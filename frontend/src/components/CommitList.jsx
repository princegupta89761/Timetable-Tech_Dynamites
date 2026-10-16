/* src/components/CommitList.jsx */
import React, { useEffect, useState } from 'react';
import { getCommitList } from '../api';

export default function CommitList({ onSelect }) {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommits() {
      try {
        const data = await getCommitList();
        setCommits(data);
      } catch (err) {
        console.error('Failed to load commits:', err);
        setCommits([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCommits();
  }, []);

  if (loading) return <div className="text-center py-4">Loading commits…</div>;
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
