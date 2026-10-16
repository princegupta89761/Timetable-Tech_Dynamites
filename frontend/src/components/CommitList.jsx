/* src/components/CommitList.jsx */
import React, { useEffect, useState } from 'react';
import { getCommitList, revertCommit } from '../api';
import Toast from './Toast';

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

  if (loading) return <div className="text-center py-4">Loading commits…</div>;
  if (error)
    return (
      <div className="text-center py-4 text-red-600">
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        Error loading commits: {error}
        <button className="ml-2 px-3 py-1 bg-primary text-white rounded" onClick={fetchCommits}>
          Retry
        </button>
      </div>
    );
  if (!loading && commits.length === 0) return <div className="text-center py-4 text-gray-500">No commits found.</div>;

  const kindClasses = {
    generate: 'bg-green-100 text-green-800',
    edit: 'bg-blue-100 text-blue-800',
    revert: 'bg-amber-100 text-amber-800',
    merge: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-3">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <ul className="space-y-2">
        {commits.map((commit) => (
          <li key={commit.id} className="space-y-3 rounded border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <code className="text-sm font-semibold">{commit.id}</code>
                <span className={`rounded px-2 py-1 text-xs font-medium capitalize ${kindClasses[commit.kind] ?? 'bg-gray-100 text-gray-700'}`}>
                  {commit.kind ?? 'unknown'}
                </span>
              </div>
              <span className="text-sm text-gray-500">{new Date(commit.timestamp).toLocaleString()}</span>
            </div>
            <p className="font-medium">{commit.message}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onSelect?.(commit.id)}
              >
                Diff with previous
              </button>
              <button
                className="rounded border border-amber-600 px-3 py-1 text-sm text-amber-800 hover:bg-amber-50"
                onClick={() => handleRevert(commit)}
              >
                Revert to this
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
