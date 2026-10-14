import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Search,
  Table as TableIcon,
  Network,
  Radio,
  Server,
  Code2,
  FileCode,
  Image as ImageIcon,
  Type,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { DependencyGraphData, ResourceNode } from '../types';
import { StatusPill } from '../components/UI/StatusPill';

// Custom Node Component for React Flow with Pastel Cartoon Box Aesthetic
const CustomResourceNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  const isMain = data.is_main_domain;
  const type = (data.resource_type || '').toUpperCase();

  // Category Pastel Accent
  const typeStyle = isMain
    ? { bg: 'bg-[#FFA45B]/20', border: 'border-[#FFA45B]', icon: <Radio className="w-3.5 h-3.5 text-[#D97550]" /> }
    : type === 'API'
    ? { bg: 'bg-[#DCEEFF]/40', border: 'border-[#BADBFC]', icon: <Cpu className="w-3.5 h-3.5 text-[#1E5385]" /> }
    : type === 'CDN'
    ? { bg: 'bg-[#FFF0B8]/40', border: 'border-[#F6DE8A]', icon: <Server className="w-3.5 h-3.5 text-[#8A5600]" /> }
    : type === 'JAVASCRIPT' || type === 'JS'
    ? { bg: 'bg-[#E9E1FF]/40', border: 'border-[#D3C4FC]', icon: <FileCode className="w-3.5 h-3.5 text-[#5B39A8]" /> }
    : type === 'IMAGE' || type === 'IMAGES'
    ? { bg: 'bg-[#DDF4E4]/40', border: 'border-[#B8E6C4]', icon: <ImageIcon className="w-3.5 h-3.5 text-[#1C6B38]" /> }
    : type === 'FONT' || type === 'FONTS'
    ? { bg: 'bg-[#FFF3E5]/50', border: 'border-[#F0DCCB]', icon: <Type className="w-3.5 h-3.5 text-[#76665E]" /> }
    : { bg: 'bg-[#FFF5EC]/40', border: 'border-[#E9C7AA]', icon: <Layers className="w-3.5 h-3.5 text-[#76665E]" /> };

  const isSuccess = data.ipv6_status === 'CONNECTED' || data.dns_status === 'AAAA_FOUND';
  const isWarning = data.dns_status === 'NO_AAAA' || data.ipv6_status === 'REFUSED';

  return (
    <div
      className={`px-3.5 py-2.5 rounded-2xl border-[1.5px] bg-white text-left transition-all min-w-[170px] max-w-[230px] shadow-[2px_3px_0px_#F1D8C3] relative ${typeStyle.border} ${typeStyle.bg} ${
        selected ? 'ring-3 ring-[#FFA45B] shadow-[3px_5px_0px_#D97550] -translate-y-0.5' : 'hover:-translate-y-0.5'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-[#FFA45B] !border-2 !border-white rounded-full shadow-[1px_1px_0px_#D97550]"
      />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5">
          {typeStyle.icon}
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-secondary">
            {isMain ? 'Origin Domain' : data.resource_type}
          </span>
        </div>
        <span
          className={`w-2 h-2 rounded-full border ${
            isSuccess
              ? 'bg-status-mintText border-[#1C6B38]'
              : isWarning
              ? 'bg-status-amberText border-[#8A5600]'
              : 'bg-status-coralText border-[#A82E1E]'
          }`}
        />
      </div>
      <div className="font-mono text-xs font-extrabold text-brand-heading truncate" title={data.hostname}>
        {data.hostname}
      </div>
      <div className="text-[10px] text-brand-secondary mt-0.5 font-medium truncate flex items-center space-x-1">
        <span>{data.dns_status}</span>
        <span>&bull;</span>
        <span className={isSuccess ? 'text-status-mintText font-bold' : 'text-brand-secondary'}>
          {data.ipv6_status}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-[#FFA45B] !border-2 !border-white rounded-full shadow-[1px_1px_0px_#D97550]"
      />
    </div>
  );
};

const nodeTypes = {
  customResource: CustomResourceNode,
};

export const DependencyExplorerPage: React.FC = () => {
  const { auditId = 'sample' } = useParams();
  const [graphData, setGraphData] = useState<DependencyGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<ResourceNode | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    api
      .getDependencyGraph(auditId)
      .then((data: DependencyGraphData) => {
        setGraphData(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auditId]);

  // Layout nodes radially / hierarchical around main domain
  useEffect(() => {
    if (!graphData) return;

    const mainNode = graphData.nodes.find((n: ResourceNode) => n.is_main_domain) || graphData.nodes[0];
    const depNodes = graphData.nodes.filter((n: ResourceNode) => n.resource_id !== mainNode?.resource_id);

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Center Origin Node
    if (mainNode) {
      flowNodes.push({
        id: mainNode.resource_id,
        type: 'customResource',
        position: { x: 380, y: 240 },
        data: mainNode as any,
      });
    }

    // Surround with dependency nodes in circular layout
    const radius = 270;
    const totalDeps = depNodes.length;

    depNodes.forEach((node: ResourceNode, idx: number) => {
      const angle = (idx / Math.max(1, totalDeps)) * 2 * Math.PI;
      const x = 380 + radius * Math.cos(angle);
      const y = 240 + radius * Math.sin(angle);

      flowNodes.push({
        id: node.resource_id,
        type: 'customResource',
        position: { x, y },
        data: node as any,
      });
    });

    // Edges with warm tangerine stroke and clean arrowheads
    graphData.edges.forEach((edge: any) => {
      flowEdges.push({
        id: edge.edge_id,
        source: edge.source_resource_id,
        target: edge.target_resource_id,
        animated: true,
        style: { stroke: '#FFA45B', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#FFA45B',
          width: 14,
          height: 14,
        },
      });
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [graphData]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.data) {
      setSelectedNode(node.data as unknown as ResourceNode);
    }
  }, []);

  // Filtered resources for table and search
  const filteredResources = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.filter((res: ResourceNode) => {
      const matchSearch = res.hostname.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'ALL' || res.resource_type.toUpperCase() === filterType.toUpperCase();
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'READY' && (res.dns_status === 'AAAA_FOUND' || res.ipv6_status === 'CONNECTED')) ||
        (filterStatus === 'NO_AAAA' && res.dns_status === 'NO_AAAA') ||
        (filterStatus === 'FAILED' && res.ipv6_status === 'TIMEOUT');
      return matchSearch && matchType && matchStatus;
    });
  }, [graphData, searchQuery, filterType, filterStatus]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[#FFA45B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-brand-secondary">Mapping dependency delivery graph...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="cartoon-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D97550] bg-[#FFE5D0] px-2.5 py-0.5 rounded-full border border-[#FFCA9A] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Map</span>
          </div>
          <h1 className="text-xl font-extrabold text-brand-heading tracking-tight mt-0.5">
            Delivery Chain Dependency Graph
          </h1>
          <p className="text-xs text-brand-secondary font-medium mt-0.5">
            Trace observed third-party scripts, stylesheets, fonts, and API services affecting website IPv6 reachability.
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'graph'
                ? 'bg-[#FFA45B] text-[#30241F] border-[1.5px] border-[#E9C7AA] shadow-[2px_2px_0px_#D97550]'
                : 'bg-white text-brand-secondary border-[1.5px] border-brand-border hover:bg-brand-cream'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Graph</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-[#FFA45B] text-[#30241F] border-[1.5px] border-[#E9C7AA] shadow-[2px_2px_0px_#D97550]'
                : 'bg-white text-brand-secondary border-[1.5px] border-brand-border hover:bg-brand-cream'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by hostname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-[1.5px] border-brand-border rounded-xl text-xs font-medium text-brand-heading placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-[#FFA45B]/30 focus:border-[#FFA45B] shadow-[2px_2px_0px_#F1D8C3]"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border-[1.5px] border-brand-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-brand-heading focus:outline-none shadow-[2px_2px_0px_#F1D8C3]"
        >
          <option value="ALL">All Resource Types</option>
          <option value="JAVASCRIPT">JavaScript</option>
          <option value="CSS">CSS Stylesheets</option>
          <option value="API">API Services</option>
          <option value="IMAGE">Images</option>
          <option value="FONT">Fonts</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border-[1.5px] border-brand-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-brand-heading focus:outline-none shadow-[2px_2px_0px_#F1D8C3]"
        >
          <option value="ALL">All Statuses</option>
          <option value="READY">IPv6 Ready (AAAA)</option>
          <option value="NO_AAAA">IPv4 Only (No AAAA)</option>
          <option value="FAILED">Timeout / Failed</option>
        </select>
      </div>

      {/* Main Graph & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Graph or Table Canvas */}
        <div className="lg:col-span-8 cartoon-card overflow-hidden min-h-[580px] flex flex-col bg-white">
          {viewMode === 'graph' ? (
            <div className="h-[580px] w-full relative bg-[#FFFDF9]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background color="#F0DCCB" gap={20} size={1.5} />
                <Controls className="bg-white border-[1.5px] border-brand-border shadow-[2px_2px_0px_#F1D8C3] rounded-xl overflow-hidden" />
                <MiniMap
                  className="bg-brand-cream border-[1.5px] border-brand-border rounded-2xl shadow-[2px_2px_0px_#F1D8C3] overflow-hidden"
                  nodeColor={(n: any) =>
                    n.data?.ipv6_status === 'CONNECTED' ? '#1C6B38' : '#8A5600'
                  }
                />
              </ReactFlow>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-[1.5px] border-brand-border text-brand-secondary font-bold bg-brand-cream/60">
                    <th className="py-3 px-3.5 rounded-l-xl">Hostname</th>
                    <th className="py-3 px-3.5">Type</th>
                    <th className="py-3 px-3.5">DNS Status</th>
                    <th className="py-3 px-3.5">IPv6 TCP</th>
                    <th className="py-3 px-3.5 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredResources.map((res: ResourceNode) => (
                    <tr
                      key={res.resource_id}
                      onClick={() => setSelectedNode(res)}
                      className="hover:bg-brand-cream/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-brand-heading">
                        {res.hostname}
                      </td>
                      <td className="py-3 px-3.5 uppercase text-[10px] text-brand-secondary font-bold">
                        {res.resource_type}
                      </td>
                      <td className="py-3 px-3.5">
                        <StatusPill status={res.dns_status} size="sm" />
                      </td>
                      <td className="py-3 px-3.5">
                        <StatusPill status={res.ipv6_status} size="sm" />
                      </td>
                      <td className="py-3 px-3.5 text-right text-[#D97550] font-bold hover:underline">
                        View Evidence
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Node Details Inspector */}
        <div className="lg:col-span-4 cartoon-card p-5 flex flex-col justify-between space-y-4 bg-white">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-[1.5px] border-brand-border">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-secondary">
                  Diagnostic Inspector
                </span>
                <StatusPill status={selectedNode.severity} size="sm" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-brand-heading break-all font-mono">
                  {selectedNode.hostname}
                </h3>
                <div className="text-xs text-brand-secondary mt-1 font-medium">
                  Type: <b className="text-brand-heading uppercase">{selectedNode.resource_type}</b> | Method: {selectedNode.discovery_method}
                </div>
              </div>

              {/* Observed Technical Records */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-brand-cream border-[1.5px] border-brand-border shadow-[1px_1px_0px_#F1D8C3]">
                  <span className="font-extrabold text-brand-heading block mb-1.5 text-xs">
                    Authoritative DNS Records:
                  </span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div>
                      <span className="text-brand-secondary font-bold">A (IPv4): </span>
                      {selectedNode.a_records.length > 0 ? (
                        <code className="text-brand-heading bg-white px-1.5 py-0.5 rounded border border-brand-border">
                          {selectedNode.a_records.join(', ')}
                        </code>
                      ) : (
                        <span className="text-brand-muted">None</span>
                      )}
                    </div>
                    <div>
                      <span className="text-brand-secondary font-bold">AAAA (IPv6): </span>
                      {selectedNode.aaaa_records.length > 0 ? (
                        <code className="text-[#D97550] font-bold bg-white px-1.5 py-0.5 rounded border border-[#FFCA9A]">
                          {selectedNode.aaaa_records.join(', ')}
                        </code>
                      ) : (
                        <span className="text-status-amberText font-bold bg-[#FFF0B8] px-1.5 py-0.5 rounded">
                          No AAAA record published
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-cream border-[1.5px] border-brand-border shadow-[1px_1px_0px_#F1D8C3] space-y-2">
                  <span className="font-extrabold text-brand-heading block text-xs">
                    IPv6 Connectivity Test:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-secondary font-medium">Result:</span>
                    <StatusPill status={selectedNode.ipv6_status} size="sm" />
                  </div>
                  {selectedNode.impact_score !== undefined && (
                    <div className="flex items-center justify-between pt-1 border-t border-brand-border">
                      <span className="text-brand-secondary font-medium">Blast-Radius Impact:</span>
                      <span className="font-extrabold text-[#D97550] text-sm">
                        {selectedNode.impact_score.toFixed(1)} / 100
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-brand-secondary leading-relaxed p-3 bg-[#FFFDF9] rounded-xl border border-brand-border font-medium">
                  <b className="text-brand-heading">Methodology Note:</b> This dependency was extracted from page assets. Observations reflect responses from public authoritative DNS resolvers at scan time.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-brand-secondary text-xs font-medium">
              Select a node on the graph or table to view detailed technical diagnostic evidence.
            </div>
          )}

          <div className="pt-3 text-[11px] text-brand-secondary border-t-[1.5px] border-brand-border font-medium flex items-center justify-between">
            <span>Observed delivery chain:</span>
            <b className="text-brand-heading">{graphData?.total_resources ?? 0} resources</b>
          </div>
        </div>
      </div>
    </div>
  );
};

