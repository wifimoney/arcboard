/**
 * Payroll Automation Runner
 * Standalone script to run the payroll automation service
 * 
 * Usage: node automationRunner.js
 * Or: npm run automation
 * 
 * This service demonstrates how the system automates distributions
 * and reduces manual intervention through:
 * - Automated scheduled payroll execution
 * - Rule-based distribution automation
 * - Compliance checks before execution
 * - Event monitoring and logging
 */

require('dotenv').config();
const MonitoringService = require('./monitoringService');

const config = {
  // Treasury Contract
  treasuryAddress: process.env.TREASURY_ADDRESS,
  rpcUrl: process.env.RPC_URL || 'https://rpc.arc.network',
  privateKey: process.env.PRIVATE_KEY,
  
  // Circle Gateway
  circleGatewayApiKey: process.env.CIRCLE_GATEWAY_API_KEY || 'mock-api-key',
  circleGatewayBaseUrl: process.env.CIRCLE_GATEWAY_BASE_URL || 'https://api.circle.com/v1',
  
  // Automation Settings
  cronExpression: process.env.CRON_EXPRESSION || '*/5 * * * *', // Every 5 minutes
  requireKYC: process.env.REQUIRE_KYC === 'true',
  requireAML: process.env.REQUIRE_AML === 'true'
};

// Validate required config
if (!config.treasuryAddress) {
  console.error('Error: TREASURY_ADDRESS environment variable is required');
  process.exit(1);
}

if (!config.privateKey) {
  console.error('Error: PRIVATE_KEY environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Treasury Monitoring & Automation Service                ║');
  console.log('║   Automated Payroll & Distribution Execution             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('Configuration:');
  console.log(`  Treasury Address: ${config.treasuryAddress}`);
  console.log(`  RPC URL: ${config.rpcUrl}`);
  console.log(`  Cron Expression: ${config.cronExpression}`);
  console.log(`  Require KYC: ${config.requireKYC}`);
  console.log(`  Require AML: ${config.requireAML}`);
  console.log('');

  const service = new MonitoringService(config);

  try {
    // Initialize all services
    await service.initialize();
    
    // Start monitoring and automation
    service.start();
    
    console.log('\n💡 Service Features:');
    console.log('   • Automated scheduled payroll execution');
    console.log('   • Rule-based distribution automation');
    console.log('   • Real-time event monitoring');
    console.log('   • Compliance checks via Circle Gateway');
    console.log('   • Multi-chain balance tracking');
    console.log('\n📝 Press Ctrl+C to stop\n');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n');
      service.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n');
      service.stop();
      process.exit(0);
    });
    
    // Keep process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('\n❌ Failed to start monitoring service:', error);
    process.exit(1);
  }
}

// Run
main();

