from fastapi import APIRouter
from app.config import settings
from app.services.ipv6_service import check_scanner_ipv6_capability

router = APIRouter(tags=["system"])

@router.get("/methodology")
async def get_methodology():
    return {
        "title": "NETSCOPE Technical Assessment & Scoring Methodology",
        "scoring_model_version": settings.SCORING_MODEL_VERSION,
        "scoring_categories": [
            {
                "category": "DNS Configuration",
                "weight": 0.15,
                "description": "Evaluates presence of AAAA records in authoritative DNS for the audited domain."
            },
            {
                "category": "Main-Site IPv6 Connectivity",
                "weight": 0.25,
                "description": "Evaluates explicit TCP socket establishment to destination IPv6 address on port 443."
            },
            {
                "category": "HTTPS & TLS over IPv6",
                "weight": 0.20,
                "description": "Validates end-to-end TLS handshake, SNI, certificate chain validity, and HTTP response over IPv6."
            },
            {
                "category": "Observed Dependency Connectivity",
                "weight": 0.25,
                "description": "Calculates the ratio of discovered external delivery-chain assets that resolve to IPv6 and connect."
            },
            {
                "category": "Protocol & Configuration",
                "weight": 0.15,
                "description": "Validates dual-stack symmetry, consistent CNAME records, and fallback resiliency."
            }
        ],
        "blast_radius_formula": {
            "formula": "Impact Score = 0.35 × Resource Criticality + 0.30 × Failure Severity + 0.20 × Page Relevance + 0.15 × Evidence Strength",
            "weights": {
                "resource_criticality": 0.35,
                "failure_severity": 0.30,
                "page_relevance": 0.20,
                "evidence_strength": 0.15
            },
            "thresholds": {
                "0-24": "Informational",
                "25-49": "Low",
                "50-74": "Moderate",
                "75-100": "High potential impact"
            }
        },
        "coverage_formula": "Coverage (%) = (Tested Items / Discovered Items) × 100",
        "confidence_levels": [
            {"level": "HIGH", "criteria": "Scanner environment is IPv6-capable and comprehensive network tests completed."},
            {"level": "MODERATE", "criteria": "DNS observed but connectivity was partially bounded or scanner environment had constraints."},
            {"level": "LOW", "criteria": "Test had timeouts or ambiguous host responses."},
            {"level": "INCONCLUSIVE", "criteria": "Scanner lacks public IPv6 route or target refused all address families."}
        ],
        "limitations": [
            "Dynamic client-side dependencies rendered only after user authentication are not automatically discovered.",
            "Authoritative DNS responses may vary across split-horizon DNS environments and geographic anycast locations.",
            "Audit results represent the observable state at the recorded timestamp and do not constitute a compliance certification."
        ]
    }

@router.get("/settings")
async def get_settings():
    cap = check_scanner_ipv6_capability(force_refresh=True)
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "scoring_model_version": settings.SCORING_MODEL_VERSION,
        "scanner_ipv6": {
            "status": cap.status,
            "detail": cap.detail,
            "duration_ms": cap.duration_ms,
            "probe_target": settings.IPV6_PROBE_TARGET,
            "probe_port": settings.IPV6_PROBE_PORT
        },
        "default_timeout_seconds": settings.DEFAULT_TIMEOUT,
        "max_dependencies_default": settings.MAX_DEPENDENCIES_DEFAULT,
        "allowed_ports": sorted(list(settings.ALLOWED_PORTS)),
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }
