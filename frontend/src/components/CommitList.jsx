/* src/components/CommitList.jsx */
import React, { useEffect, useState } from 'react';
import { getCommitList, revertCommit } from '../api';
import Toast from './Toast';
import { GitCommit, RotateCcw, Eye, Sprout, Leaf } from 'lucide-react';

export default function CommitList({ onSelect, refreshKey }) {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchCommits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCommitList();
      setCommits(data ?? []);
    } catch (err) {
      console.error('Failed to load commits:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits();
  }, [refreshKey]);

  const handleRevert = async (commit) => {
    if (!window.confirm(`Revert to commit ${commit.id}?`)) return;
    setToast(null);
    try {
      const reverted = await revertCommit(commit.id);
      await fetchCommits();
      setToast({
        type: 'success',
        message: `Reverted to ${commit.id} in commit ${reverted.id}.`,
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Unable to revert commit.' });
    }
  };

  if (loading) return (
    <div className="text-center py-6 text-xs text-forest dark:text-fresh_mint flex items-center justify-center gap-2">
      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-leaf border-t-transparent rounded-full"></span>
      <span>Reading growth rings…</span>
    </div>
  );

  if (error)
    return (
      <div className="text-center py-4 text-xs text-error">
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        Error loading commits: {error}
        <button className="ml-2 px-2.5 py-1 bg-leaf text-white rounded-lg text-xs" onClick={fetchCommits}>
          Retry
        </button>
      </div>
    );

  if (!loading && commits.length === 0) return (
    <div className="text-center py-6 text-xs text-text_secondary">
      🌱 No commit rings sprouted yet.
    </div>
  );

  const kindClasses = {
    generate: 'bg-fresh_mint text-forest border border-leaf/40',
    edit: 'bg-bulba_light text-bulba_dark border border-bulba_teal/40',
    revert: 'bg-sunshine_yellow/25 text-earth_brown border border-sunshine_yellow/50',
    merge: 'bg-flower_coral/20 text-flower_coral border border-flower_coral/40',
  };

  return (
    <div className="space-y-3">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <ul className="space-y-2.5">
        {commits.map((commit) => (
          <li key={commit.id} className="p-3 rounded-xl bg-botanical_cream/50 dark:bg-gray-700/50 border border-fresh_mint/60 space-y-2 hover:border-leaf transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-leaf" />
                <code className="font-bold text-deep_forest dark:text-fresh_mint text-xs font-mono">{commit.id}</code>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${kindClasses[commit.kind] ?? 'bg-gray-100 text-gray-700'}`}>
                  {commit.kind ?? 'unknown'}
                </span>
              </div>
              <span className="text-[10px] text-text_secondary">{new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <p className="font-semibold text-xs text-deep_forest dark:text-white leading-tight">
              {commit.message}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-fresh_mint bg-white dark:bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-forest dark:text-fresh_mint hover:bg-light_mint transition shadow-2xs"
                onClick={() => onSelect?.(commit.id)}
              >
                <Eye className="w-3 h-3 text-leaf" />
                <span>Diff</span>
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-bulb_coral/50 bg-bulb_coral/10 px-2.5 py-1 text-[11px] font-semibold text-bulb_coral hover:bg-bulb_coral hover:text-white transition shadow-2xs"
                onClick={() => handleRevert(commit)}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
