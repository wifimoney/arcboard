/**
 * Monitoring Service
 * Main service that orchestrates payroll automation and event listening
 * Demonstrates how the system automates distributions and reduces manual intervention
 */

const PayrollAutomationService = require('./payrollAutomation');
const TreasuryEventListener = require('./eventListener');
const CircleGatewayService = require('./circleGatewayService');
const { ethers } = require('ethers');

class MonitoringService {
  constructor(config) {
    this.config = config;
    this.automation = null;
    this.eventListener = null;
    this.circleGateway = new CircleGatewayService(
      config.circleGatewayApiKey,
      config.circleGatewayBaseUrl
    );
    this.stats = {
      startTime: null,
      distributionsExecuted: 0,
      allocationsExecuted: 0,
      rulesExecuted: 0,
      errors: 0,
      lastCheck: null
    };
  }

  /**
   * Initialize all services
   */
  async initialize() {
    try {
      console.log('Initializing Treasury Monitoring Service...\n');

      // Initialize automation service
      this.automation = new PayrollAutomationService(this.config);
      await this.automation.initialize();

      // Initialize event listener
      this.eventListener = new TreasuryEventListener(this.config);
      await this.eventListener.initialize();

      console.log('✓ All services initialized successfully\n');
    } catch (error) {
      console.error('Error initializing monitoring service:', error);
      throw error;
    }
  }

  /**
   * Start all monitoring and automation
   */
  start() {
    if (!this.automation || !this.eventListener) {
      throw new Error('Services not initialized. Call initialize() first.');
    }

    console.log('🚀 Starting Treasury Monitoring Service...\n');

    // Start automation (cron jobs)
    this.automation.start();

    // Start event listener
    this.eventListener.start();

    this.stats.startTime = new Date();
    
    console.log('✅ Treasury Monitoring Service is now running');
    console.log('   - Automated distribution checks: ACTIVE');
    console.log('   - Event monitoring: ACTIVE');
    console.log('   - Compliance checks: ACTIVE\n');

    // Print stats periodically
    this._startStatsReporting();
  }

  /**
   * Stop all services
   */
  stop() {
    console.log('\n🛑 Stopping Treasury Monitoring Service...');

    if (this.automation) {
      this.automation.stop();
    }

    if (this.eventListener) {
      this.eventListener.stop();
    }

    this._printFinalStats();
    console.log('✅ Service stopped');
  }

  /**
   * Get current treasury status
   */
  async getTreasuryStatus() {
    try {
      const balances = await this.circleGateway.getMultiChainUSDCBalances(
        this.config.treasuryAddress
      );

      const balance = await this.automation.treasuryContract.getBalance();
      const balanceFormatted = ethers.utils.formatUnits(balance, 6);

      return {
        onChainBalance: balanceFormatted,
        multiChainBalances: balances,
        stats: this.stats,
        isRunning: this.automation.isRunning
      };
    } catch (error) {
      console.error('Error getting treasury status:', error);
      throw error;
    }
  }

  /**
   * Print current statistics
   */
  printStats() {
    const uptime = this.stats.startTime 
      ? Math.floor((Date.now() - this.stats.startTime.getTime()) / 1000)
      : 0;
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    console.log('\n' + '='.repeat(60));
    console.log('📊 Treasury Monitoring Statistics');
    console.log('='.repeat(60));
    console.log(`Uptime: ${hours}h ${minutes}m ${seconds}s`);
    console.log(`Distributions Executed: ${this.stats.distributionsExecuted}`);
    console.log(`Allocations Executed: ${this.stats.allocationsExecuted}`);
    console.log(`Rules Executed: ${this.stats.rulesExecuted}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Last Check: ${this.stats.lastCheck || 'Never'}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Start periodic stats reporting
   * @private
   */
  _startStatsReporting() {
    // Print stats every hour
    setInterval(() => {
      this.printStats();
    }, 3600000); // 1 hour
  }

  /**
   * Print final statistics on shutdown
   * @private
   */
  _printFinalStats() {
    this.printStats();
  }
}

module.exports = MonitoringService;

