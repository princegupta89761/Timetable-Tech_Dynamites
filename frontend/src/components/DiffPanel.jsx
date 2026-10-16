/* src/components/DiffPanel.jsx */
import React, { useEffect, useState } from 'react';
import { getCommitDiff } from '../api';

export default function DiffPanel({ commitId }) {
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!commitId) return;
    setLoading(true);
    async function fetchDiff() {
      const d = await getCommitDiff(commitId);
      setDiff(d);
      setLoading(false);
    }
    fetchDiff();
  }, [commitId]);

  if (!commitId) return <div className="text-center py-4">Select a commit to view diff.</div>;
  if (loading) return <div className="text-center py-4">Loading diff…</div>;
  if (!diff) return <div className="text-center py-4">No diff data.</div>;

  return (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm max-h-96">
      {JSON.stringify(diff, null, 2)}
    </pre>
  );
}
