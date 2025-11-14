# Compliance and Reporting Suite

## Overview

The Treasury Management contract includes a comprehensive Native Compliance and Reporting Suite designed to integrate with Circle Gateway and Arc's opt-in transparency features. This system tracks all USDC allocations for regulatory reporting and auditing purposes.

## Transaction Data Structure

### ComplianceRecord

Each transaction creates a compliance record with the following fields:

```solidity
struct ComplianceRecord {
    bytes32 transactionHash;      // On-chain transaction hash
    bytes32 internalTxHash;      // Internal transaction identifier
    uint256 ruleId;               // Rule ID (0 if manual transaction)
    TransactionSource source;     // Source of the transaction
    address recipient;            // Recipient wallet address
    uint256 usdcAmount;           // USDC amount (6 decimals)
    ComplianceStatus kycStatus;   // KYC verification status
    ComplianceStatus amlStatus;   // AML screening status
    uint256 timestamp;            // Block timestamp
    uint256 blockNumber;           // Block number
    address executor;             // Address that executed the transaction
    string circleGatewayTxId;      // Circle Gateway transaction ID
    string arcTransparencyId;      // Arc transparency identifier
    bool reconciled;              // Reconciliation status
    uint256 reconciledAt;         // Reconciliation timestamp
}
```

### Transaction Sources

- `MULTISIG_TRANSACTION`: Manual multi-signature transactions
- `SCHEDULED_DISTRIBUTION`: Scheduled recurring distributions
- `ALLOCATION_RULE`: Automated allocation rules
- `DISTRIBUTION_RULE`: Rule-based distributions

### Compliance Status

- `PENDING`: Verification in progress
- `VERIFIED`: Successfully verified
- `REJECTED`: Verification failed
- `EXEMPT`: Exempt from verification
- `UNKNOWN`: Status not yet determined

## JSON Schema

The compliance transaction data structure follows a standardized JSON schema located at `schemas/compliance-transaction-schema.json`. This schema defines:

- Required fields for regulatory reporting
- Data types and validation rules
- Integration with Circle Gateway and Arc transparency
- Metadata fields for additional reporting context

### Example JSON Record

```json
{
  "recordId": "0x1234567890abcdef...",
  "transactionHash": "0xabcdef1234567890...",
  "internalTxHash": "0x9876543210fedcba...",
  "ruleId": 42,
  "source": "ALLOCATION_RULE",
  "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "usdcAmount": "1000000000",
  "usdcAmountFormatted": 1000.0,
  "kycStatus": "VERIFIED",
  "amlStatus": "VERIFIED",
  "timestamp": 1704067200,
  "timestampISO": "2024-01-01T00:00:00Z",
  "blockNumber": 12345678,
  "executor": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "circleGatewayTxId": "cg_tx_1234567890abcdef",
  "arcTransparencyId": "arc_tx_abcdef1234567890",
  "reconciled": false,
  "reconciledAt": 0,
  "metadata": {
    "jurisdiction": "US",
    "regulatoryCategory": "PAYROLL",
    "reportingPeriod": "2024-Q1",
    "notes": "Monthly payroll distribution"
  }
}
```

## Integration with Circle Gateway

### Circle Gateway Transaction ID

When a transaction is processed through Circle Gateway, the `circleGatewayTxId` field stores the Circle Gateway transaction identifier. This enables:

- Cross-referencing with Circle's compliance systems
- Integration with Circle's reporting tools
- Real-time transaction tracking

### Updating Circle Gateway Information

```solidity
treasury.updateComplianceStatus(
    recordId,
    ComplianceStatus.VERIFIED,
    ComplianceStatus.VERIFIED,
    "cg_tx_1234567890abcdef",  // Circle Gateway TX ID
    ""  // Arc transparency ID (optional)
);
```

## Integration with Arc Transparency

### Arc Transparency Identifier

Arc's opt-in transparency features require a transparency identifier for each transaction. The `arcTransparencyId` field stores this identifier, enabling:

- Public transparency reporting
- Regulatory compliance on Arc network
- Real-time reconciliation with Arc's transparency system

### Updating Arc Transparency Information

