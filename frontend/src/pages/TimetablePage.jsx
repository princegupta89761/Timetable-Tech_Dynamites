/* src/pages/TimetablePage.jsx */
import React, { useEffect, useState } from 'react';
import { getProblem, getView } from '../api';

export default function TimetablePage() {
  const [problem, setProblem] = useState(null);
  const [grid, setGrid] = useState(null);

  useEffect(() => {
    async function load() {
      const prob = await getProblem();
      setProblem(prob);
      if (prob && prob.batches && prob.batches.length) {
        const batchId = prob.batches[0].id;
        const view = await getView({ batch: batchId });
        setGrid(view);
      }
    }
    load();
  }, []);

  if (!problem) return <div className="text-center py-4">Loading timetable…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-primary">Timetable Preview</h2>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-sm max-h-96">
        {JSON.stringify(grid, null, 2)}
      </pre>
    </div>
  );
}
