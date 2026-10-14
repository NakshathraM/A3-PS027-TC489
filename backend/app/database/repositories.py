import json
from typing import List, Optional, Dict, Any
from app.database.connection import get_db

class AuditRepository:
    @staticmethod
    def create_audit(
        audit_id: str,
        target_url: str,
        target_hostname: str,
        scan_mode: str,
        status: str,
        progress_stage: str,
        progress_percentage: int,
        scanner_ipv6_status: str,
        started_at: str,
        confidence_category: str,
        scoring_model_version: str,
        is_sample_data: int = 0
    ) -> None:
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO audits (
                    audit_id, target_url, target_hostname, scan_mode, status,
                    progress_stage, progress_percentage, scanner_ipv6_status,
                    started_at, confidence_category, scoring_model_version, is_sample_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    audit_id, target_url, target_hostname, scan_mode, status,
                    progress_stage, progress_percentage, scanner_ipv6_status,
                    started_at, confidence_category, scoring_model_version, is_sample_data
                )
            )

    @staticmethod
    def update_progress(
        audit_id: str,
        status: str,
        progress_stage: str,
        progress_percentage: int,
        scanner_ipv6_status: Optional[str] = None,
        resources_discovered: int = 0,
        resources_tested: int = 0,
        findings_count: int = 0
    ) -> None:
        with get_db() as conn:
            if scanner_ipv6_status:
                conn.execute(
                    """
                    UPDATE audits SET
                        status = ?, progress_stage = ?, progress_percentage = ?,
                        scanner_ipv6_status = ?, dependencies_count = ?, findings_count = ?
                    WHERE audit_id = ?
                    """,
                    (status, progress_stage, progress_percentage, scanner_ipv6_status, resources_discovered, findings_count, audit_id)
                )
            else:
                conn.execute(
                    """
                    UPDATE audits SET
                        status = ?, progress_stage = ?, progress_percentage = ?,
                        dependencies_count = ?, findings_count = ?
                    WHERE audit_id = ?
                    """,
                    (status, progress_stage, progress_percentage, resources_discovered, findings_count, audit_id)
                )

    @staticmethod
    def complete_audit(
        audit_id: str,
        completed_at: str,
        readiness_score: Optional[float],
        coverage_score: Optional[float],
        confidence_category: str,
        findings_count: int,
        dependencies_count: int,
        error_message: Optional[str] = None
    ) -> None:
        with get_db() as conn:
            status = "FAILED" if error_message and readiness_score is None else "COMPLETED"
            conn.execute(
                """
                UPDATE audits SET
                    status = ?, progress_stage = ?, progress_percentage = 100,
                    completed_at = ?, readiness_score = ?, coverage_score = ?,
                    confidence_category = ?, findings_count = ?, dependencies_count = ?,
                    error_message = ?
                WHERE audit_id = ?
                """,
                (
                    status, "COMPLETED" if status == "COMPLETED" else "FAILED",
                    completed_at, readiness_score, coverage_score,
                    confidence_category, findings_count, dependencies_count,
                    error_message, audit_id
                )
            )

    @staticmethod
    def get_audit(audit_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM audits WHERE audit_id = ?", (audit_id,)).fetchone()
            return dict(row) if row else None

    @staticmethod
    def list_audits(limit: int = 50) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM audits ORDER BY started_at DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def get_latest_audit() -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            row = conn.execute(
                "SELECT * FROM audits ORDER BY started_at DESC LIMIT 1"
            ).fetchone()
            return dict(row) if row else None

class ResourceRepository:
    @staticmethod
    def add_resource(
        resource_id: str,
        audit_id: str,
        url: str,
        hostname: str,
        resource_type: str,
        discovery_method: str,
        discovery_timestamp: str,
        is_main_domain: int = 0,
        dns_status: str = "NOT_TESTED",
        ipv6_status: str = "NOT_TESTED",
        https_status: Optional[str] = None,
        a_records: Optional[List[str]] = None,
        aaaa_records: Optional[List[str]] = None,
        impact_score: Optional[float] = None,
        severity: str = "INFO",
        confidence: str = "HIGH"
    ) -> None:
        with get_db() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO resources (
                    resource_id, audit_id, url, hostname, resource_type,
                    discovery_method, discovery_timestamp, is_main_domain,
                    dns_status, ipv6_status, https_status,
                    a_records_json, aaaa_records_json, impact_score, severity, confidence
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    resource_id, audit_id, url, hostname, resource_type,
                    discovery_method, discovery_timestamp, is_main_domain,
                    dns_status, ipv6_status, https_status,
                    json.dumps(a_records or []), json.dumps(aaaa_records or []),
                    impact_score, severity, confidence
                )
            )

    @staticmethod
    def update_resource_tests(
        resource_id: str,
        dns_status: str,
        ipv6_status: str,
        https_status: Optional[str],
        a_records: List[str],
        aaaa_records: List[str],
        impact_score: Optional[float] = None,
        severity: str = "INFO",
        confidence: str = "HIGH"
    ) -> None:
        with get_db() as conn:
            conn.execute(
                """
                UPDATE resources SET
                    dns_status = ?, ipv6_status = ?, https_status = ?,
                    a_records_json = ?, aaaa_records_json = ?,
                    impact_score = ?, severity = ?, confidence = ?
                WHERE resource_id = ?
                """,
                (
                    dns_status, ipv6_status, https_status,
                    json.dumps(a_records), json.dumps(aaaa_records),
                    impact_score, severity, confidence, resource_id
                )
            )

    @staticmethod
    def get_resources_by_audit(audit_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM resources WHERE audit_id = ? ORDER BY is_main_domain DESC, hostname ASC",
                (audit_id,)
            ).fetchall()
            results = []
            for r in rows:
                d = dict(r)
                d["a_records"] = json.loads(d.get("a_records_json") or "[]")
                d["aaaa_records"] = json.loads(d.get("aaaa_records_json") or "[]")
                d["is_main_domain"] = bool(d.get("is_main_domain"))
                results.append(d)
            return results

    @staticmethod
    def add_edge(
        edge_id: str,
        audit_id: str,
        source_resource_id: str,
        target_resource_id: str,
        relationship_type: str,
        provenance: str,
        observed_or_inferred: str = "observed"
    ) -> None:
        with get_db() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO dependency_edges (
                    edge_id, audit_id, source_resource_id, target_resource_id,
                    relationship_type, provenance, observed_or_inferred
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    edge_id, audit_id, source_resource_id, target_resource_id,
                    relationship_type, provenance, observed_or_inferred
                )
            )

    @staticmethod
    def get_edges_by_audit(audit_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM dependency_edges WHERE audit_id = ?", (audit_id,)
            ).fetchall()
            return [dict(r) for r in rows]

