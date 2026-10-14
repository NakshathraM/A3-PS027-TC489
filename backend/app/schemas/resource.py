from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ResourceType(str, Enum):
    JAVASCRIPT = "javascript"
    CSS = "css"
    IMAGE = "image"
    FONT = "font"
    API = "api"
    IFRAME = "iframe"
    OTHER = "other"

class DiscoveryMethod(str, Enum):
    STATIC_HTML = "static_html"
    BROWSER_REQUEST = "browser_request"
    INFERRED = "inferred"

class ResourceNode(BaseModel):
    resource_id: str
    audit_id: str
    url: str
    hostname: str
    resource_type: ResourceType
    discovery_method: DiscoveryMethod
    is_main_domain: bool = False
    
    # Technical test metrics
    dns_status: str  # AAAA_FOUND, NO_AAAA, DNS_ERROR, NOT_TESTED
    ipv6_status: str  # CONNECTED, FAILED, TIMEOUT, INCONCLUSIVE, NOT_TESTED
    https_status: Optional[str] = None  # SUCCESS, CERT_ERROR, HTTP_ERROR, NOT_TESTED
    a_records: List[str] = []
    aaaa_records: List[str] = []
    
    # Blast radius & scoring
    impact_score: Optional[float] = None
    severity: str = "INFO"  # CRITICAL, WARNING, INFO
    confidence: str = "HIGH"

class DependencyEdge(BaseModel):
    edge_id: str
    audit_id: str
    source_resource_id: str
    target_resource_id: str
    relationship_type: str  # loads_script, loads_stylesheet, embeds_iframe, requests_api, fetches_asset
    provenance: str  # parsed_from_dom, network_initiator, origin_link
    observed_or_inferred: str = "observed"

class DependencyGraphData(BaseModel):
    nodes: List[ResourceNode]
    edges: List[DependencyEdge]
    total_resources: int
    unique_hostnames: int
    ipv6_ready_hostnames: int
    ipv4_only_hostnames: int
