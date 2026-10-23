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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Public access enabled for client-side gameplay and serverless routes
-- ==============================================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;

-- Allow anon read and write on rooms
CREATE POLICY "Allow public read on rooms" 
    ON public.rooms FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert on rooms" 
    ON public.rooms FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public update on rooms" 
    ON public.rooms FOR UPDATE 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow public delete on rooms" 
    ON public.rooms FOR DELETE 
    USING (true);

-- Allow anon read and write on room_players
CREATE POLICY "Allow public read on room_players" 
    ON public.room_players FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert/update on room_players" 
    ON public.room_players FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow public delete on room_players" 
    ON public.room_players FOR DELETE 
    USING (true);

-- Allow anon read and write on race_results
CREATE POLICY "Allow public read on race_results" 
    ON public.race_results FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert on race_results" 
    ON public.race_results FOR INSERT 
    WITH CHECK (true);

-- ==============================================================================
-- REALTIME REPLICATION (CRITICAL FOR LIVE LOBBY & RACE SYNC)
-- ==============================================================================
-- Enables instant broadcasts to all connected clients when rows change
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.rooms, public.room_players, public.race_results;
COMMIT;
