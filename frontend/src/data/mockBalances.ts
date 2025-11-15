import { AggregatedBalances } from '../types';

export const MOCK_AGGREGATED_BALANCES: AggregatedBalances = {
  walletAddress: '0xArcDemoWallet000000000000000000000000',
  timestamp: new Date().toISOString(),
  totalUSDC: '5,000,000.00',
  chains: [
    {
      chain: 'arc',
      chainId: 0xa11ce,
      network: 'arc-mainnet',
      balance: '2,500,000.00',
      balanceRaw: '2500000000000',
      currency: 'USDC',
      lastUpdated: new Date().toISOString()
    },
    {
      chain: 'ethereum',
      chainId: 1,
      network: 'ethereum-mainnet',
      balance: '1,500,000.00',
      balanceRaw: '1500000000000',
      currency: 'USDC',
      lastUpdated: new Date().toISOString()
    },
    {
      chain: 'polygon',
      chainId: 137,
      network: 'polygon-mainnet',
      balance: '750,000.00',
      balanceRaw: '750000000000',
      currency: 'USDC',
      lastUpdated: new Date().toISOString()
    },
    {
      chain: 'avalanche',
      chainId: 43114,
      network: 'avalanche-mainnet',
      balance: '250,000.00',
      balanceRaw: '250000000000',
      currency: 'USDC',
      lastUpdated: new Date().toISOString()
    }
  ],
  metadata: {
    source: 'mock',
    version: '1.0'
  }
};

