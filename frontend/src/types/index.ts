export type ScanMode = 'quick' | 'standard' | 'deep';

export type AuditStatus =
  | 'QUEUED'
  | 'VALIDATING'
  | 'DNS_CHECK'
  | 'IPV6_CHECK'
  | 'HTTPS_CHECK'
  | 'DISCOVERING_DEPENDENCIES'
  | 'TESTING_DEPENDENCIES'
  | 'ANALYZING'
  | 'GENERATING_REPORT'
  | 'COMPLETED'
  | 'FAILED';

export type ScannerIPv6Status = 'CAPABLE' | 'UNAVAILABLE' | 'INCONCLUSIVE';

export interface ScoreCategoryBreakdown {
  dns_score?: number;
  main_connectivity_score?: number;
  https_score?: number;
  dependency_score?: number;
  protocol_score?: number;
}

export interface Audit {
  audit_id: string;
  target_url: string;
  target_hostname: string;
  scan_mode: ScanMode;
  status: AuditStatus;
  progress_stage: string;
  progress_percentage: number;
  scanner_ipv6_status: ScannerIPv6Status;
  started_at: string;
  completed_at?: string | null;
  readiness_score?: number | null;
  coverage_score?: number | null;
  confidence_category: 'HIGH' | 'MODERATE' | 'LOW' | 'INCONCLUSIVE';
  category_breakdown?: ScoreCategoryBreakdown | null;
  scoring_model_version: string;
  error_message?: string | null;
  is_sample_data: boolean;
  findings_count: number;
  dependencies_count: number;
}

export interface AuditProgress {
  audit_id: string;
  status: AuditStatus;
  progress_stage: string;
  progress_percentage: number;
  scanner_ipv6_status: ScannerIPv6Status;
  resources_discovered: number;
  resources_tested: number;
  findings_count: number;
  message?: string | null;
}

export type ResourceType =
  | 'javascript'
  | 'css'
  | 'image'
  | 'font'
  | 'api'
  | 'iframe'
  | 'other';

export interface ResourceNode {
  resource_id: string;
  audit_id: string;
  url: string;
  hostname: string;
  resource_type: ResourceType;
  discovery_method: string;
  is_main_domain: boolean;
  dns_status: string;
  ipv6_status: string;
  https_status?: string | null;
  a_records: string[];
  aaaa_records: string[];
  impact_score?: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  confidence: string;
}

export interface DependencyEdge {
  edge_id: string;
  audit_id: string;
  source_resource_id: string;
  target_resource_id: string;
  relationship_type: string;
  provenance: string;
  observed_or_inferred: string;
}

export interface DependencyGraphData {
  nodes: ResourceNode[];
  edges: DependencyEdge[];
  total_resources: number;
  unique_hostnames: number;
  ipv6_ready_hostnames: number;
  ipv4_only_hostnames: number;
}

export interface EvidenceData {
  test_type: string;
  target_hostname: string;
  destination_ip?: string | null;
  address_family?: string | null;
  dns_a_records: string[];
  dns_aaaa_records: string[];
  connection_result?: string | null;
  duration_ms?: number | null;
  http_status?: number | null;
  tls_validation?: string | null;
  scanner_ipv6_capability: string;
  error_detail?: string | null;
  methodology_note: string;
}

export interface Finding {
  finding_id: string;
  audit_id: string;
  resource_id?: string | null;
  category: 'DNS' | 'CONNECTIVITY' | 'HTTPS' | 'DEPENDENCY' | 'RELIABILITY';
  title: string;
  description: string;
  affected_hostname: string;
  impact_score: number;
  potential_impact_category: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  confidence: 'HIGH' | 'MODERATE' | 'LOW' | 'INCONCLUSIVE';
  recommendation: string;
  evidence: EvidenceData;
  created_at: string;
  status: string;
}

export interface RemediationAction {
  action_id: string;
  finding_id: string;
  target_hostname: string;
  title: string;
  problem: string;
  recommended_action: string;
  estimated_effort: string;
  potential_impact: string;
  confidence: string;
  verification_procedure: string;
  projected_readiness_gain: number;
}

export interface SimulationResult {
  audit_id: string;
  baseline_score: number;
  projected_score: number;
  score_delta: number;
  selected_actions: RemediationAction[];
  resolved_finding_ids: string[];
  unresolved_finding_ids: string[];
  assumptions: string[];
  disclaimer: string;
}

export interface MethodologyData {
  title: string;
  scoring_model_version: string;
  scoring_categories: Array<{
    category: string;
    weight: number;
    description: string;
  }>;
  blast_radius_formula: {
    formula: string;
    weights: Record<string, number>;
    thresholds: Record<string, string>;
  };
  coverage_formula: string;
  confidence_levels: Array<{
    level: string;
    criteria: string;
  }>;
  limitations: string[];
}

export interface ScannerSettingsData {
  project_name: string;
  version: string;
  scoring_model_version: string;
  scanner_ipv6: {
    status: ScannerIPv6Status;
    detail: string;
    duration_ms: number;
    probe_target: string;
    probe_port: number;
  };
  default_timeout_seconds: number;
  max_dependencies_default: number;
  allowed_ports: number[];
  gemini_configured: boolean;
}
