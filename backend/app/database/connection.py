import sqlite3
import os
from contextlib import contextmanager
from app.config import settings

def get_db_path() -> str:
    # Ensure directory exists if path has a directory
    db_path = settings.DATABASE_PATH
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    return db_path

@contextmanager
def get_db():
    conn = sqlite3.connect(get_db_path(), timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS audits (
            audit_id TEXT PRIMARY KEY,
            target_url TEXT NOT NULL,
            target_hostname TEXT NOT NULL,
            scan_mode TEXT NOT NULL,
            status TEXT NOT NULL,
            progress_stage TEXT NOT NULL,
            progress_percentage INTEGER NOT NULL DEFAULT 0,
            scanner_ipv6_status TEXT NOT NULL,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            readiness_score REAL,
            coverage_score REAL,
            confidence_category TEXT NOT NULL,
            scoring_model_version TEXT NOT NULL,
            error_message TEXT,
            is_sample_data INTEGER NOT NULL DEFAULT 0,
            findings_count INTEGER NOT NULL DEFAULT 0,
            dependencies_count INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS resources (
            resource_id TEXT PRIMARY KEY,
            audit_id TEXT NOT NULL,
            url TEXT NOT NULL,
            hostname TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            discovery_method TEXT NOT NULL,
            discovery_timestamp TEXT NOT NULL,
            parent_resource_id TEXT,
            is_main_domain INTEGER NOT NULL DEFAULT 0,
            dns_status TEXT NOT NULL DEFAULT 'NOT_TESTED',
            ipv6_status TEXT NOT NULL DEFAULT 'NOT_TESTED',
            https_status TEXT,
            a_records_json TEXT DEFAULT '[]',
            aaaa_records_json TEXT DEFAULT '[]',
            impact_score REAL,
            severity TEXT DEFAULT 'INFO',
            confidence TEXT DEFAULT 'HIGH',
            FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS dependency_edges (
            edge_id TEXT PRIMARY KEY,
            audit_id TEXT NOT NULL,
            source_resource_id TEXT NOT NULL,
            target_resource_id TEXT NOT NULL,
            relationship_type TEXT NOT NULL,
            provenance TEXT NOT NULL,
            observed_or_inferred TEXT NOT NULL DEFAULT 'observed',
            FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS dns_results (
            dns_result_id TEXT PRIMARY KEY,
            audit_id TEXT NOT NULL,
            hostname TEXT NOT NULL,
            a_records_json TEXT NOT NULL DEFAULT '[]',
            aaaa_records_json TEXT NOT NULL DEFAULT '[]',
            cname_data TEXT,
            status TEXT NOT NULL,
            observed_at TEXT NOT NULL,
            error_category TEXT,
            FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS connection_tests (
            test_id TEXT PRIMARY KEY,
            audit_id TEXT NOT NULL,
            resource_id TEXT,
            hostname TEXT NOT NULL,
            address_family TEXT NOT NULL,
            destination_address TEXT,
            test_type TEXT NOT NULL,
            status TEXT NOT NULL,
            duration_ms REAL,
            error_category TEXT,
            http_status INTEGER,
            tls_status TEXT,
            observed_at TEXT NOT NULL,
            FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS findings (
            finding_id TEXT PRIMARY KEY,
            audit_id TEXT NOT NULL,
            resource_id TEXT,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            evidence_json TEXT NOT NULL,
            impact_score REAL NOT NULL,
            severity TEXT NOT NULL,
            confidence TEXT NOT NULL,
            recommendation TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'OPEN',
            created_at TEXT NOT NULL,
            FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS simulations (
            simulation_id TEXT PRIMARY KEY,
            audit_id TEXT NOT NULL,
            selected_actions_json TEXT NOT NULL,
            baseline_score REAL NOT NULL,
            projected_score REAL NOT NULL,
            assumptions_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_audits_target ON audits (target_hostname);
        CREATE INDEX IF NOT EXISTS idx_resources_audit ON resources (audit_id);
        CREATE INDEX IF NOT EXISTS idx_edges_audit ON dependency_edges (audit_id);
        CREATE INDEX IF NOT EXISTS idx_findings_audit ON findings (audit_id);
        """)
