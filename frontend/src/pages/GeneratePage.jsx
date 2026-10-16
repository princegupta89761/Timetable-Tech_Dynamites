/* src/pages/GeneratePage.jsx */
import React, { useState } from 'react';
import { postCommit } from '../api';

export default function GeneratePage() {
  const [message, setMessage] = useState('Run solver and create generate commit');
  const [status, setStatus] = useState(null);

  const handleGenerate = async () => {
    setStatus('Generating…');
    try {
      const commit = await postCommit(message);
      setStatus(`✅ Commit ${commit.id} created`);
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-primary">Generate Timetable</h2>
      <textarea
        className="w-full p-2 border rounded focus:outline-none focus:ring"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
      >
        Run Solver
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
