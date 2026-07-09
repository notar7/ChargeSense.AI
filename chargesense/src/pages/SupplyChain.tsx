import { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, ShieldAlert, Cpu, Globe, LineChart, Wrench } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api, type QMSBatch } from '../services/api';

// Import Leaflet CSS styles
import 'leaflet/dist/leaflet.css';

const COMMODITY_CARDS = [
  { name: 'Lithium (Li)', price: '162,500 CNY/T', change: '+1.56%', trend: 'up', risk: 'HIGH', desc: 'China refining operations dominate. Geopolitical trade quotas tight.' },
  { name: 'Cobalt (Co)', price: '$33,000 / T', change: '-0.80%', trend: 'down', risk: 'MEDIUM', desc: 'DRC concentration remains high. Alternative chemistry transition underway.' },
  { name: 'Nickel (Ni)', price: '$16,172 / T', change: '-1.33%', trend: 'down', risk: 'LOW', desc: 'Indonesia production output remains steady. Supply chain inventory stable.' }
];

const indiaCoords: [number, number] = [20.5937, 78.9629];

// Define glowing markers to prevent broken Leaflet icon paths in Vite builds
const createCustomIcon = (risk: string) => {
  const color = risk === 'HIGH' ? '#EF4444' : risk === 'MEDIUM' ? '#F59E0B' : '#10B981';
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
        <span style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: ${color}; opacity: 0.4; transform: scale(1.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: relative; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; border: 1.5px solid white; box-shadow: 0 0 6px ${color};"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const indiaIcon = L.divIcon({
  className: 'india-leaflet-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
      <span style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: #06B6D4; opacity: 0.5; transform: scale(1.6); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="position: relative; width: 10px; height: 10px; border-radius: 50%; background-color: #0891B2; border: 2px solid white; box-shadow: 0 0 10px #06B6D4;"></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Helper sub-component to handle map animations and auto-zoom when selections change
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      animate: true,
      duration: 1.0
    });
  }, [center, zoom, map]);
  return null;
}

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState<'map' | 'qms'>('map');
  const [batches, setBatches] = useState<QMSBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<QMSBatch | null>(null);
  const [diagnosticText, setDiagnosticText] = useState<string>('');
  const [diagnosticLoading, setDiagnosticLoading] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; mineral: string; share: string; risk: string; desc: string; coords: [number, number] } | null>({
    name: 'China',
    mineral: 'Lithium & Graphite Refining',
    share: '60% Global Refining Quota',
    risk: 'HIGH',
    coords: [35.8617, 104.1954],
    desc: 'Bans on export of battery anode technologies and machinery limit local supply options.'
  });
  const [isMapCardCollapsed, setIsMapCardCollapsed] = useState<boolean>(false);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const data = await api.getQMSBatches();
      setBatches(data);
      if (data.length > 0) {
        const drifted = data.find(b => b.qa_status === 'Drifted');
        setSelectedBatch(drifted || data[0]);
      }
    } catch (err) {
      console.error('Error loading cell QMS batches:', err);
    }
  };

  const runDiagnostic = async () => {
    if (!selectedBatch) return;
    setDiagnosticLoading(true);
    setDiagnosticText('');
    try {
      const res = await api.getQMSDiagnostic({
        batch_id: selectedBatch.batch_id,
        internal_resistance_mohm: selectedBatch.internal_resistance_mohm,
        weld_consistency_pct: selectedBatch.weld_consistency_pct,
        ultrasonic_score_pct: selectedBatch.ultrasonic_score_pct
      });
      setDiagnosticText(res.diagnostic);
    } catch (err) {
      console.error('Diagnostic error:', err);
      setDiagnosticText('⚠️ **System Error**: Could not establish connection to the VoltQMS diagnostic engine. Verify backend is active.');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  useEffect(() => {
    setDiagnosticText('');
  }, [selectedBatch]);

  // Expand panel automatically when country changes
  useEffect(() => {
    if (selectedCountry) {
      setIsMapCardCollapsed(false);
    }
  }, [selectedCountry]);

  const mapNodes = [
    { name: 'Australia', mineral: 'Lithium Spodumene', share: '47% Global Supply', risk: 'LOW', coords: [-25.2744, 133.7751] as [number, number], desc: 'Secure trade treaties. Increased refining capacities in WA.' },
    { name: 'Chile', mineral: 'Lithium Brine', share: '26% Global Supply', risk: 'MEDIUM', coords: [-35.6751, -71.5430] as [number, number], desc: 'Nationalisation framework reforms under discussion. High water stress.' },
    { name: 'DRC', mineral: 'Cobalt Ore', share: '72% Global Supply', risk: 'HIGH', coords: [-4.0383, 21.7587] as [number, number], desc: 'Artisanal mining ethics audits and logistics bottlenecks at border nodes.' },
    { name: 'Indonesia', mineral: 'Class 1 Nickel', share: '37% Global Supply', risk: 'MEDIUM', coords: [-0.7893, 113.9213] as [number, number], desc: 'Export restrictions on raw ore. Smelter capacity expansion funded by Chinese consortia.' },
    { name: 'China', mineral: 'Lithium & Graphite Refining', share: '60% Global Refining Quota', risk: 'HIGH', coords: [35.8617, 104.1954] as [number, number], desc: 'Bans on export of battery anode technologies and machinery limit local supply options.' }
  ];

  const formatDiagnosticHTML = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      if (trimmed.startsWith('===') || trimmed.startsWith('---') || trimmed.startsWith('___')) {
        return <hr key={idx} className="border-slate-800 my-2" />;
      }

      if (trimmed.startsWith('###')) {
        const title = trimmed.replace(/^###\s*/, '');
        return <h4 key={idx} className="text-[0.65rem] font-bold text-cyan-400 mt-3 mb-1 uppercase tracking-wider">{title}</h4>;
      }
      if (trimmed.startsWith('##')) {
        const title = trimmed.replace(/^##\s*/, '');
        return <h3 key={idx} className="text-xs font-extrabold text-white mt-4 mb-1.5 uppercase border-b border-slate-800 pb-1 tracking-wide">{title}</h3>;
      }
      if (trimmed.startsWith('#')) {
        const title = trimmed.replace(/^#\s*/, '');
        return <h2 key={idx} className="text-sm font-black text-cyan-300 mt-5 mb-2 uppercase tracking-wide">{title}</h2>;
      }

      const isListItem = trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('+');
      const content = isListItem ? trimmed.replace(/^[\s*\-+]+/, '').trim() : trimmed;

      const parseBold = (str: string) => {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        while ((match = boldRegex.exec(str)) !== null) {
          if (match.index > lastIndex) {
            parts.push(str.substring(lastIndex, match.index));
          }
          parts.push(<strong key={match.index} className="text-white font-extrabold">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < str.length) {
          parts.push(str.substring(lastIndex));
        }
        return parts.length > 0 ? parts : str;
      };

      if (isListItem) {
        return (
          <li key={idx} className="ml-3.5 list-disc my-1 leading-relaxed text-slate-350 text-[0.62rem] font-mono">
            {parseBold(content)}
          </li>
        );
      }

      return (
        <p key={idx} className="my-1 leading-relaxed text-slate-300 text-[0.62rem] font-mono">
          {parseBold(content)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pt-4">

      {/* Grid: 3 Commodity cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COMMODITY_CARDS.map((c, i) => (
          <div key={i} className="light-card p-5 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[0.55rem] font-bold text-slate-400 font-mono tracking-widest uppercase">COMMODITY INDEX</span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{c.name}</h4>
              </div>
              <span className={`text-[0.55rem] font-bold px-2.5 py-0.5 rounded-full font-mono tracking-wider border ${
                c.risk === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                c.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {c.risk} RISK
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 my-2">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight">{c.price}</span>
              <span className={`text-[0.65rem] font-bold font-mono flex items-center gap-0.5 ${
                c.trend === 'up' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {c.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {c.change}
              </span>
            </div>

            <p className="text-[0.68rem] text-slate-500 font-semibold leading-relaxed mt-2 border-t border-slate-100 pt-2.5">
              {c.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Tab Switcher Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (8 cols): Map / SPC Chart */}
        <div className="lg:col-span-8 flex flex-col space-y-4 h-[calc(100vh-18.5rem)] min-h-[500px]">
          
          <div className="flex justify-between items-center bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'map'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Globe className="h-4 w-4" />
                Supplier Risk Network
              </button>
              <button
                onClick={() => setActiveTab('qms')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                  activeTab === 'qms'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <LineChart className="h-4 w-4" />
                Cell Manufacturing SPC
              </button>
            </div>
            <span className="text-[0.6rem] font-bold text-slate-400 font-mono tracking-widest uppercase mr-3">
              VoltTrace Integration
            </span>
          </div>

          <div className="flex-1 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
            
            {activeTab === 'map' ? (
              <div className="flex flex-col flex-grow justify-between min-h-0 space-y-4 relative h-full">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-slate-800 font-mono tracking-wider uppercase">GEOPOLITICAL RESOURCE MAP</span>
                  <span className="text-[0.65rem] font-mono text-slate-400">SUPPLIER NODES</span>
                </div>

                {/* Leaflet interactive map - takes full height */}
                <div className="relative flex-1 rounded-xl min-h-0 overflow-hidden border border-slate-250 bg-[#0B1220] h-full w-full">
                  <MapContainer
                    center={[15.0, 50.0]}
                    zoom={2}
                    minZoom={2}
                    maxZoom={6}
                    scrollWheelZoom={true}
                    className="w-full h-full z-10"
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    {/* Auto zoom and panning controller */}
                    <MapController
                      center={selectedCountry ? selectedCountry.coords : [15.0, 50.0]}
                      zoom={selectedCountry ? 4 : 2}
                    />

                    {/* Trade Route Polylines */}
                    {mapNodes.map((n, i) => (
                      <Polyline
                        key={i}
                        positions={[n.coords, indiaCoords]}
                        pathOptions={{
                          color: n.risk === 'HIGH' ? '#EF4444' : n.risk === 'MEDIUM' ? '#F59E0B' : '#10B981',
                          weight: 1.8,
                          dashArray: '5, 8',
                          opacity: 0.65
                        }}
                      />
                    ))}

                    {/* India Central HQ Hub Node */}
                    <Marker position={indiaCoords} icon={indiaIcon} />

                    {/* Supplier Nodes */}
                    {mapNodes.map((n, i) => (
                      <Marker
                        key={i}
                        position={n.coords}
                        icon={createCustomIcon(n.risk)}
                        eventHandlers={{
                          click: () => {
                            setSelectedCountry(n);
                          }
                        }}
                      />
                    ))}
                  </MapContainer>

                  {/* Leaflet Compact Sidebar Panel overlay (z-[1000] - sits at top right, leaves map fully visible and supports collapsing) */}
                  {selectedCountry && (
                    <div className="absolute top-3 right-3 w-80 bg-slate-955/95 border border-slate-800 rounded-2xl p-4 shadow-xl z-[1000] flex flex-col gap-2.5 text-gray-200 font-mono text-left select-text">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                        <span className={`text-[0.55rem] font-bold px-2.5 py-0.5 rounded-full border ${
                          selectedCountry.risk === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          selectedCountry.risk === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {selectedCountry.risk} RISK
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsMapCardCollapsed(!isMapCardCollapsed)}
                            className="text-[0.55rem] text-slate-400 hover:text-white cursor-pointer border border-slate-800 hover:border-slate-700 px-2.5 py-0.5 rounded transition-all"
                          >
                            {isMapCardCollapsed ? '▼ Expand' : '▲ Collapse'}
                          </button>
                          <button
                            onClick={() => setSelectedCountry(null)}
                            className="text-[0.55rem] text-slate-400 hover:text-white cursor-pointer border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition-all"
                          >
                            ✕ Close
                          </button>
                        </div>
                      </div>
                      
                      {!isMapCardCollapsed && (
                        <div className="space-y-2.5 animate-fade-in">
                          <div>
                            <span className="text-[0.5rem] text-slate-500 uppercase font-bold block">SUPPLIER TARGET</span>
                            <span className="font-extrabold text-white text-xs block mt-0.5">{selectedCountry.name}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-850 py-2 my-0.5">
                            <div>
                              <span className="text-[0.5rem] text-slate-500 uppercase font-bold block">MINERAL</span>
                              <span className="font-bold text-cyan-400 text-[0.62rem] mt-0.5 block truncate">{selectedCountry.mineral}</span>
                            </div>
                            <div>
                              <span className="text-[0.5rem] text-slate-500 uppercase font-bold block">GLOBAL SHARE</span>
                              <span className="font-bold text-cyan-400 text-[0.62rem] mt-0.5 block truncate">{selectedCountry.share}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[0.5rem] text-slate-500 uppercase font-bold block">RISK NARRATIVE</span>
                            <p className="text-[0.62rem] text-slate-400 mt-1 font-sans leading-relaxed">{selectedCountry.desc}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 font-mono text-[0.6rem] text-slate-500 justify-center">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> HIGH RISK NODE</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> MEDIUM RISK NODE</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> SECURE RESOURCE NODE</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-grow justify-between min-h-0 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 font-mono tracking-wider uppercase">Statistical Process Control (SPC) Quality bounds</span>
                  <span className="text-[0.65rem] font-mono text-slate-400">CELL INTERNAL RESISTANCE VARIANCE (mΩ)</span>
                </div>

                <div className="h-[180px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={batches} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="batch_id" stroke="#94A3B8" tickLine={false} fontFamily="JetBrains Mono" tickFormatter={(v) => v.split('-')[2]} />
                      <YAxis domain={[1.0, 3.2]} stroke="#94A3B8" tickLine={false} fontFamily="JetBrains Mono" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '12px' }}
                        labelStyle={{ color: '#0F172A', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
                        itemStyle={{ fontFamily: 'JetBrains Mono' }}
                      />
                      <ReferenceLine y={2.4} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'UCL (2.4)', position: 'insideTopRight', fill: '#EF4444', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                      <ReferenceLine y={1.8} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Target (1.8)', position: 'insideRight', fill: '#10B981', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                      <ReferenceLine y={1.2} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'LCL (1.2)', position: 'insideBottomRight', fill: '#EF4444', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                      <Line
                        type="monotone"
                        dataKey="internal_resistance_mohm"
                        stroke="#0F172A"
                        strokeWidth={2}
                        dot={(props) => {
                          const isDrifted = props.payload.qa_status === 'Drifted';
                          const isSelected = selectedBatch?.batch_id === props.payload.batch_id;
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={isSelected ? 7.5 : isDrifted ? 5.5 : 3.5}
                              fill={isDrifted ? '#EF4444' : isSelected ? '#3B82F6' : '#94A3B8'}
                              stroke={isDrifted || isSelected ? '#FFFFFF' : 'none'}
                              strokeWidth={isSelected ? 2.5 : 1.5}
                              className="cursor-pointer hover:scale-125 transition-all"
                              onClick={() => setSelectedBatch(props.payload)}
                            />
                          );
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-grow overflow-y-auto min-h-0 border border-slate-200 rounded-xl bg-slate-50">
                  <table className="w-full text-left font-mono text-[0.62rem] leading-normal">
                    <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 font-bold uppercase z-10">
                      <tr>
                        <th className="px-4 py-2">Batch ID</th>
                        <th className="px-4 py-2">Int. Resistance</th>
                        <th className="px-4 py-2">Weld Consistency</th>
                        <th className="px-4 py-2">QA Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batches.map((b) => (
                        <tr
                          key={b.batch_id}
                          onClick={() => setSelectedBatch(b)}
                          className={`cursor-pointer hover:bg-slate-100/50 transition-colors border-l-4 ${
                            selectedBatch?.batch_id === b.batch_id
                              ? 'bg-cyan-100/50 border-l-cyan-600 font-bold'
                              : 'border-l-transparent'
                          }`}
                        >
                          <td className="px-4 py-2.5 text-slate-900">{b.batch_id}</td>
                          <td className={`px-4 py-2.5 ${b.internal_resistance_mohm > 2.4 ? 'text-red-600 font-extrabold' : 'text-slate-700'}`}>
                            {b.internal_resistance_mohm} mΩ
                          </td>
                          <td className="px-4 py-2.5 text-slate-700">{b.weld_consistency_pct}%</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[0.55rem] font-bold ${
                              b.qa_status === 'Passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {b.qa_status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column (4 cols): AI Quality Diagnostics Widget */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-[#080C14] border border-cyan-950/40 rounded-2xl p-5 h-[calc(100vh-18.5rem)] min-h-[500px] shadow-xl text-gray-200">
          <div className="flex flex-col flex-grow min-h-0 space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-cyan-400" />
                <span className="font-bold text-white text-sm tracking-wider font-mono uppercase">VoltQMS Diagnostic</span>
              </div>
              <span className="text-[0.55rem] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Analyzer
              </span>
            </div>

            {selectedBatch ? (
              <div className="flex-grow flex flex-col min-h-0 space-y-4">
                <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl font-mono text-[0.62rem] space-y-2.5">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-500">TARGET UNIT:</span>
                    <span className="text-white font-bold">{selectedBatch.batch_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">INTERNAL RESISTANCE:</span>
                    <span className={`font-bold ${selectedBatch.internal_resistance_mohm > 2.4 ? 'text-red-400' : 'text-cyan-400'}`}>
                      {selectedBatch.internal_resistance_mohm} mΩ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">WELD CONSISTENCY:</span>
                    <span className={`font-bold ${selectedBatch.weld_consistency_pct < 95 ? 'text-red-400' : 'text-slate-350'}`}>
                      {selectedBatch.weld_consistency_pct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ULTRASONIC QA SCORE:</span>
                    <span className="text-slate-350 font-bold">{selectedBatch.ultrasonic_score_pct}%</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800 pt-2 mt-1">
                    <span className="text-slate-500">QA VERDICT:</span>
                    <span className={`px-2 py-0.5 rounded text-[0.55rem] font-bold ${
                      selectedBatch.qa_status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'
                    }`}>
                      {selectedBatch.qa_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-950/80 border border-slate-900 rounded-xl p-3.5 font-mono text-[0.62rem] space-y-2 select-text scrollbar-thin scrollbar-thumb-slate-900 animate-fade-in">
                  {diagnosticLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                      <span className="animate-spin h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full" />
                      <span className="animate-pulse">CONSULTING VoltQMS NEURAL NET...</span>
                    </div>
                  ) : diagnosticText ? (
                    <div className="space-y-1.5">
                      <div className="text-cyan-400 font-bold border-b border-slate-900 pb-1 mb-2">QMS SYSTEM CORRECTIVE DIAGNOSTIC REPORT</div>
                      {formatDiagnosticHTML(diagnosticText)}
                    </div>
                  ) : selectedBatch.qa_status === 'Passed' ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-4">
                      <ShieldAlert className="h-7 w-7 text-emerald-500 mb-2" />
                      <span>Batch quality metrics nominal. No corrective action required on assembly welding lines.</span>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-4">
                      <ShieldAlert className="h-7 w-7 text-red-400 mb-2" />
                      <span>Quality drift detected on internal resistance bounds. Request AI diagnostics calibration data.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center font-mono text-xs text-slate-500">
                NO BATCH TARGET SELECTED
              </div>
            )}

          </div>

          {/* Diagnostic Action Button */}
          {selectedBatch && selectedBatch.qa_status === 'Drifted' && !diagnosticText && (
            <button
              onClick={runDiagnostic}
              disabled={diagnosticLoading}
              className="w-full py-2.5 mt-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:cursor-not-allowed transition-all text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-950/20 animate-pulse hover:animate-none"
            >
              <Wrench className="h-4.5 w-4.5" />
              Run AI Quality Diagnostic
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
