export interface ChainBalance {
  chain: string;
  chainId: number;
  network: string;
  balance: string;
  balanceRaw: string;
  currency: string;
  lastUpdated: string;
}

export interface AggregatedBalances {
  walletAddress: string;
  timestamp: string;
  totalUSDC: string;
  chains: ChainBalance[];
  metadata?: Record<string, unknown>;
}

