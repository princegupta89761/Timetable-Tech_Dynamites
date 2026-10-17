import React from 'react';
import { Sun, Moon, UserCheck, Shield } from 'lucide-react';

export default function Topbar({ activeRole, onRoleChange }) {
  const [dark, setDark] = React.useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setDark(!dark);
  };

  return (
    <header className="flex items-center justify-between bg-white/95 dark:bg-gray-800/95 backdrop-blur-md px-6 py-3.5 border-b border-fresh_mint/60 shadow-xs">
      {/* Brand & Leaf Motif */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-forest to-leaf flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-fresh_mint" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" />
            <path d="M10 20c0-4.5 1.5-8 5-11-2.5 0-6 1.5-7 5" />
            <path d="M12 20c0-6 2-10 7-14-3 0-8 2-9 7" />
          </svg>
        </div>
        <div>
          <span className="text-lg font-bold bg-gradient-to-r from-deep_forest to-leaf bg-clip-text text-transparent dark:text-fresh_mint leading-none block">
            CampusWeave
          </span>
          <span className="text-[10px] text-text_secondary tracking-wider uppercase font-medium">
            Bulbasaur Edition • Academic Scheduling
          </span>
        </div>
      </div>

      {/* Right controls: Role Selector & Dark Mode */}
      <div className="flex items-center gap-3">
        {/* Role Selector */}
        <div className="flex items-center gap-2 bg-botanical_cream/80 dark:bg-gray-700/80 px-3 py-1.5 rounded-xl border border-fresh_mint/60 text-xs">
          <Shield className="w-3.5 h-3.5 text-leaf" />
          <span className="text-[11px] font-semibold text-deep_forest dark:text-gray-200">Role:</span>
          <select
            value={activeRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-deep_forest dark:text-gray-100 focus:outline-none cursor-pointer"
          >
            <option value="admin" className="text-black">Administrator</option>
            <option value="coordinator" className="text-black">Dept Coordinator</option>
            <option value="teacher" className="text-black">Teacher (Faculty)</option>
            <option value="student" className="text-black">Student</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl border border-fresh_mint/60 text-forest dark:text-fresh_mint hover:bg-light_mint dark:hover:bg-gray-700 transition"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
