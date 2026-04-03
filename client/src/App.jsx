import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5000;
const FEATURED_SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"];

function formatPrice(value, currency = "USD") {
  if (value === null || value === undefined) {
    return "--";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2
    }).format(value);
  }
}

function formatSignedPrice(value, currency = "USD") {
  if (value === null || value === undefined) {
    return "--";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      signDisplay: "exceptZero"
    }).format(value);
  } catch {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}`;
  }
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatSigned(value, suffix = "") {
  if (value === null || value === undefined) {
    return "--";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}${suffix}`;
}

function formatTimestamp(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(date);
}

function App() {
  const [symbolInput, setSymbolInput] = useState("AAPL");
  const [activeSymbol, setActiveSymbol] = useState("AAPL");
  const [quote, setQuote] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState("");

  useEffect(() => {
    let cancelled = false;
    const query = symbolInput.trim();

    if (!query || query.toUpperCase() === activeSymbol) {
      setSearchResults([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to search symbols.");
        }

        if (!cancelled) {
          setSearchResults(data.results || []);
        }
      } catch (requestError) {
        if (!cancelled && requestError.name !== "AbortError") {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [symbolInput, activeSymbol]);

  useEffect(() => {
    let cancelled = false;

    const loadQuote = async ({ background = false } = {}) => {
      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await fetch(
          `/api/quote?symbol=${encodeURIComponent(activeSymbol)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load quote data.");
        }

        if (!cancelled) {
          setQuote(data.quote);
          setError("");
          setRefreshedAt(data.refreshedAt);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadQuote();
    const intervalId = window.setInterval(() => {
      loadQuote({ background: true });
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeSymbol]);

  const quoteCards = quote
    ? [
        {
          label: "Open",
          value: formatPrice(quote.open, quote.currency)
        },
        {
          label: "High",
          value: formatPrice(quote.high, quote.currency)
        },
        {
          label: "Low",
          value: formatPrice(quote.low, quote.currency)
        },
        {
          label: "Previous Close",
          value: formatPrice(quote.previousClose, quote.currency)
        },
        {
          label: "Volume",
          value: formatNumber(quote.volume)
        },
        {
          label: "52 Week Range",
          value:
            quote.fiftyTwoWeekLow !== null && quote.fiftyTwoWeekHigh !== null
              ? `${formatPrice(quote.fiftyTwoWeekLow, quote.currency)} to ${formatPrice(
                  quote.fiftyTwoWeekHigh,
                  quote.currency
                )}`
              : "--"
        }
      ]
    : [];

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextSymbol = symbolInput.trim().replace(/\s+/g, "").toUpperCase();

    if (!nextSymbol) {
      setError("Please enter a stock symbol.");
      return;
    }

    setActiveSymbol(nextSymbol);
    setSearchResults([]);
  };

  const handleSuggestionClick = (symbol) => {
    setSymbolInput(symbol);
    setActiveSymbol(symbol);
    setSearchResults([]);
  };

  const changeTone =
    quote?.change > 0 ? "positive" : quote?.change < 0 ? "negative" : "neutral";

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Node.js + React.js</p>
          <h1>Track live stock prices from a web dashboard.</h1>
          <p className="hero-text">
            Search a ticker, keep the API key on the server, and refresh the quote
            automatically every 5 seconds.
          </p>
        </div>

        <div className="search-panel">
          <form className="search-form" onSubmit={handleSubmit}>
            <label className="input-label" htmlFor="symbol">
              Stock symbol
            </label>
            <div className="input-row">
              <input
                id="symbol"
                name="symbol"
                value={symbolInput}
                onChange={(event) => setSymbolInput(event.target.value.toUpperCase())}
                placeholder="Enter symbol like AAPL"
                autoComplete="off"
              />
              <button type="submit">Load Quote</button>
            </div>
          </form>

          <div className="featured-list">
            {FEATURED_SYMBOLS.map((symbol) => (
              <button
                key={symbol}
                type="button"
                className={symbol === activeSymbol ? "chip active" : "chip"}
                onClick={() => handleSuggestionClick(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>

          {(isSearching || searchResults.length > 0) && (
            <div className="search-results">
              <div className="results-header">
                <span>Matches</span>
                {isSearching && <span>Searching...</span>}
              </div>

              {searchResults.map((result) => (
                <button
                  key={`${result.symbol}-${result.exchange}`}
                  type="button"
                  className="result-row"
                  onClick={() => handleSuggestionClick(result.symbol)}
                >
                  <span className="result-symbol">{result.symbol}</span>
                  <span className="result-name">{result.instrumentName || "Unknown"}</span>
                  <span className="result-meta">
                    {[result.exchange, result.country].filter(Boolean).join(" | ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {error && <section className="status-banner error">{error}</section>}

      <section className="quote-panel">
        <div className="quote-header">
          <div>
            <p className="section-label">Live Quote</p>
            <h2>
              {quote?.name || activeSymbol}
              <span>{activeSymbol}</span>
            </h2>
          </div>

          <div className="quote-meta">
            <span className={`market-pill ${quote?.marketOpen ? "open" : "closed"}`}>
              {quote?.marketOpen ? "Market Open" : "Market Closed"}
            </span>
            <span>{isRefreshing ? "Refreshing..." : `Updated ${formatTimestamp(refreshedAt)}`}</span>
          </div>
        </div>

        <div className="headline-grid">
          <article className="headline-card">
            <p>Last Price</p>
            <strong>
              {isLoading && !quote ? "Loading..." : formatPrice(quote?.close, quote?.currency)}
            </strong>
            <span>{quote?.exchange || "Exchange unavailable"}</span>
          </article>

          <article className={`headline-card accent ${changeTone}`}>
            <p>Day Change</p>
            <strong>{formatSignedPrice(quote?.change, quote?.currency)}</strong>
            <span>{formatSigned(quote?.percentChange, "%")}</span>
          </article>
        </div>

        <div className="stats-grid">
          {quoteCards.map((item) => (
            <article key={item.label} className="stat-card">
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
