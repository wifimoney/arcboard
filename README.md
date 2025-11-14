# Treasury Management Smart Contract

A comprehensive EVM-compatible smart contract system for Treasury Management on Arc, featuring multi-signature approvals and rule-based distributions (e.g., scheduled payroll).

## Features

- **Multi-Signature Approvals**: Secure transaction execution requiring multiple signer confirmations
- **USDC Management**: Native support for USDC token transfers
- **Automated Allocations**: Rule-based automatic fund allocation with percentage, fixed amount, and threshold-based options
- **Rule-Based Distributions**: Advanced distribution rules including time-based, balance-condition, percentage-based, and batch distributions
- **Scheduled Distributions**: Automated recurring distributions (e.g., monthly payroll)
- **Budget Management**: Budget limits and tracking for allocations and distributions
- **Priority-Based Execution**: Priority system for rule execution order
- **Flexible Signer Management**: Add/remove signers and adjust required signatures
- **Reentrancy Protection**: Secure against reentrancy attacks
- **Comprehensive Events**: Full event logging for transparency

## Architecture

### Treasury Contract

The main `Treasury` contract provides:

1. **Multi-Signature Transaction System**
   - Propose transactions with recipient, amount, and optional data
   - Require multiple signer confirmations before execution
   - Auto-execute when threshold is met
   - Support for revoking confirmations

2. **Automated Allocation System**
   - **Percentage-Based**: Allocate a percentage of treasury balance
   - **Fixed Amount**: Allocate a fixed amount periodically
   - **Balance Threshold**: Allocate excess funds above a threshold
   - Budget limits per allocation rule
   - Priority-based execution
   - Cooldown periods to prevent excessive execution

3. **Rule-Based Distribution System**
   - **Time-Based**: Execute distributions at specific intervals
   - **Balance Condition**: Execute when balance meets conditions (>, <, =, >=, <=)
   - **Percentage-Based**: Distribute a percentage of current balance
   - **Batch Distribution**: Distribute to multiple recipients simultaneously
   - Support for both fixed amounts and percentages in batch mode
   - Budget caps and total distribution tracking
   - Priority-based execution order

4. **Scheduled Distribution System**
   - Create recurring distributions (e.g., monthly payroll)
   - Automatic execution of due distributions
   - Track total distributed amounts
   - Enable/disable schedules

5. **Signer Management**
   - Add new signers (owner only)
   - Remove signers (owner only)
   - Update required signature threshold (owner only)

## Installation

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js (for optional tooling)

### Setup

1. Install Foundry dependencies:
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

2. Build the project:
```bash
forge build
```

3. Run tests:
```bash
forge test
```

## Usage

### Deployment

1. Create a `.env` file with the following variables:
```
USDC_ADDRESS=0x...
SIGNER_1=0x...
SIGNER_2=0x...
SIGNER_3=0x...
REQUIRED_SIGNATURES=2
PRIVATE_KEY=0x...
RPC_URL=https://...
```

2. Deploy the contract:
```bash
forge script scripts/Deploy.s.sol:DeployTreasury --rpc-url $RPC_URL --broadcast --verify
```

### Multi-Signature Transactions

#### Propose a Transaction

```solidity
bytes32 txHash = treasury.proposeTransaction(
    recipientAddress,
    amount,
    ""
);
```

#### Confirm a Transaction

```solidity
treasury.confirmTransaction(txHash);
```

#### Execute a Transaction

Transactions automatically execute when the required number of confirmations is reached. You can also manually execute:

```solidity
treasury.executeTransaction(txHash);
```

### Scheduled Distributions

#### Create a Scheduled Distribution

```solidity
uint256 scheduleId = treasury.createScheduledDistribution(
    recipientAddress,
    amount,        // Amount per distribution
    interval       // Interval in seconds (e.g., 2592000 for monthly)
);
```

#### Execute Due Distributions

```solidity
uint256[] memory dueSchedules = treasury.getDueScheduledDistributions();
treasury.executeScheduledDistributions(dueSchedules);
```

#### Update a Schedule

```solidity
treasury.updateScheduledDistribution(scheduleId, false); // Deactivate
treasury.updateScheduledDistribution(scheduleId, true);  // Activate
```

### Automated Allocations

#### Create a Percentage-Based Allocation Rule

```solidity
uint256 ruleId = treasury.createAllocationRule(
    recipientAddress,
    Treasury.AllocationType.PERCENTAGE,
    1000,        // 10% (in basis points)
    0,           // No budget limit
    1,           // Priority
    0            // No cooldown
);
```

#### Create a Fixed Amount Allocation Rule

```solidity
uint256 ruleId = treasury.createAllocationRule(
    recipientAddress,
    Treasury.AllocationType.FIXED_AMOUNT,
    5000e6,      // 5000 USDC
    100000e6,    // Budget limit: 100K USDC
    2,           // Priority
    1 days       // Cooldown period
);
```

#### Create a Balance Threshold Allocation Rule

```solidity
uint256 ruleId = treasury.createAllocationRule(
    recipientAddress,
    Treasury.AllocationType.BALANCE_THRESHOLD,
    500000e6,    // Threshold: 500K USDC
    0,           // No budget limit
    1,           // Priority
    0            // No cooldown
);
// Allocates excess above threshold
```

#### Execute Allocations

```solidity
// Execute specific rules
uint256[] memory ruleIds = new uint256[](1);
ruleIds[0] = ruleId;
treasury.executeAllocations(ruleIds);

// Or execute all eligible rules (sorted by priority)
treasury.executeAllEligibleAllocations();
```

