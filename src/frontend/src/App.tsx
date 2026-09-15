import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RiskMap } from './pages/RiskMap';
import { Fleet } from './pages/Fleet';
import { AssetDetail } from './pages/AssetDetail';
import { ActionPlan } from './pages/ActionPlan';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Branded Landing / Login */}
        <Route path="/" element={<Login />} />

        {/* Protected Operator Application Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<RiskMap />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/asset/:id" element={<AssetDetail />} />
          <Route path="/action-plan" element={<ActionPlan />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
