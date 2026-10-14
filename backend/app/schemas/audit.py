from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ScanMode(str, Enum):
    QUICK = "quick"
    STANDARD = "standard"
    DEEP = "deep"

class AuditStatus(str, Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    DNS_CHECK = "DNS_CHECK"
    IPV6_CHECK = "IPV6_CHECK"
    HTTPS_CHECK = "HTTPS_CHECK"
    DISCOVERING_DEPENDENCIES = "DISCOVERING_DEPENDENCIES"
    TESTING_DEPENDENCIES = "TESTING_DEPENDENCIES"
    ANALYZING = "ANALYZING"
    GENERATING_REPORT = "GENERATING_REPORT"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ScannerIPv6Status(str, Enum):
    CAPABLE = "CAPABLE"
    UNAVAILABLE = "UNAVAILABLE"
    INCONCLUSIVE = "INCONCLUSIVE"

class AuditCreateRequest(BaseModel):
    target_url: str = Field(..., description="Target website URL to audit")
    scan_mode: ScanMode = Field(ScanMode.STANDARD, description="quick, standard, or deep")
    max_dependencies: Optional[int] = Field(50, ge=5, le=150, description="Max dependencies to inspect")
    request_timeout: Optional[float] = Field(8.0, ge=2.0, le=30.0, description="Per-request timeout in seconds")

class AuditProgress(BaseModel):
    audit_id: str
    status: AuditStatus
    progress_stage: str
    progress_percentage: int
    scanner_ipv6_status: ScannerIPv6Status
    resources_discovered: int = 0
    resources_tested: int = 0
    findings_count: int = 0
    message: Optional[str] = None

class ScoreCategoryBreakdown(BaseModel):
    dns_score: Optional[float] = None
    main_connectivity_score: Optional[float] = None
    https_score: Optional[float] = None
    dependency_score: Optional[float] = None
    protocol_score: Optional[float] = None

class AuditResponse(BaseModel):
    audit_id: str
    target_url: str
    target_hostname: str
    scan_mode: ScanMode
    status: AuditStatus
    progress_stage: str
    progress_percentage: int
    scanner_ipv6_status: ScannerIPv6Status
    started_at: str
    completed_at: Optional[str] = None
    readiness_score: Optional[float] = None
    coverage_score: Optional[float] = None
    confidence_category: str  # HIGH, MODERATE, LOW, INCONCLUSIVE
    category_breakdown: Optional[ScoreCategoryBreakdown] = None
    scoring_model_version: str
    error_message: Optional[str] = None
    is_sample_data: bool = False
    findings_count: int = 0
    dependencies_count: int = 0

class AuditListItem(BaseModel):
    audit_id: str
    target_url: str
    target_hostname: str
    scan_mode: ScanMode
    status: AuditStatus
    started_at: str
    completed_at: Optional[str] = None
    readiness_score: Optional[float] = None
    coverage_score: Optional[float] = None
    confidence_category: str
    findings_count: int
    is_sample_data: bool = False
