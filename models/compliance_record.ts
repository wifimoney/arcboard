/**
 * TypeScript interfaces and types for Treasury Compliance Transaction Records
 * Compatible with Circle Gateway and Arc transparency integration
 */

/**
 * Transaction source types matching Solidity enum
 */
export enum TransactionSource {
  MULTISIG_TRANSACTION = 'MULTISIG_TRANSACTION',
  SCHEDULED_DISTRIBUTION = 'SCHEDULED_DISTRIBUTION',
  ALLOCATION_RULE = 'ALLOCATION_RULE',
  DISTRIBUTION_RULE = 'DISTRIBUTION_RULE'
}

/**
 * KYC/AML compliance status flags matching Solidity enum
 */
export enum ComplianceStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXEMPT = 'EXEMPT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Additional metadata for regulatory reporting
 */
export interface Metadata {
  jurisdiction?: string; // ISO 3166-1 alpha-2 (e.g., "US")
  regulatoryCategory?: string;
  reportingPeriod?: string; // e.g., "2024-Q1"
  notes?: string;
}

/**
 * Compliance transaction record for regulatory reporting and auditing
 * Aligned with Circle Gateway and Arc transparency requirements
 */
export interface ComplianceRecord {
  // Primary identifiers
  recordId: string; // bytes32 hex string (0x + 64 hex chars)
  transactionHash: string; // bytes32 hex string
  internalTxHash: string; // bytes32 hex string

  // Rule and source information
  ruleId: number; // 0 for manual transactions
  source: TransactionSource;

  // Recipient and amount
  recipient: string; // Ethereum address (0x + 40 hex chars)
  usdcAmount: string; // String representation of amount (6 decimals)
  usdcAmountFormatted: number; // Human-readable format

  // Compliance status
  kycStatus: ComplianceStatus;
  amlStatus: ComplianceStatus;

  // Timestamp and block information
  timestamp: number; // Unix timestamp (seconds)
  timestampISO: string; // ISO 8601 formatted
  blockNumber: number;

  // Executor information
  executor: string; // Ethereum address

  // External system integration
  circleGatewayTxId?: string;
  arcTransparencyId?: string;

  // Reconciliation status
  reconciled: boolean;
  reconciledAt: number; // Unix timestamp, 0 if not reconciled
  reconciledAtISO?: string; // ISO 8601 formatted

  // Additional metadata
  metadata?: Metadata;

  // Database fields (optional, for ORM integration)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Validation helpers
 */
export class ComplianceRecordValidator {
  private static readonly ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
  private static readonly HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;
  private static readonly AMOUNT_REGEX = /^[0-9]+$/;
  private static readonly JURISDICTION_REGEX = /^[A-Z]{2}$/;

  static validateAddress(address: string): boolean {
    return this.ADDRESS_REGEX.test(address);
  }

  static validateHash(hash: string): boolean {
    return this.HASH_REGEX.test(hash);
  }

  static validateAmount(amount: string): boolean {
    return this.AMOUNT_REGEX.test(amount);
  }

  static validateJurisdiction(jurisdiction: string): boolean {
    return this.JURISDICTION_REGEX.test(jurisdiction);
  }

