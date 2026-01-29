export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export interface PortfolioContext {
  wallet: number;
  holdings: Array<{
    symbol: string;
    quantity: number;
    buy_price: number;
    total_value: number;
  }>;
  transactions: Array<{
    id: string;
    symbol: string;
    type: "buy" | "sell";
    quantity: number;
    price: number;
    total: number;
    created_at: string;
  }>;
  total_invested: number;
  total_value: number;
}

export interface ChatResponse {
  message: string;
  context?: PortfolioContext;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}
