/* src/pages/GeneratePage.jsx */
import React, { useState } from 'react';
import { postCommit } from '../api';
import Toast from '../components/Toast';

export default function GeneratePage({ onCommitCreated }) {
  const [message, setMessage] = useState('Run solver and create generate commit');
  const [toast, setToast] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setToast(null);
    try {
      const commit = await postCommit(message);
      setToast({ type: 'success', message: `Commit ${commit.id} created.` });
      onCommitCreated?.(commit);
    } catch (e) {
      setToast({ type: 'error', message: e.message || 'Unable to generate timetable.' });
    } finally {
      setGenerating(false);
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
        disabled={generating}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
      >
        {generating ? 'Generating…' : 'Run Solver'}
      </button>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}
