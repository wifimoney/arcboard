# Data Models for Off-Chain Monitoring Service

This directory contains data models for the off-chain monitoring service that tracks Treasury compliance transactions. Models are provided in multiple languages and frameworks for flexibility.

## Available Models

### 1. Mongoose Schema (Node.js/MongoDB)
**File:** `ComplianceRecord.mongoose.js`

- Full Mongoose schema with validation
- Indexes for efficient querying
- Static methods for common queries
- Instance methods for status updates
- Pre-save hooks for timestamp conversion

**Usage:**
```javascript
const { ComplianceRecord, TransactionSource, ComplianceStatus } = require('./models/ComplianceRecord.mongoose');

// Create a new record
const record = new ComplianceRecord({
  recordId: '0x...',
  transactionHash: '0x...',
  // ... other fields
});

await record.save();

// Query records
const records = await ComplianceRecord.findByRecipient(recipientAddress);
const unreconciled = await ComplianceRecord.findUnreconciled();
```

### 2. Python Pydantic Model
**File:** `compliance_record.py`

- Pydantic model with validation
- Type hints and enum support
- Automatic timestamp conversion
- Methods for status updates
- Optional SQLAlchemy ORM model included

**Usage:**
```python
from models.compliance_record import ComplianceRecord, TransactionSource, ComplianceStatus

# Create a new record
record = ComplianceRecord(
    recordId="0x...",
    transactionHash="0x...",
    # ... other fields
)

# Update status
record.update_compliance_status(
    ComplianceStatus.VERIFIED,
    ComplianceStatus.VERIFIED,
    circle_gateway_tx_id="cg_tx_...",
    arc_transparency_id="arc_tx_..."
)

# Mark as reconciled
record.mark_reconciled()
```

### 3. TypeScript Interfaces
**File:** `compliance_record.ts`

- TypeScript interfaces and enums
- Validation utilities
- Helper functions for conversions
- Type guards for runtime validation

**Usage:**
```typescript
import {
  ComplianceRecord,
  TransactionSource,
  ComplianceStatus,
  ComplianceRecordUtils,
  ComplianceRecordValidator
} from './models/compliance_record';

// Create from event
const record = ComplianceRecordUtils.fromEvent(
  recordId,
  transactionHash,
  recipient,
  ruleId,
  TransactionSource.ALLOCATION_RULE,
  amount,
  executor,
  blockNumber,
  timestamp
);

// Validate
const errors = ComplianceRecordValidator.validate(record);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
}

// Update status
const updated = ComplianceRecordUtils.updateComplianceStatus(
  record,
  ComplianceStatus.VERIFIED,
  ComplianceStatus.VERIFIED
);
```

## Common Features

All models include:

1. **Field Validation**
   - Ethereum address format validation
   - Transaction hash format validation
   - Amount format validation
   - Enum validation for status fields

2. **Timestamp Handling**
   - Unix timestamp (seconds)
   - ISO 8601 formatted timestamps
   - Automatic conversion between formats

3. **Status Management**
   - KYC status tracking
   - AML status tracking
   - Reconciliation status

4. **External System Integration**
   - Circle Gateway transaction ID
   - Arc transparency identifier

5. **Query Support**
   - Query by recipient
   - Query by rule ID
   - Query by date range
   - Query unreconciled records
   - Query by compliance status

## Database Integration

### MongoDB (Mongoose)
The Mongoose schema includes:
- Compound indexes for common queries
- TTL indexes (if needed for data retention)
- Pre-save hooks for data transformation

### PostgreSQL/MySQL (SQLAlchemy)
The Python model includes an optional SQLAlchemy ORM model:
- Proper column types
- Indexes for performance
- JSON column for metadata
- Conversion methods between Pydantic and SQLAlchemy models

### TypeScript/Node.js
Use with your preferred ORM:
- TypeORM
- Prisma
- Sequelize
- Or direct MongoDB driver

## Event Indexing

These models are designed to work with blockchain event indexing:

1. Listen to `ComplianceRecordCreated` events
2. Parse event data into model instances
3. Store in database
4. Update status as compliance checks complete
5. Mark as reconciled when integrated with external systems

## Example Integration

### Node.js/MongoDB
```javascript
const { ComplianceRecord } = require('./models/ComplianceRecord.mongoose');

// Listen to events
treasury.on('ComplianceRecordCreated', async (event) => {
  const record = new ComplianceRecord({
    recordId: event.recordId,
    transactionHash: event.transactionHash,
    recipient: event.recipient,
    ruleId: event.ruleId,
    source: event.source,
    usdcAmount: event.amount.toString(),
    usdcAmountFormatted: parseFloat(event.amount) / 1e6,
    timestamp: event.timestamp,
    timestampISO: new Date(event.timestamp * 1000),
    blockNumber: event.blockNumber,
    executor: event.executor,
    kycStatus: event.kycStatus,
    amlStatus: event.amlStatus
  });
  
  await record.save();
});
```

### Python
```python
from models.compliance_record import ComplianceRecord, TransactionSource, ComplianceStatus

# Listen to events
def handle_compliance_record_created(event):
    record = ComplianceRecord(
        recordId=event['recordId'],
        transactionHash=event['transactionHash'],
        recipient=event['recipient'],
        ruleId=event['ruleId'],
        source=TransactionSource(event['source']),
        usdcAmount=str(event['amount']),
        timestamp=event['timestamp'],
        blockNumber=event['blockNumber'],
        executor=event['executor'],
        kycStatus=ComplianceStatus(event['kycStatus']),
        amlStatus=ComplianceStatus(event['amlStatus'])
    )
    
    # Save to database (using your ORM)
    db.session.add(ComplianceRecordDB.from_pydantic(record))
    db.session.commit()
```

## Testing

Each model includes validation that matches the JSON schema. Use the validation functions to ensure data integrity:

- **Mongoose**: Built-in validation on save
- **Pydantic**: Automatic validation on instantiation
- **TypeScript**: Use `ComplianceRecordValidator.validate()`

## Next Steps

1. Choose the model that matches your tech stack
2. Set up database connection
3. Implement event listener for `ComplianceRecordCreated` events
4. Create API endpoints for querying records
5. Implement compliance status update workflows
6. Set up reconciliation processes

