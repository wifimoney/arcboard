export const ARC_NETWORK = {
  chainId: '0xA11CE',
  chainName: 'Arc Mainnet',
  rpcUrls: [import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.arc.network'],
  nativeCurrency: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6
  },
  blockExplorerUrls: [import.meta.env.VITE_ARC_BLOCK_EXPLORER || 'https://explorer.arc.network']
};

export const ARC_NETWORK_DISPLAY = 'Arc • Predictable Dollar Pricing';

/**
 * Arc guarantees predictable, dollar-based transaction costs.
 * This value is surfaced in the UI as a reminder of the Arc network guarantee.
 */
export const ARC_PREDICTABLE_GAS_USD = 0.02;

