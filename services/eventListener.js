/**
 * Treasury Event Listener
 * Listens to Treasury contract events and updates compliance records
 */

const { ethers } = require('ethers');
const CircleGatewayService = require('./circleGatewayService');

class TreasuryEventListener {
  constructor(config) {
    this.config = config;
    this.provider = null;
    this.treasuryContract = null;
    this.circleGateway = new CircleGatewayService(
      config.circleGatewayApiKey,
      config.circleGatewayBaseUrl
    );
    this.isListening = false;
    this.eventHandlers = new Map();
  }

  /**
   * Initialize the event listener
   */
  async initialize() {
    try {
      this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
      
      const treasuryABI = this._getTreasuryABI();
      this.treasuryContract = new ethers.Contract(
        this.config.treasuryAddress,
        treasuryABI,
        this.provider
      );
      
      console.log('Treasury event listener initialized');
      console.log(`Treasury contract: ${this.config.treasuryAddress}`);
    } catch (error) {
      console.error('Error initializing event listener:', error);
      throw error;
    }
  }

  /**
   * Start listening to Treasury contract events
   */
  start() {
    if (this.isListening) {
      console.warn('Event listener is already running');
      return;
    }

    this._setupEventListeners();
    this.isListening = true;
    console.log('Treasury event listener started');
  }

  /**
   * Stop listening to events
   */
  stop() {
    if (!this.isListening) {
      return;
    }

    // Remove all listeners
    this.eventHandlers.forEach((handler, eventName) => {
      this.treasuryContract.off(eventName, handler);
    });
    
    this.eventHandlers.clear();
    this.isListening = false;
    console.log('Treasury event listener stopped');
  }

  /**
   * Setup event listeners for all Treasury events
   * @private
   */
  _setupEventListeners() {
    // Scheduled Distribution Executed
    const scheduledHandler = async (scheduleId, recipient, amount, event) => {
      await this._handleScheduledDistribution(scheduleId, recipient, amount, event);
    };
    this.treasuryContract.on('ScheduledDistributionExecuted', scheduledHandler);
    this.eventHandlers.set('ScheduledDistributionExecuted', scheduledHandler);

    // Distribution Rule Executed
    const distributionHandler = async (ruleId, recipients, amounts, event) => {
      await this._handleDistributionRule(ruleId, recipients, amounts, event);
    };
    this.treasuryContract.on('DistributionRuleExecuted', distributionHandler);
    this.eventHandlers.set('DistributionRuleExecuted', distributionHandler);

    // Allocation Executed
    const allocationHandler = async (ruleId, recipient, amount, event) => {
      await this._handleAllocation(ruleId, recipient, amount, event);
    };
    this.treasuryContract.on('AllocationExecuted', allocationHandler);
    this.eventHandlers.set('AllocationExecuted', allocationHandler);

    // Compliance Record Created
    const complianceHandler = async (recordId, txHash, recipient, ruleId, source, amount, kycStatus, amlStatus, event) => {
      await this._handleComplianceRecord(recordId, txHash, recipient, ruleId, source, amount, kycStatus, amlStatus, event);
    };
    this.treasuryContract.on('ComplianceRecordCreated', complianceHandler);
    this.eventHandlers.set('ComplianceRecordCreated', complianceHandler);

    // Transaction Executed
    const transactionHandler = async (txHash, to, amount, event) => {
      await this._handleTransaction(txHash, to, amount, event);
    };
    this.treasuryContract.on('TransactionExecuted', transactionHandler);
    this.eventHandlers.set('TransactionExecuted', transactionHandler);
  }

