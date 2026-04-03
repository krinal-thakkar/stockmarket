# Live Stock Price App

A small full-stack app that fetches live stock quote data with Node.js and displays it in a React UI.

## Stack

- Node.js + Express for the backend API proxy
- React + Vite for the frontend
- Twelve Data for stock market quote data

## Why the backend proxy?

The React app calls your Node server, and the Node server calls the stock market API. This keeps the API key on the server instead of exposing it in the browser.

## Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create your environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Replace `TWELVE_DATA_API_KEY=demo` in `.env` with your real Twelve Data API key for broader symbol coverage and higher limits.

4. Start both apps:

   ```powershell
   npm run dev
   ```

## App URLs

- React app: `http://localhost:5173`
- Node API: `http://localhost:3001/api/quote?symbol=AAPL`

## Features

- Search by ticker symbol
- Live polling every 5 seconds
- Price, change, market state, volume, and daily range
- Safe server-side API key handling
