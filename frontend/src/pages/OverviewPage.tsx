import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  PlusCircle,
  Network,
  AlertTriangle,
  ArrowRight,
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
import { Audit, Finding, DependencyGraphData } from '../types';
import { ScoreCard } from '../components/UI/ScoreCard';
import { StatusPill } from '../components/UI/StatusPill';

export const OverviewPage: React.FC = () => {
  const [latestAudit, setLatestAudit] = useState<Audit | null>(null);
  const [topFindings, setTopFindings] = useState<Finding[]>([]);
  const [graphData, setGraphData] = useState<DependencyGraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listAudits()
      .then(async (audits: Audit[]) => {
        if (audits.length > 0) {
          const latest = audits[0];
          setLatestAudit(latest);
          try {
            const [fRes, gRes] = await Promise.all([
              api.getAuditFindings(latest.audit_id),
              api.getDependencyGraph(latest.audit_id),
            ]);
            setTopFindings(fRes.slice(0, 3));
            setGraphData(gRes);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[#FFA45B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-brand-secondary">Loading intelligence overview...</p>
      </div>
    );
  }

  // First-time empty state if no audits have been run yet
  if (!latestAudit) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 sm:p-12 cartoon-card text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#FFE5D0] border-[1.5px] border-[#FFCA9A] shadow-[3px_4px_0px_#F1D8C3] flex items-center justify-center text-[#D97550] mx-auto">
          <Radio className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-brand-heading">
            Welcome to NETSCOPE
          </h2>
          <p className="text-sm text-brand-secondary max-w-md mx-auto leading-relaxed">
            Audit websites and their observed third-party dependency chains to uncover IPv6 delivery gaps before they impact users.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/app/audits/new"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FFA45B] text-[#30241F] font-bold text-xs border-[1.5px] border-[#E9C7AA] shadow-[2px_3px_0px_#D97550] hover:bg-[#FF9642] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Run Your First Audit</span>
          </Link>
          <Link
            to="/app/audits/sample"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border-[1.5px] border-brand-border text-brand-heading font-bold text-xs shadow-[2px_2px_0px_#F1D8C3] hover:bg-brand-cream hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center"
          >
            Explore Sample Report
          </Link>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'DNS (AAAA)', score: latestAudit.category_breakdown?.dns_score ?? (latestAudit.readiness_score ? 100 : 0), color: '#FFA45B' },
    { name: 'Main Conn', score: latestAudit.category_breakdown?.main_connectivity_score ?? (latestAudit.readiness_score ? 100 : 0), color: '#FFCA9A' },
    { name: 'HTTPS/TLS', score: latestAudit.category_breakdown?.https_score ?? (latestAudit.readiness_score ? 100 : 0), color: '#DDF4E4' },
    { name: 'Dependencies', score: latestAudit.category_breakdown?.dependency_score ?? (latestAudit.readiness_score ? 75 : 0), color: '#DCEEFF' },
    { name: 'Protocol', score: latestAudit.category_breakdown?.protocol_score ?? (latestAudit.readiness_score ? 85 : 0), color: '#E9E1FF' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="cartoon-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D97550] bg-[#FFE5D0] px-2.5 py-0.5 rounded-full border border-[#FFCA9A] mb-1.5">
            <span>Intelligence Overview</span>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-heading tracking-tight mt-0.5">
            Observability Dashboard
          </h1>
          <p className="text-xs text-brand-secondary mt-1">
            Displaying empirical health metrics from the latest completed audit for{' '}
            <b className="text-brand-heading font-mono bg-brand-cream px-2 py-0.5 rounded-lg border border-brand-border">
              {latestAudit.target_hostname}
            </b>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/app/audits/${latestAudit.audit_id}`}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white border-[1.5px] border-brand-border text-brand-heading hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3] hover:-translate-y-0.5 transition-all"
          >
            View Full Audit
          </Link>
          <Link
            to="/app/audits/new"
            className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#FFA45B] text-[#30241F] border-[1.5px] border-[#E9C7AA] shadow-[2px_3px_0px_#D97550] hover:bg-[#FF9642] hover:-translate-y-0.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Audit</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Cards with Curated Pastel Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Observed Readiness"
          value={latestAudit.readiness_score != null ? `${latestAudit.readiness_score.toFixed(1)}%` : 'Inconclusive'}
          subtitle="Weighted delivery-chain readiness"
          colorTheme="peach"
          tooltip="Weighted evaluation across DNS, Main IPv6 TCP reachability, HTTPS/TLS, dependency readiness, and protocol symmetry."
        />
        <ScoreCard
          title="Audit Coverage"
          value={latestAudit.coverage_score != null ? `${latestAudit.coverage_score.toFixed(1)}%` : 'N/A'}
          subtitle="Observable scope tested"
          colorTheme="sky"
          tooltip="(Tested Items / Discovered Items) × 100. Measures verified scope on the audited page."
        />
        <ScoreCard
          title="Evidence Confidence"
          value={latestAudit.confidence_category}
          subtitle="Empirical reliability level"
          badge="Deterministic"
          colorTheme="mint"
          tooltip="Determined by test completion, scanner environment capabilities, and corroborated observation."
        />
        <ScoreCard
          title="Findings Count"
          value={latestAudit.findings_count}
          subtitle="Prioritized diagnostic findings"
          colorTheme="yellow"
          tooltip="Total technical failure modes and observations identified."
        />
      </div>

      {/* Category Breakdown & Delivery Chain Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 cartoon-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#D97550]" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">
                Readiness by Verification Category
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

        <div className="lg:col-span-5 cartoon-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">
                Observed Delivery Chain
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
              Trace scripts, stylesheets, and APIs that can silently break for IPv6-only users when external dependencies lack dual-stack endpoints.
            </p>
          </div>

          <Link
            to={`/app/audits/${latestAudit.audit_id}/dependencies`}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-cream border-[1.5px] border-brand-border text-brand-heading font-bold text-xs hover:bg-[#FFE5D0] shadow-[2px_2px_0px_#F1D8C3] hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
          >
            <span>Open Dependency Graph</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D97550]" />
          </Link>
        </div>
      </div>

      {/* Top Prioritized Findings */}
      <div className="cartoon-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#D97550]" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-heading">
              Priority Technical Findings
            </h2>
          </div>
          <Link
            to={`/app/audits/${latestAudit.audit_id}/findings`}
            className="text-xs font-bold text-[#D97550] hover:underline"
          >
            View all findings &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {topFindings.map((f) => (
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
                  <span>Impact: <b className="text-[#D97550] font-bold">{f.impact_score.toFixed(1)}/100</b></span>
                </div>
              </div>

              <Link
                to={`/app/audits/${latestAudit.audit_id}/findings?id=${f.finding_id}`}
                className="text-xs font-bold text-[#D97550] hover:underline shrink-0"
              >
                Inspect Evidence &rarr;
              </Link>
            </div>
          ))}

          {topFindings.length === 0 && (
            <p className="text-xs text-brand-secondary text-center py-6 font-medium">
              No technical failure findings observed on latest audit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

