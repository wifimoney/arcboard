# Environment Variables Example

Create a `.env` file in the root directory with the following variables:

```bash
# Treasury Deployment Configuration
USDC_ADDRESS=0x0000000000000000000000000000000000000000
SIGNER_1=0x0000000000000000000000000000000000000000
SIGNER_2=0x0000000000000000000000000000000000000000
SIGNER_3=0x0000000000000000000000000000000000000000
REQUIRED_SIGNATURES=2

# Deployment Configuration
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
RPC_URL=https://rpc.arc.network

# Interaction Configuration (for Interact.s.sol)
TREASURY_ADDRESS=0x0000000000000000000000000000000000000000
RECIPIENT_ADDRESS=0x0000000000000000000000000000000000000000
AMOUNT=1000000000
```

## Notes

- `USDC_ADDRESS`: The USDC token contract address on Arc network
- `SIGNER_1`, `SIGNER_2`, `SIGNER_3`: Addresses of the initial signers
- `REQUIRED_SIGNATURES`: Number of signatures required to execute a transaction (e.g., 2 for 2-of-3 multisig)
- `PRIVATE_KEY`: Private key of the deployer account (keep secure!)
- `RPC_URL`: RPC endpoint for Arc network
- `TREASURY_ADDRESS`: Deployed Treasury contract address (for interaction scripts)
- `RECIPIENT_ADDRESS`: Example recipient address for testing
- `AMOUNT`: Amount in USDC (6 decimals, so 1000000000 = 1000 USDC)

