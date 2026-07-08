import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen bg-[#05070C] text-gray-200 overflow-hidden font-heading">
      {/* Floating Sidebar (fixed left, dark theme) */}
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      {/* Main Content Area Container (Right-side light panel) */}
      <div 
        className={`transition-all duration-300 h-screen flex flex-col ${
          collapsed ? 'pl-[76px]' : 'pl-[260px]'
        }`}
      >
        {/* Light theme background container that fills the right side to touch the sidebar */}
        <div className="flex-1 light-content-bg h-screen relative z-0 flex flex-col overflow-hidden">
          {/* Floating Navbar */}
          <Navbar collapsed={collapsed} />

          {/* Main content scroll container - starts below navbar with internal padding */}
          <main className="mt-[96px] mb-4 flex-1 overflow-y-auto pl-4 pr-4">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, cubicBezier: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
