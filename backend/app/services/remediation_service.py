from typing import List, Dict, Any, Tuple
from app.schemas.simulation import RemediationActionItem, SimulationResponse
from app.services.scoring_service import calculate_audit_scores

def generate_remediation_actions(
    audit_id: str,
    findings: List[Dict[str, Any]]
) -> List[RemediationActionItem]:
    """
    Generates actionable remediation items for each technical finding.
    """
    actions: List[RemediationActionItem] = []

    for f in findings:
        f_id = f.get("finding_id", "")
        title = f.get("title", "")
        hostname = f.get("affected_hostname", "")
        category = f.get("category", "")
        evidence = f.get("evidence", {})

        action_id = f"act_{f_id}"

        if "No AAAA" in title or "missing AAAA" in title.lower():
            if evidence.get("target_hostname") == hostname and category == "DNS":
                problem = f"The domain {hostname} has no AAAA DNS record. Clients on IPv6-only networks cannot resolve it directly."
                rec = f"Provision dual-stack hosting at DNS provider; create an AAAA record pointing to the server's public IPv6 address."
                effort = "Low (DNS configuration)"
                gain = 35.0
                verify = f"Run: dig AAAA {hostname} +short to verify record propagation."
            else:
                problem = f"Dependency {hostname} lacks an IPv6 address (no AAAA record observed)."
                rec = f"Contact dependency vendor ({hostname}) or switch to a dual-stack CDN/endpoint."
                effort = "Medium (Vendor/CDN switch)"
                gain = 8.0
                verify = f"Run: nslookup -type=AAAA {hostname}"
        elif "timed out" in title.lower() or "connection" in title.lower():
            problem = f"IPv6 connection attempt to {hostname} timed out or failed."
            rec = "Check server firewall/security group rules to permit ingress TCP traffic on port 443 from all IPv6 subnets (::/0)."
            effort = "Medium (Firewall/Security Group)"
            gain = 25.0
            verify = f"Run: curl -6 --connect-timeout 5 -I https://{hostname}"
        elif "TLS" in title or "Certificate" in title:
            problem = f"TLS handshake over IPv6 for {hostname} failed certificate verification."
            rec = "Verify that the TLS certificate includes the domain name in SAN and is properly bound to the IPv6 virtual host."
            effort = "Low (TLS/Cert binding)"
            gain = 15.0
            verify = f"Run: openssl s_client -connect [{evidence.get('destination_ip', '::1')}]:443 -servername {hostname}"
        else:
            problem = f"Observation for {hostname}: {f.get('description', '')}"
            rec = f.get("recommendation", "Review configuration and retest.")
            effort = "Low"
            gain = 5.0
            verify = f"Retest audit in NETSCOPE after applying fix."

        actions.append(
            RemediationActionItem(
                action_id=action_id,
                finding_id=f_id,
                target_hostname=hostname,
                title=f"Remediate: {title}",
                problem=problem,
                recommended_action=rec,
                estimated_effort=effort,
                potential_impact=f.get("potential_impact_category", "Moderate"),
                confidence=f.get("confidence", "HIGH"),
                verification_procedure=verify,
                projected_readiness_gain=gain,
            )
        )

    # Sort actions by projected readiness gain descending
    actions.sort(key=lambda a: a.projected_readiness_gain, reverse=True)
    return actions

def simulate_remediation(
    audit: Dict[str, Any],
    findings: List[Dict[str, Any]],
    resources: List[Dict[str, Any]],
    selected_action_ids: List[str]
) -> SimulationResponse:
    """
    Deterministically computes a projected readiness score based on selected hypothetical fixes.
    Does not touch any real DNS or target systems.
    """
    baseline_score = float(audit.get("readiness_score") or 0.0)
    all_actions = generate_remediation_actions(audit["audit_id"], findings)
    
    # Map action_id to action
    action_map = {a.action_id: a for a in all_actions}
    selected_actions = [action_map[aid] for aid in selected_action_ids if aid in action_map]
    resolved_finding_ids = [a.finding_id for a in selected_actions]
    unresolved_finding_ids = [
        f["finding_id"] for f in findings if f["finding_id"] not in resolved_finding_ids
    ]

    # Evaluate simulated state for scoring calculation
    main_res = next((r for r in resources if r.get("is_main_domain")), None)
    main_has_aaaa = bool(main_res and main_res.get("aaaa_records")) if main_res else False
    main_ipv6_status = main_res.get("ipv6_status", "NOT_TESTED") if main_res else "NOT_TESTED"
    main_https_status = main_res.get("https_status", "SUCCESS") if main_res else "SUCCESS"

    dep_resources = [r for r in resources if not r.get("is_main_domain")]
    dep_total = len(dep_resources)
    dep_ready = sum(1 for r in dep_resources if r.get("dns_status") == "AAAA_FOUND")

    # Apply simulated fixes
    for act in selected_actions:
        finding = next((f for f in findings if f["finding_id"] == act.finding_id), None)
        if not finding:
            continue
        
        aff_host = act.target_hostname
        is_main = main_res and (aff_host == main_res.get("hostname"))

        if is_main:
            main_has_aaaa = True
            main_ipv6_status = "CONNECTED"
            main_https_status = "SUCCESS"
        else:
            dep_ready = min(dep_total, dep_ready + 1)

    # Recalculate score with documented scoring model
    projected_res = calculate_audit_scores(
        main_dns_has_aaaa=main_has_aaaa,
        main_ipv6_status=main_ipv6_status,
        main_https_status=main_https_status,
        dependencies_total=dep_total,
        dependencies_assessed=dep_total,
        dependencies_ipv6_ready=dep_ready,
        scanner_ipv6_status="CAPABLE",
    )

    projected_score = projected_res.readiness_score or baseline_score
    delta = round(projected_score - baseline_score, 1)

    assumptions = [
        "Simulates that selected DNS AAAA records are published and propagated globally.",
        "Simulates that IPv6 firewall and port 443 listeners accept traffic successfully.",
        "Simulates valid TLS certificates installed on all affected dual-stack hosts.",
        "No network regressions or routing asymmetry introduced.",
    ]

    return SimulationResponse(
        audit_id=audit["audit_id"],
        baseline_score=baseline_score,
        projected_score=projected_score,
        score_delta=delta,
        selected_actions=selected_actions,
        resolved_finding_ids=resolved_finding_ids,
        unresolved_finding_ids=unresolved_finding_ids,
        assumptions=assumptions,
    )
