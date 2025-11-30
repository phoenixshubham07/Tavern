-- Create Duel Queue Table
CREATE TABLE IF NOT EXISTS duel_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    year TEXT NOT NULL,
    stream TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Duel Matches Table
CREATE TABLE IF NOT EXISTS duel_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id UUID REFERENCES auth.users(id) NOT NULL,
    player2_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'loading', -- 'loading', 'active', 'finished'
    current_round INTEGER NOT NULL DEFAULT 1,
    scores JSONB DEFAULT '{"p1": 0, "p2": 0}'::jsonb,
    deck JSONB, -- Array of questions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Duel Moves Table
CREATE TABLE IF NOT EXISTS duel_moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES duel_matches(id) ON DELETE CASCADE NOT NULL,
    round INTEGER NOT NULL,
    player_id UUID REFERENCES auth.users(id) NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE duel_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE duel_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE duel_moves;

-- RLS Policies (Simplified for MVP)
ALTER TABLE duel_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_moves ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write queue (for matchmaking)
CREATE POLICY "Enable all access for queue" ON duel_queue FOR ALL USING (true) WITH CHECK (true);

-- Allow players to read/write their matches
CREATE POLICY "Enable read access for match players" ON duel_matches FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Enable insert for matchmaking" ON duel_matches FOR INSERT WITH CHECK (true); -- Ideally restricted, but open for MVP matchmaking action
CREATE POLICY "Enable update for match players" ON duel_matches FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Allow players to read/write moves
CREATE POLICY "Enable all access for moves" ON duel_moves FOR ALL USING (true) WITH CHECK (true);
