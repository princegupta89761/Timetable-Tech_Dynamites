import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ currentPage, onChangePage, activeRole, onRoleChange, children }) {
  return (
    <div className="flex h-screen bg-page_background dark:bg-gray-900 text-text_primary dark:text-gray-100 overflow-hidden font-sans">
      <Sidebar currentPage={currentPage} onChangePage={onChangePage} activeRole={activeRole} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar activeRole={activeRole} onRoleChange={onRoleChange} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
