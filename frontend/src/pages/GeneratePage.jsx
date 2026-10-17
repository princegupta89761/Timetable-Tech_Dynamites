/* src/pages/GeneratePage.jsx */
import React, { useState } from 'react';
import { postCommit } from '../api';
import Toast from '../components/Toast';
import { Sparkles, Cpu, CheckCircle2, ShieldCheck, Zap, GitCommit, Sprout } from 'lucide-react';

export default function GeneratePage({ onCommitCreated }) {
  const [message, setMessage] = useState('Generate clash-free timetable via CP-SAT solver');
  const [toast, setToast] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [lastCommit, setLastCommit] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setToast(null);
    try {
      const commit = await postCommit(message);
      setLastCommit(commit);
      setToast({ type: 'success', message: `Timetable committed successfully (ID: ${commit.id})` });
      onCommitCreated?.(commit);
    } catch (e) {
      setToast({ type: 'error', message: e.message || 'Unable to generate timetable.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bulba-card p-6 bg-gradient-to-r from-forest via-leaf to-bulba_teal text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-fresh_mint px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2">
            <Sprout className="w-3.5 h-3.5 text-fresh_mint" />
            <span>Bulbasaur Nature Solver</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Solar Beam Timetable Generation</h2>
          <p className="text-xs text-fresh_mint/90 mt-1 max-w-lg leading-relaxed">
            Harness Google OR-Tools CP-SAT constraint optimization to formulate atomic, clash-free academic allocations across all faculties and classrooms.
          </p>
        </div>
        {/* Background sprout watermark */}
        <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
      </div>

      {/* Constraint Satisfaction Checklist */}
      <div className="bulba-card p-5 bg-white dark:bg-gray-800">
        <h3 className="font-bold text-xs uppercase tracking-wider text-forest dark:text-fresh_mint mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-leaf" />
          <span>Active Constraint Guarantee</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-light_mint/60 dark:bg-gray-700/60 border border-fresh_mint flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
            <div>
              <strong className="text-deep_forest dark:text-white">Zero Faculty Clashes</strong>
              <p className="text-[11px] text-text_secondary dark:text-gray-300">No instructor is assigned to multiple classes simultaneously.</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-light_mint/60 dark:bg-gray-700/60 border border-fresh_mint flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
            <div>
              <strong className="text-deep_forest dark:text-white">Room Capacity Lock</strong>
              <p className="text-[11px] text-text_secondary dark:text-gray-300">Classrooms match subject requirements and batch sizes.</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-light_mint/60 dark:bg-gray-700/60 border border-fresh_mint flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
            <div>
              <strong className="text-deep_forest dark:text-white">Bounded Execution</strong>
              <p className="text-[11px] text-text_secondary dark:text-gray-300">Mathematical convergence bounded within 10 seconds.</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-light_mint/60 dark:bg-gray-700/60 border border-fresh_mint flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
            <div>
              <strong className="text-deep_forest dark:text-white">Immutable VCS Commit</strong>
              <p className="text-[11px] text-text_secondary dark:text-gray-300">Full snapshot saved with parent pointer and rollback support.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Form */}
      <div className="bulba-card p-6 bg-white dark:bg-gray-800 space-y-4">
        <div>
          <label className="block text-xs font-bold text-deep_forest dark:text-fresh_mint mb-1">
            Commit Log Message
          </label>
          <textarea
            className="w-full p-3 rounded-xl border border-fresh_mint bg-botanical_cream/30 dark:bg-gray-900 text-xs text-deep_forest dark:text-white focus:outline-none focus:ring-2 focus:ring-leaf transition shadow-xs"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe this timetable iteration..."
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-forest via-leaf to-bulb_green hover:from-leaf hover:to-forest text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              <span>Running Solver Constraints (Solar Beam)…</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-sunshine_yellow" />
              <span>Generate Clash-Free Timetable</span>
            </>
          )}
        </button>

        {lastCommit && (
          <div className="p-3.5 rounded-xl bg-light_mint/80 border border-leaf text-xs text-forest flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-leaf" />
              <span>HEAD Updated to: <strong className="font-mono">{lastCommit.id}</strong></span>
            </div>
            <span className="leaf-badge">Live at HEAD</span>
          </div>
        )}
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
