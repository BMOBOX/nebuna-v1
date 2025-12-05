import { authOptions } from "@/lib/authOptions";
import { transaction } from "nebuna";
import { getServerSession, Session } from "next-auth";
import { getSession } from "next-auth/react";

export interface Stock {
  stock_name: string;
  stock_price: number;
  quantity: number;
  type: "BUY" | "SELL";
}

export interface Watch {
  symbol: string;
  id: string;
}

// Fetch user stocks
export const getStocks = async (user: Session["user"]): Promise<Stock[]> => {
  const response = await fetch("/api/user-stocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.user_id }),
  });

  if (!response.ok) throw new Error("Failed to fetch stocks");
  return response.json();
};

// Fetch user watchlist
export const getwatchStocks = async (
  user: Session["user"]
): Promise<Watch[]> => {
  const response = await fetch("/api/user-watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.user_id }),
  });

  if (!response.ok) throw new Error("Failed to fetch watchlist");
  return response.json();
};

// Remove stock from watchlist
export const removestock = async (
  user: Session["user"],
  symbol: string
): Promise<{ success: boolean }> => {
  const response = await fetch("/api/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.user_id, symbol }),
  });

  if (!response.ok) throw new Error("Failed to remove stock");
  return response.json();
};

// Add stock to watchlist
export const addstock = async (
  user: Session["user"],
  symbol: string
): Promise<{ success: boolean }> => {
  const response = await fetch("/api/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.id, symbol }),
  });

  if (!response.ok) throw new Error("Failed to add stock");
  return response.json();
};

// Get user transactions
export const gettransaction = async (): Promise<transaction[]> => {
  const user = await getServerSession(authOptions);
  console.log(user?.user.user_id);
  const response = await fetch(
    `http://localhost:3000/api/transactions?id=${user?.user.user_id}`
  );
  if (!response.ok) throw new Error("Failed to fetch transactions");
  const result: transaction[] = await response.json();
  console.log(result);
  return result;
};
