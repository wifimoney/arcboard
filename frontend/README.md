# Arc Treasury Dashboard

Phase 3 dashboard (mock) demonstrating how Arc automates distributions and surfaces predictable costs.

## Features

- React + Vite single-page dashboard
- Web3 integration with Arc network (Metamask or Arc-compatible wallet)
- “Set Rule” button wired to the Treasury contract `setAllocationRule`
- Aggregated USDC balances fetched from the Phase 5 Node.js service (falls back to mock data)
- Display of Arc’s predictable USD-denominated gas cost guarantee

## Getting Started

```bash
cd frontend
npm install

# copy env example
cp .env.example .env.local

# update .env.local with your addresses + RPC URLs
npm run dev
```

Required env values:

- `VITE_TREASURY_ADDRESS`: deployed Treasury contract on Arc
- `VITE_ARC_RPC_URL`: Arc RPC endpoint (defaults to `https://rpc.arc.network`)
- `VITE_ARC_BLOCK_EXPLORER`: explorer URL
- `VITE_TREASURY_SERVICE_URL`: URL for the Phase 5 Node service (defaults to proxy `/api/balances`)

## Interaction Flow

1. Dashboard boots with Arc provider context.
2. User connects wallet → app ensures Arc network (adds it if needed).
3. “Set Rule” submits `setAllocationRule` with typed inputs (value converted to basis points for percentage).
4. Aggregated balances load from `/api/balances` (proxy to Node service). If the service is offline, mock data keeps the UI populated.

## Design Notes

- Styling is vanilla CSS with modern cards to mirror the Figma mockups.
- Arc’s predictable dollar-based gas cost is highlighted in the KPI cards for stakeholders.

