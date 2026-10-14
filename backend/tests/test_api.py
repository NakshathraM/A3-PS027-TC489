from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_methodology_endpoint():
    res = client.get("/api/v1/methodology")
    assert res.status_code == 200
    data = res.json()
    assert "blast_radius_formula" in data
    assert "scoring_categories" in data

def test_settings_endpoint():
    res = client.get("/api/v1/settings")
    assert res.status_code == 200
    data = res.json()
    assert "scanner_ipv6" in data

def test_sample_audit_endpoints():
    # 1. Audit summary
    res = client.get("/api/v1/audits/sample")
    assert res.status_code == 200
    audit = res.json()
    assert audit["is_sample_data"] is True
    assert audit["target_hostname"] == "portal.example.com"

    # 2. Resources
    res_resources = client.get("/api/v1/audits/sample/resources")
    assert res_resources.status_code == 200
    resources = res_resources.json()
    assert len(resources) > 0

    # 3. Dependencies graph
    res_deps = client.get("/api/v1/audits/sample/dependencies")
    assert res_deps.status_code == 200
    graph = res_deps.json()
    assert "nodes" in graph
    assert "edges" in graph
    assert len(graph["nodes"]) > 0

    # 4. Findings
    res_findings = client.get("/api/v1/audits/sample/findings")
    assert res_findings.status_code == 200
    findings = res_findings.json()
    assert len(findings) > 0

    # 5. Remediation actions
    res_actions = client.get("/api/v1/audits/sample/remediation/actions")
    assert res_actions.status_code == 200
    actions = res_actions.json()
    assert len(actions) > 0

    # 6. Simulate fix
    first_action_id = actions[0]["action_id"]
    res_sim = client.post(
        "/api/v1/audits/sample/simulate",
        json={"audit_id": "sample", "selected_action_ids": [first_action_id]}
    )
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert sim_data["projected_score"] >= sim_data["baseline_score"]

    # 7. Explain finding
    first_finding_id = findings[0]["finding_id"]
    res_explain = client.post(
        "/api/v1/audits/sample/explain",
        json={"finding_id": first_finding_id}
    )
    assert res_explain.status_code == 200
    explain_data = res_explain.json()
    assert "explanation" in explain_data

    # 8. HTML report
    res_report = client.get("/api/v1/audits/sample/report")
    assert res_report.status_code == 200
    assert "text/html" in res_report.headers["content-type"]
    assert "SAMPLE DATA — NOT A LIVE AUDIT" in res_report.text

def test_create_audit_validation():
    # Invalid URL scheme
    bad_res = client.post(
        "/api/v1/audits",
        json={"target_url": "ftp://example.com", "scan_mode": "quick"}
    )
    assert bad_res.status_code == 400

    # Valid audit creation
    good_res = client.post(
        "/api/v1/audits",
        json={"target_url": "https://example.com", "scan_mode": "quick"}
    )
    assert good_res.status_code == 200
    created = good_res.json()
    assert created["target_hostname"] == "example.com"
    assert created["status"] in ("QUEUED", "VALIDATING", "DNS_CHECK", "COMPLETED")
