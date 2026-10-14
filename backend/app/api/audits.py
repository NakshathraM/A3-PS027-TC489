import uuid
import asyncio
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from fastapi.responses import HTMLResponse
from app.schemas.audit import AuditCreateRequest, AuditResponse, AuditListItem, AuditProgress, ScanMode, AuditStatus, ScannerIPv6Status
from app.schemas.resource import DependencyGraphData, ResourceNode, DependencyEdge
from app.schemas.finding import FindingResponse
from app.schemas.simulation import SimulationRequest, SimulationResponse, RemediationActionItem
from app.security.url_validation import validate_and_normalize_url, URLValidationError
from app.database.repositories import AuditRepository, ResourceRepository, FindingRepository
from app.services.audit_service import execute_audit_task
from app.services.sample_data_service import get_sample_audit_data, SAMPLE_AUDIT_ID
from app.services.explanation_service import explain_finding_with_ai
from app.services.remediation_service import generate_remediation_actions, simulate_remediation
from app.services.report_service import generate_html_report
from app.services.ipv6_service import check_scanner_ipv6_capability
from app.config import settings

router = APIRouter(prefix="/audits", tags=["audits"])

@router.post("", response_model=AuditResponse)
async def create_audit(req: AuditCreateRequest, background_tasks: BackgroundTasks):
    try:
        norm = validate_and_normalize_url(req.target_url)
    except URLValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    audit_id = f"aud_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.utcnow().isoformat() + "Z"

    scanner_cap = check_scanner_ipv6_capability()

    AuditRepository.create_audit(
        audit_id=audit_id,
        target_url=norm.normalized_url,
        target_hostname=norm.hostname,
        scan_mode=req.scan_mode.value,
        status=AuditStatus.QUEUED.value,
        progress_stage="Audit queued for execution",
        progress_percentage=0,
        scanner_ipv6_status=scanner_cap.status,
        started_at=now_iso,
        confidence_category="HIGH" if scanner_cap.status == "CAPABLE" else "MODERATE",
        scoring_model_version=settings.SCORING_MODEL_VERSION,
        is_sample_data=0
    )

    background_tasks.add_task(
        execute_audit_task,
        audit_id=audit_id,
        target_url=norm.normalized_url,
        target_hostname=norm.hostname,
        scan_mode=req.scan_mode,
        max_dependencies=req.max_dependencies or 50,
        request_timeout=req.request_timeout or 8.0,
    )

    audit_row = AuditRepository.get_audit(audit_id)
    return AuditResponse(**audit_row)

@router.get("", response_model=list[AuditListItem])
async def list_audits(limit: int = 50):
    rows = AuditRepository.list_audits(limit=limit)
    return [AuditListItem(**r) for r in rows]

