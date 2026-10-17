import React, { useState } from 'react';
import AppShell from './components/AppShell';
import HistoryPage from './pages/HistoryPage';
import TimetablePage from './pages/TimetablePage';
import GeneratePage from './pages/GeneratePage';
import DataManagementPage from './pages/DataManagementPage';
import ArchitecturePage from './pages/ArchitecturePage';
import RoleDashboardPage from './pages/RoleDashboardPage';
import ChatBot from './components/ChatBot';
import './i18n';

function App() {
  const [page, setPage] = useState('role');
  const [activeRole, setActiveRole] = useState('admin');
  const [commitRefreshKey, setCommitRefreshKey] = useState(0);

  const notifyCommitCreated = () => setCommitRefreshKey((key) => key + 1);

  const renderPage = () => {
    switch (page) {
      case 'role':
        return <RoleDashboardPage role={activeRole} onNavigate={setPage} />;
      case 'history':
        return <HistoryPage refreshKey={commitRefreshKey} />;
      case 'timetable':
        return <TimetablePage />;
      case 'generate':
        return <GeneratePage onCommitCreated={notifyCommitCreated} />;
      case 'data':
        return <DataManagementPage />;
      case 'architecture':
        return <ArchitecturePage />;
      default:
        return <RoleDashboardPage role={activeRole} onNavigate={setPage} />;
    }
  };

  return (
    <AppShell
      currentPage={page}
      onChangePage={setPage}
      activeRole={activeRole}
      onRoleChange={setActiveRole}
    >
      {renderPage()}
      {/* Twist 2: Multilingual AI Chatbot Assistant available on all pages */}
      <ChatBot activeRole={activeRole} onNavigate={setPage} />
    </AppShell>
  );
}

export default App;
