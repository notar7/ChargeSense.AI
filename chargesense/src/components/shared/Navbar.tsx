import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';

interface NavbarProps {
  collapsed: boolean;
}

export default function Navbar({ collapsed }: NavbarProps) {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

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

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return 'Fleet Intelligence Dashboard';
      case '/procurement':
        return 'AI Procurement Agent';
      case '/supply-chain':
        return 'Supply Chain Risk Network';
      case '/carbon':
        return 'Carbon Engine Tracker';
      default:
        return 'ChargeSense.AI Grid Control';
    }
  };

  return (
    <header 
      className={`fixed top-4 right-4 z-10 flex h-16 items-center justify-between px-6 rounded-2xl border border-white/5 bg-[#080C14]/75 backdrop-blur-xl shadow-xl transition-all duration-300 ${
        collapsed ? 'left-[92px]' : 'left-[276px]'
      }`}
    >
      {/* Left side: Dynamic Page Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-base font-extrabold text-white uppercase tracking-wider font-mono bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent">
          {getPageTitle(location.pathname)}
        </h2>
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
