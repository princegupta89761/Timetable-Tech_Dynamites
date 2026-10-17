/* src/pages/DataManagementPage.jsx */
import React, { useEffect, useState } from 'react';
import { getProblem, seedData } from '../api';
import { Users, DoorOpen, GraduationCap, BookOpen, RefreshCw, Sprout, CheckCircle2 } from 'lucide-react';

export default function DataManagementPage() {
  const [problem, setProblem] = useState(null);
  const [status, setStatus] = useState('');
  const [resetting, setResetting] = useState(false);

  const loadProblem = async () => {
    setStatus('Loading…');
    try {
      const data = await getProblem();
      setProblem(data);
      setStatus('');
    } catch (err) {
      setStatus('Failed to load problem data.');
    }
  };

  useEffect(() => {
    loadProblem();
  }, []);

  const handleReset = async () => {
    setResetting(true);
    setStatus('Cultivating seed problem dataset…');
    try {
      await seedData();
      await loadProblem();
      setStatus('Garden data successfully restored to seed state.');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus('Failed to reset seed data.');
    } finally {
      setResetting(false);
    }
  };

  if (!problem) return (
    <div className="text-center py-12 text-forest dark:text-fresh_mint flex items-center justify-center gap-2">
      <span className="animate-spin inline-block w-4 h-4 border-2 border-leaf border-t-transparent rounded-full"></span>
      <span>Loading Garden Ecosystem…</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-fresh_mint/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="leaf-badge">
              <Sprout className="w-3.5 h-3.5 text-leaf" />
              Academic Roots
            </span>
            <span className="text-xs text-text_secondary">Constraint Definitions</span>
          </div>
          <h2 className="text-2xl font-extrabold text-deep_forest dark:text-fresh_mint mt-1">
            Garden Data & Academic Resources
          </h2>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-forest to-leaf hover:from-leaf hover:to-forest text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting…' : 'Re-seed Demo Garden'}</span>
        </button>
      </div>

      {status && (
        <div className="p-3 rounded-xl bg-light_mint text-deep_forest border border-fresh_mint text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-leaf" />
          <span>{status}</span>
        </div>
      )}

      {/* 4 Ecosystem Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Faculty */}
        <div className="bulba-card p-5 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3 border-b border-fresh_mint/40 pb-2">
            <div className="flex items-center gap-2 text-forest dark:text-fresh_mint font-bold text-sm">
              <Users className="w-4 h-4 text-leaf" />
              <span>Faculty Members ({problem.teachers.length})</span>
            </div>
            <span className="leaf-badge text-[10px]">Max Load Checked</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {problem.teachers.map((t) => (
              <div key={t.id} className="p-2.5 rounded-xl bg-botanical_cream/50 dark:bg-gray-700/50 border border-fresh_mint/40 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-deep_forest dark:text-white block">{t.name}</strong>
                  <span className="text-[10px] text-text_secondary">ID: {t.id}</span>
                </div>
                <span className="text-[11px] font-semibold text-leaf">
                  Max {t.max_per_day} classes/day
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Classrooms & Labs */}
        <div className="bulba-card p-5 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3 border-b border-fresh_mint/40 pb-2">
            <div className="flex items-center gap-2 text-forest dark:text-fresh_mint font-bold text-sm">
              <DoorOpen className="w-4 h-4 text-lagoon_teal" />
              <span>Classrooms & Labs ({problem.rooms.length})</span>
            </div>
            <span className="leaf-badge text-[10px]">Capacity Mapped</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {problem.rooms.map((r) => (
              <div key={r.id} className="p-2.5 rounded-xl bg-botanical_cream/50 dark:bg-gray-700/50 border border-fresh_mint/40 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-deep_forest dark:text-white block">{r.name}</strong>
                  <span className="text-[10px] text-text_secondary">ID: {r.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-deep_forest dark:text-fresh_mint block">Cap: {r.capacity}</span>
                  <span className="text-[10px] uppercase font-bold text-leaf">{r.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batches */}
        <div className="bulba-card p-5 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3 border-b border-fresh_mint/40 pb-2">
            <div className="flex items-center gap-2 text-forest dark:text-fresh_mint font-bold text-sm">
              <GraduationCap className="w-4 h-4 text-sunshine_yellow" />
              <span>Student Batches ({problem.batches.length})</span>
            </div>
            <span className="leaf-badge text-[10px]">Cohorts</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {problem.batches.map((b) => (
              <div key={b.id} className="p-2.5 rounded-xl bg-botanical_cream/50 dark:bg-gray-700/50 border border-fresh_mint/40 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-deep_forest dark:text-white block">{b.name}</strong>
                  <span className="text-[10px] text-text_secondary">Cohort ID: {b.id}</span>
                </div>
                <span className="text-[11px] font-semibold text-deep_forest dark:text-fresh_mint">
                  {b.size} Students
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div className="bulba-card p-5 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3 border-b border-fresh_mint/40 pb-2">
            <div className="flex items-center gap-2 text-forest dark:text-fresh_mint font-bold text-sm">
              <BookOpen className="w-4 h-4 text-flower_coral" />
              <span>Curriculum Courses ({problem.subjects.length})</span>
            </div>
            <span className="leaf-badge text-[10px]">Curriculum</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {problem.subjects.map((s) => (
              <div key={s.id} className="p-2.5 rounded-xl bg-botanical_cream/50 dark:bg-gray-700/50 border border-fresh_mint/40 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-deep_forest dark:text-white block">{s.name}</strong>
                  <span className="text-[10px] text-text_secondary">Code: {s.id}</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-leaf bg-light_mint px-2 py-0.5 rounded-full border border-fresh_mint">
                  Requires {s.room_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
