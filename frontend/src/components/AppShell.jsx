/* src/components/AppShell.jsx */
import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ currentPage, onChangePage, children }) {
  return (
    <div className="flex h-screen bg-page_background dark:bg-gray-900 text-text_primary dark:text-gray-100">
      <Sidebar currentPage={currentPage} onChangePage={onChangePage} />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
