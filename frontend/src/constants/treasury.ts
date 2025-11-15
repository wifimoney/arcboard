export const TREASURY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_recipient', type: 'address' },
      { internalType: 'uint8', name: '_allocationType', type: 'uint8' },
      { internalType: 'uint256', name: '_value', type: 'uint256' },
      { internalType: 'uint256', name: '_budgetLimit', type: 'uint256' },
      { internalType: 'uint256', name: '_priority', type: 'uint256' },
      { internalType: 'uint256', name: '_cooldownPeriod', type: 'uint256' }
    ],
    name: 'setAllocationRule',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

export const TREASURY_CONTRACT_ADDRESS = '0x438848a5A2825b5aF7F2997e37D0A2f617F30A09' as const;

