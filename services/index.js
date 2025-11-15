/**
 * Service entry point
 * Example usage of Circle Gateway and Payroll Automation services
 */

const CircleGatewayService = require('./circleGatewayService');
const PayrollAutomationService = require('./payrollAutomation');

// Example configuration
const config = {
  // Circle Gateway
  circleGatewayApiKey: process.env.CIRCLE_GATEWAY_API_KEY || 'mock-api-key',
  circleGatewayBaseUrl: process.env.CIRCLE_GATEWAY_BASE_URL || 'https://api.circle.com/v1',
  
  // Treasury Contract
  treasuryAddress: process.env.TREASURY_ADDRESS || '0x...',
  rpcUrl: process.env.RPC_URL || 'https://rpc.arc.network',
  privateKey: process.env.PRIVATE_KEY || '0x...',
  
  // Automation
  cronExpression: process.env.CRON_EXPRESSION || '*/5 * * * *', // Every 5 minutes
  requireKYC: process.env.REQUIRE_KYC === 'true',
  requireAML: process.env.REQUIRE_AML === 'true'
};

/**
 * Example: Fetch multi-chain balances
 */
async function exampleFetchBalances() {
  const circleGateway = new CircleGatewayService(
    config.circleGatewayApiKey,
    config.circleGatewayBaseUrl
  );
  
  const treasuryAddress = config.treasuryAddress;
  const balances = await circleGateway.getMultiChainUSDCBalances(treasuryAddress);
  
  console.log('Multi-Chain USDC Balances:');
  console.log(`Total: ${balances.totalUSDC} USDC`);
  console.log('\nBy Chain:');
  balances.chains.forEach(chain => {
    console.log(`  ${chain.chain}: ${chain.balance} USDC`);
  });
  
  return balances;
}

/**
 * Example: Perform compliance check
 */
async function exampleComplianceCheck() {
  const circleGateway = new CircleGatewayService(
    config.circleGatewayApiKey,
    config.circleGatewayBaseUrl
  );
  
  const complianceCheck = await circleGateway.performComplianceCheck({
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    amount: '5000.00',
    source: 'SCHEDULED_DISTRIBUTION'
  });
  
  console.log('Compliance Check Results:');
  console.log(`  KYC Status: ${complianceCheck.kycStatus}`);
  console.log(`  AML Status: ${complianceCheck.amlStatus}`);
  console.log(`  Risk Score: ${complianceCheck.riskScore}`);
  console.log(`  Circle TX ID: ${complianceCheck.transactionId}`);
  
  return complianceCheck;
}

/**
 * Example: Start payroll automation
 */
async function exampleStartPayrollAutomation() {
  const automation = new PayrollAutomationService(config);
  
  // Initialize
  await automation.initialize();
  
  // Start cron job
  automation.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down payroll automation...');
    automation.stop();
    process.exit(0);
  });
  
  return automation;
}

// Export for use in other modules
module.exports = {
  CircleGatewayService,
  PayrollAutomationService,
  exampleFetchBalances,
  exampleComplianceCheck,
  exampleStartPayrollAutomation,
  config
};

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      console.log('=== Circle Gateway Examples ===\n');
      
      // Example 1: Fetch balances
      await exampleFetchBalances();
      console.log('\n');
      
      // Example 2: Compliance check
      await exampleComplianceCheck();
      console.log('\n');
      
      // Example 3: Start automation (comment out if you don't want it running)
      // await exampleStartPayrollAutomation();
      
    } catch (error) {
      console.error('Error running examples:', error);
      process.exit(1);
    }
  })();
}

