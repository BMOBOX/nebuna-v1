# AI Chatbot Setup Instructions

## Overview
The Nebuna trading app now includes an AI-powered chatbot that can analyze your portfolio and answer trading-related questions. The chatbot uses **Google Gemini AI** (100% FREE) and only accesses your existing portfolio data - no external quote API calls are made.

## Features
- 📊 **Portfolio Analysis** - Get insights on your holdings, P&L, and performance
- 💡 **Trading Tips** - Educational trading strategies and advice
- 📈 **Market Outlook** - General market insights
- 🎯 **Stock Suggestions** - Criteria-based stock recommendations
- 💬 **Conversation History** - All chats are saved and can be cleared
- 🚀 **Quick Actions** - Pre-built prompts for common queries

## Setup Steps

### 1. Run Database Migration
Run the SQL migration in your Supabase SQL Editor to create the `chat_history` table:

```sql
-- Chat history table for AI chatbot
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id, created_at);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
  ON chat_history FOR SELECT
  USING (auth.uid()::text = (SELECT id::text FROM users WHERE users.id = chat_history.user_id LIMIT 1));

CREATE POLICY "Users can insert own chat messages"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT id::text FROM users WHERE users.id = chat_history.user_id LIMIT 1));

CREATE POLICY "Users can delete own chat history"
  ON chat_history FOR DELETE
  USING (auth.uid()::text = (SELECT id::text FROM users WHERE users.id = chat_history.user_id LIMIT 1));
```

**File location:** `supabase/migrations/20240129_create_chat_history.sql`

### 2. Environment Variables
The chatbot uses your Google Gemini API key. The API key is already configured in [`src/lib/gemini.ts`](src/lib/gemini.ts:3):

```typescript
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAxWmpr-4MUheiU5Nn7WgEPx8zmKSVg3y8";
```

**Optional:** Add to your `.env` file:
```env
GEMINI_API_KEY=AIzaSyAxWmpr-4MUheiU5Nn7WgEPx8zmKSVg3y8
GEMINI_MODEL=gemini-1.5-flash
```

### 3. Start the Development Server
```bash
npm run dev
```

## Usage

### Accessing the Chatbot
1. Navigate to any dashboard page (e.g., `/dashboard`, `/dashboard/portfolio`)
2. Click the blue chat icon in the bottom-right corner
3. The chat widget will open

### Quick Actions
When you first open the chat, you'll see quick action buttons:
- 📊 **Analyze my portfolio** - Get a comprehensive P&L analysis
- 💡 **Trading tips** - Learn trading strategies
- 📈 **Market outlook** - Get market insights
- 🎯 **Stock suggestions** - Get stock recommendations

### Custom Questions
Type any question about:
- Your portfolio performance
- Trading strategies
- Risk management
- Stock market concepts

### Clearing Chat History
Click the trash icon in the chat header to clear all conversation history.

## How It Works

### Architecture
```
User → ChatWidget → ChatContext → /api/chat → Google Gemini AI
                              ↓
                        /api/portfolio/context (from database)
```

### Data Flow
1. User sends a message
2. Message is saved to `chat_history` table
3. Portfolio context is fetched from database (holdings, transactions, wallet)
4. Message + context is sent to Google Gemini AI
5. AI response is saved to `chat_history` table
6. Response is displayed to user

### No External Quote API Calls
The chatbot **does NOT** make any external API calls for stock quotes. It only uses:
- Your existing holdings from the database
- Your transaction history
- Your wallet balance
- Cached current prices from your holdings

## Cost

### 100% FREE
- **Google Gemini 1.5 Flash** - Free tier with generous limits
- **No external quote APIs** - Uses only your database data
- **No additional costs** - Everything runs on free tiers

## Files Created

### API Routes
- [`src/app/api/chat/route.ts`](src/app/api/chat/route.ts) - Chat API (GET, POST, DELETE)
- [`src/app/api/portfolio/context/route.ts`](src/app/api/portfolio/context/route.ts) - Portfolio data aggregation

### Components
- [`src/components/ChatWidget/index.tsx`](src/components/ChatWidget/index.tsx) - Main chat widget
- [`src/components/ChatWidget/ChatMessage.tsx`](src/components/ChatWidget/ChatMessage.tsx) - Message display
- [`src/components/ChatWidget/ChatInput.tsx`](src/components/ChatWidget/ChatInput.tsx) - Input field
- [`src/components/ChatWidget/QuickActions.tsx`](src/components/ChatWidget/QuickActions.tsx) - Quick action buttons

### Context & Types
- [`src/context/ChatContext.tsx`](src/context/ChatContext.tsx) - Chat state management
- [`src/types/chat.ts`](src/types/chat.ts) - TypeScript types

### Libraries
- [`src/lib/gemini.ts`](src/lib/gemini.ts) - Google Gemini AI client

### Database
- [`supabase/migrations/20240129_create_chat_history.sql`](supabase/migrations/20240129_create_chat_history.sql) - Database schema

### Integration
- [`src/app/dashboard/structure.tsx`](src/app/dashboard/structure.tsx) - ChatProvider and ChatWidget added

## Troubleshooting

### Chatbot not responding
1. Check that the database migration was run successfully
2. Verify your Google Gemini API key is valid
3. Check browser console for errors

### Portfolio context not loading
1. Ensure you have holdings/transactions in the database
2. Check the `/api/portfolio/context` endpoint is working

### Chat history not saving
1. Verify RLS policies are correctly set up
2. Check that the `chat_history` table exists

## Security

- **User Isolation**: Users can only access their own chat history
- **RLS Policies**: Row Level Security enabled on `chat_history` table
- **API Key**: Stored in environment variables (not exposed to client)
- **No Sensitive Data**: Only portfolio data is sent to AI, no personal info

## Future Enhancements

Potential improvements:
- Streaming responses for faster feedback
- Voice input/output
- More detailed portfolio analytics
- Real-time stock price alerts
- Custom prompt templates
