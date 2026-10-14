import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { NewAuditPage } from './pages/NewAuditPage';
import { AuditDashboardPage } from './pages/AuditDashboardPage';
import { DependencyExplorerPage } from './pages/DependencyExplorerPage';
import { FindingsExplorerPage } from './pages/FindingsExplorerPage';
import { RemediationStudioPage } from './pages/RemediationStudioPage';
import { HistoryPage } from './pages/HistoryPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Application Shell */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="audits/new" element={<NewAuditPage />} />
          <Route path="audits/:auditId" element={<AuditDashboardPage />} />
          <Route path="audits/:auditId/dependencies" element={<DependencyExplorerPage />} />
          <Route path="audits/:auditId/findings" element={<FindingsExplorerPage />} />
          <Route path="audits/:auditId/remediation" element={<RemediationStudioPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="methodology" element={<MethodologyPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
