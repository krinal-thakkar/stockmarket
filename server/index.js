import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import { fetchQuote, searchSymbols } from "./services/twelveData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const app = express();
const port = process.env.PORT || 3001;
const clientDistPath = path.resolve(__dirname, "../client/dist");

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    provider: "Twelve Data"
  });
});

app.get("/api/quote", async (request, response) => {
  try {
    const quote = await fetchQuote(request.query.symbol);

    response.json({
      quote,
      provider: "Twelve Data",
      refreshedAt: new Date().toISOString()
    });
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/search", async (request, response) => {
  try {
    const results = await searchSymbols(request.query.q);
    response.json({ results });
  } catch (error) {
    sendError(response, error);
  }
});

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      next();
      return;
    }

    response.sendFile(path.join(clientDistPath, "index.html"));
  });
}

function sendError(response, error) {
  const status = error.response?.status || error.status || 500;
  const message =
    error.response?.data?.message ||
    error.message ||
    "Something went wrong while loading market data.";

  response.status(status).json({ error: message });
}

app.listen(port, () => {
  console.log(`Stock server listening on http://localhost:${port}`);
});
