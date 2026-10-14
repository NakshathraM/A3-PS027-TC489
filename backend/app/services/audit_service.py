import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas.audit import AuditCreateRequest, AuditResponse, ScanMode, AuditStatus, ScannerIPv6Status
from app.schemas.resource import ResourceType, DiscoveryMethod
from app.schemas.finding import FindingCategory, FindingSeverity, EvidenceData
from app.security.url_validation import validate_and_normalize_url, URLValidationError
from app.database.repositories import AuditRepository, ResourceRepository, FindingRepository
from app.services.dns_service import resolve_hostname_dns
from app.services.ipv6_service import check_scanner_ipv6_capability, test_ipv6_connectivity
from app.services.http_service import test_tls_and_https_ipv6, fetch_target_html_safely
from app.services.discovery_service import discover_dependencies_from_html
from app.services.impact_service import calculate_impact_score
from app.services.scoring_service import calculate_audit_scores

async def execute_audit_task(
    audit_id: str,
    target_url: str,
    target_hostname: str,
    scan_mode: ScanMode,
    max_dependencies: int,
    request_timeout: float
):
    """
    Executes the real multi-stage network audit asynchronously.
    """
    try:
        # Stage 1: VALIDATING
        AuditRepository.update_progress(
            audit_id=audit_id,
            status=AuditStatus.VALIDATING.value,
            progress_stage="Validating target and network policies",
            progress_percentage=10,
        )
        await asyncio.sleep(0.3)

        # Stage 2: DNS_CHECK
        AuditRepository.update_progress(
            audit_id=audit_id,
            status=AuditStatus.DNS_CHECK.value,
            progress_stage=f"Resolving DNS (A / AAAA) for {target_hostname}",
            progress_percentage=25,
        )
        main_dns = resolve_hostname_dns(target_hostname, timeout=request_timeout)

        # Stage 3: IPV6_CHECK & Scanner capability
        AuditRepository.update_progress(
            audit_id=audit_id,
            status=AuditStatus.IPV6_CHECK.value,
            progress_stage="Detecting scanner IPv6 route and testing target connectivity",
            progress_percentage=40,
        )
        scanner_cap = check_scanner_ipv6_capability()
        main_ipv6 = test_ipv6_connectivity(
            hostname=target_hostname,
            aaaa_records=main_dns.aaaa_records,
            port=443,
            timeout=request_timeout,
        )

        # Stage 4: HTTPS_CHECK
        AuditRepository.update_progress(
            audit_id=audit_id,
            status=AuditStatus.HTTPS_CHECK.value,
            progress_stage="Validating HTTPS and TLS certificate over IPv6",
            progress_percentage=55,
        )
        main_https = None
        if main_ipv6.status == "CONNECTED" and main_ipv6.destination_ip:
            main_https = test_tls_and_https_ipv6(
                hostname=target_hostname,
                aaaa_ip=main_ipv6.destination_ip,
                port=443,
                timeout=request_timeout,
            )

        # Record main domain resource
        main_res_id = f"res_{uuid.uuid4().hex[:8]}"
        ResourceRepository.add_resource(
            resource_id=main_res_id,
            audit_id=audit_id,
            url=target_url,
            hostname=target_hostname,
            resource_type=ResourceType.OTHER.value,
            discovery_method=DiscoveryMethod.STATIC_HTML.value,
            discovery_timestamp=datetime.utcnow().isoformat() + "Z",
            is_main_domain=1,
            dns_status="AAAA_FOUND" if main_dns.aaaa_records else "NO_AAAA",
            ipv6_status=main_ipv6.status,
            https_status="SUCCESS" if (main_https and main_https.cert_valid) else ("CERT_ERROR" if main_https and not main_https.cert_valid else None),
            a_records=main_dns.a_records,
            aaaa_records=main_dns.aaaa_records,
            impact_score=0.0 if main_ipv6.status == "CONNECTED" else 100.0,
            severity="INFO" if main_ipv6.status == "CONNECTED" else "CRITICAL",
            confidence="HIGH",
        )

        discovered_resources = []
        html_content = ""
        # If Quick Scan, we skip dependency discovery. Otherwise, run discovery.
        if scan_mode != ScanMode.QUICK:
            # Stage 5: DISCOVERING_DEPENDENCIES
            AuditRepository.update_progress(
                audit_id=audit_id,
                status=AuditStatus.DISCOVERING_DEPENDENCIES.value,
                progress_stage="Fetching HTML and extracting delivery-chain dependencies",
                progress_percentage=70,
            )
            try:
                html_content, _, _, _ = fetch_target_html_safely(
                    url=target_url,
                    timeout=request_timeout,
                )
                discovered_resources = discover_dependencies_from_html(
                    html_content=html_content,
                    base_url=target_url,
                    main_hostname=target_hostname,
                    max_count=max_dependencies,
                )
            except Exception as e:
                # Page fetch failed (e.g. timeout or blocked)
                html_content = ""

        # Stage 6: TESTING_DEPENDENCIES
        AuditRepository.update_progress(
            audit_id=audit_id,
            status=AuditStatus.TESTING_DEPENDENCIES.value,
            progress_stage=f"Testing {len(discovered_resources)} discovered dependencies for IPv6 readiness",
            progress_percentage=85,
            resources_discovered=len(discovered_resources),
        )

        # Cache DNS lookups per unique hostname to avoid redundant queries
        host_dns_cache: Dict[str, Any] = {target_hostname: main_dns}
        host_ipv6_cache: Dict[str, Any] = {target_hostname: main_ipv6}

        tested_resources = []
        for disc in discovered_resources:
            res_id = f"res_{uuid.uuid4().hex[:8]}"
            h = disc.hostname

            if h not in host_dns_cache:
                d_res = resolve_hostname_dns(h, timeout=request_timeout)
                host_dns_cache[h] = d_res
                # Quick IPv6 test
                ip6_res = test_ipv6_connectivity(h, d_res.aaaa_records, port=443, timeout=request_timeout)
                host_ipv6_cache[h] = ip6_res
            else:
                d_res = host_dns_cache[h]
                ip6_res = host_ipv6_cache[h]

            # Failure classification for impact scoring
            if not d_res.aaaa_records:
                fail_type = "NO_AAAA_RECORD"
            elif ip6_res.status == "CONNECTED":
                fail_type = "HEALTHY"
            elif ip6_res.status == "INCONCLUSIVE":
                fail_type = "INCONCLUSIVE_SCANNER_LIMIT"
            else:
                fail_type = "IPV6_TCP_TIMEOUT_OR_FAILED"

            imp_score, imp_cat, _ = calculate_impact_score(
                resource_type=disc.resource_type,
                failure_type=fail_type,
                is_main_domain=False,
                evidence_quality="HIGH" if scanner_cap.status == "CAPABLE" else "MODERATE",
            )

            severity = "CRITICAL" if imp_score >= 75 else ("WARNING" if imp_score >= 50 else "INFO")

            ResourceRepository.add_resource(
                resource_id=res_id,
                audit_id=audit_id,
                url=disc.url,
                hostname=h,
                resource_type=disc.resource_type.value,
                discovery_method=disc.discovery_method.value,
                discovery_timestamp=datetime.utcnow().isoformat() + "Z",
                is_main_domain=0,
                dns_status="AAAA_FOUND" if d_res.aaaa_records else "NO_AAAA",
                ipv6_status=ip6_res.status,
                https_status=None,
                a_records=d_res.a_records,
                aaaa_records=d_res.aaaa_records,
                impact_score=imp_score,
                severity=severity,
                confidence="HIGH" if scanner_cap.status == "CAPABLE" else "MODERATE",
            )

            # Add dependency edge from main domain
            ResourceRepository.add_edge(
                edge_id=f"edge_{uuid.uuid4().hex[:8]}",
                audit_id=audit_id,
                source_resource_id=main_res_id,
                target_resource_id=res_id,
                relationship_type=disc.relationship_type,
                provenance=disc.provenance,
                observed_or_inferred="observed",
            )
            tested_resources.append((disc, d_res, ip6_res, imp_score, severity, res_id))

        # Stage 7: ANALYZING findings & calculating scores
        AuditRepository.update_progress(
            audit_id=audit_id,
            status=AuditStatus.ANALYZING.value,
            progress_stage="Synthesizing technical findings and calculating readiness metrics",
            progress_percentage=95,
            resources_tested=len(tested_resources),
        )

        findings_created = []

        # Finding for main domain DNS AAAA
        if not main_dns.aaaa_records:
            f_id = f"f_{uuid.uuid4().hex[:8]}"
            FindingRepository.add_finding(
                finding_id=f_id,
                audit_id=audit_id,
                category=FindingCategory.DNS.value,
                title=f"No AAAA DNS record observed for primary domain {target_hostname}",
                description=f"The domain resolves to IPv4 addresses ({', '.join(main_dns.a_records) if main_dns.a_records else 'None'}), but no AAAA (IPv6) record was returned.",
                evidence={
                    "test_type": "DNS AAAA Query",
                    "target_hostname": target_hostname,
                    "destination_ip": None,
                    "address_family": "IPv6",
                    "dns_a_records": main_dns.a_records,
                    "dns_aaaa_records": [],
                    "connection_result": "NO_AAAA",
                    "duration_ms": main_dns.duration_ms,
                    "http_status": None,
                    "tls_validation": None,
                    "scanner_ipv6_capability": scanner_cap.status,
                    "error_detail": main_dns.error_category or "No AAAA record in DNS zone",
                    "methodology_note": "Authoritative nameserver observation. IPv6-only clients cannot connect without NAT64.",
                },
                impact_score=90.0,
                severity=FindingSeverity.CRITICAL.value,
                confidence="HIGH",
                recommendation=f"Configure dual-stack DNS records by adding an AAAA record for {target_hostname} pointing to your IPv6 address.",
                resource_id=main_res_id,
            )
            findings_created.append(f_id)
        elif main_ipv6.status in ("TIMEOUT", "FAILED", "REFUSED", "UNREACHABLE"):
            f_id = f"f_{uuid.uuid4().hex[:8]}"
            FindingRepository.add_finding(
                finding_id=f_id,
                audit_id=audit_id,
                category=FindingCategory.CONNECTIVITY.value,
                title=f"Primary domain IPv6 connection attempt did not complete ({main_ipv6.status})",
                description=f"The hostname {target_hostname} resolved to IPv6 address {main_ipv6.destination_ip}, but the TCP connection attempt on port 443 failed.",
                evidence={
                    "test_type": "IPv6 TCP Socket Connect",
                    "target_hostname": target_hostname,
                    "destination_ip": main_ipv6.destination_ip,
                    "address_family": "IPv6",
                    "dns_a_records": main_dns.a_records,
                    "dns_aaaa_records": main_dns.aaaa_records,
                    "connection_result": main_ipv6.status,
                    "duration_ms": main_ipv6.duration_ms,
                    "http_status": None,
                    "tls_validation": None,
                    "scanner_ipv6_capability": scanner_cap.status,
                    "error_detail": main_ipv6.error_category,
                    "methodology_note": "Direct IPv6 socket connection probe.",
                },
                impact_score=95.0,
                severity=FindingSeverity.CRITICAL.value,
                confidence="HIGH" if scanner_cap.status == "CAPABLE" else "LOW",
                recommendation="Verify server firewall and routing rules allow inbound IPv6 TCP port 443 traffic.",
                resource_id=main_res_id,
            )
            findings_created.append(f_id)

        # Findings for dependencies
        seen_dep_hosts_in_findings = set()
        for disc, d_res, ip6_res, imp_score, severity, r_id in tested_resources:
            h = disc.hostname
            if h in seen_dep_hosts_in_findings or h == target_hostname:
                continue
            seen_dep_hosts_in_findings.add(h)

            if not d_res.aaaa_records:
                f_id = f"f_{uuid.uuid4().hex[:8]}"
                FindingRepository.add_finding(
                    finding_id=f_id,
                    audit_id=audit_id,
                    category=FindingCategory.DEPENDENCY.value,
                    title=f"Dependency {h} lacks IPv6 (AAAA) record",
                    description=f"Observable page resource ({disc.resource_type.value}) loaded from {h} relies exclusively on IPv4.",
                    evidence={
                        "test_type": "DNS AAAA Lookup",
                        "target_hostname": h,
                        "destination_ip": None,
                        "address_family": "IPv6",
                        "dns_a_records": d_res.a_records,
                        "dns_aaaa_records": [],
                        "connection_result": "NO_AAAA",
                        "duration_ms": d_res.duration_ms,
                        "http_status": None,
                        "tls_validation": None,
                        "scanner_ipv6_capability": scanner_cap.status,
                        "error_detail": "NoAnswer",
                        "methodology_note": "Discovered from DOM asset reference.",
                    },
                    impact_score=imp_score,
                    severity=severity,
                    confidence="HIGH",
                    recommendation=f"Request dual-stack endpoint support from {h} or migrate to an IPv6-capable provider.",
                    resource_id=r_id,
                )
                findings_created.append(f_id)
            elif ip6_res.status in ("TIMEOUT", "FAILED", "REFUSED"):
                f_id = f"f_{uuid.uuid4().hex[:8]}"
                FindingRepository.add_finding(
                    finding_id=f_id,
                    audit_id=audit_id,
                    category=FindingCategory.CONNECTIVITY.value,
                    title=f"Dependency {h} has AAAA record but connection {ip6_res.status}",
                    description=f"Host {h} has IPv6 DNS configured ({ip6_res.destination_ip}), but TCP port 443 timed out or was refused.",
                    evidence={
                        "test_type": "IPv6 TCP Socket Connect",
                        "target_hostname": h,
                        "destination_ip": ip6_res.destination_ip,
                        "address_family": "IPv6",
                        "dns_a_records": d_res.a_records,
                        "dns_aaaa_records": d_res.aaaa_records,
                        "connection_result": ip6_res.status,
                        "duration_ms": ip6_res.duration_ms,
                        "http_status": None,
                        "tls_validation": None,
                        "scanner_ipv6_capability": scanner_cap.status,
                        "error_detail": ip6_res.error_category,
                        "methodology_note": "Direct IPv6 connection test to destination.",
                    },
                    impact_score=imp_score,
                    severity=severity,
                    confidence="HIGH" if scanner_cap.status == "CAPABLE" else "MODERATE",
                    recommendation=f"Notify vendor/maintainer of {h} regarding IPv6 reachability outage.",
                    resource_id=r_id,
                )
                findings_created.append(f_id)

        # Count dual-stack ready dependencies
        unique_dep_hosts = [h for h in host_dns_cache.keys() if h != target_hostname]
        dep_ready_count = sum(1 for h in unique_dep_hosts if host_dns_cache[h].aaaa_records)

        # Calculate scores
        scores = calculate_audit_scores(
            main_dns_has_aaaa=bool(main_dns.aaaa_records),
            main_ipv6_status=main_ipv6.status,
            main_https_status="SUCCESS" if (main_https and main_https.cert_valid) else None,
            dependencies_total=len(unique_dep_hosts),
            dependencies_assessed=len(unique_dep_hosts),
            dependencies_ipv6_ready=dep_ready_count,
            scanner_ipv6_status=scanner_cap.status,
        )

        # Mark COMPLETED
        AuditRepository.complete_audit(
            audit_id=audit_id,
            completed_at=datetime.utcnow().isoformat() + "Z",
            readiness_score=scores.readiness_score,
            coverage_score=scores.coverage_score,
            confidence_category=scores.confidence_category,
            findings_count=len(findings_created),
            dependencies_count=len(discovered_resources),
            error_message=None,
        )

    except Exception as e:
        AuditRepository.complete_audit(
            audit_id=audit_id,
            completed_at=datetime.utcnow().isoformat() + "Z",
            readiness_score=None,
            coverage_score=0.0,
            confidence_category="INCONCLUSIVE",
            findings_count=0,
            dependencies_count=0,
            error_message=f"Audit failed during execution: {type(e).__name__} - {str(e)}",
        )
