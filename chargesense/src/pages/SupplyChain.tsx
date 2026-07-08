import { TrendingUp, TrendingDown, AlertTriangle, MapPin } from 'lucide-react';

const MOCK_COMMODITIES = [
  { name: 'Lithium (Li)', price: '162,500 CNY/T', change: '+1.56%', trend: 'up', risk: 'HIGH', riskColor: 'red', desc: 'China refining operations dominate. Geopolitical trade quotas tight.' },
  { name: 'Cobalt (Co)', price: '$33,000 / T', change: '-0.8%', trend: 'down', risk: 'MEDIUM', riskColor: 'yellow', desc: 'DRC concentration remains high. Alternative chemistry transition underway.' },
  { name: 'Nickel (Ni)', price: '$16,172 / T', change: '-1.33%', trend: 'down', risk: 'LOW', riskColor: 'green', desc: 'Indonesia production output remains steady. Supply chain inventory stable.' }
];

const MOCK_NEWS = [
  { time: '10m ago', text: 'Chile announces updated lithium resource extraction framework contracts.' },
  { time: '2h ago', text: 'DRC cobalt logistics delays reported at copper-cobalt border checkpoints.' },
  { time: '5h ago', text: 'Indonesia signs long-term nickel supply contract commitments for domestic EV battery cells.' }
];

export default function SupplyChain() {
  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
            Supply Chain Risk Tracker
          </h1>
          <p className="text-[0.65rem] text-slate-500 font-mono tracking-widest mt-1 uppercase">
            Critical Commodity Index // geopolitical alerts
          </p>
        </div>
      </div>

      {/* Grid: 3 Commodity cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_COMMODITIES.map((c, i) => (
          <div key={i} className="light-card p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[0.55rem] font-bold text-slate-400 font-mono tracking-widest uppercase">COMMODITY</span>
                <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{c.name}</h4>
              </div>
              <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded font-mono tracking-wider border ${
                c.risk === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                c.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {c.risk} RISK
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 my-2">
              <span className="text-xl font-bold text-slate-900 font-mono">{c.price}</span>
              <span className={`text-[0.65rem] font-bold font-mono flex items-center gap-0.5 ${
                c.trend === 'up' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {c.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {c.change}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-3 border-t border-slate-100 pt-3">
              {c.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Grid: Map and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Map visual (7 cols) */}
        <div className="lg:col-span-7 light-card p-5 flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-800 font-mono tracking-wider uppercase">GEOPOLITICAL RESOURCE MAP</span>
              <span className="text-[0.65rem] font-mono text-slate-400">PRODUCTION SITES</span>
            </div>

            {/* Simulated high-tech map outline */}
            <div className="relative aspect-video rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              
              <span className="text-[0.65rem] font-mono text-slate-500 uppercase tracking-widest border border-slate-200 px-3 py-2 rounded-lg bg-white shadow-sm font-bold">
                🌎 MAP NETWORK CONNECTING IN PHASE 4
              </span>

              {/* Pulsing overlay nodes representing raw mineral nodes */}
              <div className="absolute top-[30%] left-[25%] group cursor-pointer">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 relative flex">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                </span>
                <span className="absolute left-4 top-0 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[0.55rem] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  DRC (COBALT) // 72% SUPPLY
                </span>
              </div>

              <div className="absolute top-[45%] left-[78%] group cursor-pointer">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative flex">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                </span>
                <span className="absolute left-4 top-0 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[0.55rem] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  INDONESIA (NICKEL) // 37% SUPPLY
                </span>
              </div>

              <div className="absolute top-[75%] left-[32%] group cursor-pointer">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 relative flex">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                </span>
                <span className="absolute left-4 top-0 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[0.55rem] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  CHILE (LITHIUM) // 26% SUPPLY
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-4 font-mono text-[0.65rem] text-slate-500 justify-center">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-red-500" /> HIGH RISK NODE</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> SECURE RESOURCE NODE</span>
          </div>
        </div>

        {/* Right: Geopolitical risk alerts (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              RISK INTELLIGENCE ALERTS
            </h3>
            <span className="text-[0.65rem] font-mono text-slate-500">LIVE FEED</span>
          </div>

          <div className="space-y-4">
            {MOCK_NEWS.map((n, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm transition-colors hover:bg-slate-50/50 hover:border-slate-300"
              >
                <div className="p-2 bg-red-50 border border-red-100 text-red-500 rounded-lg mt-0.5">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.55rem] font-bold text-red-700 font-mono uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      RISK INDEX // ACTIVE
                    </span>
                    <span className="text-[0.65rem] font-mono text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed mt-2">
                    {n.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