  /**
   * Handle scheduled distribution execution
   * @private
   */
  async _handleScheduledDistribution(scheduleId, recipient, amount, event) {
    try {
      const amountFormatted = ethers.utils.formatUnits(amount, 6);
      
      console.log(`\n[EVENT] Scheduled Distribution Executed:`);
      console.log(`  Schedule ID: ${scheduleId.toString()}`);
      console.log(`  Recipient: ${recipient}`);
      console.log(`  Amount: ${amountFormatted} USDC`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  TX Hash: ${event.transactionHash}`);

      // Perform compliance check
      const complianceCheck = await this.circleGateway.performComplianceCheck({
        recipient,
        amount: amountFormatted,
        source: 'SCHEDULED_DISTRIBUTION'
      });

      console.log(`  Compliance: KYC=${complianceCheck.kycStatus}, AML=${complianceCheck.amlStatus}`);
      console.log(`  Circle TX ID: ${complianceCheck.transactionId}`);

      // Here you would update your database with the compliance record
      // await this.updateComplianceRecord(event.transactionHash, complianceCheck);

    } catch (error) {
      console.error('Error handling scheduled distribution event:', error);
    }
  }

  /**
   * Handle distribution rule execution
   * @private
   */
  async _handleDistributionRule(ruleId, recipients, amounts, event) {
    try {
      console.log(`\n[EVENT] Distribution Rule Executed:`);
      console.log(`  Rule ID: ${ruleId.toString()}`);
      console.log(`  Recipients: ${recipients.length}`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  TX Hash: ${event.transactionHash}`);

      for (let i = 0; i < recipients.length; i++) {
        const amountFormatted = ethers.utils.formatUnits(amounts[i], 6);
        console.log(`  - ${recipients[i]}: ${amountFormatted} USDC`);

        // Perform compliance check for each recipient
        const complianceCheck = await this.circleGateway.performComplianceCheck({
          recipient: recipients[i],
          amount: amountFormatted,
          source: 'DISTRIBUTION_RULE'
        });

        console.log(`    Compliance: KYC=${complianceCheck.kycStatus}, AML=${complianceCheck.amlStatus}`);
      }

    } catch (error) {
      console.error('Error handling distribution rule event:', error);
    }
  }

  /**
   * Handle allocation execution
   * @private
   */
  async _handleAllocation(ruleId, recipient, amount, event) {
    try {
      const amountFormatted = ethers.utils.formatUnits(amount, 6);
      
      console.log(`\n[EVENT] Allocation Executed:`);
      console.log(`  Rule ID: ${ruleId.toString()}`);
      console.log(`  Recipient: ${recipient}`);
      console.log(`  Amount: ${amountFormatted} USDC`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  TX Hash: ${event.transactionHash}`);

      // Perform compliance check
      const complianceCheck = await this.circleGateway.performComplianceCheck({
        recipient,
        amount: amountFormatted,
        source: 'ALLOCATION_RULE'
      });

      console.log(`  Compliance: KYC=${complianceCheck.kycStatus}, AML=${complianceCheck.amlStatus}`);

    } catch (error) {
      console.error('Error handling allocation event:', error);
    }
  }

  /**
   * Handle compliance record creation
   * @private
   */
  async _handleComplianceRecord(recordId, txHash, recipient, ruleId, source, amount, kycStatus, amlStatus, event) {
    try {
      const amountFormatted = ethers.utils.formatUnits(amount, 6);
      
      console.log(`\n[EVENT] Compliance Record Created:`);
      console.log(`  Record ID: ${recordId}`);
      console.log(`  TX Hash: ${txHash}`);
      console.log(`  Recipient: ${recipient}`);
      console.log(`  Rule ID: ${ruleId.toString()}`);
      console.log(`  Source: ${source}`);
      console.log(`  Amount: ${amountFormatted} USDC`);
      console.log(`  KYC Status: ${kycStatus}`);
      console.log(`  AML Status: ${amlStatus}`);

      // Here you would save this to your database
      // await this.saveComplianceRecord({ recordId, txHash, recipient, ... });

    } catch (error) {
      console.error('Error handling compliance record event:', error);
    }
  }

  /**
   * Handle transaction execution
   * @private
   */
  async _handleTransaction(txHash, to, amount, event) {
    try {
      const amountFormatted = ethers.utils.formatUnits(amount, 6);
      
      console.log(`\n[EVENT] Transaction Executed:`);
      console.log(`  TX Hash: ${txHash}`);
      console.log(`  Recipient: ${to}`);
      console.log(`  Amount: ${amountFormatted} USDC`);
      console.log(`  Block: ${event.blockNumber}`);

    } catch (error) {
      console.error('Error handling transaction event:', error);
    }
  }

  /**
   * Get minimal Treasury ABI for events
   * @private
   */
  _getTreasuryABI() {
    return [
      "event ScheduledDistributionExecuted(uint256 indexed scheduleId, address indexed recipient, uint256 amount)",
      "event DistributionRuleExecuted(uint256 indexed ruleId, address[] recipients, uint256[] amounts)",
      "event AllocationExecuted(uint256 indexed ruleId, address indexed recipient, uint256 amount)",
      "event ComplianceRecordCreated(bytes32 indexed recordId, bytes32 indexed transactionHash, address indexed recipient, uint256 ruleId, uint8 source, uint256 amount, uint8 kycStatus, uint8 amlStatus)",
      "event TransactionExecuted(bytes32 indexed txHash, address indexed to, uint256 amount)"
    ];
  }
}

module.exports = TreasuryEventListener;

