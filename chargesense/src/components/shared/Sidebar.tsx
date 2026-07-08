import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, ShieldAlert, Leaf, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const navItems = [
    { to: '/dashboard', label: 'Fleet Intelligence', icon: LayoutDashboard },
    { to: '/procurement', label: 'AI Procurement', icon: Cpu },
    { to: '/supply-chain', label: 'Risk Network', icon: ShieldAlert },
    { to: '/carbon', label: 'Carbon Engine', icon: Leaf },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-20 flex flex-col border-r border-white/5 bg-[#080C14] shadow-2xl transition-all duration-300 ${
        collapsed ? 'w-[76px]' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <div className={`flex h-20 items-center border-b border-white/5 transition-all duration-300 ${collapsed ? 'justify-center px-0' : 'justify-start gap-3.5 px-6'}`}>
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20 shrink-0">
          <span className="text-xl font-bold text-[#05070C]">⚡</span>
          <span className="absolute -inset-1 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-20 blur-sm animate-pulse" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white uppercase font-heading bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent">
              ChargeSense
            </span>
            <span className="text-[0.65rem] font-bold text-cyan-400/80 tracking-widest font-mono uppercase">
              Grid Control (IN-01)
            </span>
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <nav className={`flex-1 space-y-2 py-8 transition-all duration-300 ${collapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex items-center transition-all duration-300 rounded-xl text-sm font-semibold tracking-wide ${
                  collapsed ? 'justify-center px-0 py-3.5' : 'gap-4 px-4 py-3.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-900/20 to-emerald-950/10 text-cyan-400 border border-cyan-500/10 shadow-[inset_0_0_12px_rgba(6,182,212,0.05)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Neon laser active line indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-gradient-to-b from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
                  )}
                  <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'}`} />
                  {!collapsed && <span className="transition-all duration-300">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-white/5 p-5 flex flex-col items-center gap-4">
        {!collapsed ? (
          <div className="w-full flex items-center gap-3 bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider font-mono">CORE STATUS</span>
              <span className="text-[0.7rem] font-semibold text-emerald-400 font-mono tracking-wider">SECURE CONNECT</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}

        {/* Circular collapse toggle button at the bottom center */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shadow-lg"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>
    </aside>
  );
}
