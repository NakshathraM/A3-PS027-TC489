import React from 'react';
import { BookOpen, ShieldCheck, CheckCircle2, Globe, Cpu, Lock, Network, Award } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header Banner */}
      <div className="cartoon-card p-6 md:p-8 bg-white space-y-3">
        <div className="inline-flex items-center space-x-1.5 text-xs font-black px-3 py-1 rounded-full bg-brand-peach/60 text-brand-terracotta border border-brand-peach">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Diagnostic Standards & Mathematical Rules</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-heading tracking-tight">
          NETSCOPE Assessment Methodology
        </h1>
        <p className="text-xs sm:text-sm text-brand-secondary leading-relaxed">
          Technical specifications explaining how NETSCOPE gathers empirical network evidence, classifies failure severity, calculates readiness, and prioritizes remediation across multi-party web architectures.
        </p>
      </div>

      {/* Layer-by-layer breakdown */}
      <div className="space-y-6">
        {/* Layer 1: DNS */}
        <div className="cartoon-card p-6 bg-white space-y-3">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-xl bg-brand-peach text-brand-terracotta flex items-center justify-center text-sm font-black border border-brand-border shadow-[1px_2px_0px_#E9C7AA]">
              1
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-terracotta block">Layer 1: Authoritative Naming</span>
              <h2 className="text-base font-black text-brand-heading">
                DNS Resolution (A vs AAAA Records)
              </h2>
            </div>
          </div>
          <p className="text-xs text-brand-secondary leading-relaxed">
            The DNS engine inspects both <strong className="text-brand-heading">A (IPv4)</strong> and <strong className="text-brand-heading">AAAA (IPv6)</strong> records using dnspython across public recursive resolvers. The presence of an AAAA record confirms that an authoritative nameserver advertises an IPv6 address for the domain. However, an AAAA record alone does not prove that network routing works, nor does its absence imply that a website is broken. If no AAAA record is returned, IPv6-only clients cannot establish direct IP connectivity and must traverse transition gateways (e.g. NAT64/DNS64).
          </p>
        </div>

        {/* Layer 2: IPv6 TCP */}
        <div className="cartoon-card p-6 bg-white space-y-3">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-xl bg-status-sky text-brand-heading flex items-center justify-center text-sm font-black border border-[#BFDFFF] shadow-[1px_2px_0px_#BFDFFF]">
              2
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2A5288] block">Layer 2: Transport & Routing</span>
              <h2 className="text-base font-black text-brand-heading">
                Scanner Route Detection & IPv6 Socket Connectivity
              </h2>
            </div>
          </div>
          <p className="text-xs text-brand-secondary leading-relaxed">
            Before auditing external hosts, NETSCOPE verifies whether the scanning environment itself possesses working outbound public IPv6 routing by probing a controlled endpoint (Google Public IPv6 DNS <code className="font-mono font-bold text-brand-heading bg-brand-cream px-1.5 py-0.5 rounded border border-brand-border">2001:4860:4860::8888</code>). For target domains, the engine explicitly binds to <code className="font-mono font-bold text-brand-heading bg-brand-cream px-1.5 py-0.5 rounded border border-brand-border">socket.AF_INET6</code> to test destination port 443 with bounded timeouts. If the scanner environment lacks an IPv6 route, target tests are classified as <strong className="text-brand-terracotta">INCONCLUSIVE</strong> to prevent false failure attributions.
          </p>
        </div>

        {/* Layer 3: HTTPS & TLS */}
        <div className="cartoon-card p-6 bg-white space-y-3">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-xl bg-status-mint text-[#1E5631] flex items-center justify-center text-sm font-black border border-[#A6E8BA] shadow-[1px_2px_0px_#A6E8BA]">
              3
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1E5631] block">Layer 3: Cryptography & Identity</span>
              <h2 className="text-base font-black text-brand-heading">
                HTTPS Handshake & TLS Certificate Verification
              </h2>
            </div>
          </div>
          <p className="text-xs text-brand-secondary leading-relaxed">
            A successful TCP connection over IPv6 does not guarantee that web traffic functions correctly. NETSCOPE conducts a strict TLS handshake over the IPv6 socket using standard Python SSL contexts without disabling certificate validation. This confirms that the server's TLS certificate includes the target domain in its Subject Alternative Name (SAN) and is correctly bound to the IPv6 virtual host without cipher mismatches.
          </p>
        </div>

        {/* Layer 4: Blast-Radius Prioritization */}
        <div className="cartoon-card p-6 bg-white space-y-4">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-xl bg-brand-yellow text-brand-heading flex items-center justify-center text-sm font-black border border-[#F0D680] shadow-[1px_2px_0px_#F0D680]">
              4
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7A5B00] block">Layer 4: Mathematical Impact</span>
              <h2 className="text-base font-black text-brand-heading">
                Dependency Blast-Radius Prioritization Model
              </h2>
            </div>
          </div>
          <p className="text-xs text-brand-secondary leading-relaxed">
            The Blast-Radius Engine ranks technical findings using a deterministic formula combining resource criticality, failure severity, page relevance, and evidence strength:
          </p>

          <div className="p-4 rounded-xl bg-brand-cream border-[1.5px] border-brand-border font-mono text-xs text-brand-heading shadow-[2px_2px_0px_#F1D8C3] overflow-x-auto font-bold">
            Impact Score = 0.35 &times; Resource Criticality + 0.30 &times; Failure Severity + 0.20 &times; Page Relevance + 0.15 &times; Evidence Strength
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="cartoon-card p-3 bg-white space-y-1">
              <span className="text-brand-secondary text-[11px] font-bold block">0 – 24</span>
              <span className="font-black text-brand-heading">Informational</span>
            </div>
            <div className="cartoon-card p-3 bg-white space-y-1">
              <span className="text-brand-secondary text-[11px] font-bold block">25 – 49</span>
              <span className="font-black text-brand-heading">Low Potential Impact</span>
            </div>
            <div className="cartoon-card p-3 bg-status-amber/40 border-status-amber border space-y-1">
              <span className="text-[#7A5B00] text-[11px] font-bold block">50 – 74</span>
              <span className="font-black text-status-amberText">Moderate Impact</span>
            </div>
            <div className="cartoon-card p-3 bg-status-coral/40 border-status-coral border space-y-1">
              <span className="text-[#8B2020] text-[11px] font-bold block">75 – 100</span>
              <span className="font-black text-status-coralText">High Potential Impact</span>
            </div>
          </div>
        </div>

        {/* Layer 5: Readiness, Coverage, and Confidence */}
        <div className="cartoon-card p-6 bg-white space-y-4">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-xl bg-brand-lavender text-brand-heading flex items-center justify-center text-sm font-black border border-[#D5C6F5] shadow-[1px_2px_0px_#D5C6F5]">
              5
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5A3896] block">Layer 5: Diagnostic Integrity</span>
              <h2 className="text-base font-black text-brand-heading">
                Separation of Readiness, Coverage, and Confidence
              </h2>
            </div>
          </div>
          <div className="space-y-3 text-xs text-brand-secondary leading-relaxed">
            <p>
              <strong className="text-brand-heading">Observed Readiness Score (0-100%): </strong>
              Weighted diagnostic composite measuring DNS (15%), Main IPv6 Connectivity (25%), HTTPS/TLS (20%), Dependency Connectivity (25%), and Protocol Checks (15%).
            </p>
            <p>
              <strong className="text-brand-heading">Audit Coverage (%): </strong>
              Defined mathematically as <code className="font-mono font-bold text-brand-heading bg-brand-cream px-1.5 py-0.5 rounded border border-brand-border">(Tested Items / Discovered Items) &times; 100</code>. Represents the verified scope of observable assets on the audited page.
            </p>
            <p>
              <strong className="text-brand-heading">Evidence Confidence: </strong>
              Reflects empirical verification rigor (HIGH, MODERATE, LOW, INCONCLUSIVE) based on probe completion and scanner environment capability.
            </p>
          </div>
        </div>

        {/* Limitations & Responsible Scanning */}
        <div className="cartoon-card p-6 bg-white space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-status-mintText" />
            <h2 className="text-base font-black text-brand-heading">
              Limitations & Responsible Scanning
            </h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-xs text-brand-secondary leading-relaxed">
            <li>NETSCOPE performs non-intrusive, read-only network queries against publicly accessible endpoints.</li>
            <li>Dynamic dependencies rendered only after user authentication are not automatically audited.</li>
            <li>DNS resolution may vary across geographic regions due to anycast routing and split-horizon configurations.</li>
            <li>Audit results represent snapshot diagnostics and do not constitute a legal or compliance certification.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

