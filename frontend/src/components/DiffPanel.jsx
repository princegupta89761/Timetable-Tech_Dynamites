/* src/components/DiffPanel.jsx */
import React, { useEffect, useState } from 'react';
import { getCommitDiff, getProblem } from '../api';

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

  if (!commitId) return <div className="text-center py-4">Select a commit to view diff.</div>;
  if (loading) return <div className="text-center py-4">Loading diff…</div>;
  if (error) return <div className="py-4 text-red-600">Unable to load diff: {error}</div>;
  if (diff === null) return <div className="py-4 text-gray-600">Initial commit, nothing to compare.</div>;
  if (!diff) return <div className="text-center py-4">No diff data.</div>;

  const badgeClasses = {
    moved: 'bg-amber-100 text-amber-800',
    added: 'bg-green-100 text-green-800',
    removed: 'bg-red-100 text-red-800',
    changed: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-4">
      {teachers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-light_mint/40 p-2.5 rounded-lg border border-fresh_mint">
          <label htmlFor="teacher-filter-select" className="text-xs font-semibold uppercase tracking-wider text-forest">
            Filter changes by teacher:
          </label>
          <select
            id="teacher-filter-select"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="rounded-md border border-leaf/40 bg-white px-2.5 py-1 text-xs font-medium text-forest focus:border-leaf focus:ring-1 focus:ring-leaf"
          >
            <option value="">All Teachers (Unfiltered)</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name || t.id}</option>
            ))}
          </select>
        </div>
      )}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['moved', 'added', 'removed', 'changed'].map((type) => (
          <div key={type} className="rounded border p-3">
            <dt className="text-sm capitalize text-gray-500">{type}</dt>
            <dd className="text-xl font-semibold">{diff.summary?.[type] ?? 0}</dd>
          </div>
        ))}
      </dl>
      {diff.changes?.length ? (
        <ul className="divide-y rounded border">
          {diff.changes.map((change, index) => (
            <li key={`${change.type}-${index}`} className="flex items-start gap-3 p-3">
              <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium capitalize ${badgeClasses[change.type] ?? 'bg-gray-100 text-gray-700'}`}>
                {change.type}
              </span>
              <span>{change.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-2 text-gray-500">No changes in this diff.</p>
      )}
    </div>
  );
}
