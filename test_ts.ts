import yahooFinance from "yahoo-finance2";

async function test() {
  const startDate = "2021-01-01";
  const endDate = "2021-02-01";
  const queryOptions: any = {
    period1: startDate,
    period2: endDate,
    interval: "1d",
  };
  const result = (await yahooFinance.historical("AAPL", queryOptions)) as any[];
  console.log(result.length);
}
