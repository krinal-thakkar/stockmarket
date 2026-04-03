import axios from "axios";

const DEFAULT_API_KEY = "317c17a11e4d42db80ba6e0fa32ada22";

const api = axios.create({
  baseURL: "https://api.twelvedata.com",
  timeout: 10000
});

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

export function normalizeSymbol(input = "") {
  return input.trim().replace(/\s+/g, "").toUpperCase();
}

function getApiKey() {
  return process.env.TWELVE_DATA_API_KEY || DEFAULT_API_KEY;
}

function createHttpError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function handleProviderError(payload, fallbackMessage) {
  if (payload?.status === "error") {
    throw createHttpError(payload.message || fallbackMessage, 400);
  }
}

export async function fetchQuote(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);

  if (!symbol) {
    throw createHttpError("Please enter a stock symbol.", 400);
  }

  const response = await api.get("/quote", {
    params: {
      symbol,
      apikey: getApiKey()
    }
  });

  handleProviderError(response.data, "Unable to load quote data.");

  const data = response.data;

  return {
    symbol: data.symbol || symbol,
    name: data.name || null,
    exchange: data.exchange || null,
    currency: data.currency || "USD",
    close: toNumber(data.close),
    open: toNumber(data.open),
    high: toNumber(data.high),
    low: toNumber(data.low),
    previousClose: toNumber(data.previous_close),
    change: toNumber(data.change),
    percentChange: toNumber(data.percent_change),
    volume: toNumber(data.volume),
    averageVolume: toNumber(data.average_volume),
    marketOpen: toBoolean(data.is_market_open),
    fiftyTwoWeekLow: toNumber(data.fifty_two_week?.low),
    fiftyTwoWeekHigh: toNumber(data.fifty_two_week?.high),
    providerTimestamp: data.datetime || data.timestamp || null
  };
}

export async function searchSymbols(rawQuery) {
  const query = rawQuery?.trim();

  if (!query) {
    return [];
  }

  const response = await api.get("/symbol_search", {
    params: {
      symbol: query,
      outputsize: 8,
      apikey: getApiKey()
    }
  });

  handleProviderError(response.data, "Unable to search symbols.");

  const results = Array.isArray(response.data?.data) ? response.data.data : [];

  return results.map((item) => ({
    symbol: item.symbol,
    instrumentName: item.instrument_name || item.name || "",
    exchange: item.exchange || "",
    country: item.country || "",
    currency: item.currency || ""
  }));
}