  static validate(record: Partial<ComplianceRecord>): string[] {
    const errors: string[] = [];

    if (record.recordId && !this.validateHash(record.recordId)) {
      errors.push('recordId must be a valid bytes32 hex string');
    }

    if (record.transactionHash && !this.validateHash(record.transactionHash)) {
      errors.push('transactionHash must be a valid bytes32 hex string');
    }

    if (record.internalTxHash && !this.validateHash(record.internalTxHash)) {
      errors.push('internalTxHash must be a valid bytes32 hex string');
    }

    if (record.recipient && !this.validateAddress(record.recipient)) {
      errors.push('recipient must be a valid Ethereum address');
    }

    if (record.executor && !this.validateAddress(record.executor)) {
      errors.push('executor must be a valid Ethereum address');
    }

    if (record.usdcAmount && !this.validateAmount(record.usdcAmount)) {
      errors.push('usdcAmount must be a numeric string');
    }

    if (record.ruleId !== undefined && record.ruleId < 0) {
      errors.push('ruleId must be non-negative');
    }

    if (record.timestamp !== undefined && record.timestamp < 0) {
      errors.push('timestamp must be non-negative');
    }

    if (record.blockNumber !== undefined && record.blockNumber < 0) {
      errors.push('blockNumber must be non-negative');
    }

    if (record.metadata?.jurisdiction && !this.validateJurisdiction(record.metadata.jurisdiction)) {
      errors.push('metadata.jurisdiction must be a valid ISO 3166-1 alpha-2 code');
    }

    return errors;
  }
}

/**
 * Utility functions for ComplianceRecord
 */
export class ComplianceRecordUtils {
  /**
   * Convert Unix timestamp to ISO 8601 string
   */
  static timestampToISO(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString();
  }

  /**
   * Convert ISO 8601 string to Unix timestamp
   */
  static isoToTimestamp(iso: string): number {
    return Math.floor(new Date(iso).getTime() / 1000);
  }

  /**
   * Format USDC amount from string to number
   */
  static formatUSDCAmount(amount: string): number {
    return parseInt(amount, 10) / 1e6;
  }

  /**
   * Convert number to USDC amount string (6 decimals)
   */
  static unformatUSDCAmount(amount: number): string {
    return Math.floor(amount * 1e6).toString();
  }

  /**
   * Mark record as reconciled
   */
  static markReconciled(record: ComplianceRecord): ComplianceRecord {
    const now = Math.floor(Date.now() / 1000);
    return {
      ...record,
      reconciled: true,
      reconciledAt: now,
      reconciledAtISO: this.timestampToISO(now)
    };
  }

  /**
   * Update compliance status
   */
  static updateComplianceStatus(
    record: ComplianceRecord,
    kycStatus: ComplianceStatus,
    amlStatus: ComplianceStatus,
    circleGatewayTxId?: string,
    arcTransparencyId?: string
  ): ComplianceRecord {
    return {
      ...record,
      kycStatus,
      amlStatus,
      circleGatewayTxId: circleGatewayTxId || record.circleGatewayTxId,
      arcTransparencyId: arcTransparencyId || record.arcTransparencyId
    };
  }

  /**
   * Create a new compliance record from event data
   */
  static fromEvent(
    recordId: string,
    transactionHash: string,
    recipient: string,
    ruleId: number,
    source: TransactionSource,
    amount: string,
    executor: string,
    blockNumber: number,
    timestamp: number
  ): ComplianceRecord {
    return {
      recordId,
      transactionHash,
      internalTxHash: recordId, // Use recordId as internal hash initially
      ruleId,
      source,
      recipient,
      usdcAmount: amount,
      usdcAmountFormatted: this.formatUSDCAmount(amount),
      kycStatus: ComplianceStatus.UNKNOWN,
      amlStatus: ComplianceStatus.UNKNOWN,
      timestamp,
      timestampISO: this.timestampToISO(timestamp),
      blockNumber,
      executor,
      reconciled: false,
      reconciledAt: 0
    };
  }
}

/**
 * Example usage and type guards
 */
export function isComplianceRecord(obj: any): obj is ComplianceRecord {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.recordId === 'string' &&
    typeof obj.transactionHash === 'string' &&
    typeof obj.recipient === 'string' &&
    typeof obj.ruleId === 'number' &&
    typeof obj.usdcAmount === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.blockNumber === 'number' &&
    Object.values(TransactionSource).includes(obj.source) &&
    Object.values(ComplianceStatus).includes(obj.kycStatus) &&
    Object.values(ComplianceStatus).includes(obj.amlStatus)
  );
}

