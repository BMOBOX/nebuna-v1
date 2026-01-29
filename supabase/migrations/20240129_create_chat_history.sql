-- Chat history table for AI chatbot
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own chat history
CREATE POLICY "Users can view own chat history"
  ON chat_history FOR SELECT
  USING (auth.uid()::text = (SELECT id::text FROM users WHERE users.id = chat_history.user_id LIMIT 1));

CREATE POLICY "Users can insert own chat messages"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT id::text FROM users WHERE users.id = chat_history.user_id LIMIT 1));

CREATE POLICY "Users can delete own chat history"
  ON chat_history FOR DELETE
  USING (auth.uid()::text = (SELECT id::text FROM users WHERE users.id = chat_history.user_id LIMIT 1));
