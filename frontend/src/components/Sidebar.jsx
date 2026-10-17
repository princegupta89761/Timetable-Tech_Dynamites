import React from 'react';
import { Home, Calendar, Settings, Database, GitBranch, Layers, Shield, Sprout, Leaf } from 'lucide-react';

const pages = [
  { id: 'role', label: 'Role Console', icon: Shield, badge: 'Active' },
  { id: 'timetable', label: 'Timetable Grid', icon: Calendar, badge: null },
  { id: 'generate', label: 'Solar Beam Solver', icon: Settings, badge: 'CP-SAT' },
  { id: 'history', label: 'Growth Log (VCS)', icon: GitBranch, badge: null },
  { id: 'data', label: 'Garden Data', icon: Database, badge: null },
  { id: 'architecture', label: 'System Blueprint', icon: Layers, badge: 'Twist 3' },
];

export default function Sidebar({ currentPage, onChangePage, activeRole }) {
  return (
    <nav className="w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-r border-fresh_mint/60 dark:border-forest/40 flex flex-col p-4 shadow-sm select-none relative overflow-hidden">
      {/* Decorative leaf vine top banner */}
      <div className="px-2 py-3 mb-4 rounded-xl bg-light_mint/80 dark:bg-forest/30 border border-fresh_mint/60 dark:border-forest/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-leaf animate-bounce" />
            <span className="text-xs uppercase tracking-wider font-extrabold text-forest dark:text-fresh_mint">
              Bulbasaur Hub
            </span>
          </div>
          <span className="text-[10px] bg-leaf text-white px-1.5 py-0.5 rounded-full font-bold">
            Twist 1
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-text_secondary dark:text-gray-300 flex items-center justify-between">
          <span>Active Role:</span>
          <strong className="capitalize text-forest dark:text-bulb_green font-bold px-1.5 py-0.5 bg-white/70 dark:bg-gray-800 rounded">
            {activeRole}
          </strong>
        </div>
      </div>

      {/* Nav List */}
      <ul className="list-none flex-1 space-y-1.5">
        {pages.map((p) => {
          const Icon = p.icon;
          const active = currentPage === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => onChangePage(p.id)}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 
                  ${
                    active
                      ? 'bg-gradient-to-r from-forest via-leaf to-bulba_teal text-white shadow-md transform translate-x-1'
                      : 'text-text_secondary dark:text-gray-300 hover:text-deep_forest dark:hover:text-white hover:bg-light_mint/70 dark:hover:bg-forest/30'
                  }
                `}
              >
                <div className="flex items-center">
                  <Icon className={`mr-2.5 h-4 w-4 ${active ? 'text-fresh_mint' : 'text-leaf'}`} />
                  <span>{p.label}</span>
                </div>
                {p.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                    active ? 'bg-white/20 text-white' : 'bg-fresh_mint/50 text-forest dark:bg-forest/60 dark:text-fresh_mint'
                  }`}>
                    {p.badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bulbasaur Nature Engine Footer Card */}
      <div className="mt-auto p-3.5 rounded-2xl bg-gradient-to-br from-light_mint via-botanical_cream to-bulba_light/50 dark:from-forest/40 dark:to-gray-800 border border-fresh_mint/80 dark:border-forest/60 text-[11px] relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-leaf text-white flex items-center justify-center text-[10px]">
            🌱
          </div>
          <span className="font-bold text-deep_forest dark:text-fresh_mint text-xs">
            Nature Engine
          </span>
        </div>
        <p className="text-[10px] text-text_secondary dark:text-gray-400 leading-tight">
          Bulbasaur botanical styling with organic constraints & leaf diffs.
        </p>
      </div>
    </nav>
  );
}
