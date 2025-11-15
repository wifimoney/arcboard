/**
 * Demo Script
 * Demonstrates the automated treasury management system
 * Shows how distributions are automated and manual intervention is reduced
 */

require('dotenv').config();
const MonitoringService = require('./monitoringService');
const CircleGatewayService = require('./circleGatewayService');

async function runDemo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Treasury Management System - Demo                        ║');
  console.log('║   Automated Distribution & Compliance Demo                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const config = {
    treasuryAddress: process.env.TREASURY_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    rpcUrl: process.env.RPC_URL || 'https://rpc.arc.network',
    privateKey: process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
    circleGatewayApiKey: process.env.CIRCLE_GATEWAY_API_KEY || 'demo-api-key',
    circleGatewayBaseUrl: process.env.CIRCLE_GATEWAY_BASE_URL || 'https://api.circle.com/v1',
    cronExpression: '*/1 * * * *', // Every minute for demo
    requireKYC: false, // Disable for demo
    requireAML: false  // Disable for demo
  };

  try {
    // Demo 1: Circle Gateway Multi-Chain Balances
    console.log('📊 Demo 1: Multi-Chain Balance Aggregation');
    console.log('─'.repeat(60));
    const circleGateway = new CircleGatewayService(
      config.circleGatewayApiKey,
      config.circleGatewayBaseUrl
    );
    
    const balances = await circleGateway.getMultiChainUSDCBalances(config.treasuryAddress);
    console.log(`Total USDC Balance: ${balances.totalUSDC}`);
    console.log('\nBy Chain:');
    balances.chains.forEach(chain => {
      console.log(`  ${chain.chain.padEnd(15)} ${chain.balance.padStart(15)} USDC`);
    });
    console.log('');

    // Demo 2: Compliance Check
    console.log('🔍 Demo 2: Compliance Check');
    console.log('─'.repeat(60));
    const complianceCheck = await circleGateway.performComplianceCheck({
      recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      amount: '5000.00',
      source: 'SCHEDULED_DISTRIBUTION'
    });
    
    console.log(`Recipient: ${complianceCheck.recipient}`);
    console.log(`Amount: ${complianceCheck.amount} USDC`);
    console.log(`KYC Status: ${complianceCheck.kycStatus}`);
    console.log(`AML Status: ${complianceCheck.amlStatus}`);
    console.log(`Risk Score: ${complianceCheck.riskScore}`);
    console.log(`Circle TX ID: ${complianceCheck.transactionId}`);
    console.log('');

    // Demo 3: Treasury Health
    console.log('💚 Demo 3: Treasury Health Metrics');
    console.log('─'.repeat(60));
    const health = await circleGateway.getTreasuryHealth(config.treasuryAddress);
    console.log(`Total Balance: ${health.totalBalance} USDC`);
    console.log(`Active Chains: ${health.chainCount}`);
    console.log(`Health Score: ${health.healthScore}/100`);
    console.log('');

    // Demo 4: Automation Service (if contract is configured)
    if (config.treasuryAddress && config.privateKey && 
        config.treasuryAddress !== '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' &&
        config.privateKey !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      
      console.log('🤖 Demo 4: Automated Distribution Check');
      console.log('─'.repeat(60));
      console.log('Note: This requires a deployed Treasury contract');
      console.log('      and valid private key in .env file\n');
      
      const service = new MonitoringService(config);
      await service.initialize();
      
      // Run one check manually
      console.log('Running automated distribution check...');
      await service.automation.checkAndExecuteDistributions();
      
      service.stop();
    } else {
      console.log('🤖 Demo 4: Automated Distribution Check');
      console.log('─'.repeat(60));
      console.log('⚠️  Skipped: Treasury contract not configured');
      console.log('   Set TREASURY_ADDRESS and PRIVATE_KEY in .env to enable\n');
    }

    console.log('✅ Demo completed successfully!');
    console.log('\n💡 Key Benefits Demonstrated:');
    console.log('   • Automated multi-chain balance tracking');
    console.log('   • Real-time compliance checks');
    console.log('   • Automated payroll execution');
    console.log('   • Reduced manual intervention');
    console.log('   • Comprehensive monitoring and logging\n');

  } catch (error) {
    console.error('\n❌ Demo error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run demo
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };

