import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface Trade {
  type: "BUY" | "SELL";
  date: string;
  price: number;
  shares: number;
  value: number;
}

interface CompletedTrade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPercent: number;
}

interface DailyEquity {
  date: string;
  equity: number;
  close: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ticker,
      startDate,
      endDate,
      initialCapital,
      shortSma,
      longSma,
    } = body;

    if (!ticker || !startDate || !endDate || !initialCapital) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const shortPeriod = Number(shortSma) || 50;
    const longPeriod = Number(longSma) || 200;
    const startCap = Number(initialCapital);

    // Fetch data from local CSV
    const filePath = path.join(process.cwd(), 'scripts', 'data', `${ticker}.csv`);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Data for ${ticker} is not available.` },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    // YFinance CSV format usually has Date at 0, and Close somewhere
    const dateIdx = headers.indexOf('Date');
    const closeIdx = headers.indexOf('Close');

    if (dateIdx === -1 || closeIdx === -1) {
       return NextResponse.json({ error: "Invalid CSV format for target asset." }, { status: 500 });
    }

    // Parse all prices
    const allPrices = [];
    for (let i = 1; i < lines.length; i++) {
       const row = lines[i].split(',');
       if (row.length < headers.length) continue;
       
       const dateRaw = row[dateIdx].split(" ")[0]; // "YYYY-MM-DD" handles any timestamp extensions
       const closeRaw = row[closeIdx];
       
       if (!closeRaw) continue;
       
       const close = parseFloat(closeRaw);
       if (isNaN(close)) continue;

       allPrices.push({ date: dateRaw, close });
    }

    // Filter by date range
    const startObj = new Date(startDate).getTime();
    const endObj = new Date(endDate).getTime();
    
    const prices = allPrices.filter(item => {
       const compObj = new Date(item.date).getTime();
       return compObj >= startObj && compObj <= endObj;
    });

    if (prices.length < longPeriod) {
      return NextResponse.json(
        { error: `Not enough data in selected range to calculate ${longPeriod}-day SMA. Selected range returned ${prices.length} days.` },
        { status: 400 }
      );
    }

    // Backtest Variables
    let cash = startCap;
    let shares = 0;
    let position: "NONE" | "LONG" = "NONE";
    
    let currentEntryPrice = 0;
    let currentEntryDate = "";
    
    const completedTrades: CompletedTrade[] = [];
    const equityCurve: DailyEquity[] = [];

    // Helper to calculate SMA
    const getSma = (index: number, period: number) => {
      if (index < period - 1) return null;
      let sum = 0;
      for (let i = index - period + 1; i <= index; i++) {
        sum += prices[i].close;
      }
      return sum / period;
    };

    let peakEquity = startCap;
    let maxDrawdown = 0;

    for (let i = 0; i < prices.length; i++) {
      const currentPrice = prices[i].close;
      const currentDate = prices[i].date;
      
      const shortMa = getSma(i, shortPeriod);
      const longMa = getSma(i, longPeriod);

      // Check signals if we have both SMAs
      if (shortMa !== null && longMa !== null && i > 0) {
        const prevShortMa = getSma(i - 1, shortPeriod);
        const prevLongMa = getSma(i - 1, longPeriod);

        if (prevShortMa !== null && prevLongMa !== null) {
          const crossAbove = prevShortMa <= prevLongMa && shortMa > longMa;
          const crossBelow = prevShortMa >= prevLongMa && shortMa < longMa;

          if (position === "NONE" && crossAbove) {
            // BUY
            shares = cash / currentPrice;
            cash = 0;
            position = "LONG";
            currentEntryPrice = currentPrice;
            currentEntryDate = currentDate;
          } else if (position === "LONG" && crossBelow) {
            // SELL
            const exitValue = shares * currentPrice;
            const pnl = exitValue - (shares * currentEntryPrice);
            const pnlPercent = (exitValue / (shares * currentEntryPrice) - 1) * 100;
            
            completedTrades.push({
              entryDate: currentEntryDate,
              exitDate: currentDate,
              entryPrice: currentEntryPrice,
              exitPrice: currentPrice,
              shares,
              pnl,
              pnlPercent,
            });

            cash = exitValue;
            shares = 0;
            position = "NONE";
          }
        }
      }

      // Record daily equity
      const currentEquity = cash + (shares * currentPrice);
      equityCurve.push({
        date: currentDate,
        equity: currentEquity,
        close: currentPrice,
      });

      // Calculate Drawdown
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      const drawdown = (peakEquity - currentEquity) / peakEquity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Force close open position at the end of backtest
    if (position === "LONG") {
      const finalPrice = prices[prices.length - 1].close;
      const finalDate = prices[prices.length - 1].date;
      const exitValue = shares * finalPrice;
      const pnl = exitValue - (shares * currentEntryPrice);
      const pnlPercent = (exitValue / (shares * currentEntryPrice) - 1) * 100;
      
      completedTrades.push({
        entryDate: currentEntryDate,
        exitDate: finalDate,
        entryPrice: currentEntryPrice,
        exitPrice: finalPrice,
        shares,
        pnl,
        pnlPercent,
      });

      cash = exitValue;
      shares = 0;
      position = "NONE";
    }

    const finalEquity = cash;
    const totalReturn = ((finalEquity / startCap) - 1) * 100;
    
    // Win Rate
    const winningTrades = completedTrades.filter(t => t.pnl > 0).length;
    const winRate = completedTrades.length > 0 ? (winningTrades / completedTrades.length) * 100 : 0;

    const metrics = {
      initialCapital: startCap,
      finalEquity,
      totalReturn,
      maxDrawdown: maxDrawdown * 100, // as percentage
      totalTrades: completedTrades.length,
      winRate,
    };

    return NextResponse.json({
      ticker,
      metrics,
      chartData: equityCurve,
      trades: completedTrades,
    });
  } catch (error) {
    console.error("Backtest error:", error);
    return NextResponse.json(
      { error: "Internal server error during backtest calculation." },
      { status: 500 }
    );
  }
}
