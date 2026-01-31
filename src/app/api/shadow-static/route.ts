import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    count: 10,
    data: [
      {
        investor: "Berkshire Hathaway",
        cik: "1067983",
        period: "2025-09-30",
        totalHoldings: 115,
        topHoldings: [
          {
            ticker: "ALLY",
            shares: 12719675,
            valueUSD: 498611260,
          },
          {
            ticker: "ALLY",
            shares: 2803875,
            valueUSD: 109911900,
          },
          {
            ticker: "ALLY",
            shares: 4228200,
            valueUSD: 165745440,
          },
          {
            ticker: "ALLY",
            shares: 3137000,
            valueUSD: 122970400,
          },
          {
            ticker: "ALLY",
            shares: 4836250,
            valueUSD: 189581000,
          },
        ],
      },
      {
        investor: "BlackRock",
        cik: "1364742",
        period: "2024-06-30",
        totalHoldings: 48161,
        topHoldings: [
          {
            ticker: "FLWS",
            shares: 359942,
            valueUSD: 3426648,
          },
          {
            ticker: "FLWS",
            shares: 96,
            valueUSD: 914,
          },
          {
            ticker: "FLWS",
            shares: 377,
            valueUSD: 3589,
          },
          {
            ticker: "FLWS",
            shares: 100328,
            valueUSD: 955123,
          },
          {
            ticker: "FLWS",
            shares: 621699,
            valueUSD: 5918574,
          },
        ],
      },
      {
        investor: "Vanguard Group",
        cik: "102909",
        period: "2025-12-31",
        totalHoldings: 17686,
        topHoldings: [
          {
            ticker: "BN",
            shares: 18968006,
            valueUSD: 870915995,
          },
          {
            ticker: "AA",
            shares: 80886,
            valueUSD: 4298282,
          },
          {
            ticker: "SPWR",
            shares: 430790,
            valueUSD: 676340,
          },
          {
            ticker: "WOOF",
            shares: 7574303,
            valueUSD: 21283791,
          },
          {
            ticker: "BRZE",
            shares: 73877,
            valueUSD: 2533242,
          },
        ],
      },
      {
        investor: "State Street",
        cik: "93751",
        period: "2025-09-30",
        totalHoldings: 4282,
        topHoldings: [
          {
            ticker: "FLWS",
            shares: 540454,
            valueUSD: 2486088,
          },
          {
            ticker: "TXG",
            shares: 2520199,
            valueUSD: 29461126,
          },
          {
            ticker: "SRCE",
            shares: 593416,
            valueUSD: 36530689,
          },
          {
            ticker: "DIBS",
            shares: 120487,
            valueUSD: 312061,
          },
          {
            ticker: "DDD",
            shares: 9803386,
            valueUSD: 28429819,
          },
        ],
      },
      {
        investor: "Bridgewater Associates",
        cik: "1350694",
        period: "2025-09-30",
        totalHoldings: 812,
        topHoldings: [
          {
            ticker: "SPY",
            shares: 2250000,
            valueUSD: 1048500000,
          },
          {
            ticker: "IVV",
            shares: 1430000,
            valueUSD: 662090000,
          },
          {
            ticker: "QQQ",
            shares: 980000,
            valueUSD: 481040000,
          },
          {
            ticker: "IEMG",
            shares: 6120000,
            valueUSD: 309840000,
          },
          {
            ticker: "TLT",
            shares: 3750000,
            valueUSD: 337500000,
          },
        ],
      },
      {
        investor: "Renaissance Technologies",
        cik: "1037389",
        period: "2025-09-30",
        totalHoldings: 3457,
        topHoldings: [
          {
            ticker: "TXG",
            shares: 1044921,
            valueUSD: 12215126,
          },
          {
            ticker: "YI",
            shares: 13014,
            valueUSD: 59214,
          },
          {
            ticker: "YQ",
            shares: 40581,
            valueUSD: 173687,
          },
          {
            ticker: "DIBS",
            shares: 419799,
            valueUSD: 1087279,
          },
          {
            ticker: "SRCE",
            shares: 175644,
            valueUSD: 10812645,
          },
        ],
      },
      {
        investor: "Citadel Advisors",
        cik: "1423053",
        period: "2025-09-30",
        totalHoldings: 15551,
        topHoldings: [
          {
            ticker: "FLWS",
            shares: 143900,
            valueUSD: 661940,
          },
          {
            ticker: "FLWS",
            shares: 22500,
            valueUSD: 103500,
          },
          {
            ticker: "TXG",
            shares: 65800,
            valueUSD: 769202,
          },
          {
            ticker: "TXG",
            shares: 44000,
            valueUSD: 514360,
          },
          {
            ticker: "YQ",
            shares: 11726,
            valueUSD: 50187,
          },
        ],
      },
      {
        investor: "Two Sigma Advisors",
        cik: "1179392",
        period: "2025-09-30",
        totalHoldings: 3628,
        topHoldings: [
          {
            ticker: "TXG",
            shares: 591394,
            valueUSD: 6913396,
          },
          {
            ticker: "ONCH",
            shares: 150624,
            valueUSD: 1574021,
          },
          {
            ticker: "SRCE",
            shares: 79566,
            valueUSD: 4898083,
          },
          {
            ticker: "DIBS",
            shares: 112460,
            valueUSD: 291271,
          },
          {
            ticker: "DDD",
            shares: 1836053,
            valueUSD: 5324554,
          },
        ],
      },
      {
        investor: "Point72 Asset Management",
        cik: "1603466",
        period: "2025-09-30",
        totalHoldings: 2263,
        topHoldings: [
          {
            ticker: "ONCHU",
            shares: 1500000,
            valueUSD: 15825000,
          },
          {
            ticker: "SRCE",
            shares: 2590,
            valueUSD: 159416,
          },
          {
            ticker: "MMM",
            shares: 200957,
            valueUSD: 31184578,
          },
          {
            ticker: "MMM",
            shares: 17300,
            valueUSD: 2684614,
          },
          {
            ticker: "ETNB",
            shares: 28900,
            valueUSD: 424830,
          },
        ],
      },
    ],
  });
}
