import React from 'react';

interface StatusPillProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'sm' }) => {
  const s = status.toUpperCase();
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  // Success / High / Capable / Connected
  if (
    s === 'CONNECTED' ||
    s === 'SUCCESS' ||
    s === 'AAAA_FOUND' ||
    s === 'AAAA_OBSERVED' ||
    s === 'CAPABLE' ||
    s === 'COMPLETED' ||
    s === 'HIGH' ||
    s === 'DUAL-STACK READY'
  ) {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-status-mint text-status-mintText border border-status-mintBorder shadow-[1px_1px_0px_#B8E6C4] ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-status-mintText mr-1.5" />
        {status}
      </span>
    );
  }

  // Warning / Moderate / Low / Informational / Refused
  if (s === 'WARNING' || s === 'MODERATE' || s === 'LOW' || s === 'CERT_ERROR' || s === 'REFUSED') {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-status-amber text-status-amberText border border-status-amberBorder shadow-[1px_1px_0px_#F6DE8A] ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-status-amberText mr-1.5" />
        {status}
      </span>
    );
  }

  // Critical / Failed / Timeout / No AAAA
  if (
    s === 'CRITICAL' ||
    s === 'FAILED' ||
    s === 'TIMEOUT' ||
    s === 'NO_AAAA' ||
    s === 'NO_AAAA_OBSERVED' ||
    s === 'UNAVAILABLE' ||
    s === 'SSRF_BLOCKED'
  ) {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-status-coral text-status-coralText border border-status-coralBorder shadow-[1px_1px_0px_#F7B8AC] ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-status-coralText mr-1.5" />
        {status}
      </span>
    );
  }

  // Informational / DNS / HTTP
  if (s === 'INFO' || s === 'INFORMATIONAL') {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-status-sky text-status-skyText border border-status-skyBorder shadow-[1px_1px_0px_#BADBFC] ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-status-skyText mr-1.5" />
        {status}
      </span>
    );
  }

  // Inconclusive / Neutral / Queued
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-brand-cream text-brand-secondary border border-brand-border shadow-[1px_1px_0px_#F1D8C3] ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-brand-muted mr-1.5" />
      {status}
    </span>
  );
};

