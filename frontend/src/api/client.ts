import {
  Audit,
  AuditProgress,
  DependencyGraphData,
  Finding,
  RemediationAction,
  ResourceNode,
  SimulationResult,
  MethodologyData,
  ScannerSettingsData,
  ScanMode,
} from '../types';

const BASE_URL = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.detail) {
        errMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // Non-json response
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  async createAudit(
    targetUrl: string,
    scanMode: ScanMode = 'standard',
    maxDependencies = 50,
    requestTimeout = 8.0
  ): Promise<Audit> {
    const res = await fetch(`${BASE_URL}/audits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_url: targetUrl,
        scan_mode: scanMode,
        max_dependencies: maxDependencies,
        request_timeout: requestTimeout,
      }),
    });
    return handleResponse<Audit>(res);
  },

  async listAudits(): Promise<Audit[]> {
    const res = await fetch(`${BASE_URL}/audits`);
    return handleResponse<Audit[]>(res);
  },

  async getAudit(auditId: string): Promise<Audit> {
    const res = await fetch(`${BASE_URL}/audits/${encodeURIComponent(auditId)}`);
    return handleResponse<Audit>(res);
  },

  async getAuditProgress(auditId: string): Promise<AuditProgress> {
    const res = await fetch(`${BASE_URL}/audits/${encodeURIComponent(auditId)}/progress`);
    return handleResponse<AuditProgress>(res);
  },

  async getAuditResources(auditId: string): Promise<ResourceNode[]> {
    const res = await fetch(`${BASE_URL}/audits/${encodeURIComponent(auditId)}/resources`);
    return handleResponse<ResourceNode[]>(res);
  },

  async getDependencyGraph(auditId: string): Promise<DependencyGraphData> {
    const res = await fetch(`${BASE_URL}/audits/${encodeURIComponent(auditId)}/dependencies`);
    return handleResponse<DependencyGraphData>(res);
  },

  async getAuditFindings(auditId: string): Promise<Finding[]> {
    const res = await fetch(`${BASE_URL}/audits/${encodeURIComponent(auditId)}/findings`);
    return handleResponse<Finding[]>(res);
  },

  async getRemediationActions(auditId: string): Promise<RemediationAction[]> {
    const res = await fetch(`${BASE_URL}/audits/${encodeURIComponent(auditId)}/remediation/actions`);
    return handleResponse<RemediationAction[]>(res);
  },

  async simulateRemediation(auditId: string, selectedActionIds: string[]): Promise<SimulationResult> {
    const res = await fetch(`${BASE_URL}/audits/${encodeURIComponent(auditId)}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audit_id: auditId,
        selected_action_ids: selectedActionIds,
      }),
    });
    return handleResponse<SimulationResult>(res);
  },

  async explainFinding(auditId: string, findingId: string): Promise<{
    source: string;
    model: string;
    explanation: string;
    disclaimer: string;
  }> {
    const res = await fetch(`${BASE_URL}/audits/${encodeURIComponent(auditId)}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finding_id: findingId }),
    });
    return handleResponse(res);
  },

  async getMethodology(): Promise<MethodologyData> {
    const res = await fetch(`${BASE_URL}/methodology`);
    return handleResponse<MethodologyData>(res);
  },

  async getSettings(): Promise<ScannerSettingsData> {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse<ScannerSettingsData>(res);
  },

  getReportDownloadUrl(auditId: string, download = true): string {
    return `${BASE_URL}/audits/${encodeURIComponent(auditId)}/report${download ? '?download=true' : ''}`;
  },
};
