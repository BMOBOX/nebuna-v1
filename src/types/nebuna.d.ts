declare module "nebuna" {
  interface transaction {
    id: string;
    symbol: string;
    stock_name: string;
    type: "BUY" | "SELL";
    open_price: number;
    quantity: number;
    total: number;
    pl: number;
    close_price: number;
  }
}
