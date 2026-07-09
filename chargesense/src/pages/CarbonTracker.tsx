import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Leaf, Zap, Award, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

const MOCK_CARBON_DATA = [
  { class: 'Light Cargo', saved: 320, target: 450 },
  { class: 'Mid Cargo', saved: 480, target: 600 },
  { class: 'Heavy Cargo', saved: 280, target: 350 },
  { class: 'Staff Buses', saved: 167.3, target: 200 }
];

export default function CarbonTracker() {
  const [carbonSaved, setCarbonSaved] = useState<number>(0);
  const [tonnesToday, setTonnesToday] = useState<number>(0);
  const [targetProgress, setTargetProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let intervalId: any;

    const fetchInitialData = async () => {
      try {
        const data = await api.getCarbonSavings();
        setCarbonSaved(data.co2_saved_tonnes);
        setTonnesToday(data.tonnes_today);
        setTargetProgress(data.target_progress_pct);
        setLoading(false);

        // Smooth sub-second rolling count (increments 10 times a second)
        const step = 0.00405 / 10;
        intervalId = setInterval(() => {
          setCarbonSaved(prev => prev + step);
        }, 100);
      } catch (err) {
        console.error('Failed to load carbon savings data:', err);
        setCarbonSaved(1247.34);
        setTonnesToday(350);
        setTargetProgress(34.6);
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pt-4">

      {/* Grid: 3 Stats Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Giant live ticker card */}
        <div className="md:col-span-2 light-card p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div>
            <span className="text-[0.6rem] font-bold text-slate-500 font-mono tracking-widest uppercase block mb-1">REAL-TIME CO₂ EMISSIONS OFFSET</span>
            <div className="flex items-baseline gap-3 mt-1">
              {loading ? (
                <span className="text-4xl md:text-5xl font-black text-slate-300 font-mono animate-pulse">
                  0000.0000
                </span>
              ) : (
                <span className="text-4xl md:text-5xl font-black text-slate-900 font-mono tracking-widest">
                  {carbonSaved.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </span>
              )}
              <span className="text-sm font-extrabold text-emerald-600 font-mono uppercase bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                TONNES CO₂
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 mt-6 font-mono text-[0.65rem] text-slate-500">
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-emerald-500" /> DIESEL DISPLACED: 465,400 L</span>
            <span className="flex items-center gap-1.5"><Leaf className="h-4 w-4 text-emerald-500" /> EQUIVALENT TREES: 20,620</span>
          </div>
        </div>

        {/* Impact Level card */}
        <div className="light-card p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div>
            <span className="text-[0.6rem] font-bold text-slate-500 font-mono tracking-widest uppercase block mb-1">ACCELERATION STATUS</span>
            <h3 className="text-base font-bold text-slate-900 mt-2 font-mono uppercase">
              {loading ? 'Level -- ...' : `Level 04 - ${targetProgress}% Net Zero`}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">
              Replacement rate is offsetting carbon {loading ? '--' : '18'}% faster than regional benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl mt-4">
            <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[0.55rem] font-bold text-slate-400 font-mono block">BENCHMARK RATIO</span>
              <span className="text-xs font-bold text-emerald-600 font-mono uppercase">Class A Leader</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Bar Chart & actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Bar chart of emissions saved (8 cols) */}
        <div className="lg:col-span-8 light-card p-5 flex flex-col justify-between min-h-[320px] shadow-sm">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-bold text-slate-800 font-mono tracking-wider uppercase">CO₂ EMISSIONS SAVED BY CLASS</span>
              <span className="text-[0.65rem] font-mono text-slate-400">SAVED VS TARGET (TONNES)</span>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-[200px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CARBON_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="class" stroke="#94A3B8" tickLine={false} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#94A3B8" tickLine={false} fontFamily="JetBrains Mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '8px' }}
                    labelStyle={{ color: '#0F172A', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10B981', fontFamily: 'JetBrains Mono' }}
                  />
                  <Bar dataKey="saved" fill="#10B981" radius={[4, 4, 0, 0]} name="Saved CO₂" />
                  <Bar dataKey="target" fill="rgba(15,23,42,0.04)" radius={[4, 4, 0, 0]} name="Target CO₂" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-center">
            <span className="text-[0.55rem] text-slate-400 font-mono tracking-wider uppercase">
              *Calculation based on diesel carbon metrics (Emissions Offset Today: {tonnesToday} tonnes)
            </span>
          </div>
        </div>

        {/* Right: Action Checklist (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              TARGET ACTIONS
            </h3>
            <span className="text-[0.65rem] font-mono text-slate-500">4 AUDITS DONE</span>
          </div>

          <div className="space-y-3.5 flex-1">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs font-mono uppercase">MUMBAI WAREHOUSE</h4>
                <p className="text-[0.6rem] text-emerald-600 font-bold uppercase mt-1">100% ELECTRIFIED</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="p-2 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-lg">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs font-mono uppercase">PUNE LOGISTICS</h4>
                <p className="text-[0.6rem] text-cyan-600 font-bold uppercase mt-1">64% TRANSITION RATE</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
              <div className="p-2 bg-red-50 border border-red-100 text-red-500 rounded-lg">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs font-mono uppercase">DELHI BULK FEED</h4>
                <p className="text-[0.6rem] text-red-500 font-bold uppercase mt-1">12% INITIATED</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
