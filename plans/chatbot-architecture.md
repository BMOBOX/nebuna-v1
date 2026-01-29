# AI Chatbot Architecture for Nebuna Trading App

## Overview
A floating chatbot widget powered by Google Gemini AI that provides portfolio analysis and answers stock trading questions with conversation history persistence. Uses only existing portfolio data from the database - no external quote API calls.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Next.js)"]
        ChatWidget[ChatWidget Component]
        ChatContext[ChatContext Provider]
    end
    
    subgraph API["API Routes"]
        ChatAPI[/api/chat/route.ts\]
        PortfolioAPI[/api/portfolio/context\]
    end
    
    subgraph Services["External Services"]
        Gemini[Google Gemini AI API]
    end
    
    subgraph Database["Database (Supabase)"]
        ChatHistory[(chat_history table)]
        PortfolioData[(portfolio data)]
    end
    
    ChatWidget --> ChatContext
    ChatContext --> ChatAPI
    ChatAPI --> Gemini
    ChatAPI --> PortfolioAPI
    PortfolioAPI --> PortfolioData
    ChatAPI --> ChatHistory
```

## Components

### 1. Database Schema

```sql
-- Chat history table
CREATE TABLE chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_chat_history_user ON chat_history(user_id, created_at);
```

### 2. API Routes

#### `/api/chat/route.ts`
- POST: Send message to Google Gemini with portfolio context
- GET: Fetch chat history for user
- DELETE: Clear chat history

#### `/api/portfolio/context`
- GET: Aggregated portfolio data for AI context (from database only)
  - Current holdings with P&L
  - Recent transactions
  - Wallet balance
  - Performance metrics
  - **No external quote API calls**

### 3. Frontend Components

#### ChatWidget
- Floating button (bottom-right corner)
- Expandable chat interface
- Message bubbles (user/assistant)
- Loading states
- Quick action buttons ("Analyze my portfolio", "Trading tips", etc.)

#### ChatContext Provider
- Manages chat state
- Handles API calls
- Manages conversation history
- Auto-scroll to latest message

### 4. AI Prompt Engineering

```typescript
const SYSTEM_PROMPT = `You are a professional trading assistant for Nebuna, a paper trading platform. 
You help users with:
1. Portfolio analysis and evaluation
2. Stock trading education and strategies
3. Market insights and explanations
4. Risk management advice

Current user portfolio context:
{{PORTFOLIO_DATA}}

IMPORTANT: You only have access to the portfolio data provided above. Do NOT make any external API calls for stock quotes or market data. Work only with the information provided.

Guidelines:
- Be concise but informative
- Use ₹ for Indian Rupees
- Provide actionable insights
- Always clarify you're providing educational info, not financial advice
- Reference user's actual holdings when relevant
- If asked for current stock prices, explain you only have access to the portfolio data shown above`;
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts
│   │   └── portfolio/
│   │       └── context/
│   │           └── route.ts
│   └── dashboard/
│       └── layout.tsx (add ChatWidget)
├── components/
│   └── ChatWidget/
│       ├── index.tsx
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       └── QuickActions.tsx
├── context/
│   └── ChatContext.tsx
├── lib/
│   └── gemini.ts
└── types/
    └── chat.ts
```

## Environment Variables

```env
GEMINI_API_KEY=AIzaSyAxWmpr-4MUheiU5Nn7WgEPx8zmKSVg3y8
GEMINI_MODEL=gemini-1.5-flash
```

**Note**: Google Gemini 1.5 Flash is FREE and provides fast responses. No external quote API calls will be made - only existing portfolio data from the database is used.

## Implementation Steps

1. Create database schema for chat history
2. Set up Google Gemini client library (`npm install @google/generative-ai`)
3. Create portfolio context API (uses only existing database data)
4. Create chat API with streaming support
5. Build ChatWidget UI components
6. Add ChatContext for state management
7. Integrate into dashboard layout
8. Add quick action buttons
9. Test with various portfolio scenarios

## Features

### Quick Actions
- "📊 Analyze my portfolio" - Comprehensive P&L analysis
- "💡 Trading tips" - Educational trading strategies
- "📈 Market outlook" - General market insights
- "🎯 Stock suggestions" - Criteria-based stock suggestions

### Cost & Usage
- **100% FREE** - Uses Google Gemini 1.5 Flash (free tier)
- **No external quote API calls** - Only uses existing database data
- **No additional costs** - All data comes from your Supabase database

### Portfolio Context Includes (from database only)
- Total portfolio value
- Current holdings with quantities
- Unrealized P&L per stock
- Recent buy/sell transactions
- Cash/wallet balance
- Win/loss ratio
- **No external quote API calls** - uses cached data from database

## Security Considerations
- Rate limiting on chat API
- User can only access own chat history
- Portfolio data only visible to authenticated user
- No sensitive data stored in AI prompts
- **No external quote API calls** - only uses existing database data
- Google Gemini API key stored in environment variables
- Free tier usage only (gemini-1.5-flash)
