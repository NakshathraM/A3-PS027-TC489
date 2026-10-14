import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Network,
  AlertTriangle,
  Wrench,
  History,
  BookOpen,
  Settings,
  Download,
  Activity,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { api } from '../../api/client';
import { ScannerSettingsData } from '../../types';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannerInfo, setScannerInfo] = useState<ScannerSettingsData | null>(null);

  // Extract auditId from current pathname if in /app/audits/:auditId
  const match = location.pathname.match(/\/app\/audits\/([^/]+)/);
  const currentAuditId = match && match[1] !== 'new' ? match[1] : null;

  useEffect(() => {
    api.getSettings().then(setScannerInfo).catch(() => {});
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? 'bg-[#FFE5D0] text-[#30241F] border-[1.5px] border-[#FFA45B] shadow-[2px_2px_0px_#F1D8C3]'
        : 'text-brand-secondary hover:text-brand-heading hover:bg-brand-cream border-[1.5px] border-transparent'
    }`;

  const subNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? 'bg-[#FFA45B] text-[#30241F] border-[1.5px] border-[#E9C7AA] shadow-[2px_2px_0px_#D97550]'
        : 'text-brand-secondary hover:text-brand-heading hover:bg-brand-cream border-[1.5px] border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3D302B] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-[1.5px] border-brand-border px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-[0_2px_0px_#F1D8C3]">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-brand-cream border border-brand-border text-brand-secondary hover:text-brand-heading"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* NETSCOPE Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-2xl bg-[#FFA45B] border-[1.5px] border-[#E9C7AA] shadow-[2px_2px_0px_#D97550] flex items-center justify-center text-[#30241F] group-hover:-translate-y-0.5 transition-transform">
              <Radio className="w-5 h-5 text-[#30241F]" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-extrabold tracking-tight text-[#D97550]">
                  NET<span className="text-[#30241F]">SCOPE</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-[#FFA45B]" />
              </div>
              <p className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                IPv6 Readiness Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Right status & CTAs */}
        <div className="flex items-center space-x-3">
          {/* Scanner Capability Pill */}
          {scannerInfo && (
            <div className="hidden md:flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-brand-cream border border-brand-border shadow-[1px_1px_0px_#F1D8C3]">
              <Activity className="w-3.5 h-3.5 text-[#D97550]" />
              <span className="text-brand-secondary font-medium">Scanner IPv6:</span>
              <span
                className={`font-bold ${
                  scannerInfo.scanner_ipv6.status === 'CAPABLE'
                    ? 'text-status-mintText'
                    : 'text-status-coralText'
                }`}
              >
                {scannerInfo.scanner_ipv6.status}
              </span>
            </div>
          )}

          <Link
            to="/app/audits/sample"
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white border-[1.5px] border-brand-border text-brand-heading hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3] hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
          >
            Sample Report
          </Link>

          <Link
            to="/app/audits/new"
            className="flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-[#FFA45B] text-[#30241F] border-[1.5px] border-[#E9C7AA] shadow-[2px_3px_0px_#D97550] hover:bg-[#FF9642] hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#30241F]" />
            <span>New Audit</span>
          </Link>
        </div>
      </header>

      {/* Main App Layout Grid */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } lg:block w-64 shrink-0 space-y-5 bg-white lg:bg-transparent p-5 lg:p-0 rounded-2xl lg:rounded-none border-[1.5px] lg:border-none border-brand-border absolute lg:static z-30 left-4 top-16 shadow-[4px_6px_0px_#E8C7AC] lg:shadow-none`}
        >
          {/* Main Navigation Container */}
          <div className="cartoon-card p-3 space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-muted px-3 py-1.5">
              Platform Modules
            </div>
            <NavLink to="/app" end className={navItemClass}>
              <LayoutDashboard className="w-4 h-4 text-[#D97550]" />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/app/audits/new" className={navItemClass}>
              <PlusCircle className="w-4 h-4 text-[#FFA45B]" />
              <span>New Audit</span>
            </NavLink>
            <NavLink to="/app/history" className={navItemClass}>
              <History className="w-4 h-4 text-brand-secondary" />
              <span>Audit History</span>
            </NavLink>
            <NavLink to="/app/methodology" className={navItemClass}>
              <BookOpen className="w-4 h-4 text-brand-secondary" />
              <span>Methodology</span>
            </NavLink>
            <NavLink to="/app/settings" className={navItemClass}>
              <Settings className="w-4 h-4 text-brand-secondary" />
              <span>Settings</span>
            </NavLink>
          </div>

          {/* Active Audit Context Submenu */}
          {currentAuditId && (
            <div className="cartoon-card p-3 space-y-1.5 bg-[#FFFDF9]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-muted px-3 py-1 flex items-center justify-between">
                <span>Active Audit</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#FFE5D0] text-[#D97550] font-bold border border-[#FFCA9A]">
                  {currentAuditId === 'sample' ? 'SAMPLE' : currentAuditId.slice(0, 8)}
                </span>
              </div>
              <NavLink to={`/app/audits/${currentAuditId}`} end className={subNavItemClass}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Audit Overview</span>
              </NavLink>
              <NavLink to={`/app/audits/${currentAuditId}/dependencies`} className={subNavItemClass}>
                <Network className="w-3.5 h-3.5" />
                <span>Dependency Graph</span>
              </NavLink>
              <NavLink to={`/app/audits/${currentAuditId}/findings`} className={subNavItemClass}>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Findings Explorer</span>
              </NavLink>
              <NavLink to={`/app/audits/${currentAuditId}/remediation`} className={subNavItemClass}>
                <Wrench className="w-3.5 h-3.5" />
                <span>Remediation Studio</span>
              </NavLink>

              <div className="pt-2 px-1">
                <a
                  href={api.getReportDownloadUrl(currentAuditId)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center space-x-1.5 text-xs font-bold py-2 px-3 rounded-xl bg-white border-[1.5px] border-brand-border text-brand-heading hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3] hover:-translate-y-0.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-[#D97550]" />
                  <span>Download Report</span>
                </a>
              </div>
            </div>
          )}

          {/* Micro Card: Platform Credibility */}
          <div className="p-4 rounded-2xl bg-brand-cream border-[1.5px] border-brand-border space-y-1 shadow-[2px_2px_0px_#F1D8C3]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97550] block">
              Auditor Guarantee
            </span>
            <p className="text-[11px] text-brand-secondary leading-relaxed">
              Real socket handshakes & authoritative DNS. No fabricated metrics or simulations in audit snapshots.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

