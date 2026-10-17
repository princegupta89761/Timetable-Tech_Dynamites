/* src/components/DiffPanel.jsx */
import React, { useEffect, useState } from 'react';
import { getCommitDiff, getProblem } from '../api';
import { GitCompare, Filter, Leaf, ArrowRight } from 'lucide-react';

export default function DiffPanel({ commitId }) {
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  useEffect(() => {
    let active = true;
    getProblem()
      .then((p) => {
        if (active && p?.teachers) setTeachers(p.teachers);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!commitId) {
      setDiff(null);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    async function fetchDiff() {
      try {
        const result = await getCommitDiff(commitId, selectedTeacher || null);
        if (active) setDiff(result);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load diff.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchDiff();

    return () => {
      active = false;
    };
  }, [commitId, selectedTeacher]);

  if (!commitId) return (
    <div className="text-center py-12 text-xs text-text_secondary">
      👈 Select a growth ring commit on the left to inspect its visual diff.
    </div>
  );

  if (loading) return (
    <div className="text-center py-12 text-xs text-forest dark:text-fresh_mint flex items-center justify-center gap-2">
      <span className="animate-spin inline-block w-4 h-4 border-2 border-leaf border-t-transparent rounded-full"></span>
      <span>Calculating slot diffs…</span>
    </div>
  );

  if (error) return <div className="py-4 text-xs text-error font-medium">Unable to load diff: {error}</div>;
  if (diff === null) return <div className="py-8 text-center text-xs text-text_secondary">Initial root commit, no previous state to compare.</div>;
  if (!diff) return <div className="text-center py-8 text-xs text-text_secondary">No diff data.</div>;

  const badgeClasses = {
    moved: 'bg-sunshine_yellow/30 text-earth_brown border border-sunshine_yellow/60',
    added: 'bg-fresh_mint text-forest border border-leaf/40',
    removed: 'bg-bulb_coral/25 text-bulb_coral border border-bulb_coral/40',
  };

  return (
    <div className="space-y-4">
      {/* Diff Meta & Filter */}
      <div className="p-3.5 rounded-xl bg-botanical_cream/50 dark:bg-gray-700/50 border border-fresh_mint/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-text_secondary block text-[10px]">Comparing snapshots:</span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-deep_forest dark:text-white">
            <span>{diff.from ?? 'Genesis'}</span>
            <ArrowRight className="w-3 h-3 text-leaf" />
            <span className="text-leaf">{diff.to}</span>
          </div>
        </div>

        {/* Teacher filter (contract v1.1) */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-leaf" />
          <label className="text-[11px] font-semibold text-deep_forest dark:text-gray-200" htmlFor="diff-teacher-filter">
            Teacher Filter:
          </label>
          <select
            id="diff-teacher-filter"
            className="rounded-lg border border-fresh_mint bg-white dark:bg-gray-800 px-2.5 py-1 text-xs text-deep_forest dark:text-white focus:outline-none focus:ring-1 focus:ring-leaf cursor-pointer"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name ?? t.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {diff.slots?.length === 0 ? (
        <div className="text-center py-8 text-xs text-text_secondary bg-light_mint/30 rounded-xl border border-dashed border-fresh_mint">
          🍃 No slot variations detected for this comparison.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-fresh_mint/60">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-light_mint dark:bg-gray-700/80 text-forest dark:text-fresh_mint font-bold uppercase text-[10px] tracking-wider border-b border-fresh_mint">
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Batch</th>
                <th className="p-2.5">Subject</th>
                <th className="p-2.5">Before</th>
                <th className="p-2.5">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fresh_mint/30 dark:divide-gray-800">
              {diff.slots?.map((slot, idx) => (
                <tr key={idx} className="hover:bg-light_mint/20 dark:hover:bg-gray-700/30">
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${badgeClasses[slot.kind] ?? 'bg-gray-100'}`}>
                      {slot.kind}
                    </span>
                  </td>
                  <td className="p-2.5 font-semibold text-deep_forest dark:text-white">{slot.batch}</td>
                  <td className="p-2.5">{slot.subject}</td>
                  <td className="p-2.5 text-text_secondary">
                    {slot.from ? `Day ${slot.from.day}, P${slot.from.period} (${slot.from.room})` : '—'}
                  </td>
                  <td className="p-2.5 font-medium text-forest dark:text-fresh_mint">
                    {slot.to ? `Day ${slot.to.day}, P${slot.to.period} (${slot.to.room})` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
