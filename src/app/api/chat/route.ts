import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";
import { generateResponseWithSystem } from "@/lib/gemini";
import type { ChatMessage } from "@/types/chat";

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a professional trading assistant for Nebuna, a paper trading platform. 
You help users with:
1. Portfolio analysis and evaluation
2. Stock trading education and strategies
3. Market insights and explanations
4. Risk management advice

IMPORTANT: You only have access to the portfolio data provided above. Work only with the information provided do not create your own data for user. Never ask for current price to user

Guidelines:
- Be concise but informative
- Response should be detailed
- Use ₹ for Indian Rupees
- Provide actionable insights
- Always clarify you're providing educational info, not financial advice
- Reference user's actual holdings when relevant
- If asked for current stock prices, search on web for the current price
- Keep responses under 200 words when possible`;

// GET: Fetch chat history for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.user_id);

    const { data: messages, error } = await supabase
      .from("chat_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error fetching chat history:", error);
      return NextResponse.json(
        { error: "Failed to fetch chat history" },
        { status: 500 }
      );
    }

    return NextResponse.json(messages || []);
  } catch (error) {
    console.error("Error in GET /api/chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Send message to AI and get response
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.user_id);
    const { message, includeContext = true } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Save user message to chat history
    const { error: userMsgError } = await supabase.from("chat_history").insert({
      user_id: userId,
      role: "user",
      content: message,
    });

    if (userMsgError) {
      console.error("Error saving user message:", userMsgError);
    }

    // Fetch portfolio context if requested
    let contextString = "";
    if (includeContext) {
      try {
        console.log(req.headers.get("cookie"));
        const contextRes = await fetch(
          `${
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          }/api/portfolio/context`,
          {
            headers: {
              cookie: req.headers.get("cookie") || "",
            },
          }
        );

        if (contextRes.ok) {
          const context = await contextRes.json();
          contextString = JSON.stringify(context, null, 2);
          console.log(context);
        }
      } catch (error) {
        console.error("Error fetching portfolio context:", error);
      }
    }

    // Extract stock symbols from message and fetch current prices
    let stockPricesContext = "";
    const stockSymbolRegex = /\b([A-Z]{2,5})\b/g;
    const stockSymbols = message.match(stockSymbolRegex);

    if (stockSymbols && stockSymbols.length > 0) {
      const uniqueSymbols = [...new Set(stockSymbols)];
      const stockPrices: Record<string, number> = {};

      for (const symbol of uniqueSymbols) {
        try {
          const priceRes = await fetch(
            `${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/api/stock-price/${symbol}/current`,
            {
              headers: {
                cookie: req.headers.get("cookie") || "",
              },
            }
          );

          if (priceRes.ok) {
            const priceData = await priceRes.json();
            if (priceData.regularMarketPrice) {
              stockPrices[symbol] = priceData.regularMarketPrice;
            }
          }
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
        }
      }

      if (Object.keys(stockPrices).length > 0) {
        stockPricesContext = `\n\nCurrent Stock Prices:\n${JSON.stringify(
          stockPrices,
          null,
          2
        )}`;
      }
    }

    // Generate AI response
    const aiResponse = await generateResponseWithSystem(
      message,
      SYSTEM_PROMPT,
      contextString + stockPricesContext
    );

    // Save AI response to chat history
    const { error: aiMsgError } = await supabase.from("chat_history").insert({
      user_id: userId,
      role: "assistant",
      content: aiResponse,
    });

    if (aiMsgError) {
      console.error("Error saving AI message:", aiMsgError);
    }

    return NextResponse.json({
      role: "assistant",
      content: aiResponse,
    });
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Clear chat history for user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.user_id);

    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error clearing chat history:", error);
      return NextResponse.json(
        { error: "Failed to clear chat history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
