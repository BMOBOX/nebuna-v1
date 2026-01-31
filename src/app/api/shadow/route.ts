import { NextResponse } from "next/server";

const SEC_API_URL = "https://api.sec-api.io/form-13f/holdings";

/**
 * Top 10 US Institutional Investors (by reputation / AUM)
 */
const TOP_INVESTORS = [
  { name: "Berkshire Hathaway", cik: "1067983" },
  { name: "BlackRock", cik: "1364742" },
  { name: "Vanguard Group", cik: "102909" },
  { name: "State Street", cik: "93751" },
  { name: "Bridgewater Associates", cik: "1350694" },
  { name: "Renaissance Technologies", cik: "1037389" },
  { name: "Citadel Advisors", cik: "1423053" },
  { name: "Two Sigma Advisors", cik: "1179392" },
  { name: "Point72 Asset Management", cik: "1603466" },
  { name: "ARK Investment Management", cik: "1697748" },
];

export async function GET() {
  try {
    const results = await Promise.all(
      TOP_INVESTORS.map(async (inv) => {
        const body = {
          query: `cik:${inv.cik}`,
          from: "0",
          size: "1",
          sort: [{ periodOfReport: { order: "desc" } }],
        };

        const res = await fetch(
          `${SEC_API_URL}?token=${process.env.SEC_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
          }
        );

        if (!res.ok) {
          return {
            investor: inv.name,
            cik: inv.cik,
            topHoldings: [],
            error: "Failed to fetch 13F",
          };
        }

        const json = await res.json();
        console.log(json);
        const filing = json?.data?.[0];

        if (!filing) {
          return {
            investor: inv.name,
            cik: inv.cik,
            topHoldings: [],
            error: "No filing found",
          };
        }

        return {
          investor: inv.name,
          cik: inv.cik,
          period: filing.periodOfReport,
          totalHoldings: filing.holdings.length,
          topHoldings: filing.holdings.slice(0, 5).map((h: any) => ({
            ticker: h.ticker,
            shares: h.shrsOrPrnAmt?.sshPrnamt,
            valueUSD: h.value,
          })),
        };
      })
    );

    return NextResponse.json({
      count: results.length,
      data: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
