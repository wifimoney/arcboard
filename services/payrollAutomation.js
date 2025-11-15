/**
 * Payroll Automation Service
 * Cron job that periodically checks distribution rules and executes them
 * when triggers are met (e.g., scheduled payroll)
 */

const { ethers } = require('ethers');
const cron = require('node-cron');
const CircleGatewayService = require('./circleGatewayService');

// Make ethers available for monitoring service
if (typeof module !== 'undefined' && module.exports) {
  module.exports.ethers = ethers;
}

class PayrollAutomationService {
  constructor(config) {
    this.config = config;
    this.treasuryContract = null;
    this.provider = null;
    this.signer = null;
    this.circleGateway = new CircleGatewayService(
      config.circleGatewayApiKey,
      config.circleGatewayBaseUrl
    );
    this.isRunning = false;
    this.jobs = new Map();
  }

  /**
   * Initialize the service with contract and provider
   */
  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
      
      // Initialize signer (for executing transactions)
      this.signer = new ethers.Wallet(this.config.privateKey, this.provider);
      
      // Initialize contract
      const treasuryABI = this._getTreasuryABI();
      this.treasuryContract = new ethers.Contract(
        this.config.treasuryAddress,
        treasuryABI,
        this.signer
      );
      
      console.log('Payroll automation service initialized');
      console.log(`Treasury contract: ${this.config.treasuryAddress}`);
      console.log(`Executor address: ${this.signer.address}`);
    } catch (error) {
      console.error('Error initializing payroll automation:', error);
      throw error;
    }
  }

  /**
   * Start the cron job scheduler
   */
  start() {
    if (this.isRunning) {
      console.warn('Payroll automation is already running');
      return;
    }

    // Schedule job to run every minute (adjust as needed)
    // For production, you might want to run every 5 minutes or hourly
    const cronExpression = this.config.cronExpression || '*/1 * * * *'; // Every minute
    
    const job = cron.schedule(cronExpression, async () => {
      try {
        await this.checkAndExecuteDistributions();
      } catch (error) {
        console.error('Error in cron job execution:', error);
        // Don't throw - we want the cron to continue running
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.jobs.set('main', job);
    this.isRunning = true;
    
    console.log(`Payroll automation started with cron: ${cronExpression}`);
    console.log('Automation will check for due distributions and execute them automatically\n');
    
    // Also run immediately on start (with delay to allow initialization)
    setTimeout(() => {
      this.checkAndExecuteDistributions();
    }, 2000);
  }

  /**
   * Stop the cron job scheduler
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.jobs.forEach(job => job.stop());
    this.jobs.clear();
    this.isRunning = false;
    
    console.log('Payroll automation stopped');
  }

  /**
   * Check distribution rules and execute if triggers are met
   */
  async checkAndExecuteDistributions() {
    const startTime = Date.now();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${new Date().toISOString()}] Starting distribution check...`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      // Get current balance for context
      const balance = await this.treasuryContract.getBalance();
      const balanceFormatted = ethers.utils.formatUnits(balance, 6);
      console.log(`Current Treasury Balance: ${balanceFormatted} USDC\n`);
      
      let totalExecuted = 0;
      
      // 1. Check scheduled distributions (payroll)
      const scheduledResult = await this.checkScheduledDistributions();
      if (scheduledResult) totalExecuted += scheduledResult.count || 0;
      
      // 2. Check rule-based distributions
      const distributionResult = await this.checkRuleBasedDistributions();
      if (distributionResult) totalExecuted += distributionResult.rulesExecuted || 0;
      
      // 3. Check allocation rules
      const allocationResult = await this.checkAllocationRules();
      if (allocationResult) totalExecuted += allocationResult.rulesExecuted || 0;
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Check completed in ${duration}s. Total rules executed: ${totalExecuted}`);
      console.log(`${'='.repeat(60)}\n`);
      
    } catch (error) {
      console.error('Error checking distributions:', error);
      // Don't throw - we want the cron to continue running
    }
  }

  /**
   * Check and execute scheduled distributions (payroll)
   */
  async checkScheduledDistributions() {
    try {
      // Get all due scheduled distributions
      const dueSchedules = await this.treasuryContract.getDueScheduledDistributions();
      
      if (dueSchedules.length === 0) {
        console.log('✓ No due scheduled distributions');
        return { count: 0 };
      }

      console.log(`\n📅 Found ${dueSchedules.length} due scheduled distribution(s)`);
      console.log(`${'-'.repeat(60)}`);
      
      const results = [];
      
      // Execute each due schedule
      for (const scheduleId of dueSchedules) {
        try {
          const result = await this.executeScheduledDistribution(scheduleId);
          if (result) results.push(result);
        } catch (error) {
          console.error(`❌ Error executing schedule ${scheduleId}:`, error.message);
          // Continue with other schedules
        }
      }
      
      return { count: results.length, results };
    } catch (error) {
      console.error('Error checking scheduled distributions:', error);
      // Don't throw - might be expected if contract call fails
      return { count: 0, error: error.message };
    }
  }

  /**
   * Execute a scheduled distribution
   */
  async executeScheduledDistribution(scheduleId) {
    try {
      // Get schedule details
      const schedule = await this.treasuryContract.getScheduledDistribution(scheduleId);
      const amountFormatted = ethers.utils.formatUnits(schedule.amount, 6);
      
      console.log(`\n💼 Schedule ID: ${scheduleId}`);
      console.log(`   Recipient: ${schedule.recipient}`);
      console.log(`   Amount: ${amountFormatted} USDC`);
      console.log(`   Status: ${schedule.active ? 'Active' : 'Inactive'}`);
      
      // Perform compliance check via Circle Gateway
      console.log(`   🔍 Performing compliance check...`);
      const complianceCheck = await this.circleGateway.performComplianceCheck({
        recipient: schedule.recipient,
        amount: amountFormatted,
        source: 'SCHEDULED_DISTRIBUTION'
      });
      
      console.log(`   ✓ KYC Status: ${complianceCheck.kycStatus}`);
      console.log(`   ✓ AML Status: ${complianceCheck.amlStatus}`);
      console.log(`   ✓ Risk Score: ${complianceCheck.riskScore}`);
      
      // Check if compliance requirements are met
      if (this.config.requireKYC && complianceCheck.kycStatus !== 'VERIFIED' && complianceCheck.kycStatus !== 'EXEMPT') {
        console.warn(`   ⚠️  Skipping: KYC not verified (required: ${this.config.requireKYC})`);
        return null;
      }
      
      if (this.config.requireAML && complianceCheck.amlStatus !== 'VERIFIED' && complianceCheck.amlStatus !== 'EXEMPT') {
        console.warn(`   ⚠️  Skipping: AML not verified (required: ${this.config.requireAML})`);
        return null;
      }
      
      // Execute the distribution
      console.log(`   📤 Executing distribution...`);
      const tx = await this.treasuryContract.executeScheduledDistributions([scheduleId], {
        gasLimit: 500000 // Adjust as needed
      });
      
      console.log(`   ✓ Transaction submitted: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`   🔗 Circle Gateway TX ID: ${complianceCheck.transactionId}`);
      
      return {
        scheduleId: scheduleId.toString(),
        recipient: schedule.recipient,
        amount: amountFormatted,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        circleGatewayTxId: complianceCheck.transactionId,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error(`   ❌ Error executing scheduled distribution ${scheduleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Check and execute rule-based distributions
   */
  async checkRuleBasedDistributions() {
    try {
      // Get all eligible distribution rules
      const eligibleRules = await this.treasuryContract.getEligibleDistributionRules();
      
      if (eligibleRules.length === 0) {
        console.log('✓ No eligible distribution rules');
        return { rulesExecuted: 0 };
      }

      console.log(`\n📋 Found ${eligibleRules.length} eligible distribution rule(s)`);
      console.log(`   Rule IDs: ${eligibleRules.map(r => r.toString()).join(', ')}`);
      console.log(`   📤 Executing all eligible rules...`);
      
      // Execute all eligible rules (they're already sorted by priority)
      const tx = await this.treasuryContract.executeAllEligibleDistributionRules({
        gasLimit: 1000000 // Adjust as needed
      });
      
      console.log(`   ✓ Transaction submitted: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
      
      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        rulesExecuted: eligibleRules.length,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      // Check if it's a "no eligible rules" type error
      if (error.message && (
        error.message.includes('No eligible') ||
        error.message.includes('no eligible') ||
        error.message.includes('insufficient balance')
      )) {
        console.log('✓ No eligible distribution rules to execute');
        return { rulesExecuted: 0 };
      }
      console.error('❌ Error checking rule-based distributions:', error.message);
      return { rulesExecuted: 0, error: error.message };
    }
  }

  /**
   * Check and execute allocation rules
   */
  async checkAllocationRules() {
    try {
      // Get all eligible allocation rules
      const eligibleRules = await this.treasuryContract.getEligibleAllocationRules();
      
      if (eligibleRules.length === 0) {
        console.log('✓ No eligible allocation rules');
        return { rulesExecuted: 0 };
      }

      console.log(`\n💰 Found ${eligibleRules.length} eligible allocation rule(s)`);
      console.log(`   Rule IDs: ${eligibleRules.map(r => r.toString()).join(', ')}`);
      console.log(`   📤 Executing all eligible allocations...`);
      
      // Execute all eligible allocations
      const tx = await this.treasuryContract.executeAllEligibleAllocations({
        gasLimit: 1000000 // Adjust as needed
      });
      
      console.log(`   ✓ Transaction submitted: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
      
      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        rulesExecuted: eligibleRules.length,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      // Check if it's a "no eligible rules" type error
      if (error.message && (
        error.message.includes('No eligible') ||
        error.message.includes('no eligible') ||
        error.message.includes('insufficient balance')
      )) {
        console.log('✓ No eligible allocation rules to execute');
        return { rulesExecuted: 0 };
      }
      console.error('❌ Error checking allocation rules:', error.message);
      return { rulesExecuted: 0, error: error.message };
    }
  }

  /**
   * Get treasury balance from Circle Gateway
   */
  async getTreasuryBalance() {
    try {
      const balances = await this.circleGateway.getMultiChainUSDCBalances(
        this.config.treasuryAddress
      );
      return balances;
    } catch (error) {
      console.error('Error fetching treasury balance:', error);
      throw error;
    }
  }

  /**
   * Get minimal Treasury ABI (only functions we need)
   * @private
   */
  _getTreasuryABI() {
    return [
      "function getDueScheduledDistributions() external view returns (uint256[] memory)",
      "function getScheduledDistribution(uint256 scheduleId) external view returns (tuple(address recipient, uint256 amount, uint256 interval, uint256 nextDistribution, bool active, uint256 totalDistributed))",
      "function executeScheduledDistributions(uint256[] calldata scheduleIds) external",
      "function getEligibleDistributionRules() external view returns (uint256[] memory)",
      "function executeAllEligibleDistributionRules() external returns (uint256 executedCount)",
      "function getEligibleAllocationRules() external view returns (uint256[] memory)",
      "function executeAllEligibleAllocations() external returns (uint256 executedCount)",
      "function getBalance() external view returns (uint256)",
      "event ScheduledDistributionExecuted(uint256 indexed scheduleId, address indexed recipient, uint256 amount)",
      "event DistributionRuleExecuted(uint256 indexed ruleId, address[] recipients, uint256[] amounts)",
      "event AllocationExecuted(uint256 indexed ruleId, address indexed recipient, uint256 amount)"
    ];
  }
}

module.exports = PayrollAutomationService;

