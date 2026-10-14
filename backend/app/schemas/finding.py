from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FindingSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"

class FindingCategory(str, Enum):
    DNS = "DNS"
    CONNECTIVITY = "CONNECTIVITY"
    HTTPS = "HTTPS"
    DEPENDENCY = "DEPENDENCY"
    RELIABILITY = "RELIABILITY"

class EvidenceData(BaseModel):
    test_type: str
    target_hostname: str
    destination_ip: Optional[str] = None
    address_family: Optional[str] = None
    dns_a_records: List[str] = []
    dns_aaaa_records: List[str] = []
    connection_result: Optional[str] = None
    duration_ms: Optional[float] = None
    http_status: Optional[int] = None
    tls_validation: Optional[str] = None
    scanner_ipv6_capability: str
    error_detail: Optional[str] = None
    methodology_note: str

class FindingResponse(BaseModel):
    finding_id: str
    audit_id: str
    resource_id: Optional[str] = None
    category: FindingCategory
    title: str
    description: str
    affected_hostname: str
    impact_score: float  # 0 to 100
    potential_impact_category: str  # Informational, Low, Moderate, High
    severity: FindingSeverity
    confidence: str  # HIGH, MODERATE, LOW, INCONCLUSIVE
    recommendation: str
    evidence: EvidenceData
    created_at: str
    status: str = "OPEN"
