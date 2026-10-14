import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Network,
  AlertTriangle,
  Wrench,
  Download,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { api } from '../api/client';
import { Audit, AuditProgress, Finding, DependencyGraphData } from '../types';
import { ScoreCard } from '../components/UI/ScoreCard';
import { StatusPill } from '../components/UI/StatusPill';

export const AuditDashboardPage: React.FC = () => {
  const { auditId = 'sample' } = useParams();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [progress, setProgress] = useState<AuditProgress | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [graphData, setGraphData] = useState<DependencyGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditData = async () => {
    try {
      const auditRes = await api.getAudit(auditId);
      setAudit(auditRes);

      if (auditRes.status === 'COMPLETED' || auditRes.status === 'FAILED') {
        const [findingsRes, graphRes] = await Promise.all([
          api.getAuditFindings(auditId),
          api.getDependencyGraph(auditId),
        ]);
        setFindings(findingsRes);
        setGraphData(graphRes);
      } else {
        const prog = await api.getAuditProgress(auditId);
        setProgress(prog);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [auditId]);

  // Polling for live audits
  useEffect(() => {
    if (!audit || audit.status === 'COMPLETED' || audit.status === 'FAILED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const prog = await api.getAuditProgress(auditId);
        setProgress(prog);
        if (prog.status === 'COMPLETED' || prog.status === 'FAILED') {
          fetchAuditData();
        }
      } catch {
        // Polling error
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [audit, auditId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[#FFA45B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-brand-secondary">Loading audit intelligence...</p>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="p-8 text-center cartoon-card max-w-lg mx-auto my-12 space-y-4 bg-white">
        <div className="w-12 h-12 rounded-2xl bg-status-coral border border-status-coralBorder flex items-center justify-center text-status-coralText mx-auto shadow-[2px_2px_0px_#F7B8AC]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-brand-heading">Audit Not Found or Failed</h2>
        <p className="text-xs text-brand-secondary font-medium">{error || 'Unable to retrieve audit records.'}</p>
        <Link
          to="/app/audits/new"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#FFA45B] text-[#30241F] text-xs font-bold border border-[#E9C7AA] shadow-[2px_3px_0px_#D97550] hover:bg-[#FF9642] transition-all"
        >
          Start New Audit
        </Link>
      </div>
    );
  }

  // If audit is currently running, show live progress stage view
  const isRunning = audit.status !== 'COMPLETED' && audit.status !== 'FAILED';

  if (isRunning && progress) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="cartoon-card p-6 sm:p-8 space-y-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D97550] bg-[#FFE5D0] px-2.5 py-0.5 rounded-full border border-[#FFCA9A] mb-1">
                <span>Live Audit Pipeline</span>
              </div>
              <h2 className="text-xl font-extrabold text-brand-heading mt-1">
                Auditing {audit.target_hostname}
              </h2>
            </div>
            <span className="font-mono text-sm px-3 py-1 rounded-full bg-[#FFE5D0] text-[#D97550] font-bold border border-[#FFCA9A] shadow-[1px_1px_0px_#F1D8C3]">
              {progress.progress_percentage}%
            </span>
          </div>

          {/* Progress Bar with warm tangerine fill */}
          <div className="w-full bg-brand-cream h-3.5 rounded-full overflow-hidden border-[1.5px] border-brand-border p-0.5">
            <div
              className="bg-[#FFA45B] h-full transition-all duration-500 rounded-full shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]"
              style={{ width: `${progress.progress_percentage}%` }}
            />
          </div>

          {/* Current Stage */}
          <div className="p-4 rounded-2xl bg-brand-cream border-[1.5px] border-brand-border shadow-[2px_2px_0px_#F1D8C3] flex items-center space-x-3.5">
            <RefreshCw className="w-5 h-5 text-[#D97550] animate-spin" />
            <div>
              <div className="text-xs font-bold text-brand-heading">{progress.progress_stage}</div>
              <div className="text-[11px] text-brand-secondary mt-0.5 font-medium">
                Stage: <b className="text-brand-heading uppercase">{progress.status}</b> | Discovered: <b className="text-brand-heading">{progress.resources_discovered}</b> | Tested: <b className="text-brand-heading">{progress.resources_tested}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed Audit Data
  const chartData = [
    { name: 'DNS (AAAA)', score: audit.category_breakdown?.dns_score ?? (audit.readiness_score ? 100 : 0), color: '#FFA45B' },
    { name: 'Main Conn', score: audit.category_breakdown?.main_connectivity_score ?? (audit.readiness_score ? 100 : 0), color: '#FFCA9A' },
    { name: 'HTTPS/TLS', score: audit.category_breakdown?.https_score ?? (audit.readiness_score ? 100 : 0), color: '#DDF4E4' },
    { name: 'Dependencies', score: audit.category_breakdown?.dependency_score ?? (audit.readiness_score ? 75 : 0), color: '#DCEEFF' },
    { name: 'Protocol', score: audit.category_breakdown?.protocol_score ?? (audit.readiness_score ? 85 : 0), color: '#E9E1FF' },
  ];

  return (
    <div className="space-y-6">
      {/* Sample Banner if sample audit */}
      {audit.is_sample_data && (
        <div className="bg-[#FFF0B8] border-[1.5px] border-[#F6DE8A] rounded-2xl p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-[#8A5600] shadow-[2px_2px_0px_#F6DE8A]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8A5600] animate-pulse" />
            <span>SAMPLE DATA — NOT A LIVE AUDIT (Documentation & Demonstration Mode)</span>
          </div>
          <Link
            to="/app/audits/new"
            className="text-xs underline hover:text-[#5B3900] font-bold shrink-0"
          >
            Run a live audit &rarr;
          </Link>
        </div>
      )}

      {/* Audit Header Banner */}
      <div className="cartoon-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-brand-heading tracking-tight font-mono">
              {audit.target_hostname}
            </h1>
            <a
              href={audit.target_url}
              target="_blank"
              rel="noreferrer"
              className="p-1 rounded-lg bg-brand-cream border border-brand-border text-brand-secondary hover:text-[#D97550] transition-colors"
              title="Open website"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <StatusPill status={audit.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-secondary mt-2 font-medium">
            <span>Mode: <b className="text-brand-heading uppercase">{audit.scan_mode}</b></span>
            <span>&bull;</span>
            <span>Scanner IPv6: <b className="text-brand-heading">{audit.scanner_ipv6_status}</b></span>
            <span>&bull;</span>
            <span>Audit ID: <code className="bg-brand-cream border border-brand-border px-1.5 py-0.5 rounded text-[#D97550] font-mono text-[11px]">{audit.audit_id.slice(0, 14)}</code></span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={api.getReportDownloadUrl(audit.audit_id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-white border-[1.5px] border-brand-border text-brand-heading hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3] hover:-translate-y-0.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#D97550]" />
            <span>Download Report</span>
          </a>
          <Link
            to={`/app/audits/${audit.audit_id}/remediation`}
            className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#FFA45B] text-[#30241F] border-[1.5px] border-[#E9C7AA] shadow-[2px_3px_0px_#D97550] hover:bg-[#FF9642] hover:-translate-y-0.5 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Remediation Studio</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Cards (Separate Metrics!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Observed Readiness"
          value={audit.readiness_score != null ? `${audit.readiness_score.toFixed(1)}%` : 'Inconclusive'}
          subtitle="Weighted delivery-chain readiness"
          colorTheme="peach"
          tooltip="Calculated from weighted verification across DNS (15%), Main IPv6 Connectivity (25%), HTTPS/TLS (20%), Dependency Connectivity (25%), and Protocol symmetry (15%)."
        />
        <ScoreCard
          title="Audit Coverage"
          value={audit.coverage_score != null ? `${audit.coverage_score.toFixed(1)}%` : 'N/A'}
          subtitle="Discovered scope tested"
          colorTheme="sky"
          tooltip="Calculated as (Tested Items / Discovered Items) × 100. Measures audit completeness within the discovered delivery chain."
        />
        <ScoreCard
          title="Evidence Confidence"
          value={audit.confidence_category}
          subtitle="Empirical reliability level"
          badge="Deterministic"
          colorTheme="mint"
          tooltip="Reflects observation reliability, test completion, and scanner capability. Evaluated deterministically."
        />
        <ScoreCard
          title="Findings Count"
          value={findings.length}
          subtitle="Prioritized diagnostic findings"
          badge={`${findings.filter((f) => f.severity === 'CRITICAL').length} Critical`}
          colorTheme={findings.some((f) => f.severity === 'CRITICAL') ? 'coral' : 'yellow'}
          tooltip="Total technical observations and failure modes identified during the audit."
        />
      </div>

      {/* Middle Row: Category Breakdown Chart & Dependency Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Recharts */}
        <div className="lg:col-span-7 cartoon-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#D97550]" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">
                Category Readiness Breakdown
              </h2>
            </div>
            <span className="text-xs font-bold text-brand-secondary bg-brand-cream px-2.5 py-0.5 rounded-full border border-brand-border">
              0 – 100% Scale
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0DCCB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#76665E', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#76665E' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Readiness']}
                  contentStyle={{
                    backgroundColor: '#30241F',
                    borderRadius: '14px',
                    border: '1.5px solid #4A3B34',
                    color: '#FFF',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#E9C7AA" strokeWidth={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dependency Preview Card */}
        <div className="lg:col-span-5 cartoon-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">
                Delivery Chain Summary
              </h2>
              <div className="w-7 h-7 rounded-xl bg-[#FFE5D0] flex items-center justify-center text-[#D97550]">
                <Network className="w-4 h-4" />
              </div>
            </div>

            {graphData && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 bg-brand-cream rounded-2xl border-[1.5px] border-brand-border text-center shadow-[1px_2px_0px_#F1D8C3]">
                  <div className="text-2xl font-extrabold text-brand-heading">{graphData.unique_hostnames}</div>
                  <div className="text-[11px] font-bold text-brand-secondary mt-0.5">Unique Hostnames</div>
                </div>
                <div className="p-3.5 bg-status-mint rounded-2xl border-[1.5px] border-status-mintBorder text-center shadow-[1px_2px_0px_#B8E6C4]">
                  <div className="text-2xl font-extrabold text-status-mintText">{graphData.ipv6_ready_hostnames}</div>
                  <div className="text-[11px] font-bold text-[#1C6B38] mt-0.5">Dual-Stack Ready</div>
                </div>
              </div>
            )}

            <p className="text-xs text-brand-secondary leading-relaxed font-medium">
              Explore the interactive dependency graph to trace third-party scripts, stylesheets, and APIs affecting the website's IPv6 readiness.
            </p>
          </div>

          <Link
            to={`/app/audits/${audit.audit_id}/dependencies`}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-cream border-[1.5px] border-brand-border text-brand-heading font-bold text-xs hover:bg-[#FFE5D0] shadow-[2px_2px_0px_#F1D8C3] hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
          >
            <span>Open Interactive Dependency Explorer</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D97550]" />
          </Link>
        </div>
      </div>

      {/* Prioritized Findings Preview */}
      <div className="cartoon-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#D97550]" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">
              Top Prioritized Findings
            </h2>
          </div>
          <Link
            to={`/app/audits/${audit.audit_id}/findings`}
            className="text-xs font-bold text-[#D97550] hover:underline"
          >
            View all ({findings.length}) findings &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {findings.slice(0, 3).map((f) => (
            <div
              key={f.finding_id}
              className="p-4 rounded-2xl border-[1.5px] border-brand-border bg-[#FFFDF9] hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3] hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <StatusPill status={f.severity} size="sm" />
                  <span className="font-extrabold text-sm text-brand-heading">{f.title}</span>
                </div>
                <div className="text-xs text-brand-secondary flex flex-wrap items-center gap-2 font-medium">
                  <span>Host: <code className="bg-brand-cream border border-brand-border px-2 py-0.5 rounded-lg text-brand-heading font-mono text-[11px]">{f.affected_hostname}</code></span>
                  <span>&bull;</span>
                  <span>Potential Impact: <b className="text-[#D97550] font-bold">{f.impact_score.toFixed(1)}/100</b> ({f.potential_impact_category})</span>
                </div>
              </div>

              <Link
                to={`/app/audits/${audit.audit_id}/findings?id=${f.finding_id}`}
                className="text-xs font-bold text-[#D97550] hover:underline shrink-0"
              >
                Inspect Evidence &rarr;
              </Link>
            </div>
          ))}

          {findings.length === 0 && (
            <p className="text-xs text-brand-secondary text-center py-6 font-medium">
              No technical failure findings observed. Full delivery chain appears dual-stack compliant.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

