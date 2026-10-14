from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class RemediationActionItem(BaseModel):
    action_id: str
    finding_id: str
    target_hostname: str
    title: str
    problem: str
    recommended_action: str
    estimated_effort: str  # e.g. "Low (DNS config)", "Medium (CDN setup)", "High (Vendor request)"
    potential_impact: str
    confidence: str
    verification_procedure: str
    projected_readiness_gain: float

class SimulationRequest(BaseModel):
    audit_id: str
    selected_action_ids: List[str]

class SimulationResponse(BaseModel):
    audit_id: str
    baseline_score: float
    projected_score: float
    score_delta: float
    selected_actions: List[RemediationActionItem]
    resolved_finding_ids: List[str]
    unresolved_finding_ids: List[str]
    assumptions: List[str]
    disclaimer: str = (
        "This is a hypothetical projection based on selected actions. "
        "Actual improvements require applying the changes and rerunning the audit."
    )
