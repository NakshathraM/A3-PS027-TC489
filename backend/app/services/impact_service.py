from typing import Tuple
from app.schemas.resource import ResourceType

# Documented weights for the Dependency Blast-Radius Engine
WEIGHT_CRITICALITY = 0.35
WEIGHT_SEVERITY = 0.30
WEIGHT_RELEVANCE = 0.20
WEIGHT_EVIDENCE = 0.15

RESOURCE_CRITICALITY_MAP = {
    ResourceType.API: 90.0,
    ResourceType.JAVASCRIPT: 85.0,
    ResourceType.CSS: 70.0,
    ResourceType.IFRAME: 60.0,
    ResourceType.FONT: 40.0,
    ResourceType.IMAGE: 30.0,
    ResourceType.OTHER: 30.0,
}

def calculate_impact_score(
    resource_type: ResourceType,
    failure_type: str,
    is_main_domain: bool,
    evidence_quality: str = "HIGH"
) -> Tuple[float, str, str]:
    """
    Calculates deterministic potential impact using the Blast-Radius Engine formula:
    Impact Score = 0.35 × Resource Criticality + 0.30 × Failure Severity + 0.20 × Page Relevance + 0.15 × Evidence Strength

    Returns: (score, category, explanation)
    """
    # 1. Resource Criticality (0 - 100)
    crit = RESOURCE_CRITICALITY_MAP.get(resource_type, 40.0)
    if is_main_domain:
        crit = 100.0

    # 2. Failure Severity (0 - 100)
    if failure_type == "MAIN_SITE_UNREACHABLE_IPV6":
        sev = 100.0
    elif failure_type == "IPV6_TCP_TIMEOUT_OR_FAILED":
        sev = 85.0
    elif failure_type == "TLS_VERIFICATION_FAILED":
        sev = 80.0
    elif failure_type == "NO_AAAA_RECORD":
        sev = 60.0
    elif failure_type == "INCONCLUSIVE_SCANNER_LIMIT":
        sev = 30.0
    elif failure_type == "HEALTHY":
        sev = 0.0
    else:
        sev = 50.0

    # 3. Page Relevance (0 - 100)
    if is_main_domain:
        rel = 100.0
    elif resource_type in (ResourceType.JAVASCRIPT, ResourceType.CSS, ResourceType.API):
        rel = 80.0
    else:
        rel = 55.0

    # 4. Evidence Strength (0 - 100)
    if evidence_quality == "HIGH":
        ev = 95.0
    elif evidence_quality == "MODERATE":
        ev = 70.0
    elif evidence_quality == "LOW":
        ev = 45.0
    else:
        ev = 30.0

    raw_score = (
        (WEIGHT_CRITICALITY * crit)
        + (WEIGHT_SEVERITY * sev)
        + (WEIGHT_RELEVANCE * rel)
        + (WEIGHT_EVIDENCE * ev)
    )
    score = round(min(100.0, max(0.0, raw_score)), 1)

    # Threshold mapping
    if score >= 75.0:
        category = "High potential impact"
        explanation = f"Critical delivery component with significant failure severity ({score:.1f}/100)."
    elif score >= 50.0:
        category = "Moderate"
        explanation = f"Important page dependency; failure may degrade functionality or performance ({score:.1f}/100)."
    elif score >= 25.0:
        category = "Low"
        explanation = f"Non-blocking resource or partial degradation observed ({score:.1f}/100)."
    else:
        category = "Informational"
        explanation = f"Observation notes without direct user-facing interruption ({score:.1f}/100)."

    return score, category, explanation
