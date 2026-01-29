type TwelveDataQuoteRaw = {
  symbol?: string;
  name?: string;
  currency?: string;
  close?: string;
  price?: string;
  percent_change?: string;
  volume?: string;
  high?: string;
  low?: string;
  fifty_two_week?: {
    high?: string;
    low?: string;
  };
  pe?: string;
  exchange?: string;
};

type TwelveDataError = {
  error: string;
  status: number;
};

const BASE_URL = "https://api.twelvedata.com";

const toNumber = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const mapTwelveQuote = (raw: TwelveDataQuoteRaw) => {
  const price = toNumber(raw.close) ?? toNumber(raw.price) ?? 0;
  return {
    symbol: raw.symbol ?? "",
    shortName: raw.name ?? raw.symbol ?? "",
    currency: raw.currency ?? "USD",
    regularMarketPrice: price,
    regularMarketChangePercent: toNumber(raw.percent_change) ?? 0,
    regularMarketVolume: toNumber(raw.volume) ?? 0,
    regularMarketDayRange: {
      high: toNumber(raw.high),
      low: toNumber(raw.low),
    },
    fiftyTwoWeekHigh: toNumber(raw.fifty_two_week?.high),
    fiftyTwoWeekLow: toNumber(raw.fifty_two_week?.low),
    trailingPE: toNumber(raw.pe),
    averageAnalystRating: null,
    exchange: raw.exchange ?? null,
  };
};

export const normalizeQuotePayload = (payload: any): TwelveDataQuoteRaw[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as TwelveDataQuoteRaw[];
  if (Array.isArray(payload?.data)) return payload.data as TwelveDataQuoteRaw[];
  if (payload?.symbol) return [payload as TwelveDataQuoteRaw];

  const values = Object.values(payload).filter(
    (item) => item && typeof item === "object"
  );
  return values as TwelveDataQuoteRaw[];
};

export const buildTwelveDataUrl = (
  endpoint: string,
  params: Record<string, string>
) => {
  const apiKey = process.env.TWELEVEDATA_API;
  if (!apiKey) throw new Error("TWELEVEDATA_API is not set");

  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "") url.searchParams.set(key, value);
  });
  url.searchParams.set("apikey", apiKey);
  return url;
};

export const fetchTwelveData = async <T>(
  endpoint: string,
  params: Record<string, string>
): Promise<{ data?: T } & Partial<TwelveDataError>> => {
  let response: Response;
  try {
    response = await fetch(buildTwelveDataUrl(endpoint, params));
  } catch (error) {
    return { error: "Failed to reach TwelveData", status: 502 };
  }

  let payload: any;
  try {
    payload = await response.json();
  } catch (error) {
    return { error: "Invalid TwelveData response", status: 502 };
  }

  if (!response.ok || payload?.status === "error" || payload?.code) {
    return {
      error: payload?.message || "TwelveData request failed",
      status: response.status || 500,
    };
  }

  return { data: payload as T };
};
