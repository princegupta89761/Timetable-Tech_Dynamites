import React from 'react';
import { Home, Calendar, Settings, Database, GitBranch, Layers, Shield } from 'lucide-react';

const pages = [
  { id: 'role', label: 'Role Console', icon: Shield },
  { id: 'timetable', label: 'Timetable Grid', icon: Calendar },
  { id: 'generate', label: 'Solver Generator', icon: Settings },
  { id: 'history', label: 'VCS Commit History', icon: GitBranch },
  { id: 'data', label: 'Problem Data', icon: Database },
  { id: 'architecture', label: 'System Architecture', icon: Layers },
];

export default function Sidebar({ currentPage, onChangePage, activeRole }) {
  return (
    <nav className="w-64 bg-white dark:bg-gray-800 border-r border-fresh_mint/60 flex flex-col p-4 shadow-sm select-none">
      <div className="px-2 py-3 mb-4 border-b border-fresh_mint/40">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-leaf animate-pulse"></div>
          <span className="text-xs uppercase tracking-wider font-bold text-forest dark:text-fresh_mint">
            CampusWeave
          </span>
        </div>
        <div className="mt-1 text-[11px] text-text_secondary">
          Active Workspace: <strong className="capitalize text-deep_forest dark:text-white">{activeRole}</strong>
        </div>
      </div>

      <ul className="list-none flex-1 space-y-1.5">
        {pages.map((p) => {
          const Icon = p.icon;
          const active = currentPage === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => onChangePage(p.id)}
                className={`flex items-center w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 
                  ${
                    active
                      ? 'bg-gradient-to-r from-forest to-leaf text-white shadow-md'
                      : 'text-text_secondary hover:text-deep_forest hover:bg-light_mint dark:hover:bg-gray-700/60'
                  }
                `}
              >
                <Icon className={`mr-2.5 h-4 w-4 ${active ? 'text-fresh_mint' : 'text-leaf'}`} />
                {p.label}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer Info Badge */}
      <div className="mt-auto p-3 rounded-xl bg-botanical_cream/80 dark:bg-gray-700/50 border border-fresh_mint/60 text-[11px] text-text_secondary">
        <div className="font-semibold text-deep_forest dark:text-gray-200">Indigo Tech Fest 2026</div>
        <div className="text-[10px] text-forest dark:text-fresh_mint mt-0.5">Round 2: The Twist (Bulbasaur)</div>
      </div>
    </nav>
  );
}
