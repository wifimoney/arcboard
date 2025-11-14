# Quick Start Guide

## Prerequisites

1. Install [Foundry](https://book.getfoundry.sh/getting-started/installation):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Setup

1. **Install Dependencies**
```bash
make install
# or
forge install OpenZeppelin/openzeppelin-contracts
```

2. **Build the Project**
```bash
make build
# or
forge build
```

3. **Run Tests**
```bash
make test
# or
forge test
```

## Deployment

1. **Create Environment File**
   - Copy `ENV_EXAMPLE.md` as a reference
   - Create a `.env` file with your configuration
   - Set `USDC_ADDRESS`, signer addresses, and `REQUIRED_SIGNATURES`

2. **Deploy to Arc Network**
```bash
source .env
forge script scripts/Deploy.s.sol:DeployTreasury --rpc-url $RPC_URL --broadcast --verify
```

## Usage Examples

### Propose a Transaction

```solidity
// As a signer
bytes32 txHash = treasury.proposeTransaction(
    0xRecipientAddress,
    1000e6,  // 1000 USDC (6 decimals)
    ""
);
```

### Confirm a Transaction

```solidity
// As another signer
treasury.confirmTransaction(txHash);
// Transaction auto-executes when threshold is met
```

### Create Scheduled Payroll

```solidity
// Create monthly payroll of 5000 USDC
uint256 scheduleId = treasury.createScheduledDistribution(
    0xEmployeeAddress,
    5000e6,      // 5000 USDC
    2592000      // 30 days in seconds
);
```

### Execute Due Distributions

```solidity
// Get all due distributions
uint256[] memory dueSchedules = treasury.getDueScheduledDistributions();

// Execute them
treasury.executeScheduledDistributions(dueSchedules);
```

## Next Steps

- Review the full [README.md](./README.md) for detailed documentation
- Check [test/Treasury.t.sol](./test/Treasury.t.sol) for usage examples
- Customize the contract for your specific needs