### Rule-Based Distributions

#### Create a Time-Based Distribution Rule

```solidity
uint256 ruleId = treasury.createTimeBasedDistributionRule(
    recipientAddress,
    1000e6,      // Amount per distribution
    30 days,     // Interval
    0,           // No max total distribution
    1,           // Priority
    0            // No cooldown
);
```

#### Create a Balance Condition Distribution Rule

```solidity
uint256 ruleId = treasury.createBalanceConditionDistributionRule(
    recipientAddress,
    10000e6,     // Amount to distribute
    Treasury.BalanceCondition.GREATER_THAN_OR_EQUAL,
    500000e6,    // Threshold
    0,           // No max total
    1,           // Priority
    0            // No cooldown
);
```

#### Create a Percentage-Based Distribution Rule

```solidity
uint256 ruleId = treasury.createPercentageBasedDistributionRule(
    recipientAddress,
    1500,        // 15% (basis points)
    0,           // No max total
    1,           // Priority
    0            // No cooldown
);
```

#### Create a Batch Distribution Rule

```solidity
address[] memory recipients = new address[](3);
recipients[0] = address1;
recipients[1] = address2;
recipients[2] = address3;

uint256[] memory amounts = new uint256[](3);
amounts[0] = 1000e6;
amounts[1] = 2000e6;
amounts[2] = 3000e6;

uint256 ruleId = treasury.createBatchDistributionRule(
    recipients,
    amounts,
    new uint256[](0),  // Empty percentages array
    false,              // Use fixed amounts
    0,                  // No max total
    1,                  // Priority
    0                   // No cooldown
);
```

#### Execute Distribution Rules

```solidity
// Execute specific rules
uint256[] memory ruleIds = new uint256[](1);
ruleIds[0] = ruleId;
treasury.executeDistributionRules(ruleIds);

// Or execute all eligible rules (sorted by priority)
treasury.executeAllEligibleDistributionRules();
```

### Signer Management

#### Add a Signer

```solidity
treasury.addSigner(newSignerAddress);
```

#### Remove a Signer

```solidity
treasury.removeSigner(signerAddress);
```

#### Update Required Signatures

```solidity
treasury.updateRequiredSignatures(newRequiredCount);
```

## Contract Interface

### Key Functions

- `proposeTransaction(address to, uint256 amount, bytes calldata data)`: Propose a new transaction
- `confirmTransaction(bytes32 txHash)`: Confirm a proposed transaction
- `revokeConfirmation(bytes32 txHash)`: Revoke a confirmation
- `executeTransaction(bytes32 txHash)`: Manually execute a transaction
- `createScheduledDistribution(address recipient, uint256 amount, uint256 interval)`: Create a scheduled distribution
- `executeScheduledDistributions(uint256[] calldata scheduleIds)`: Execute due distributions
- `updateScheduledDistribution(uint256 scheduleId, bool active)`: Update schedule status
- `createAllocationRule(...)`: Create an automated allocation rule
- `executeAllocations(uint256[] calldata ruleIds)`: Execute allocation rules
- `executeAllEligibleAllocations()`: Execute all eligible allocation rules
- `updateAllocationRule(uint256 ruleId, bool active)`: Update allocation rule status
- `createTimeBasedDistributionRule(...)`: Create a time-based distribution rule
- `createBalanceConditionDistributionRule(...)`: Create a balance-condition distribution rule
- `createPercentageBasedDistributionRule(...)`: Create a percentage-based distribution rule
- `createBatchDistributionRule(...)`: Create a batch distribution rule
- `executeDistributionRules(uint256[] calldata ruleIds)`: Execute distribution rules
- `executeAllEligibleDistributionRules()`: Execute all eligible distribution rules
- `updateDistributionRule(uint256 ruleId, bool active)`: Update distribution rule status
- `addSigner(address signer)`: Add a new signer
- `removeSigner(address signer)`: Remove a signer
- `updateRequiredSignatures(uint256 requiredSignatures)`: Update required signatures

### View Functions

- `getTransaction(bytes32 txHash)`: Get transaction details
- `isConfirmed(bytes32 txHash, address signer)`: Check if transaction is confirmed
- `getBalance()`: Get current USDC balance
- `getScheduledDistribution(uint256 scheduleId)`: Get schedule details
- `getRecipientSchedules(address recipient)`: Get all schedules for a recipient
- `getDueScheduledDistributions()`: Get all due schedules
- `getAllocationRule(uint256 ruleId)`: Get allocation rule details
- `getEligibleAllocationRules()`: Get all eligible allocation rules
- `getDistributionRule(uint256 ruleId)`: Get distribution rule details
- `getEligibleDistributionRules()`: Get all eligible distribution rules

## Security Considerations

1. **Multi-Signature Threshold**: Ensure the required signature threshold is appropriate for your use case (e.g., 2 of 3, 3 of 5)

2. **Signer Management**: Only trusted addresses should be added as signers. The owner has full control over signer management.

3. **Scheduled Distributions**: Monitor scheduled distributions to ensure sufficient balance. Consider implementing a keeper bot to execute due distributions.

4. **Reentrancy Protection**: The contract uses OpenZeppelin's `ReentrancyGuard` to prevent reentrancy attacks.

5. **Access Control**: Multi-signature functions are restricted to signers, and signer management is restricted to the owner.

## Testing

Run the test suite:

```bash
forge test
```

Run with verbose output:

```bash
forge test -vvv
```

Run specific test:

```bash
forge test --match-test test_ProposeTransaction
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.

