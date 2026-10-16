/* src/components/CommitList.jsx */
import React, { useEffect, useState } from 'react';
import { getCommitList } from '../api';

export default function CommitList({ onSelect }) {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, []);

  if (loading) return <div className="text-center py-4">Loading commits…</div>;
  if (error)
    return (
      <div className="text-center py-4 text-red-600">
        Error loading commits: {error}
        <button className="ml-2 px-3 py-1 bg-primary text-white rounded" onClick={fetchCommits}>
          Retry
        </button>
      </div>
    );
  if (!loading && commits.length === 0) return <div className="text-center py-4 text-gray-500">No commits found.</div>;

  return (
    <ul className="space-y-2">
      {commits.map((c) => (
        <li key={c.id} className="p-2 rounded border hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => onSelect(c.id)}>
          <div className="flex justify-between items-center">
            <span className="font-medium">{c.message}</span>
            <span className="text-sm text-gray-500">{new Date(c.timestamp).toLocaleString()}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