```solidity
treasury.updateComplianceStatus(
    recordId,
    ComplianceStatus.VERIFIED,
    ComplianceStatus.VERIFIED,
    "",  // Circle Gateway TX ID (optional)
    "arc_tx_abcdef1234567890"  // Arc transparency ID
);
```

## Compliance Workflow

### 1. Transaction Execution

When a transaction is executed (multi-sig, allocation, or distribution), a compliance record is automatically created with:
- Transaction details
- Initial status: `UNKNOWN` for both KYC and AML
- Timestamp and block number
- Executor address

### 2. KYC/AML Verification

After execution, compliance officers update the status:

```solidity
treasury.updateComplianceStatus(
    recordId,
    ComplianceStatus.VERIFIED,  // KYC status
    ComplianceStatus.VERIFIED,  // AML status
    circleGatewayTxId,
    arcTransparencyId
);
```

### 3. Reconciliation

Once verified and integrated with external systems, mark as reconciled:

```solidity
treasury.reconcileComplianceRecord(recordId);
```

## Querying Compliance Records

### Get Record by ID

```solidity
ComplianceRecord memory record = treasury.getComplianceRecord(recordId);
```

### Get Records by Recipient

```solidity
bytes32[] memory records = treasury.getRecipientComplianceRecords(recipientAddress);
```

### Get Records by Rule

```solidity
bytes32[] memory records = treasury.getRuleComplianceRecords(ruleId);
```

## Configuration

### Enable Compliance Tracking

```solidity
treasury.setComplianceConfiguration(
    true,   // complianceEnabled
    true,   // requireKYC
    true,   // requireAML
    circleGatewayAddress  // Circle Gateway contract address
);
```

### Compliance Settings

- `complianceEnabled`: Enable/disable compliance tracking
- `requireKYC`: Require KYC verification before transactions
- `requireAML`: Require AML screening before transactions
- `circleGatewayAddress`: Circle Gateway contract address for integration

## Events

### ComplianceRecordCreated

Emitted when a compliance record is created:

```solidity
event ComplianceRecordCreated(
    bytes32 indexed recordId,
    bytes32 indexed transactionHash,
    address indexed recipient,
    uint256 ruleId,
    TransactionSource source,
    uint256 amount,
    ComplianceStatus kycStatus,
    ComplianceStatus amlStatus
);
```

### ComplianceStatusUpdated

Emitted when compliance status is updated:

```solidity
event ComplianceStatusUpdated(
    bytes32 indexed recordId,
    ComplianceStatus kycStatus,
    ComplianceStatus amlStatus
);
```

### ComplianceReconciled

Emitted when a record is marked as reconciled:

```solidity
event ComplianceReconciled(
    bytes32 indexed recordId,
    uint256 timestamp
);
```

## Real-Time Reconciliation

The compliance system supports real-time reconciliation by:

1. **Timestamp Tracking**: Each record includes precise timestamps for audit trails
2. **Block Number**: Links records to specific blockchain blocks
3. **Reconciliation Status**: Tracks which records have been reconciled
4. **External System IDs**: Stores Circle Gateway and Arc transparency identifiers

## Regulatory Reporting

### Required Fields for Reporting

All compliance records include fields required for regulatory reporting:

- **Transaction Hash**: On-chain transaction identifier
- **Rule ID**: Links to automated rules (if applicable)
- **USDC Amount**: Precise amount transferred
- **Recipient Wallet**: Destination address
- **KYC/AML Status**: Verification status flags
- **Timestamp**: Real-time transaction timestamp

### Exporting for Reporting

Compliance records can be exported in JSON format matching the schema for:

- Regulatory filings
- Audit reports
- Internal compliance reviews
- External system integration

## Best Practices

1. **Enable Compliance Early**: Configure compliance settings during deployment
2. **Update Status Promptly**: Update KYC/AML status as soon as verification completes
3. **Reconcile Regularly**: Mark records as reconciled after external system integration
4. **Monitor Events**: Use events for off-chain indexing and reporting
5. **Maintain Audit Trail**: Keep all compliance records for regulatory requirements

## Security Considerations

- Only signers can update compliance status
- Only owner can configure compliance settings
- All records are immutable once created
- Reconciliation status prevents duplicate processing
- Events provide transparent audit trail

