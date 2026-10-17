import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ currentPage, onChangePage, activeRole, onRoleChange, children }) {
  return (
    <div className="flex h-screen bg-page_background dark:bg-gray-950 text-text_primary dark:text-gray-100 overflow-hidden font-sans">
      <Sidebar currentPage={currentPage} onChangePage={onChangePage} activeRole={activeRole} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar activeRole={activeRole} onRoleChange={onRoleChange} />
        <main className="flex-1 overflow-auto p-6 relative">
          {/* Subtle nature watermarks */}
          <div className="fixed -bottom-24 -left-24 w-96 h-96 rounded-full bg-fresh_mint/20 dark:bg-forest/10 blur-3xl pointer-events-none -z-10"></div>
          <div className="fixed -top-24 -right-24 w-96 h-96 rounded-full bg-bulba_light/30 dark:bg-bulba_dark/10 blur-3xl pointer-events-none -z-10"></div>
          {children}
        </main>
      </div>
    </div>
  );
}
