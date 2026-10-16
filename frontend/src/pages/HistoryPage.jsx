/* src/pages/HistoryPage.jsx */
import React, { useState } from 'react';
import CommitList from '../components/CommitList';
import DiffPanel from '../components/DiffPanel';

export default function HistoryPage({ refreshKey }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      <section className="md:col-span-1 bg-white dark:bg-gray-800 rounded shadow p-4 overflow-auto">
        <h2 className="text-lg font-semibold mb-2 text-primary">Commit History</h2>
        <CommitList onSelect={setSelectedId} refreshKey={refreshKey} />
      </section>
      <section className="md:col-span-2 bg-white dark:bg-gray-800 rounded shadow p-4 overflow-auto">
        <h2 className="text-lg font-semibold mb-2 text-primary">Diff Viewer</h2>
        <DiffPanel commitId={selectedId} />
      </section>
    </div>
  );
}
