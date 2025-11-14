/**
 * Mongoose Schema for Treasury Compliance Transaction Records
 * Compatible with Circle Gateway and Arc transparency integration
 */

const mongoose = require('mongoose');

// Enum definitions matching Solidity enums
const TransactionSource = {
  MULTISIG_TRANSACTION: 'MULTISIG_TRANSACTION',
  SCHEDULED_DISTRIBUTION: 'SCHEDULED_DISTRIBUTION',
  ALLOCATION_RULE: 'ALLOCATION_RULE',
  DISTRIBUTION_RULE: 'DISTRIBUTION_RULE'
};

const ComplianceStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXEMPT: 'EXEMPT',
  UNKNOWN: 'UNKNOWN'
};

// Metadata sub-schema
const MetadataSchema = new mongoose.Schema({
  jurisdiction: {
    type: String,
    match: /^[A-Z]{2}$/,
    description: 'Jurisdiction code (ISO 3166-1 alpha-2)'
  },
  regulatoryCategory: {
    type: String,
    description: 'Regulatory category of the transaction'
  },
  reportingPeriod: {
    type: String,
    description: 'Reporting period identifier (e.g., "2024-Q1")'
  },
  notes: {
    type: String,
    description: 'Additional notes for compliance officers'
  }
}, { _id: false });

// Main Compliance Record Schema
const ComplianceRecordSchema = new mongoose.Schema({
  // Primary identifiers
  recordId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: /^0x[0-9a-fA-F]{64}$/,
    description: 'Unique compliance record identifier (bytes32 hex string)'
  },
  transactionHash: {
    type: String,
    required: true,
    index: true,
    match: /^0x[0-9a-fA-F]{64}$/,
    description: 'On-chain transaction hash from the blockchain'
  },
  internalTxHash: {
    type: String,
    required: true,
    index: true,
    match: /^0x[0-9a-fA-F]{64}$/,
    description: 'Internal transaction identifier within the Treasury contract'
  },
  
  // Rule and source information
  ruleId: {
    type: Number,
    required: true,
    index: true,
    min: 0,
    default: 0,
    description: 'Rule ID that triggered the transaction (0 for manual transactions)'
  },
  source: {
    type: String,
    required: true,
    enum: Object.values(TransactionSource),
    index: true,
    description: 'Source of the transaction'
  },
  
  // Recipient and amount
  recipient: {
    type: String,
    required: true,
    index: true,
    match: /^0x[0-9a-fA-F]{40}$/,
    description: 'Recipient wallet address (Ethereum address)'
  },
  usdcAmount: {
    type: String,
    required: true,
    match: /^[0-9]+$/,
    description: 'USDC amount transferred (6 decimals, as string to preserve precision)'
  },
  usdcAmountFormatted: {
    type: Number,
    required: true,
    description: 'USDC amount in human-readable format (6 decimals)'
  },
  
  // Compliance status
  kycStatus: {
    type: String,
    required: true,
    enum: Object.values(ComplianceStatus),
    index: true,
    default: ComplianceStatus.UNKNOWN,
    description: 'KYC (Know Your Customer) verification status'
  },
  amlStatus: {
    type: String,
    required: true,
    enum: Object.values(ComplianceStatus),
    index: true,
    default: ComplianceStatus.UNKNOWN,
    description: 'AML (Anti-Money Laundering) screening status'
  },
  
  // Timestamp and block information
  timestamp: {
    type: Number,
    required: true,
    index: true,
    min: 0,
    description: 'Unix timestamp of the transaction (seconds since epoch)'
  },
  timestampISO: {
    type: Date,
    required: true,
    index: true,
    description: 'ISO 8601 formatted timestamp for human readability'
  },
  blockNumber: {
    type: Number,
    required: true,
    index: true,
    min: 0,
    description: 'Block number in which the transaction was executed'
  },
  
  // Executor information
  executor: {
    type: String,
    required: true,
    match: /^0x[0-9a-fA-F]{40}$/,
    description: 'Address that executed the transaction'
  },
  
  // External system integration
  circleGatewayTxId: {
    type: String,
    index: true,
    sparse: true,
    description: 'Circle Gateway transaction identifier (if integrated)'
  },
  arcTransparencyId: {
    type: String,
    index: true,
    sparse: true,
    description: 'Arc network transparency identifier for opt-in transparency'
  },
  
  // Reconciliation status
  reconciled: {
    type: Boolean,
    required: true,
    default: false,
    index: true,
    description: 'Whether the transaction has been reconciled for reporting'
  },
  reconciledAt: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Unix timestamp when the record was reconciled (0 if not reconciled)'
  },
  reconciledAtISO: {
    type: Date,
    description: 'ISO 8601 formatted reconciliation timestamp'
  },
  
  // Additional metadata
  metadata: {
    type: MetadataSchema,
    default: {}
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'compliance_records'
});

