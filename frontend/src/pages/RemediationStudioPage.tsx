import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sliders,
  TrendingUp,
  RotateCcw,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { api } from '../api/client';
import { Audit, RemediationAction, SimulationResult } from '../types';

export const RemediationStudioPage: React.FC = () => {
  const { auditId = 'sample' } = useParams();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAudit(auditId), api.getRemediationActions(auditId)])
      .then(([auditRes, actionsRes]: [Audit, RemediationAction[]]) => {
        setAudit(auditRes);
        setActions(actionsRes);
        runSimulation([]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auditId]);

  const runSimulation = async (selectedIds: string[]) => {
    try {
      const res = await api.simulateRemediation(auditId, selectedIds);
      setSimulation(res);
    } catch {
      // Simulation error
    }
  };

  const toggleAction = (actionId: string) => {
    const nextSelected = selectedActionIds.includes(actionId)
      ? selectedActionIds.filter((id) => id !== actionId)
      : [...selectedActionIds, actionId];
    setSelectedActionIds(nextSelected);
    runSimulation(nextSelected);
  };

  const handleSelectAll = () => {
    const allIds = actions.map((a) => a.action_id);
    setSelectedActionIds(allIds);
    runSimulation(allIds);
  };

  const handleReset = () => {
    setSelectedActionIds([]);
    runSimulation([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-brand-secondary">Loading remediation models & mathematical graphs...</p>
      </div>
    );
  }

  const baselineScore = simulation?.baseline_score ?? (audit?.readiness_score ?? 0);
  const projectedScore = simulation?.projected_score ?? baselineScore;
  const delta = simulation?.score_delta ?? 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="cartoon-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-black px-3 py-1 rounded-full bg-brand-peach/60 text-brand-terracotta border border-brand-peach mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Remediation Studio</span>
          </div>
          <h1 className="text-2xl font-black text-brand-heading tracking-tight">
            Remediation Studio & What-If Engine
          </h1>
          <p className="text-xs text-brand-secondary mt-1 max-w-2xl leading-relaxed">
            Test hypothetical configuration fixes and preview mathematical readiness gains without touching live infrastructure. Select actions below to recalculate scores in real-time.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleSelectAll}
            className="btn-cartoon-secondary text-xs px-3.5 py-2 font-bold"
          >
            Select All Fixes
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-brand-cream border-[1.5px] border-brand-border text-brand-secondary hover:text-brand-heading hover:bg-brand-peach/30 transition-all shadow-[2px_2px_0px_#F1D8C3]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Simulator Comparison Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Baseline Card */}
        <div className="cartoon-card p-5 bg-brand-cream/60 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-secondary block mb-1">
              Current Baseline Readiness
            </span>
            <div className="text-4xl font-black text-brand-heading">
              {baselineScore.toFixed(1)}%
            </div>
          </div>
          <p className="text-xs text-brand-secondary font-medium">
            Empirically measured score from current live DNS, socket, and TLS probes.
          </p>
        </div>

        {/* Projected Score Card */}
        <div className="rounded-2xl p-5 border-[2px] border-brand-orange bg-[#FFF5EC] shadow-[3px_4px_0px_#FFA45B] flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-peach/30 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-terracotta">
                Hypothetical Projected Score
              </span>
              <Sparkles className="w-4 h-4 text-brand-tangerine" />
            </div>
            <div className="text-4xl font-black text-brand-terracotta flex items-baseline gap-2">
              <span>{projectedScore.toFixed(1)}%</span>
              {delta > 0 && (
                <span className="text-sm font-bold text-status-mintText">
                  (prev {baselineScore.toFixed(0)}%)
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-black px-3 py-1 rounded-full bg-status-mint border border-[#A6E8BA] text-[#1E5631] shadow-[1px_2px_0px_#A6E8BA]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{delta.toFixed(1)}% Potential Readiness Gain</span>
            </div>
          </div>
        </div>

        {/* Selected Fixes Status */}
        <div className="cartoon-card p-5 bg-white flex flex-col justify-between space-y-3">
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-brand-secondary">Selected Action Items:</span>
              <span className="font-black px-2.5 py-0.5 rounded-lg bg-brand-peach text-brand-terracotta text-xs">
                {selectedActionIds.length} of {actions.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-brand-secondary">Findings Resolved:</span>
              <span className="font-black px-2.5 py-0.5 rounded-lg bg-status-mint text-[#1E5631] text-xs">
                {simulation?.resolved_finding_ids.length ?? 0}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-brand-cream border border-brand-border text-[11px] text-brand-secondary leading-snug">
            <span className="font-bold text-brand-terracotta block mb-0.5">Hypothetical Simulation:</span>
            {simulation?.disclaimer || 'Projected results are hypothetical. Actual improvements must be verified by rerunning the audit.'}
          </div>
        </div>
      </div>

      {/* Prioritized Actions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-brand-heading flex items-center gap-2">
            <span>Prioritized Remediation Action Items</span>
            <span className="px-2 py-0.5 rounded-full bg-brand-peach text-brand-terracotta text-xs font-black">
              {actions.length}
            </span>
          </h2>
          <span className="text-xs text-brand-secondary">Click any item to toggle in simulator</span>
        </div>

        <div className="space-y-3.5">
          {actions.map((act, index) => {
            const isSelected = selectedActionIds.includes(act.action_id);

            return (
              <div
                key={act.action_id}
                onClick={() => toggleAction(act.action_id)}
                className={`p-5 rounded-2xl border-[1.5px] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-orange bg-[#FFF8F2] shadow-[3px_4px_0px_#FFA45B] -translate-y-0.5'
                    : 'border-brand-border bg-white shadow-[3px_4px_0px_#F1D8C3] hover:border-brand-peach hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    {/* Custom Cartoon Checkbox */}
                    <div
                      className={`w-6 h-6 mt-0.5 rounded-lg border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-brand-orange border-brand-orange text-white shadow-[1px_2px_0px_#D97550]'
                          : 'bg-white border-brand-border'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-brand-peach/80 text-brand-terracotta text-[10px] font-black flex items-center justify-center">
                          #{index + 1}
                        </span>
                        <span className="font-black text-sm text-brand-heading">{act.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-brand-cream border border-brand-border text-brand-secondary">
                          Effort: {act.estimated_effort}
                        </span>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-status-mint border border-[#A6E8BA] text-[#1E5631] shadow-[1px_1px_0px_#A6E8BA]">
                          +{act.projected_readiness_gain}% Gain
                        </span>
                      </div>

                      {/* Problem Description */}
                      <p className="text-xs text-brand-secondary leading-relaxed">
                        <strong className="text-brand-heading font-bold">Observed Barrier: </strong>
                        {act.problem}
                      </p>

                      {/* Recommended Fix Box */}
                      <div className="p-3.5 rounded-xl bg-brand-cream/80 border border-brand-border text-xs space-y-1.5 text-brand-heading">
                        <div className="leading-relaxed">
                          <strong className="text-brand-terracotta font-bold">Recommended Engineering Action: </strong>
                          {act.recommended_action}
                        </div>
                        <div className="flex items-baseline space-x-2 pt-1 border-t border-brand-border/60">
                          <strong className="text-[11px] font-bold text-brand-secondary shrink-0">Verification Command:</strong>
                          <code className="font-mono text-[11px] text-brand-terracotta font-semibold break-all bg-white px-2 py-0.5 rounded border border-brand-border">
                            {act.verification_procedure}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Host Details */}
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-brand-secondary block mb-1">
                      Affected Delivery Host:
                    </span>
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-brand-cream border border-brand-border font-mono text-xs font-bold text-brand-heading">
                      {act.target_hostname}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {actions.length === 0 && (
            <div className="cartoon-card p-10 text-center text-xs text-brand-secondary space-y-2 bg-white">
              <CheckCircle2 className="w-8 h-8 text-status-mintText mx-auto" />
              <p className="font-bold text-brand-heading text-sm">No remediation actions needed.</p>
              <p>All audited delivery components and host dependencies are fully IPv6 ready.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

