import { defineChain } from 'viem';
import { createConfig, http } from 'wagmi';

export const arcTestnet = defineChain({
  id: 5_042_002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] }
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app'
    }
  }
});

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network')
  },
  autoConnect: true
});

