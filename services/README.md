# Treasury Monitoring Services

**Complete Node.js service implementation for automated treasury management**

This service demonstrates how the system automates distributions and reduces manual intervention through:
- ✅ Automated scheduled payroll execution
- ✅ Rule-based distribution automation  
- ✅ Real-time event monitoring
- ✅ Compliance checks via Circle Gateway
- ✅ Multi-chain balance tracking
- ✅ Comprehensive logging and statistics

## Services

### 1. Circle Gateway Service (`circleGatewayService.js`)

Simulates fetching aggregated treasury data and compliance checks via Circle Gateway.

**Features:**
- Multi-chain USDC balance aggregation
- Compliance checks (KYC/AML)
- Transaction status tracking
- Treasury health metrics

**Usage:**
```javascript
const CircleGatewayService = require('./circleGatewayService');

const service = new CircleGatewayService(apiKey, baseUrl);

// Get multi-chain balances
const balances = await service.getMultiChainUSDCBalances(walletAddress);

// Perform compliance check
const compliance = await service.performComplianceCheck({
  recipient: '0x...',
  amount: '1000.00',
  source: 'SCHEDULED_DISTRIBUTION'
});
```

### 2. Payroll Automation Service (`payrollAutomation.js`)

Cron job that periodically checks distribution rules and executes them when triggers are met.

**Features:**
- Automated scheduled distribution execution
- Rule-based distribution automation
- Allocation rule automation
- Compliance check integration
- Gas-optimized transaction execution

**Usage:**
```javascript
const PayrollAutomationService = require('./payrollAutomation');

const automation = new PayrollAutomationService(config);
await automation.initialize();
automation.start();
```

## Installation

```bash
cd services
npm install
```

## Configuration

Create a `.env` file:

```env
# Treasury Contract
TREASURY_ADDRESS=0x...
RPC_URL=https://rpc.arc.network
PRIVATE_KEY=0x...

# Circle Gateway
CIRCLE_GATEWAY_API_KEY=your-api-key
CIRCLE_GATEWAY_BASE_URL=https://api.circle.com/v1

# Automation
CRON_EXPRESSION=*/5 * * * *
REQUIRE_KYC=true
REQUIRE_AML=true
```

## Running

### Run Demo

Quick demonstration of all features:
```bash
npm run demo
```

This demonstrates:
- Multi-chain balance aggregation
- Compliance checks
- Treasury health metrics
- Automated distribution checks

### Run Examples

```bash
npm start
```

This will run example functions demonstrating:
- Multi-chain balance fetching
- Compliance checks
- Service initialization

### Run Full Monitoring Service

Start the complete monitoring and automation service:
```bash
npm run automation
```

Or directly:
```bash
node automationRunner.js
```

This starts:
- Automated distribution checks (cron job)
- Real-time event monitoring
- Compliance integration
- Statistics tracking

## Cron Expression Examples

- `*/1 * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Daily at midnight
- `0 0 * * 1` - Weekly on Monday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight

## API Responses

### Multi-Chain Balance Response

```json
{
  "walletAddress": "0x...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "totalUSDC": "5000000.00",
  "chains": [
    {
      "chain": "ethereum",
      "chainId": 1,
      "network": "mainnet",
      "balance": "2000000.00",
      "balanceRaw": "2000000000000",
      "currency": "USDC",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Compliance Check Response

```json
{
  "transactionId": "cg_tx_1234567890abcdef",
  "recipient": "0x...",
  "amount": "1000.00",
  "source": "SCHEDULED_DISTRIBUTION",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "kycStatus": "VERIFIED",
  "amlStatus": "VERIFIED",
  "riskScore": 5,
  "sanctionsCheck": {
    "status": "CLEAR",
    "checkedAt": "2024-01-01T00:00:00.000Z",
    "lists": ["OFAC", "EU", "UN"]
  }
}
```

## Integration with Treasury Contract

The automation service integrates with the Treasury contract to:

1. **Check Scheduled Distributions**
   - Queries `getDueScheduledDistributions()`
   - Executes via `executeScheduledDistributions()`

2. **Check Rule-Based Distributions**
   - Queries `getEligibleDistributionRules()`
   - Executes via `executeAllEligibleDistributionRules()`

3. **Check Allocation Rules**
   - Queries `getEligibleAllocationRules()`
   - Executes via `executeAllEligibleAllocations()`

## Error Handling

The service includes comprehensive error handling:
- Individual transaction failures don't stop the cron job
- Logs all errors for monitoring
- Continues processing other rules if one fails
- Graceful shutdown on SIGINT/SIGTERM

## Monitoring

The service logs:
- Each cron execution
- Number of eligible rules found
- Transaction hashes
- Block confirmations
- Compliance check results
- Errors and warnings

## Production Considerations

1. **Security**
   - Store private keys securely (use environment variables or key management)
   - Use a dedicated executor wallet with limited permissions
   - Enable KYC/AML requirements in production

2. **Reliability**
   - Use process managers (PM2, systemd)
   - Implement health checks
   - Set up alerting for failures
   - Monitor gas prices

3. **Performance**
   - Adjust cron frequency based on needs
   - Batch transactions when possible
   - Monitor RPC rate limits
   - Use transaction batching for multiple rules

4. **Compliance**
   - Ensure all transactions pass compliance checks
   - Maintain audit logs
   - Integrate with Circle Gateway for real compliance
   - Track all compliance record updates

## Testing

Create a test file to verify functionality:

```javascript
// test.js
const { exampleFetchBalances, exampleComplianceCheck } = require('./index');

(async () => {
  await exampleFetchBalances();
  await exampleComplianceCheck();
})();
```

Run with:
```bash
npm test
```

