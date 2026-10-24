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

DROP POLICY IF EXISTS "Allow public insert on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public update on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public delete on rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public insert/update on room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow public delete on room_players" ON public.room_players;
DROP POLICY IF EXISTS "Allow public insert on race_results" ON public.race_results;
