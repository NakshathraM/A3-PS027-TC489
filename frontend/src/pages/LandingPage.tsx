import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Network,
  Cpu,
  Sliders,
  CheckCircle2,
  Radio,
  Server,
  Code2,
  FileCode,
  Image as ImageIcon,
  KeyRound,
  Type,
} from 'lucide-react';

interface HeroNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  status: 'ready' | 'warning' | 'critical';
  nodeTypeBg: string;
  nodeTypeBorder: string;
  icon: React.ReactNode;
  description: string;
}

const HERO_NODES: HeroNode[] = [
  {
    id: 'main',
    name: 'your-website.com',
    type: 'Website Origin',
    x: 50,
    y: 50,
    status: 'ready',
    nodeTypeBg: 'bg-[#FFA45B]',
    nodeTypeBorder: 'border-[#D97550]',
    icon: <Radio className="w-5 h-5 text-[#30241F]" />,
    description: 'Dual-stack IPv4/IPv6 origin edge with valid TLS 1.3 certificate',
  },
  {
    id: 'cdn',
    name: 'cdn.static.net',
    type: 'Asset CDN',
    x: 24,
    y: 28,
    status: 'ready',
    nodeTypeBg: 'bg-[#FFF0B8]',
    nodeTypeBorder: 'border-[#F6DE8A]',
    icon: <Server className="w-4 h-4 text-[#8A5600]" />,
    description: 'Global dual-stack edge POP with AAAA records published',
  },
  {
    id: 'api',
    name: 'api.service.io',
    type: 'API Service',
    x: 76,
    y: 24,
    status: 'critical',
    nodeTypeBg: 'bg-[#DCEEFF]',
    nodeTypeBorder: 'border-[#BADBFC]',
    icon: <Cpu className="w-4 h-4 text-[#1E5385]" />,
    description: 'Has AAAA in DNS, but port 443 TCP times out over native IPv6',
  },
  {
    id: 'js',
    name: 'bundle.vendor.org',
    type: 'JavaScript',
    x: 18,
    y: 72,
    status: 'warning',
    nodeTypeBg: 'bg-[#E9E1FF]',
    nodeTypeBorder: 'border-[#D3C4FC]',
    icon: <FileCode className="w-4 h-4 text-[#5B39A8]" />,
    description: 'IPv4-only; no AAAA record found in authoritative DNS',
  },
  {
    id: 'auth',
    name: 'auth.identity.com',
    type: 'Authentication',
    x: 82,
    y: 70,
    status: 'ready',
    nodeTypeBg: 'bg-[#FFE5D0]',
    nodeTypeBorder: 'border-[#FFCA9A]',
    icon: <KeyRound className="w-4 h-4 text-[#D97550]" />,
    description: 'Dual-stack IPv6 verified with active OAuth endpoints',
  },
  {
    id: 'fonts',
    name: 'fonts.delivery.net',
    type: 'Web Fonts',
    x: 50,
    y: 16,
    status: 'warning',
    nodeTypeBg: 'bg-[#FFF3E5]',
    nodeTypeBorder: 'border-[#F0DCCB]',
    icon: <Type className="w-4 h-4 text-[#76665E]" />,
    description: 'Legacy IPv4 server requiring NAT64 translation translation',
  },
  {
    id: 'img',
    name: 'media.cloud-img.com',
    type: 'Images & Media',
    x: 50,
    y: 84,
    status: 'ready',
    nodeTypeBg: 'bg-[#DDF4E4]',
    nodeTypeBorder: 'border-[#B8E6C4]',
    icon: <ImageIcon className="w-4 h-4 text-[#1C6B38]" />,
    description: 'Public dual-stack storage bucket with verified IPv6 TLS',
  },
];

