import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Wrench,
  X,
  Bot,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';
import { Finding } from '../types';
import { StatusPill } from '../components/UI/StatusPill';

export const FindingsExplorerPage: React.FC = () => {
  const { auditId = 'sample' } = useParams();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');

  const [findings, setFindings] = useState<Finding[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(highlightedId);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // NETSCOPE INSIGHT AI modal/side panel state
  const [explainingFinding, setExplainingFinding] = useState<Finding | null>(null);
  const [explanationData, setExplanationData] = useState<{
    source: string;
    model: string;
    explanation: string;
    disclaimer: string;
  } | null>(null);
  const [explainingLoading, setExplainingLoading] = useState(false);

  useEffect(() => {
    api
      .getAuditFindings(auditId)
      .then((data: Finding[]) => {
        setFindings(data);
        if (highlightedId) {
          setExpandedId(highlightedId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auditId, highlightedId]);

  const handleExplain = async (finding: Finding) => {
    setExplainingFinding(finding);
    setExplainingLoading(true);
    setExplanationData(null);
    try {
      const res = await api.explainFinding(auditId, finding.finding_id);
      setExplanationData(res);
    } catch {
      setExplanationData({
        source: 'error',
        model: 'NETSCOPE Engine',
        explanation: 'Unable to contact diagnostic explanation service at this time.',
        disclaimer: 'Please review raw evidence directly.',
      });
    } finally {
      setExplainingLoading(false);
    }
  };

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch =
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.affected_hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
      const matchCategory = categoryFilter === 'ALL' || f.category === categoryFilter;
      return matchSearch && matchSeverity && matchCategory;
    });
  }, [findings, searchQuery, severityFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[#FFA45B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-brand-secondary">Loading diagnostic findings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cartoon-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D97550] bg-[#FFE5D0] px-2.5 py-0.5 rounded-full border border-[#FFCA9A] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empirical Evidence</span>
          </div>
          <h1 className="text-xl font-extrabold text-brand-heading tracking-tight mt-0.5">
            Technical Findings Explorer
          </h1>
          <p className="text-xs text-brand-secondary font-medium mt-0.5">
            Evidence-grounded observations prioritized mathematically by the Dependency Blast-Radius Engine.
          </p>
        </div>

        <Link
          to={`/app/audits/${auditId}/remediation`}
          className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-[#FFA45B] text-[#30241F] border-[1.5px] border-[#E9C7AA] shadow-[2px_3px_0px_#D97550] hover:bg-[#FF9642] hover:-translate-y-0.5 transition-all"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Launch Remediation Studio</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search findings by title or hostname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-[1.5px] border-brand-border rounded-xl text-xs font-medium text-brand-heading placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-[#FFA45B]/30 focus:border-[#FFA45B] shadow-[2px_2px_0px_#F1D8C3]"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-white border-[1.5px] border-brand-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-brand-heading focus:outline-none shadow-[2px_2px_0px_#F1D8C3]"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Informational</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border-[1.5px] border-brand-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-brand-heading focus:outline-none shadow-[2px_2px_0px_#F1D8C3]"
        >
          <option value="ALL">All Categories</option>
          <option value="DNS">DNS</option>
          <option value="CONNECTIVITY">Connectivity</option>
          <option value="HTTPS">HTTPS</option>
          <option value="DEPENDENCY">Dependency</option>
        </select>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.map((finding) => {
          const isExpanded = expandedId === finding.finding_id;

          // Semantic Accent Stripe
          const stripeColor =
            finding.severity === 'CRITICAL'
              ? 'bg-[#A82E1E]'
              : finding.severity === 'WARNING'
              ? 'bg-[#8A5600]'
              : 'bg-[#1E5385]';

          return (
            <div
              key={finding.finding_id}
              className={`cartoon-card bg-white transition-all overflow-hidden relative ${
                isExpanded ? 'border-[#FFA45B] ring-2 ring-[#FFA45B]/30 shadow-[3px_5px_0px_#E8C7AC]' : 'hover:-translate-y-0.5'
              }`}
            >
              {/* Left Accent Stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripeColor}`} />

              {/* Finding Card Header */}
              <div className="p-5 pl-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={finding.severity} size="sm" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-cream border border-brand-border text-brand-secondary">
                      {finding.category}
                    </span>
                    <span className="text-[11px] font-medium text-brand-secondary">
                      Confidence: <b className="text-brand-heading">{finding.confidence}</b>
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-brand-heading">
                    {finding.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-brand-secondary font-medium">
                    <span>Host: <code className="bg-brand-cream border border-brand-border px-2 py-0.5 rounded-lg text-brand-heading font-mono text-[11px]">{finding.affected_hostname}</code></span>
                    <span>&bull;</span>
                    <span>Potential Impact: <b className="text-[#D97550] font-bold">{finding.impact_score.toFixed(1)}/100</b> ({finding.potential_impact_category})</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleExplain(finding)}
                    className="flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white border-[1.5px] border-[#FFCA9A] text-[#D97550] hover:bg-[#FFE5D0] shadow-[2px_2px_0px_#F1D8C3] transition-all"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#FFA45B]" />
                    <span>Explain Finding</span>
                  </button>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : finding.finding_id)}
                    className="flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-brand-cream border-[1.5px] border-brand-border text-brand-heading hover:bg-[#FFE5D0] shadow-[2px_2px_0px_#F1D8C3] transition-all"
                  >
                    <span>{isExpanded ? 'Hide Evidence' : 'View Evidence'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Evidence Panel */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-3 border-t-[1.5px] border-brand-border bg-[#FFFDF9] space-y-4 text-xs">
                  <div>
                    <h4 className="font-extrabold text-brand-heading mb-1 text-xs">Observation Description:</h4>
                    <p className="text-brand-secondary leading-relaxed font-medium">{finding.description}</p>
                  </div>

                  {/* Raw Diagnostic Evidence */}
                  <div className="cartoon-card p-4 space-y-3 bg-white">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-secondary block">
                      Diagnostic Test Evidence:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px]">
                      <div className="p-2.5 rounded-xl bg-brand-cream border border-brand-border">
                        <span className="text-brand-secondary text-[10px] block font-sans font-bold">Test Type</span>
                        <span className="font-bold text-brand-heading">{finding.evidence.test_type}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-brand-cream border border-brand-border">
                        <span className="text-brand-secondary text-[10px] block font-sans font-bold">Connection Outcome</span>
                        <span className="font-bold text-brand-heading">{finding.evidence.connection_result || 'N/A'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-brand-cream border border-brand-border">
                        <span className="text-brand-secondary text-[10px] block font-sans font-bold">Destination IP</span>
                        <span className="font-bold text-brand-heading">{finding.evidence.destination_ip || 'None'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-brand-cream border border-brand-border">
                        <span className="text-brand-secondary text-[10px] block font-sans font-bold">Scanner Capability</span>
                        <span className="font-bold text-brand-heading">{finding.evidence.scanner_ipv6_capability}</span>
                      </div>
                    </div>

                    {finding.evidence.error_detail && (
                      <div className="p-3 rounded-xl bg-status-coral border border-status-coralBorder text-[11px] font-mono text-status-coralText">
                        <b>Error Detail:</b> {finding.evidence.error_detail}
                      </div>
                    )}

                    <div className="text-[11px] text-brand-secondary leading-relaxed pt-1 font-medium font-sans">
                      <b className="text-brand-heading">Methodology Note:</b> {finding.evidence.methodology_note}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 rounded-2xl bg-[#FFE5D0]/60 border-[1.5px] border-[#FFCA9A] text-brand-heading shadow-[1px_2px_0px_#F1D8C3]">
                    <span className="font-extrabold text-[#D97550] block mb-1">Recommended Remediation:</span>
                    <p className="text-brand-secondary font-medium leading-relaxed">{finding.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredFindings.length === 0 && (
          <div className="p-12 text-center cartoon-card text-xs text-brand-secondary font-medium bg-white">
            No findings match your selected filter criteria.
          </div>
        )}
      </div>

      {/* NETSCOPE INSIGHT Assistant Panel */}
      {explainingFinding && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-[0_0_24px_rgba(0,0,0,0.15)] flex flex-col border-l-[1.5px] border-brand-border">
            {/* Header Strip in Pale Peach */}
            <div className="bg-[#FFE5D0] border-b-[1.5px] border-[#FFCA9A] p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFA45B] border border-[#E9C7AA] flex items-center justify-center text-[#30241F] shadow-[1px_2px_0px_#D97550]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-[#30241F] block">NETSCOPE INSIGHT</span>
                  <span className="text-[10px] text-[#76665E] font-bold">Evidence-Grounded Explainer</span>
                </div>
              </div>
              <button
                onClick={() => setExplainingFinding(null)}
                className="p-1.5 rounded-xl bg-white border border-brand-border text-brand-secondary hover:text-brand-heading hover:bg-brand-cream transition-all shadow-[1px_1px_0px_#F1D8C3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              {/* Finding Title & Target Host */}
              <div className="p-4 rounded-2xl bg-brand-cream border-[1.5px] border-brand-border shadow-[2px_2px_0px_#F1D8C3]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-muted block">
                  Analyzing Finding:
                </span>
                <h3 className="text-base font-extrabold text-brand-heading mt-1">
                  {explainingFinding.title}
                </h3>
                <p className="font-mono text-xs text-[#D97550] font-bold mt-1">
                  {explainingFinding.affected_hostname}
                </p>
              </div>

              {/* Contextual Prompt Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary block">
                  Contextual Inquiries:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-brand-border text-brand-heading shadow-[1px_1px_0px_#F1D8C3]">
                    Explain this finding
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-brand-border text-brand-heading shadow-[1px_1px_0px_#F1D8C3]">
                    Why is this inconclusive?
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-brand-border text-brand-heading shadow-[1px_1px_0px_#F1D8C3]">
                    What should I fix first?
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-brand-border text-brand-heading shadow-[1px_1px_0px_#F1D8C3]">
                    How do I verify the fix?
                  </span>
                </div>
              </div>

              {explainingLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
                  <div className="w-9 h-9 border-3 border-[#FFA45B] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-brand-secondary">Generating evidence-grounded explanation...</p>
                </div>
              ) : explanationData ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border-[1.5px] border-brand-border shadow-[2px_3px_0px_#F1D8C3] text-xs leading-relaxed text-brand-heading whitespace-pre-wrap font-sans font-medium">
                    {explanationData.explanation}
                  </div>

                  <div className="text-[11px] text-brand-secondary p-3.5 bg-brand-cream rounded-xl border border-brand-border font-medium leading-relaxed">
                    <b className="text-brand-heading">Provenance:</b> {explanationData.model} &bull; {explanationData.disclaimer}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t-[1.5px] border-brand-border bg-brand-cream/50 flex justify-end">
              <button
                onClick={() => setExplainingFinding(null)}
                className="px-4 py-2 rounded-xl bg-white border-[1.5px] border-brand-border text-xs font-bold text-brand-heading hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3] transition-all"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

