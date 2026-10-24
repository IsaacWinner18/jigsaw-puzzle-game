-- ==============================================================================
-- JIGSAW ATELIER MULTIPLAYER - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this in your Supabase Project's SQL Editor to enable database persistence
-- for multiplayer rooms, player rosters, and asynchronous race finishes.
-- ==============================================================================

-- 1. ROOMS TABLE
-- Stores active and historical multiplayer puzzle rooms
CREATE TABLE IF NOT EXISTS public.rooms (
    code VARCHAR(8) PRIMARY KEY,
    host_id TEXT NOT NULL,
    puzzle_id TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    rows INT NOT NULL DEFAULT 3,
    cols INT NOT NULL DEFAULT 3,
    seed BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'countdown', 'playing', 'finished', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    started_at TIMESTAMPTZ,
    winner_id TEXT,
    winner_name TEXT
);

-- 2. ROOM PLAYERS TABLE
-- Tracks connected competitors in each room in real-time
CREATE TABLE IF NOT EXISTS public.room_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(8) NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    name TEXT NOT NULL,
    department TEXT,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    pieces_locked INT NOT NULL DEFAULT 0,
    total_pieces INT NOT NULL DEFAULT 9,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'playing', 'finished', 'forfeited', 'left')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_code, player_id)
);

-- 3. RACE RESULTS TABLE
-- Logs immutable race finish timestamps for serverless scoring verification
CREATE TABLE IF NOT EXISTS public.race_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(8) NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    elapsed_seconds NUMERIC(8, 2) NOT NULL,
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,
    finished_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR HIGH-SPEED LOOKUPS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room_code ON public.room_players(room_code);
CREATE INDEX IF NOT EXISTS idx_race_results_room_code ON public.race_results(room_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_race_results_one_winner
  ON public.race_results(room_code) WHERE is_winner;

CREATE OR REPLACE FUNCTION public.create_multiplayer_room(
  p_code VARCHAR(8),
  p_host_id TEXT,
  p_host_name TEXT,
  p_puzzle_id TEXT,
  p_difficulty TEXT,
  p_rows INT,
  p_cols INT,
  p_seed BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rooms (code, host_id, puzzle_id, difficulty, rows, cols, seed, status)
  VALUES (p_code, p_host_id, p_puzzle_id, p_difficulty, p_rows, p_cols, p_seed, 'waiting');

  INSERT INTO public.room_players (room_code, player_id, name, is_host, pieces_locked, total_pieces, status)
  VALUES (p_code, p_host_id, p_host_name, true, 0, p_rows * p_cols, 'ready');
END;
$$;

REVOKE ALL ON FUNCTION public.create_multiplayer_room(VARCHAR, TEXT, TEXT, TEXT, TEXT, INT, INT, BIGINT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.apply_race_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_winner THEN
    UPDATE public.rooms
    SET status = 'finished', winner_id = NEW.player_id, winner_name = NEW.player_name
    WHERE code = NEW.room_code AND status <> 'finished';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_race_winner ON public.race_results;
CREATE TRIGGER apply_race_winner
  AFTER INSERT ON public.race_results
  FOR EACH ROW EXECUTE FUNCTION public.apply_race_winner();

CREATE OR REPLACE FUNCTION public.enforce_room_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.room_code));

  IF NOT EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_code = NEW.room_code AND player_id = NEW.player_id
  ) AND (
    SELECT count(*) FROM public.room_players WHERE room_code = NEW.room_code
  ) >= 2 THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_room_capacity ON public.room_players;
CREATE TRIGGER enforce_room_capacity
  BEFORE INSERT OR UPDATE ON public.room_players
  FOR EACH ROW EXECUTE FUNCTION public.enforce_room_capacity();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Public access enabled for client-side gameplay and serverless routes
-- ==============================================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public update on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public delete on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public insert/update on room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow public delete on room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow public insert on race_results" ON public.race_results;

-- The browser may read room state, while all writes go through the server API
-- using SUPABASE_SERVICE_ROLE_KEY.
CREATE POLICY "Allow public read on rooms" 
    ON public.rooms FOR SELECT 
    USING (true);


-- Allow public room roster reads only.
CREATE POLICY "Allow public read on room_players" 
    ON public.room_players FOR SELECT 
    USING (true);


-- Allow public result reads only.
CREATE POLICY "Allow public read on race_results" 
    ON public.race_results FOR SELECT 
    USING (true);


-- ==============================================================================
-- REALTIME REPLICATION (CRITICAL FOR LIVE LOBBY & RACE SYNC)
-- ==============================================================================
-- Enables instant broadcasts to all connected clients when rows change
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.rooms, public.room_players, public.race_results;
COMMIT;
