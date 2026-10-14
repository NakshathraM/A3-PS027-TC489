import React, { useState, useEffect } from 'react';
import { Settings, Activity, Shield, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { ScannerSettingsData } from '../types';

export const SettingsPage: React.FC = () => {
  const [settingsData, setSettingsData] = useState<ScannerSettingsData | null>(null);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = () => {
    setTesting(true);
    api
      .getSettings()
      .then((data: ScannerSettingsData) => {
        setSettingsData(data);
        setMessage('Scanner network capability probed successfully.');
      })
      .catch(() => setMessage('Failed to query scanner settings.'))
      .finally(() => setTesting(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Header Banner */}
      <div className="cartoon-card p-6 md:p-8 bg-white space-y-3">
        <div className="inline-flex items-center space-x-1.5 text-xs font-black px-3 py-1 rounded-full bg-brand-peach/60 text-brand-terracotta border border-brand-peach">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Environment Diagnostics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-heading tracking-tight">
          Application & Scanner Settings
        </h1>
        <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
          Inspect the local scanning environment's network capability, active security controls, and diagnostic configurations.
        </p>
      </div>

      {/* Scanner Capability Card */}
      <div className="cartoon-card p-6 bg-white space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-peach flex items-center justify-center text-brand-terracotta border border-brand-border shadow-[1px_2px_0px_#E9C7AA]">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-brand-heading">
              Scanner Outbound IPv6 Verification
            </h2>
          </div>
          <button
            onClick={loadSettings}
            disabled={testing}
            className="btn-cartoon-secondary text-xs px-3.5 py-1.5 font-bold flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Re-probe Route</span>
          </button>
        </div>

        {settingsData && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 bg-brand-cream/60 rounded-xl border-[1.5px] border-brand-border space-y-1 shadow-[2px_2px_0px_#F1D8C3]">
                <span className="text-brand-secondary block text-[11px] font-bold">IPv6 Capability Status</span>
                <span
                  className={`text-xl font-black ${
                    settingsData.scanner_ipv6.status === 'CAPABLE'
                      ? 'text-status-mintText'
                      : 'text-status-coralText'
                  }`}
                >
                  {settingsData.scanner_ipv6.status}
                </span>
              </div>
              <div className="p-4 bg-brand-cream/60 rounded-xl border-[1.5px] border-brand-border space-y-1 shadow-[2px_2px_0px_#F1D8C3]">
                <span className="text-brand-secondary block text-[11px] font-bold">Probe Endpoint</span>
                <span className="font-mono font-black text-brand-heading text-sm">
                  [{settingsData.scanner_ipv6.probe_target}]:{settingsData.scanner_ipv6.probe_port}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-brand-cream border-[1.5px] border-brand-border text-brand-heading leading-relaxed">
              <strong className="text-brand-terracotta font-bold">Diagnostic Detail: </strong>
              {settingsData.scanner_ipv6.detail}
            </div>

            {message && (
              <div className="text-xs font-bold text-[#1E5631] flex items-center space-x-1.5 p-2.5 rounded-xl bg-status-mint border border-[#A6E8BA]">
                <CheckCircle2 className="w-4 h-4 text-[#1E5631] shrink-0" />
                <span>{message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Network Security Policies Card */}
      <div className="cartoon-card p-6 bg-white space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-status-sky flex items-center justify-center text-brand-heading border border-[#BFDFFF] shadow-[1px_2px_0px_#BFDFFF]">
            <Shield className="w-4 h-4 text-brand-heading" />
          </div>
          <h2 className="text-base font-black text-brand-heading">
            Network Security & SSRF Defense Policy
          </h2>
        </div>

        <p className="text-xs text-brand-secondary leading-relaxed">
          To prevent Server-Side Request Forgery (SSRF) and abuse, NETSCOPE strictly filters all scanned destinations against dangerous address spaces:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 bg-status-coral/30 rounded-xl border border-status-coral shadow-[1px_2px_0px_#F7A899]">
            <span className="text-status-coralText block text-[10px] font-black uppercase mb-1">Blocked IPv4 Ranges</span>
            <span className="text-[#8B2020] font-bold leading-relaxed text-[11px]">
              127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12, 169.254.0.0/16
            </span>
          </div>
          <div className="p-3.5 bg-status-coral/30 rounded-xl border border-status-coral shadow-[1px_2px_0px_#F7A899]">
            <span className="text-status-coralText block text-[10px] font-black uppercase mb-1">Blocked IPv6 Ranges</span>
            <span className="text-[#8B2020] font-bold leading-relaxed text-[11px]">
              ::1/128, fc00::/7 (ULA), fe80::/10 (Link-Local), ff00::/8
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-brand-cream border border-brand-border text-xs text-brand-secondary font-medium">
          Allowed Scan Ports: <code className="font-mono font-bold text-brand-heading">80, 443, 8080, 8443</code> &bull; Max Body Size: <strong className="text-brand-heading">5 MB</strong> &bull; Max Redirects: <strong className="text-brand-heading">5</strong>
        </div>
      </div>
    </div>
  );
};