// Indexes for efficient querying
ComplianceRecordSchema.index({ recipient: 1, timestamp: -1 });
ComplianceRecordSchema.index({ ruleId: 1, timestamp: -1 });
ComplianceRecordSchema.index({ source: 1, timestamp: -1 });
ComplianceRecordSchema.index({ kycStatus: 1, amlStatus: 1 });
ComplianceRecordSchema.index({ reconciled: 1, timestamp: -1 });
ComplianceRecordSchema.index({ timestamp: -1 }); // For date range queries
ComplianceRecordSchema.index({ blockNumber: 1 });

// Compound indexes for common queries
ComplianceRecordSchema.index({ recipient: 1, reconciled: 1 });
ComplianceRecordSchema.index({ ruleId: 1, reconciled: 1 });
ComplianceRecordSchema.index({ timestamp: 1, reconciled: 1 });

// Virtual for formatted USDC amount (if needed)
ComplianceRecordSchema.virtual('usdcAmountDecimal').get(function() {
  return parseFloat(this.usdcAmount) / 1e6;
});

// Methods
ComplianceRecordSchema.methods.markReconciled = function() {
  this.reconciled = true;
  this.reconciledAt = Math.floor(Date.now() / 1000);
  this.reconciledAtISO = new Date();
  return this.save();
};

ComplianceRecordSchema.methods.updateComplianceStatus = function(kycStatus, amlStatus, circleGatewayTxId, arcTransparencyId) {
  this.kycStatus = kycStatus;
  this.amlStatus = amlStatus;
  if (circleGatewayTxId) this.circleGatewayTxId = circleGatewayTxId;
  if (arcTransparencyId) this.arcTransparencyId = arcTransparencyId;
  return this.save();
};

// Static methods for querying
ComplianceRecordSchema.statics.findByRecipient = function(recipient, options = {}) {
  const query = this.find({ recipient });
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort);
  return query;
};

ComplianceRecordSchema.statics.findByRuleId = function(ruleId, options = {}) {
  const query = this.find({ ruleId });
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort);
  return query;
};

ComplianceRecordSchema.statics.findUnreconciled = function(options = {}) {
  const query = this.find({ reconciled: false });
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort || { timestamp: -1 });
  return query;
};

ComplianceRecordSchema.statics.findByDateRange = function(startTimestamp, endTimestamp, options = {}) {
  const query = this.find({
    timestamp: {
      $gte: startTimestamp,
      $lte: endTimestamp
    }
  });
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort || { timestamp: -1 });
  return query;
};

ComplianceRecordSchema.statics.findByComplianceStatus = function(kycStatus, amlStatus, options = {}) {
  const query = this.find({ kycStatus, amlStatus });
  if (options.limit) query.limit(options.limit);
  if (options.sort) query.sort(options.sort || { timestamp: -1 });
  return query;
};

// Pre-save hook to ensure timestampISO is set
ComplianceRecordSchema.pre('save', function(next) {
  if (this.timestamp && !this.timestampISO) {
    this.timestampISO = new Date(this.timestamp * 1000);
  }
  if (this.reconciledAt && !this.reconciledAtISO && this.reconciled) {
    this.reconciledAtISO = new Date(this.reconciledAt * 1000);
  }
  next();
});

const ComplianceRecord = mongoose.model('ComplianceRecord', ComplianceRecordSchema);

module.exports = {
  ComplianceRecord,
  TransactionSource,
  ComplianceStatus
};

