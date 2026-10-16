/* src/components/Sidebar.jsx */
import React from 'react';
import { Home, Calendar, Settings, Database } from 'lucide-react';

const pages = [
  { id: 'history', label: 'History', icon: Home },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'generate', label: 'Generate', icon: Settings },
  { id: 'data', label: 'Data', icon: Database },
];

export default function Sidebar({ currentPage, onChangePage }) {
  return (
    <nav className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col p-4">
      <h2 className="text-xl font-bold mb-6 text-primary">Timetable</h2>
      <ul className="list-none flex-1 space-y-2">
        {pages.map((p) => {
          const Icon = p.icon;
          const active = currentPage === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => onChangePage(p.id)}
                className={`flex items-center w-full px-3 py-2 rounded-md transition-colors 
                  ${active ? 'bg-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
                `}
              >
                <Icon className="mr-2 h-5 w-5" />
                {p.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
