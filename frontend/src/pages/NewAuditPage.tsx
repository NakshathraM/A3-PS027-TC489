import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe2,
  Zap,
  Sliders,
  Layers,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { ScanMode } from '../types';

export const NewAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('standard');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxDeps, setMaxDeps] = useState(50);
  const [timeoutSec, setTimeoutSec] = useState(8.0);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError('Please enter a website URL.');
      return;
    }

    // Client-side domain format validation
    try {
      const urlCandidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
      const parsed = new URL(urlCandidate);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setValidationError('Only HTTP and HTTPS protocols are supported.');
        return;
      }
      if (!parsed.hostname.includes('.')) {
        setValidationError('Please enter a valid domain name with an extension (e.g., example.com).');
        return;
      }
    } catch {
      setValidationError('Malformed URL. Please verify formatting.');
      return;
    }

    setLoading(true);
    try {
      const created = await api.createAudit(trimmed, scanMode, maxDeps, timeoutSec);
      navigate(`/app/audits/${created.audit_id}`);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to initialize audit.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FFE5D0] border border-[#FFCA9A] text-[#D97550] shadow-[1px_1px_0px_#F1D8C3] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Diagnostic Initializer</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-heading tracking-tight">
          Configure New IPv6 Audit
        </h1>
        <p className="text-sm text-brand-secondary mt-1 font-medium leading-relaxed">
          Perform non-destructive multi-layer IPv6 readiness diagnostics across the target website and its observed dependencies.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="cartoon-card p-6 sm:p-8 space-y-6 bg-white">
        {/* URL Input */}
        <div className="space-y-2">
          <label htmlFor="target-url" className="block text-xs font-extrabold uppercase tracking-wider text-brand-heading">
            Target Website URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#FFA45B]">
              <Globe2 className="w-5 h-5 text-[#D97550]" />
            </div>
            <input
              id="target-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="https://example.com"
              className="w-full pl-12 pr-4 py-3.5 bg-[#FFFDF9] border-[1.5px] border-brand-border rounded-xl text-sm font-medium text-brand-heading placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-[#FFA45B]/30 focus:border-[#FFA45B] shadow-[2px_2px_0px_#F1D8C3] transition-all"
              disabled={loading}
            />
          </div>
          {validationError && (
            <div className="flex items-center space-x-1.5 text-xs font-bold text-status-coralText bg-status-coral border border-status-coralBorder p-2.5 rounded-xl shadow-[1px_1px_0px_#F7B8AC] pt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Scan Mode Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-heading">
              Select Audit Mode
            </label>
            <span className="text-[11px] font-bold text-brand-secondary">
              Determines scan depth & resource discovery
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Quick Scan */}
            <button
              type="button"
              onClick={() => setScanMode('quick')}
              className={`p-4 rounded-2xl border-[1.5px] text-left transition-all relative ${
                scanMode === 'quick'
                  ? 'border-[#FFA45B] bg-[#FFF3E5] shadow-[3px_4px_0px_#E8C7AC] ring-2 ring-[#FFA45B]/40'
                  : 'border-brand-border bg-[#FFFDF9] hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFF0B8] border border-[#F6DE8A] flex items-center justify-center text-[#8A5600]">
                  <Zap className="w-4 h-4" />
                </div>
                {scanMode === 'quick' && <CheckCircle className="w-4 h-4 text-[#D97550]" />}
              </div>
              <div className="font-extrabold text-sm text-brand-heading">Quick Scan</div>
              <p className="text-xs text-brand-secondary mt-1 leading-snug">
                Main domain DNS A/AAAA, TCP connectivity, and HTTPS verification.
              </p>
            </button>

            {/* Standard Audit */}
            <button
              type="button"
              onClick={() => setScanMode('standard')}
              className={`p-4 rounded-2xl border-[1.5px] text-left transition-all relative ${
                scanMode === 'standard'
                  ? 'border-[#FFA45B] bg-[#FFE5D0] shadow-[3px_4px_0px_#D97550] ring-2 ring-[#FFA45B]/40'
                  : 'border-brand-border bg-[#FFFDF9] hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFA45B] border border-[#E9C7AA] flex items-center justify-center text-[#30241F]">
                  <Layers className="w-4 h-4" />
                </div>
                {scanMode === 'standard' ? (
                  <CheckCircle className="w-4 h-4 text-[#D97550]" />
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF0B8] text-[#8A5600]">Recommended</span>
                )}
              </div>
              <div className="font-extrabold text-sm text-brand-heading">Standard Audit</div>
              <p className="text-xs text-brand-secondary mt-1 leading-snug">
                Full delivery chain discovery, dependency testing, and blast-radius score.
              </p>
            </button>

            {/* Deep Inspection */}
            <button
              type="button"
              onClick={() => setScanMode('deep')}
              className={`p-4 rounded-2xl border-[1.5px] text-left transition-all relative ${
                scanMode === 'deep'
                  ? 'border-[#FFA45B] bg-[#FFF3E5] shadow-[3px_4px_0px_#E8C7AC] ring-2 ring-[#FFA45B]/40'
                  : 'border-brand-border bg-[#FFFDF9] hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-xl bg-[#DCEEFF] border border-[#BADBFC] flex items-center justify-center text-[#1E5385]">
                  <Sliders className="w-4 h-4" />
                </div>
                {scanMode === 'deep' && <CheckCircle className="w-4 h-4 text-[#D97550]" />}
              </div>
              <div className="font-extrabold text-sm text-brand-heading">Deep Inspection</div>
              <p className="text-xs text-brand-secondary mt-1 leading-snug">
                Extended redirect analysis and bounded dependency asset probing.
              </p>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Settings */}
        <div className="border-t-[1.5px] border-brand-border pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-xs font-bold text-[#D97550] hover:underline transition-colors"
          >
            <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Scan Controls'}</span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 rounded-2xl bg-brand-cream border-[1.5px] border-brand-border shadow-[2px_2px_0px_#F1D8C3]">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-brand-heading">
                  <span>Max Dependencies Limit</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-brand-border text-[#D97550]">
                    {maxDeps}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={maxDeps}
                  onChange={(e) => setMaxDeps(Number(e.target.value))}
                  className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-[#FFA45B]"
                />
                <span className="text-[11px] text-brand-secondary block">Limits dependency asset count for conservative scan rates.</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-brand-heading">
                  <span>Per-Probe Timeout</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-brand-border text-[#D97550]">
                    {timeoutSec}s
                  </span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="15.0"
                  step="0.5"
                  value={timeoutSec}
                  onChange={(e) => setTimeoutSec(Number(e.target.value))}
                  className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-[#FFA45B]"
                />
                <span className="text-[11px] text-brand-secondary block">Timeout applied to individual DNS and TCP socket probes.</span>
              </div>
            </div>
          )}
        </div>

        {/* Safety Notice */}
        <div className="p-4 rounded-2xl bg-brand-cream border-[1.5px] border-brand-border shadow-[2px_2px_0px_#F1D8C3] flex items-start space-x-3 text-xs text-brand-secondary">
          <div className="w-6 h-6 rounded-lg bg-[#FFE5D0] flex items-center justify-center text-[#D97550] shrink-0 mt-0.5">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <p className="leading-relaxed font-medium">
            <b className="text-brand-heading">Safety & SSRF Defense:</b> NETSCOPE performs non-destructive checks on publicly accessible resources. Only scan websites you are authorized to assess. Private RFC 1918 addresses, loopbacks, and cloud metadata endpoints are strictly blocked by built-in security policies.
          </p>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-[#FFA45B] text-[#30241F] font-extrabold text-sm border-[1.5px] border-[#E9C7AA] shadow-[3px_4px_0px_#D97550] hover:bg-[#FF9642] hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#30241F] border-t-transparent rounded-full animate-spin" />
                <span>Initializing Audit Engine...</span>
              </>
            ) : (
              <>
                <span>Start IPv6 Readiness Audit</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

