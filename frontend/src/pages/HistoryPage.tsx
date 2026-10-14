import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Download,
  PlusCircle,
  ArrowRight,
  Archive,
  Calendar,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { Audit } from '../types';
import { StatusPill } from '../components/UI/StatusPill';

export const HistoryPage: React.FC = () => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listAudits()
      .then(setAudits)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredAudits = audits.filter((a) => {
    const matchSearch =
      a.target_hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.target_url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="cartoon-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-black px-3 py-1 rounded-full bg-brand-peach/60 text-brand-terracotta border border-brand-peach mb-2">
            <Archive className="w-3.5 h-3.5" />
            <span>Audit History & Snapshots</span>
          </div>
          <h1 className="text-2xl font-black text-brand-heading tracking-tight">
            Audit Archive & History
          </h1>
          <p className="text-xs text-brand-secondary mt-1 max-w-2xl leading-relaxed">
            Persistent point-in-time diagnostic snapshots recorded in SQLite. Track longitudinal readiness progress across production websites and infrastructure dependencies.
          </p>
        </div>

        <Link
          to="/app/audits/new"
          className="btn-cartoon-primary inline-flex items-center space-x-2 text-xs py-2.5 px-4 self-start md:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Audit</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary" />
          <input
            type="text"
            placeholder="Search audits by hostname or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-[1.5px] border-brand-border rounded-xl text-xs font-semibold text-brand-heading placeholder-brand-secondary/60 shadow-[2px_2px_0px_#F1D8C3] focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-brand-secondary hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border-[1.5px] border-brand-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-brand-heading shadow-[2px_2px_0px_#F1D8C3] focus:outline-none focus:border-brand-orange cursor-pointer"
          >
            <option value="ALL">All Audit Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="QUEUED">Queued / Active</option>
          </select>
        </div>
      </div>

      {/* History Table Container */}
      <div className="cartoon-card bg-white overflow-hidden">
        {loading ? (
          <div className="p-14 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-brand-secondary">Loading audit history archives...</p>
          </div>
        ) : filteredAudits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-[1.5px] border-brand-border text-brand-secondary font-black bg-brand-cream/60">
                  <th className="py-3.5 px-5">Target Hostname</th>
                  <th className="py-3.5 px-4">Inspection Mode</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Readiness</th>
                  <th className="py-3.5 px-4">Findings</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/70">
                {filteredAudits.map((item) => (
                  <tr key={item.audit_id} className="hover:bg-[#FFF9F3] transition-colors">
                    <td className="py-4 px-5">
                      <Link
                        to={`/app/audits/${item.audit_id}`}
                        className="font-mono font-black text-brand-heading hover:text-brand-terracotta text-xs inline-flex items-center gap-1.5"
                      >
                        <span>{item.target_hostname}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-cream border border-brand-border text-brand-secondary">
                        {item.scan_mode}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusPill status={item.status} size="sm" />
                    </td>
                    <td className="py-4 px-4">
                      {item.readiness_score != null ? (
                        <span className="font-black text-sm text-brand-terracotta">
                          {item.readiness_score.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-brand-secondary font-bold">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-brand-heading">
                      <span className="px-2 py-0.5 rounded-full bg-brand-peach/40 text-brand-terracotta font-black text-xs">
                        {item.findings_count}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-brand-secondary text-[11px] font-medium whitespace-nowrap">
                      {new Date(item.started_at).toLocaleDateString()} {new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                      <a
                        href={api.getReportDownloadUrl(item.audit_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-brand-secondary hover:text-brand-heading p-1.5 rounded-lg hover:bg-brand-cream transition-colors"
                        title="Download JSON Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <Link
                        to={`/app/audits/${item.audit_id}`}
                        className="btn-cartoon-secondary text-[11px] px-3 py-1 font-bold inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-brand-secondary space-y-3">
            <p className="font-bold text-brand-heading text-sm">No historical audits match your filters.</p>
            <p>Try clearing your search query or trigger a fresh diagnostic scan.</p>
            <Link
              to="/app/audits/new"
              className="btn-cartoon-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold mt-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start Your First Audit</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

