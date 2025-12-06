import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Download, Plus } from "lucide-react";
import { format } from "date-fns";
import { get } from "http";
import { gettransaction } from "@/services/stock";
import { transaction } from "nebuna";
import Link from "next/link";

// Proper Type matching your exact API response
export type Trade = {
  id: number;
  created_at: string;
  user_id?: number;
  symbol: string;
  stock_name: string;
  type: "BUY" | "SELL";
  open_price: number;
  quantity: number;
  total: number;
  PL: number;
  close_price: number | null;
};

export default async function TradeTable({
  transaction,
  sortBy = "time", // "time" | "PL"
}: {
  transaction?: transaction[];
  sortBy?: "time" | "PL";
}) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (!transaction || transaction.length === 0) {
    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total Invested</TableHead>
              <TableHead className="text-right">Open Price</TableHead>
              <TableHead className="text-right">Close Price</TableHead>
              <TableHead className="text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <p className="text-center text-muted-foreground py-8">
          Nothing to look here :{")"}
        </p>
      </>
    );
  }

  // Sort transactions
  const sortedTransactions = [...transaction].sort((a, b) => {
    if (sortBy === "time") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === "PL") {
      return b.PL - a.PL; // descending PL
    }
    return 0;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Symbol</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Total Invested</TableHead>
          <TableHead className="text-right">Open Price</TableHead>
          <TableHead className="text-right">Close Price</TableHead>
          <TableHead className="text-right">P&L</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTransactions.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell>
              <Badge
                variant="default"
                className={
                  trade.type === "BUY"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 text-gray-100 hover:bg-red-700"
                }
              >
                {trade.type}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">
              {formatDate(trade.created_at)}
            </TableCell>
            <TableCell className="font-medium text-primary">
              <Link
                href={`/stocks/${trade.symbol}`} // change this to your stock detail route
                className="text-blue-500/90 hover:underline"
              >
                {trade.symbol}
              </Link>
            </TableCell>

            <TableCell className="capitalize">{trade.stock_name}</TableCell>
            <TableCell className="text-right font-medium">
              {trade.quantity.toLocaleString()}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(trade.total)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(trade.open_price)}
            </TableCell>
            <TableCell className="text-right">
              {trade.close_price !== null && trade.close_price !== undefined
                ? formatCurrency(trade.close_price)
                : "-"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {trade.PL > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : trade.PL < 0 ? (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                ) : null}
                <span
                  className={`font-semibold ${
                    trade.PL > 0
                      ? "text-green-600"
                      : trade.PL < 0
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {trade.PL >= 0 ? "+" : ""}
                  {formatCurrency(trade.PL)}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