export const LandingPage: React.FC = () => {
  const [activeNode, setActiveNode] = useState<HeroNode>(HERO_NODES[0]);

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3D302B] flex flex-col font-sans selection:bg-[#FFE5D0]">
      {/* Top Header */}
      <header className="border-b-[1.5px] border-brand-border bg-white/90 backdrop-blur sticky top-0 z-50 px-6 py-4 shadow-[0_2px_0px_#F1D8C3]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-2xl bg-[#FFA45B] border-[1.5px] border-[#E9C7AA] shadow-[2px_2px_0px_#D97550] flex items-center justify-center text-[#30241F] group-hover:-translate-y-0.5 transition-transform">
              <Radio className="w-5 h-5 text-[#30241F]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#D97550]">
                NET<span className="text-[#30241F]">SCOPE</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-brand-secondary">
            <Link to="/app" className="hover:text-brand-heading transition-colors">Overview</Link>
            <Link to="/app/methodology" className="hover:text-brand-heading transition-colors">Methodology</Link>
            <Link to="/app/history" className="hover:text-brand-heading transition-colors">Audit History</Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/app/audits/sample"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white border-[1.5px] border-brand-border text-brand-heading hover:bg-brand-cream shadow-[2px_2px_0px_#F1D8C3] hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
            >
              Explore Sample Report
            </Link>
            <Link
              to="/app/audits/new"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#FFA45B] text-[#30241F] border-[1.5px] border-[#E9C7AA] shadow-[2px_3px_0px_#D97550] hover:bg-[#FF9642] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center space-x-1.5"
            >
              <span>Run an Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto w-full relative">
        {/* Soft decorative background circles */}
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-[#FFE5D0]/30 blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-80 h-80 rounded-full bg-[#FFF0B8]/30 blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FFE5D0] border-[1.5px] border-[#FFCA9A] text-[#D97550] text-xs font-bold uppercase tracking-wider shadow-[1px_2px_0px_#F1D8C3]">
              <span className="w-2 h-2 rounded-full bg-[#FFA45B] animate-pulse" />
              <span>IPv6 Readiness Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#30241F] leading-[1.15]">
              Your website works.{' '}
              <br />
              <span className="text-[#D97550] underline decoration-[#FFA45B]/60 decoration-wavy decoration-2">
                But is it IPv6-ready?
              </span>
            </h1>

            <p className="text-base sm:text-lg text-brand-secondary leading-relaxed font-medium">
              Discover hidden IPv6 connectivity gaps across your website and its dependencies. Understand the evidence, prioritize potential failures, and plan your next fix.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
              <Link
                to="/app/audits/new"
                className="px-6 py-3.5 rounded-xl bg-[#FFA45B] text-[#30241F] font-bold text-sm border-[1.5px] border-[#E9C7AA] shadow-[3px_4px_0px_#D97550] hover:bg-[#FF9642] hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Run an Audit</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/app/audits/sample"
                className="px-6 py-3.5 rounded-xl bg-white border-[1.5px] border-brand-border text-brand-heading font-bold text-sm shadow-[3px_4px_0px_#F1D8C3] hover:bg-brand-cream hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-center"
              >
                Explore Sample Report
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-brand-secondary">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-status-mintText" />
                <span>Real DNS & Socket Probes</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-status-mintText" />
                <span>Blast-Radius Prioritization</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-status-mintText" />
                <span>Zero Fabricated Data</span>
              </span>
            </div>
          </div>

          {/* Interactive Hero Cartoon Delivery Chain Visualizer */}
          <div className="lg:col-span-6">
            <div className="bg-white border-[1.5px] border-[#E9C7AA] rounded-3xl p-6 shadow-[5px_7px_0px_#E8C7AC] relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFA45B]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-secondary">
                    Delivery Chain Visualizer
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#D97550] bg-[#FFE5D0] px-2.5 py-0.5 rounded-full border border-[#FFCA9A]">
                  Interactive Preview
                </span>
              </div>

              {/* Node Graph Canvas Area */}
              <div className="h-80 w-full relative bg-[#FFFDF9] rounded-2xl border-[1.5px] border-brand-border overflow-hidden">
                {/* SVG Connections between Center Node and Perimeter Nodes */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {HERO_NODES.slice(1).map((node) => (
                    <line
                      key={node.id}
                      x1="50%"
                      y1="50%"
                      x2={`${node.x}%`}
                      y2={`${node.y}%`}
                      stroke={activeNode.id === node.id ? '#FFA45B' : '#E9C7AA'}
                      strokeWidth={activeNode.id === node.id ? '2.5' : '1.5'}
                      strokeDasharray={node.status === 'critical' ? '4 3' : 'none'}
                    />
                  ))}
                </svg>

                {/* Render Nodes with cartoon boxes */}
                {HERO_NODES.map((node) => {
                  const isSelected = activeNode.id === node.id;
                  const isMain = node.id === 'main';

                  return (
                    <button
                      key={node.id}
                      onClick={() => setActiveNode(node)}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl transition-all flex items-center justify-center ${
                        isMain
                          ? 'w-16 h-16 bg-[#FFA45B] border-2 border-[#D97550] text-[#30241F] shadow-[3px_4px_0px_#D97550] z-20 hover:scale-105'
                          : `w-11 h-11 ${node.nodeTypeBg} border-[1.5px] ${node.nodeTypeBorder} shadow-[2px_2px_0px_#E8C7AC] z-10 hover:scale-110`
                      } ${
                        isSelected && !isMain
                          ? 'ring-4 ring-[#FFA45B]/40 scale-110 shadow-[3px_4px_0px_#D97550]'
                          : ''
                      }`}
                      title={`${node.name} (${node.type})`}
                    >
                      {node.icon}
                    </button>
                  );
                })}
              </div>

              {/* Selected Node Details Cartoon Subcard */}
              <div className="mt-4 p-4 bg-brand-cream border-[1.5px] border-brand-border rounded-2xl shadow-[2px_2px_0px_#F1D8C3] flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-brand-heading">
                      {activeNode.name}
                    </span>
                    <span className="text-[11px] font-bold text-brand-secondary">
                      ({activeNode.type})
                    </span>
                  </div>
                  <p className="text-xs text-brand-secondary mt-1 leading-snug">
                    {activeNode.description}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0 border ${
                    activeNode.status === 'ready'
                      ? 'bg-status-mint text-status-mintText border-status-mintBorder'
                      : activeNode.status === 'warning'
                      ? 'bg-status-amber text-status-amberText border-status-amberBorder'
                      : 'bg-status-coral text-status-coralText border-status-coralBorder'
                  }`}
                >
                  {activeNode.status === 'ready'
                    ? 'Dual-Stack Ready'
                    : activeNode.status === 'warning'
                    ? 'No AAAA Record'
                    : 'TCP Timeout'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section with Cartoon Box Cards */}
      <section className="py-20 bg-white border-y-[1.5px] border-brand-border px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#D97550]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFA45B]" />
              <span>Full-Stack Diagnostic Capabilities</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[#30241F] tracking-tight">
              Don't just test the domain. <br />
              <span className="text-[#D97550]">Audit the entire delivery chain.</span>
            </h2>
            <p className="text-sm text-brand-secondary leading-relaxed font-medium">
              Modern websites pull dependencies from dozens of distinct hostnames. NETSCOPE gives you complete visibility across the full ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="cartoon-card-interactive p-6 space-y-3 bg-[#FFFDF9]">
              <div className="w-11 h-11 rounded-2xl bg-[#FFE5D0] border-[1.5px] border-[#FFCA9A] flex items-center justify-center text-[#D97550] shadow-[2px_2px_0px_#F1D8C3]">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-brand-heading">Dependency Intelligence</h3>
              <p className="text-xs text-brand-secondary leading-relaxed">
                Discover observable third-party resources and evaluate their IPv6 connectivity across scripts, stylesheets, and APIs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="cartoon-card-interactive p-6 space-y-3 bg-[#FFFDF9]">
              <div className="w-11 h-11 rounded-2xl bg-[#E9E1FF] border-[1.5px] border-[#D3C4FC] flex items-center justify-center text-[#5B39A8] shadow-[2px_2px_0px_#D3C4FC]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-brand-heading">Evidence-Backed Findings</h3>
              <p className="text-xs text-brand-secondary leading-relaxed">
                Understand exactly what was tested, what failed, and how confident the result is with raw DNS and TCP metrics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="cartoon-card-interactive p-6 space-y-3 bg-[#FFFDF9]">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF0B8] border-[1.5px] border-[#F6DE8A] flex items-center justify-center text-[#8A5600] shadow-[2px_2px_0px_#F6DE8A]">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-brand-heading">Impact Prioritization</h3>
              <p className="text-xs text-brand-secondary leading-relaxed">
                The Blast-Radius Engine ranks potential impact mathematically based on resource criticality, failure severity, and relevance.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="cartoon-card-interactive p-6 space-y-3 bg-[#FFFDF9]">
              <div className="w-11 h-11 rounded-2xl bg-[#DDF4E4] border-[1.5px] border-[#B8E6C4] flex items-center justify-center text-[#1C6B38] shadow-[2px_2px_0px_#B8E6C4]">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-brand-heading">What-If Remediation</h3>
              <p className="text-xs text-brand-secondary leading-relaxed">
                Explore how hypothetical fixes change readiness assessment scores before touching live production systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Credibility Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-[#30241F] tracking-tight">
            Engineered for Precision & Transparency
          </h2>
          <p className="text-sm text-brand-secondary leading-relaxed font-medium">
            NETSCOPE strictly distinguishes between separate network verification layers. We never conflate DNS resolution with end-to-end reachability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cartoon-card p-6 space-y-2.5 bg-white">
            <div className="text-[11px] font-bold text-[#D97550] uppercase tracking-wider">Layer 1: DNS AAAA</div>
            <h4 className="font-extrabold text-brand-heading text-sm">Authoritative Resolution</h4>
            <p className="text-xs text-brand-secondary leading-relaxed">
              Verifies if AAAA records are published in DNS. Having an AAAA record is necessary but not sufficient for IPv6 communication.
            </p>
          </div>

          <div className="cartoon-card p-6 space-y-2.5 bg-white">
            <div className="text-[11px] font-bold text-[#1E5385] uppercase tracking-wider">Layer 2: IPv6 TCP</div>
            <h4 className="font-extrabold text-brand-heading text-sm">Explicit Socket Handshake</h4>
            <p className="text-xs text-brand-secondary leading-relaxed">
              Opens an explicit AF_INET6 socket to the target address to measure latency and confirm firewall ingress rules allow IPv6 traffic.
            </p>
          </div>

          <div className="cartoon-card p-6 space-y-2.5 bg-white">
            <div className="text-[11px] font-bold text-[#1C6B38] uppercase tracking-wider">Layer 3: HTTPS & TLS</div>
            <h4 className="font-extrabold text-brand-heading text-sm">Certificate Chain Validation</h4>
            <p className="text-xs text-brand-secondary leading-relaxed">
              Validates that TLS certificates presented over IPv6 match hostnames and complete the handshake without certificate errors.
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            to="/app/methodology"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#D97550] hover:underline"
          >
            <span>Read complete mathematical & technical methodology</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t-[1.5px] border-brand-border bg-white py-10 px-6 shadow-[0_-2px_0px_#F1D8C3]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-brand-secondary font-medium">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-[#D97550]">NETSCOPE</span>
            <span>&copy; 2026 AIORI Hackathon. Built for technical transparency.</span>
          </div>
          <div className="flex items-center space-x-6 font-bold">
            <Link to="/app/methodology" className="hover:text-brand-heading">Methodology</Link>
            <Link to="/app/history" className="hover:text-brand-heading">Audit Archive</Link>
            <Link to="/app/settings" className="hover:text-brand-heading">Scanner Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

