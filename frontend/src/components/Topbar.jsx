import React from 'react';
import { Sun, Moon, Shield, Sparkles } from 'lucide-react';

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
    <header className="bulba-canopy text-white px-6 py-4 shadow-md relative z-10 border-b border-leaf/40">
      {/* Decorative nature spots */}
      <div className="bulba-spot w-32 h-20 top-[-20px] left-[15%] opacity-20"></div>
      <div className="bulba-spot w-40 h-28 bottom-[-30px] right-[10%] opacity-20"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        {/* Brand & Bulbasaur Nature Emblem */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            {/* Bulbasaur Sprout Emblem */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-forest via-leaf to-bulb_green flex items-center justify-center shadow-lg border border-white/30 transform group-hover:scale-105 transition-transform duration-300">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white drop-shadow" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 20h10" />
                <path d="M10 20c0-4.5 1.5-8 5-11-2.5 0-6 1.5-7 5" />
                <path d="M12 20c0-6 2-10 7-14-3 0-8 2-9 7" />
              </svg>
            </div>
            {/* Small flower bud ping */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bulb_coral opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-bulb_coral"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
                CampusWeave
              </span>
              <span className="text-[10px] bg-white/20 text-fresh_mint border border-white/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Bulbasaur Edition
              </span>
            </div>
            <p className="text-xs text-fresh_mint/90 flex items-center gap-1.5 mt-0.5">
              <span>🍃 Intelligent Academic Scheduling</span>
              <span className="text-white/40">•</span>
              <span className="text-sunshine_yellow font-medium">Buildasaur Round 2</span>
            </p>
          </div>
        </div>

        {/* Right Controls: Role Selector & Nature Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* Active Nature State Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/20 text-[11px] text-fresh_mint">
            <span className="w-2 h-2 rounded-full bg-bulb_green animate-pulse"></span>
            <span>Zero Conflicts • VCS Synced</span>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/25 text-xs shadow-inner">
            <Shield className="w-3.5 h-3.5 text-sunshine_yellow" />
            <span className="text-[11px] font-semibold text-white/90">Role:</span>
            <select
              value={activeRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="admin" className="text-deep_forest font-medium">Administrator</option>
              <option value="coordinator" className="text-deep_forest font-medium">Dept Coordinator</option>
              <option value="teacher" className="text-deep_forest font-medium">Teacher (Faculty)</option>
              <option value="student" className="text-deep_forest font-medium">Student</option>
            </select>
          </div>

          {/* Day / Night Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Nature Mode"
            title={dark ? "Switch to Sunny Meadow mode" : "Switch to Deep Forest mode"}
            className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white hover:bg-white/25 transition shadow-sm"
          >
            {dark ? <Sun className="h-4 w-4 text-sunshine_yellow" /> : <Moon className="h-4 w-4 text-fresh_mint" />}
          </button>
        </div>
      </div>
    </header>
  );
}
