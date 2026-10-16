/* src/pages/DataManagementPage.jsx */
import React, { useEffect, useState } from 'react';
import { getProblem, seedData } from '../api';

export default function DataManagementPage() {
  const [problem, setProblem] = useState(null);
  const [status, setStatus] = useState('');

  const loadProblem = async () => {
    setStatus('Loading…');
    const data = await getProblem();
    setProblem(data);
    setStatus('');
  };

  useEffect(() => {
    loadProblem();
  }, []);

  const handleReset = async () => {
    setStatus('Resetting demo data…');
    await seedData();
    await loadProblem();
    setStatus('Demo data re‑seeded');
    setTimeout(() => setStatus(''), 3000);
  };

  if (!problem) return <div className="text-center py-4">{status || 'Loading data…'}</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold text-primary">Data Management</h2>
      <button
        onClick={handleReset}
        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
      >
        Reset to Seed Data
      </button>
      {status && <p>{status}</p>}
      <section>
        <h3 className="text-xl font-medium mt-4 mb-2">Teachers</h3>
        <ul className="list-disc list-inside">
          {problem.teachers.map(t => (
            <li key={t.id}>{t.name} (ID: {t.id}) – Max per day: {t.max_per_day}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-xl font-medium mt-4 mb-2">Rooms</h3>
        <ul className="list-disc list-inside">
          {problem.rooms.map(r => (
            <li key={r.id}>{r.name} (ID: {r.id}) – Capacity: {r.capacity}, Type: {r.type}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-xl font-medium mt-4 mb-2">Batches</h3>
        <ul className="list-disc list-inside">
          {problem.batches.map(b => (
            <li key={b.id}>{b.name} (ID: {b.id}) – Size: {b.size}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-xl font-medium mt-4 mb-2">Subjects</h3>
        <ul className="list-disc list-inside">
          {problem.subjects.map(s => (
            <li key={s.id}>{s.name} (ID: {s.id}) – Room type: {s.room_type}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
