import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DiagnosticContainer } from '../features/diagnostics/components/DiagnosticContainer';

// Placeholder components to be moved later
const Dashboard = () => <div>Dashboard</div>;
const AdminOverview = () => <div>Admin Overview</div>;

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/diagnostics" element={<DiagnosticContainer />} />
      <Route path="/admin" element={<AdminOverview />} />
    </Routes>
  );
};