@router.get("/{audit_id}", response_model=AuditResponse)
async def get_audit(audit_id: str):
    if audit_id == SAMPLE_AUDIT_ID or audit_id == "sample":
        return get_sample_audit_data()["audit"]

    row = AuditRepository.get_audit(audit_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Audit '{audit_id}' not found.")
    return AuditResponse(**row)

@router.get("/{audit_id}/progress", response_model=AuditProgress)
async def get_audit_progress(audit_id: str):
    if audit_id == SAMPLE_AUDIT_ID or audit_id == "sample":
        return AuditProgress(
            audit_id=SAMPLE_AUDIT_ID,
            status=AuditStatus.COMPLETED,
            progress_stage="Completed (Sample Audit)",
            progress_percentage=100,
            scanner_ipv6_status=ScannerIPv6Status.CAPABLE,
            resources_discovered=5,
            resources_tested=5,
            findings_count=4,
            message="Sample audit demonstration data."
        )

    row = AuditRepository.get_audit(audit_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Audit '{audit_id}' not found.")

    return AuditProgress(
        audit_id=row["audit_id"],
        status=AuditStatus(row["status"]),
        progress_stage=row["progress_stage"],
        progress_percentage=row["progress_percentage"],
        scanner_ipv6_status=ScannerIPv6Status(row["scanner_ipv6_status"]),
        resources_discovered=row.get("dependencies_count", 0),
        resources_tested=row.get("dependencies_count", 0),
        findings_count=row.get("findings_count", 0),
        message=row.get("error_message")
    )

@router.get("/{audit_id}/resources", response_model=list[ResourceNode])
async def get_resources(audit_id: str):
    if audit_id == SAMPLE_AUDIT_ID or audit_id == "sample":
        return get_sample_audit_data()["nodes"]

    resources = ResourceRepository.get_resources_by_audit(audit_id)
    return [ResourceNode(**r) for r in resources]

@router.get("/{audit_id}/dependencies", response_model=DependencyGraphData)
async def get_dependency_graph(audit_id: str):
    if audit_id == SAMPLE_AUDIT_ID or audit_id == "sample":
        sample = get_sample_audit_data()
        nodes = sample["nodes"]
        edges = sample["edges"]
        unique_hosts = {n.hostname for n in nodes}
        ready_hosts = {n.hostname for n in nodes if n.dns_status == "AAAA_FOUND"}
        return DependencyGraphData(
            nodes=nodes,
            edges=edges,
            total_resources=len(nodes),
            unique_hostnames=len(unique_hosts),
            ipv6_ready_hostnames=len(ready_hosts),
            ipv4_only_hostnames=len(unique_hosts) - len(ready_hosts),
        )

    resources = ResourceRepository.get_resources_by_audit(audit_id)
    edges_raw = ResourceRepository.get_edges_by_audit(audit_id)

    nodes = [ResourceNode(**r) for r in resources]
    edges = [DependencyEdge(**e) for e in edges_raw]

    unique_hosts = {n.hostname for n in nodes}
    ready_hosts = {n.hostname for n in nodes if n.dns_status == "AAAA_FOUND"}

    return DependencyGraphData(
        nodes=nodes,
        edges=edges,
        total_resources=len(nodes),
        unique_hostnames=len(unique_hosts),
        ipv6_ready_hostnames=len(ready_hosts),
        ipv4_only_hostnames=len(unique_hosts) - len(ready_hosts),
    )

@router.get("/{audit_id}/findings", response_model=list[FindingResponse])
async def get_findings(audit_id: str):
    if audit_id == SAMPLE_AUDIT_ID or audit_id == "sample":
        return get_sample_audit_data()["findings"]

    findings = FindingRepository.get_findings_by_audit(audit_id)
    return [FindingResponse(**f) for f in findings]

@router.get("/{audit_id}/remediation/actions", response_model=list[RemediationActionItem])
async def get_remediation_actions(audit_id: str):
    if audit_id == SAMPLE_AUDIT_ID or audit_id == "sample":
        sample = get_sample_audit_data()
        findings_dicts = [f.model_dump() for f in sample["findings"]]
        return generate_remediation_actions(SAMPLE_AUDIT_ID, findings_dicts)

    findings = FindingRepository.get_findings_by_audit(audit_id)
    return generate_remediation_actions(audit_id, findings)

@router.post("/{audit_id}/simulate", response_model=SimulationResponse)
async def simulate(audit_id: str, req: SimulationRequest):
    if audit_id == SAMPLE_AUDIT_ID or audit_id == "sample":
        sample = get_sample_audit_data()
        audit_dict = sample["audit"].model_dump()
        findings_dicts = [f.model_dump() for f in sample["findings"]]
        resources_dicts = [n.model_dump() for n in sample["nodes"]]
        return simulate_remediation(audit_dict, findings_dicts, resources_dicts, req.selected_action_ids)

    audit = AuditRepository.get_audit(audit_id)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    findings = FindingRepository.get_findings_by_audit(audit_id)
    resources = ResourceRepository.get_resources_by_audit(audit_id)
    return simulate_remediation(audit, findings, resources, req.selected_action_ids)

@router.post("/{audit_id}/explain")
async def explain_finding(audit_id: str, payload: dict):
    finding_id = payload.get("finding_id")
    if not finding_id:
        raise HTTPException(status_code=400, detail="Missing finding_id in request payload.")

    finding = None
    if audit_id in (SAMPLE_AUDIT_ID, "sample"):
        sample = get_sample_audit_data()
        for f in sample["findings"]:
            if f.finding_id == finding_id:
                finding = f.model_dump()
                break
    else:
        finding = FindingRepository.get_finding(finding_id)

    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found.")

    return await explain_finding_with_ai(finding)

@router.get("/{audit_id}/report", response_class=HTMLResponse)
async def download_report(audit_id: str, download: bool = False):
    if audit_id in (SAMPLE_AUDIT_ID, "sample"):
        sample = get_sample_audit_data()
        audit_dict = sample["audit"].model_dump()
        resources_dicts = [n.model_dump() for n in sample["nodes"]]
        findings_dicts = [f.model_dump() for f in sample["findings"]]
    else:
        audit_dict = AuditRepository.get_audit(audit_id)
        if not audit_dict:
            raise HTTPException(status_code=404, detail="Audit not found")
        resources_dicts = ResourceRepository.get_resources_by_audit(audit_id)
        findings_dicts = FindingRepository.get_findings_by_audit(audit_id)

    html_content = generate_html_report(audit_dict, resources_dicts, findings_dicts)
    
    headers = {}
    if download:
        filename = f"netscope_report_{audit_dict.get('target_hostname', 'audit')}_{audit_id}.html"
        headers["Content-Disposition"] = f'attachment; filename="{filename}"'

    return HTMLResponse(content=html_content, headers=headers)
