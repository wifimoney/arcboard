"""
Python data models for Treasury Compliance Transaction Records
Compatible with Circle Gateway and Arc transparency integration

Uses Pydantic for validation and type checking
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, validator, root_validator
import re


class TransactionSource(str, Enum):
    """Transaction source types matching Solidity enum"""
    MULTISIG_TRANSACTION = "MULTISIG_TRANSACTION"
    SCHEDULED_DISTRIBUTION = "SCHEDULED_DISTRIBUTION"
    ALLOCATION_RULE = "ALLOCATION_RULE"
    DISTRIBUTION_RULE = "DISTRIBUTION_RULE"


class ComplianceStatus(str, Enum):
    """KYC/AML compliance status flags matching Solidity enum"""
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    EXEMPT = "EXEMPT"
    UNKNOWN = "UNKNOWN"


class Metadata(BaseModel):
    """Additional metadata for regulatory reporting"""
    jurisdiction: Optional[str] = Field(
        None,
        regex=r"^[A-Z]{2}$",
        description="Jurisdiction code (ISO 3166-1 alpha-2)"
    )
    regulatoryCategory: Optional[str] = Field(
        None,
        description="Regulatory category of the transaction"
    )
    reportingPeriod: Optional[str] = Field(
        None,
        description="Reporting period identifier (e.g., '2024-Q1')"
    )
    notes: Optional[str] = Field(
        None,
        description="Additional notes for compliance officers"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "jurisdiction": "US",
                "regulatoryCategory": "PAYROLL",
                "reportingPeriod": "2024-Q1",
                "notes": "Monthly payroll distribution"
            }
        }


class ComplianceRecord(BaseModel):
    """
    Compliance transaction record for regulatory reporting and auditing
    
    Aligned with Circle Gateway and Arc transparency requirements
    """
    # Primary identifiers
    recordId: str = Field(
        ...,
        regex=r"^0x[0-9a-fA-F]{64}$",
        description="Unique compliance record identifier (bytes32 hex string)"
    )
    transactionHash: str = Field(
        ...,
        regex=r"^0x[0-9a-fA-F]{64}$",
        description="On-chain transaction hash from the blockchain"
    )
    internalTxHash: str = Field(
        ...,
        regex=r"^0x[0-9a-fA-F]{64}$",
        description="Internal transaction identifier within the Treasury contract"
    )
    
    # Rule and source information
    ruleId: int = Field(
        ...,
        ge=0,
        description="Rule ID that triggered the transaction (0 for manual transactions)"
    )
    source: TransactionSource = Field(
        ...,
        description="Source of the transaction"
    )
    
    # Recipient and amount
    recipient: str = Field(
        ...,
        regex=r"^0x[0-9a-fA-F]{40}$",
        description="Recipient wallet address (Ethereum address)"
    )
    usdcAmount: str = Field(
        ...,
        regex=r"^[0-9]+$",
        description="USDC amount transferred (6 decimals, as string to preserve precision)"
    )
    usdcAmountFormatted: Decimal = Field(
        ...,
        description="USDC amount in human-readable format (6 decimals)"
    )
    
    # Compliance status
    kycStatus: ComplianceStatus = Field(
        ComplianceStatus.UNKNOWN,
        description="KYC (Know Your Customer) verification status"
    )
    amlStatus: ComplianceStatus = Field(
        ComplianceStatus.UNKNOWN,
        description="AML (Anti-Money Laundering) screening status"
    )
    
    # Timestamp and block information
    timestamp: int = Field(
        ...,
        ge=0,
        description="Unix timestamp of the transaction (seconds since epoch)"
    )
    timestampISO: datetime = Field(
        ...,
        description="ISO 8601 formatted timestamp for human readability"
    )
    blockNumber: int = Field(
        ...,
        ge=0,
        description="Block number in which the transaction was executed"
    )
    
    # Executor information
    executor: str = Field(
        ...,
        regex=r"^0x[0-9a-fA-F]{40}$",
        description="Address that executed the transaction"
    )
    
    # External system integration
    circleGatewayTxId: Optional[str] = Field(
        None,
        description="Circle Gateway transaction identifier (if integrated)"
    )
    arcTransparencyId: Optional[str] = Field(
        None,
        description="Arc network transparency identifier for opt-in transparency"
    )
    
    # Reconciliation status
    reconciled: bool = Field(
        False,
        description="Whether the transaction has been reconciled for reporting"
    )
    reconciledAt: int = Field(
        0,
        ge=0,
        description="Unix timestamp when the record was reconciled (0 if not reconciled)"
    )
    reconciledAtISO: Optional[datetime] = Field(
        None,
        description="ISO 8601 formatted reconciliation timestamp"
    )
    
    # Additional metadata
    metadata: Optional[Metadata] = Field(
        None,
        description="Additional metadata for regulatory reporting"
    )
    
    # Database fields (optional, for ORM integration)
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    
    @validator('usdcAmountFormatted', pre=True, always=True)
    def calculate_formatted_amount(cls, v, values):
        """Calculate formatted amount from usdcAmount string"""
        if 'usdcAmount' in values:
            return Decimal(values['usdcAmount']) / Decimal('1000000')
        return v
    
    @validator('timestampISO', pre=True, always=True)
    def convert_timestamp(cls, v, values):
        """Convert Unix timestamp to datetime"""
        if 'timestamp' in values and isinstance(values['timestamp'], int):
            return datetime.fromtimestamp(values['timestamp'])
        return v
    
    @validator('reconciledAtISO', pre=True, always=True)
    def convert_reconciled_timestamp(cls, v, values):
        """Convert reconciled timestamp to datetime if reconciled"""
        if values.get('reconciled') and values.get('reconciledAt') and values['reconciledAt'] > 0:
            return datetime.fromtimestamp(values['reconciledAt'])
        return None
    
    @root_validator
    def validate_addresses(cls, values):
        """Validate Ethereum address format"""
        address_fields = ['recipient', 'executor']
        address_pattern = re.compile(r'^0x[0-9a-fA-F]{40}$')
        
        for field in address_fields:
            if field in values and not address_pattern.match(values[field]):
                raise ValueError(f'{field} must be a valid Ethereum address')
        
        return values
    
    def mark_reconciled(self) -> 'ComplianceRecord':
        """Mark record as reconciled"""
        self.reconciled = True
        self.reconciledAt = int(datetime.now().timestamp())
        self.reconciledAtISO = datetime.now()
        return self
    
    def update_compliance_status(
        self,
        kyc_status: ComplianceStatus,
        aml_status: ComplianceStatus,
        circle_gateway_tx_id: Optional[str] = None,
        arc_transparency_id: Optional[str] = None
    ) -> 'ComplianceRecord':
        """Update compliance status and external system IDs"""
        self.kycStatus = kyc_status
        self.amlStatus = aml_status
        if circle_gateway_tx_id:
            self.circleGatewayTxId = circle_gateway_tx_id
        if arc_transparency_id:
            self.arcTransparencyId = arc_transparency_id
        return self
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return self.dict(exclude_none=True)
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return self.json(exclude_none=True, exclude={'createdAt', 'updatedAt'})
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v),
        }
        schema_extra = {
            "example": {
                "recordId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                "internalTxHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
                "ruleId": 42,
                "source": "ALLOCATION_RULE",
                "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "usdcAmount": "1000000000",
                "usdcAmountFormatted": 1000.0,
                "kycStatus": "VERIFIED",
                "amlStatus": "VERIFIED",
                "timestamp": 1704067200,
                "timestampISO": "2024-01-01T00:00:00Z",
                "blockNumber": 12345678,
                "executor": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                "circleGatewayTxId": "cg_tx_1234567890abcdef",
                "arcTransparencyId": "arc_tx_abcdef1234567890",
                "reconciled": False,
                "reconciledAt": 0,
                "reconciledAtISO": None,
                "metadata": {
                    "jurisdiction": "US",
                    "regulatoryCategory": "PAYROLL",
                    "reportingPeriod": "2024-Q1",
                    "notes": "Monthly payroll distribution"
                }
            }
        }


# SQLAlchemy model (optional, for database ORM)
try:
    from sqlalchemy import Column, String, Integer, Boolean, DateTime, Numeric, Text, JSON
    from sqlalchemy.ext.declarative import declarative_base
    
    Base = declarative_base()
    
    class ComplianceRecordDB(Base):
        """SQLAlchemy ORM model for compliance records"""
        __tablename__ = 'compliance_records'
        
        # Primary key
        record_id = Column(String(66), primary_key=True, index=True)
        
        # Transaction identifiers
        transaction_hash = Column(String(66), nullable=False, index=True)
        internal_tx_hash = Column(String(66), nullable=False, index=True)
        
        # Rule and source
        rule_id = Column(Integer, nullable=False, index=True, default=0)
        source = Column(String(50), nullable=False, index=True)
        
        # Recipient and amount
        recipient = Column(String(42), nullable=False, index=True)
        usdc_amount = Column(String(50), nullable=False)  # Store as string for precision
        usdc_amount_formatted = Column(Numeric(20, 6), nullable=False)
        
        # Compliance status
        kyc_status = Column(String(20), nullable=False, index=True, default='UNKNOWN')
        aml_status = Column(String(20), nullable=False, index=True, default='UNKNOWN')
        
        # Timestamps
        timestamp = Column(Integer, nullable=False, index=True)
        timestamp_iso = Column(DateTime, nullable=False, index=True)
        block_number = Column(Integer, nullable=False, index=True)
        
        # Executor
        executor = Column(String(42), nullable=False)
        
        # External system IDs
        circle_gateway_tx_id = Column(String(100), nullable=True, index=True)
        arc_transparency_id = Column(String(100), nullable=True, index=True)
        
        # Reconciliation
        reconciled = Column(Boolean, nullable=False, default=False, index=True)
        reconciled_at = Column(Integer, nullable=False, default=0)
        reconciled_at_iso = Column(DateTime, nullable=True)
        
        # Metadata (stored as JSON)
        metadata = Column(JSON, nullable=True)
        
        # Audit fields
        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
        
        def to_pydantic(self) -> ComplianceRecord:
            """Convert SQLAlchemy model to Pydantic model"""
            return ComplianceRecord(
                recordId=self.record_id,
                transactionHash=self.transaction_hash,
                internalTxHash=self.internal_tx_hash,
                ruleId=self.rule_id,
                source=TransactionSource(self.source),
                recipient=self.recipient,
                usdcAmount=self.usdc_amount,
                usdcAmountFormatted=Decimal(str(self.usdc_amount_formatted)),
                kycStatus=ComplianceStatus(self.kyc_status),
                amlStatus=ComplianceStatus(self.aml_status),
                timestamp=self.timestamp,
                timestampISO=self.timestamp_iso,
                blockNumber=self.block_number,
                executor=self.executor,
                circleGatewayTxId=self.circle_gateway_tx_id,
                arcTransparencyId=self.arc_transparency_id,
                reconciled=self.reconciled,
                reconciledAt=self.reconciled_at,
                reconciledAtISO=self.reconciled_at_iso,
                metadata=Metadata(**self.metadata) if self.metadata else None,
                createdAt=self.created_at,
                updatedAt=self.updated_at
            )
        
        @classmethod
        def from_pydantic(cls, record: ComplianceRecord) -> 'ComplianceRecordDB':
            """Create SQLAlchemy model from Pydantic model"""
            return cls(
                record_id=record.recordId,
                transaction_hash=record.transactionHash,
                internal_tx_hash=record.internalTxHash,
                rule_id=record.ruleId,
                source=record.source.value,
                recipient=record.recipient,
                usdc_amount=record.usdcAmount,
                usdc_amount_formatted=float(record.usdcAmountFormatted),
                kyc_status=record.kycStatus.value,
                aml_status=record.amlStatus.value,
                timestamp=record.timestamp,
                timestamp_iso=record.timestampISO,
                block_number=record.blockNumber,
                executor=record.executor,
                circle_gateway_tx_id=record.circleGatewayTxId,
                arc_transparency_id=record.arcTransparencyId,
                reconciled=record.reconciled,
                reconciled_at=record.reconciledAt,
                reconciled_at_iso=record.reconciledAtISO,
                metadata=record.metadata.dict() if record.metadata else None
            )
    
except ImportError:
    # SQLAlchemy not available
    ComplianceRecordDB = None