class FindingRepository:
    @staticmethod
    def add_finding(
        finding_id: str,
        audit_id: str,
        category: str,
        title: str,
        description: str,
        evidence: Dict[str, Any],
        impact_score: float,
        severity: str,
        confidence: str,
        recommendation: str,
        resource_id: Optional[str] = None
    ) -> None:
        with get_db() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO findings (
                    finding_id, audit_id, resource_id, category, title, description,
                    evidence_json, impact_score, severity, confidence, recommendation,
                    status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', datetime('now'))
                """,
                (
                    finding_id, audit_id, resource_id, category, title, description,
                    json.dumps(evidence), impact_score, severity, confidence, recommendation
                )
            )

    @staticmethod
    def get_findings_by_audit(audit_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM findings WHERE audit_id = ? ORDER BY impact_score DESC",
                (audit_id,)
            ).fetchall()
            results = []
            for r in rows:
                d = dict(r)
                d["evidence"] = json.loads(d.get("evidence_json") or "{}")
                results.append(d)
            return results

    @staticmethod
    def get_finding(finding_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            row = conn.execute(
                "SELECT * FROM findings WHERE finding_id = ?", (finding_id,)
            ).fetchone()
            if row:
                d = dict(row)
                d["evidence"] = json.loads(d.get("evidence_json") or "{}")
                return d
            return None
