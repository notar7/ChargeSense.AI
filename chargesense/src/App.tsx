import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/shared/DashboardLayout';
import FleetDashboard from './pages/FleetDashboard';
import ProcurementAgent from './pages/ProcurementAgent';
import SupplyChain from './pages/SupplyChain';
import CarbonTracker from './pages/CarbonTracker';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Globe Landing Entry Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard Core Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<FleetDashboard />} />
          <Route path="procurement" element={<ProcurementAgent />} />
          <Route path="supply-chain" element={<SupplyChain />} />
          <Route path="carbon" element={<CarbonTracker />} />
        </Route>

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
