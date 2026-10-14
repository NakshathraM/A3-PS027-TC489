from typing import Dict, Any, List, Optional, Tuple
from app.schemas.audit import ScoreCategoryBreakdown

class ScoringResult:
    def __init__(
        self,
        readiness_score: Optional[float],
        coverage_score: float,
        confidence_category: str,
        category_breakdown: ScoreCategoryBreakdown,
        scoring_notes: List[str]
    ):
        self.readiness_score = readiness_score
        self.coverage_score = coverage_score
        self.confidence_category = confidence_category
        self.category_breakdown = category_breakdown
        self.scoring_notes = scoring_notes

def calculate_audit_scores(
    main_dns_has_aaaa: bool,
    main_ipv6_status: str,  # CONNECTED, FAILED, TIMEOUT, INCONCLUSIVE, NO_IPV6
    main_https_status: Optional[str],  # SUCCESS, CERT_ERROR, HTTP_ERROR, NOT_TESTED
    dependencies_total: int,
    dependencies_assessed: int,
    dependencies_ipv6_ready: int,
    scanner_ipv6_status: str,  # CAPABLE, UNAVAILABLE, INCONCLUSIVE
) -> ScoringResult:
    """
    Calculates deterministic Readiness, Coverage, and Evidence Confidence:
    - Readiness: Weighted categories (DNS 15%, Main Conn 25%, HTTPS 20%, Deps 25%, Protocol 15%)
    - Coverage: Assessed / Discovered * 100
    - Confidence: High, Moderate, Low, Inconclusive
    """
    notes: List[str] = []

    # 1. DNS Score (15%)
    # If AAAA record observed: 100, else 0
    dns_score = 100.0 if main_dns_has_aaaa else 0.0

    # 2. Main Site Connectivity (25%)
    if not main_dns_has_aaaa:
        main_conn_score = 0.0
        notes.append("Main hostname lacks AAAA DNS record; IPv6 connectivity skipped.")
    elif main_ipv6_status == "CONNECTED":
        main_conn_score = 100.0
    elif main_ipv6_status == "INCONCLUSIVE":
        main_conn_score = 50.0  # Inconclusive due to scanner environment
        notes.append("Scanner lacks outbound IPv6 connectivity; target reachability inconclusive.")
    elif main_ipv6_status in ("TIMEOUT", "FAILED", "REFUSED", "UNREACHABLE"):
        main_conn_score = 0.0
        notes.append("Main hostname IPv6 connection attempt failed or timed out.")
    else:
        main_conn_score = 0.0

    # 3. HTTPS over IPv6 (20%)
    if not main_dns_has_aaaa or main_ipv6_status != "CONNECTED":
        https_score = 0.0 if not main_dns_has_aaaa or main_ipv6_status not in ("INCONCLUSIVE",) else 50.0
    elif main_https_status == "SUCCESS":
        https_score = 100.0
    elif main_https_status == "CERT_ERROR":
        https_score = 30.0  # TLS connected but cert invalid
        notes.append("TLS certificate validation failed over IPv6.")
    elif main_https_status == "HTTP_ERROR":
        https_score = 50.0
    else:
        https_score = 0.0

    # 4. Dependency IPv6 Connectivity (25%)
    if dependencies_total == 0:
        dep_score = 100.0  # No third-party dependencies to bottleneck
        notes.append("No external dependencies detected on audited page.")
    else:
        ready_ratio = dependencies_ipv6_ready / max(1, dependencies_total)
        dep_score = round(ready_ratio * 100.0, 1)

    # 5. Protocol & Configuration Checks (15%)
    # Checks presence of dual-stack (both A and AAAA) and consistent hostnames
    proto_score = 100.0 if main_dns_has_aaaa else 20.0

    # Overall Weighted Readiness Score
    # DNS: 15%, Main Conn: 25%, HTTPS: 20%, Deps: 25%, Protocol: 15%
    weighted_score = (
        (0.15 * dns_score)
        + (0.25 * main_conn_score)
        + (0.20 * https_score)
        + (0.25 * dep_score)
        + (0.15 * proto_score)
    )
    final_readiness = round(weighted_score, 1)

    # Coverage calculation
    total_items = 1 + dependencies_total  # Main site + dependencies
    tested_items = 1 + dependencies_assessed
    coverage_score = round((tested_items / total_items) * 100.0, 1) if total_items > 0 else 100.0

    # Confidence calculation
    if scanner_ipv6_status == "CAPABLE" and coverage_score >= 80.0:
        confidence = "HIGH"
    elif scanner_ipv6_status == "CAPABLE":
        confidence = "MODERATE"
    elif scanner_ipv6_status == "UNAVAILABLE" and main_dns_has_aaaa:
        confidence = "MODERATE"  # DNS observed, but connectivity inconclusive
    else:
        confidence = "INCONCLUSIVE"

    breakdown = ScoreCategoryBreakdown(
        dns_score=dns_score,
        main_connectivity_score=main_conn_score,
        https_score=https_score,
        dependency_score=dep_score,
        protocol_score=proto_score,
    )

    return ScoringResult(
        readiness_score=final_readiness,
        coverage_score=coverage_score,
        confidence_category=confidence,
        category_breakdown=breakdown,
        scoring_notes=notes,
    )
