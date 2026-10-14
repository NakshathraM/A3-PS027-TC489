import pytest
from app.security.url_validation import validate_and_normalize_url, URLValidationError
from app.security.network_policy import classify_and_verify_ip, SSRFViolationError
from app.services.impact_service import calculate_impact_score
from app.services.scoring_service import calculate_audit_scores
from app.services.sample_data_service import get_sample_audit_data
from app.services.report_service import generate_html_report
from app.schemas.resource import ResourceType

def test_url_validation_valid():
    norm = validate_and_normalize_url("https://example.com/path")
    assert norm.scheme == "https"
    assert norm.hostname == "example.com"
    assert norm.port == 443
    assert norm.normalized_url == "https://example.com/path"

def test_url_validation_omitted_scheme():
    norm = validate_and_normalize_url("example.com")
    assert norm.scheme == "https"
    assert norm.hostname == "example.com"

def test_url_validation_rejects_credentials():
    with pytest.raises(URLValidationError):
        validate_and_normalize_url("https://admin:secret@example.com")

def test_url_validation_rejects_disallowed_schemes():
    with pytest.raises(URLValidationError):
        validate_and_normalize_url("ftp://example.com")
    with pytest.raises(URLValidationError):
        validate_and_normalize_url("javascript:alert(1)")

def test_url_validation_rejects_disallowed_ports():
    with pytest.raises(URLValidationError):
        validate_and_normalize_url("http://example.com:22")

def test_ssrf_blocks_loopback_and_private():
    with pytest.raises(SSRFViolationError):
        classify_and_verify_ip("127.0.0.1")
    with pytest.raises(SSRFViolationError):
        classify_and_verify_ip("10.0.1.5")
    with pytest.raises(SSRFViolationError):
        classify_and_verify_ip("192.168.1.1")
    with pytest.raises(SSRFViolationError):
        classify_and_verify_ip("172.16.0.1")
    with pytest.raises(SSRFViolationError):
        classify_and_verify_ip("169.254.169.254")  # Cloud metadata
    with pytest.raises(SSRFViolationError):
        classify_and_verify_ip("::1")  # IPv6 loopback
    with pytest.raises(SSRFViolationError):
        classify_and_verify_ip("fc00::1")  # Unique local

def test_ssrf_permits_public_ips():
    is_safe, af, _ = classify_and_verify_ip("8.8.8.8")
    assert is_safe is True
    assert af == "IPv4"

    is_safe, af, _ = classify_and_verify_ip("2606:4700:4700::1111")
    assert is_safe is True
    assert af == "IPv6"

def test_impact_score_calculation():
    # JavaScript + high failure severity
    score, cat, exp = calculate_impact_score(
        resource_type=ResourceType.JAVASCRIPT,
        failure_type="IPV6_TCP_TIMEOUT_OR_FAILED",
        is_main_domain=False,
        evidence_quality="HIGH"
    )
    # 0.35*85 + 0.30*85 + 0.20*80 + 0.15*95 = 29.75 + 25.5 + 16.0 + 14.25 = 85.5
    assert score >= 75.0
    assert cat == "High potential impact"

def test_scoring_engine_determines_weights():
    res = calculate_audit_scores(
        main_dns_has_aaaa=True,
        main_ipv6_status="CONNECTED",
        main_https_status="SUCCESS",
        dependencies_total=4,
        dependencies_assessed=4,
        dependencies_ipv6_ready=4,
        scanner_ipv6_status="CAPABLE",
    )
    assert res.readiness_score == 100.0
    assert res.coverage_score == 100.0
    assert res.confidence_category == "HIGH"

def test_sample_data_integrity():
    sample = get_sample_audit_data()
    assert sample["audit"].is_sample_data is True
    assert sample["audit"].readiness_score == 68.5
    assert len(sample["nodes"]) == 6
    assert len(sample["findings"]) == 4

def test_html_report_rendering():
    sample = get_sample_audit_data()
    html = generate_html_report(
        sample["audit"].model_dump(),
        [n.model_dump() for n in sample["nodes"]],
        [f.model_dump() for f in sample["findings"]]
    )
    assert "NETSCOPE Audit Report" in html
    assert "SAMPLE DATA — NOT A LIVE AUDIT" in html
    assert "portal.example.com" in html
