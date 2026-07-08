import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';

interface NavbarProps {
  collapsed: boolean;
}

export default function Navbar({ collapsed }: NavbarProps) {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <header 
      className={`fixed top-4 right-4 z-10 flex h-16 items-center justify-between px-6 rounded-2xl border border-white/5 bg-[#080C14]/75 backdrop-blur-xl shadow-xl transition-all duration-300 ${
        collapsed ? 'left-[92px]' : 'left-[276px]'
      }`}
    >
      {/* Left side: Status indicators */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
            <span className="text-[0.65rem] font-bold text-cyan-400 font-mono tracking-widest uppercase">
              STATION STATUS
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-gray-600 font-mono text-xs">/</span>
            <span className="text-[0.75rem] font-bold tracking-widest text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
              NODE_ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Orbit view navigation & Clock */}
      <div className="flex items-center gap-6">
        {/* Back to Globe button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/5 bg-white/5 text-gray-300 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all cursor-pointer font-mono text-[0.7rem] font-bold uppercase tracking-wider"
        >
          <Globe className="h-4 w-4 text-cyan-400" />
          Orbit View
        </button>

        {/* Live Clock block */}
        <div className="flex items-center gap-4 bg-black/40 border border-white/5 px-4 py-1.5 rounded-xl font-mono">
          <div className="flex flex-col items-end">
            <span className="text-sm font-extrabold text-white tracking-widest">
              {formatTime(time)}
            </span>
            <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-wider">
              {formatDate(time)}
            </span>
          </div>
          <div className="w-1.5 h-6 bg-cyan-500/20 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-cyan-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </header>
  );
}
