/* src/pages/HistoryPage.jsx */
import React, { useState } from 'react';
import CommitList from '../components/CommitList';
import DiffPanel from '../components/DiffPanel';
import { GitBranch, Eye, Leaf } from 'lucide-react';

export default function HistoryPage({ refreshKey }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fresh_mint/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="leaf-badge">
              <Leaf className="w-3 h-3 text-leaf" />
              Growth Rings
            </span>
            <span className="text-xs text-text_secondary">VCS Timeline</span>
          </div>
          <h2 className="text-2xl font-extrabold text-deep_forest dark:text-fresh_mint mt-1">
            Timetable Commit History & Diff Inspector
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <section className="md:col-span-1 bulba-card bg-white dark:bg-gray-800 p-4 overflow-auto">
          <div className="flex items-center gap-2 mb-3 text-forest dark:text-fresh_mint font-bold text-sm border-b border-fresh_mint/40 pb-2">
            <GitBranch className="w-4 h-4 text-leaf" />
            <span>Botanical Commits</span>
          </div>
          <CommitList onSelect={setSelectedId} refreshKey={refreshKey} />
        </section>

        <section className="md:col-span-2 bulba-card bg-white dark:bg-gray-800 p-5 overflow-auto">
          <div className="flex items-center gap-2 mb-3 text-forest dark:text-fresh_mint font-bold text-sm border-b border-fresh_mint/40 pb-2">
            <Eye className="w-4 h-4 text-lagoon_teal" />
            <span>Interactive Slot Diff Inspector</span>
          </div>
          <DiffPanel commitId={selectedId} />
        </section>
      </div>
    </div>
  );
}
