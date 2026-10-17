/* src/pages/TimetablePage.jsx */
import React, { useEffect, useState } from 'react';
import { editSlot, getProblem, getView } from '../api';
import Toast from '../components/Toast';

const viewTypes = ['batch', 'teacher', 'room'];
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TimetablePage() {
  const [problem, setProblem] = useState(null);
  const [problemError, setProblemError] = useState(null);
  const [viewType, setViewType] = useState('batch');
  const [selections, setSelections] = useState({});
  const [view, setView] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewError, setViewError] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;
    getProblem()
      .then((data) => {
        if (active) setProblem(data);
      })
      .catch((err) => {
        if (active) setProblemError(err.message || 'Unable to load timetable data.');
      });
    return () => {
      active = false;
    };
  }, []);

  const entities = problem?.[`${viewType}s`] ?? [];
  const selectedId = selections[viewType] || entities[0]?.id || '';
  const days = problem?.config?.days ?? [0, 1, 2, 3, 4];
  const periods = problem?.config?.periods ?? [];

  useEffect(() => {
    if (!selectedId) {
      setView(null);
      return;
    }
    let active = true;
    setLoading(true);
    setViewError(null);
    getView({ [viewType]: selectedId })
      .then((data) => {
        if (active) setView(data);
      })
      .catch((err) => {
        if (active) setViewError(err.message || 'Unable to load this timetable view.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [viewType, selectedId, refreshVersion]);

  const openEditor = (day, period) => {
    setEditing({ day, period });
    setEditForm({
      day: String(day),
      period: String(period),
      room_id: problem.rooms?.[0]?.id ?? '',
      teacher_id: problem.teachers?.[0]?.id ?? '',
      message: 'Edit timetable slot',
    });
    setEditError(null);
    setToast(null);
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setEditError(null);
    try {
      const commit = await editSlot({
        message: editForm.message,
        slot_key: { batch_id: selectedId, day: editing.day, period: editing.period },
        new: {
          day: Number(editForm.day),
          period: Number(editForm.period),
          room_id: editForm.room_id || null,
          teacher_id: editForm.teacher_id || null,
        },
      });
      setEditing(null);
      setEditForm(null);
      setToast({ type: 'success', message: `Committed ${commit.id}` });
      setRefreshVersion((version) => version + 1);
    } catch (err) {
      setEditError(err.message || 'Unable to edit this slot.');
    } finally {
      setSaving(false);
    }
  };

  if (problemError) return <p className="text-red-600" role="alert">Unable to load timetable: {problemError}</p>;
  if (!problem) return <div className="text-center py-4">Loading timetable…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-primary">Timetable</h2>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex border-b" role="tablist" aria-label="Timetable view">
          {viewTypes.map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={viewType === type}
              className={`border-b-2 px-4 py-2 capitalize ${viewType === type ? 'border-primary font-semibold text-primary' : 'border-transparent text-gray-500'}`}
              onClick={() => setViewType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            <span className="capitalize">{viewType}</span>
            <select
              className="min-w-52 rounded border border-leaf/40 bg-white px-3 py-2 text-sm focus:border-leaf focus:ring-2 focus:ring-fresh_mint/50"
              value={selectedId}
              onChange={(event) => setSelections((current) => ({ ...current, [viewType]: event.target.value }))}
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>{entity.name ?? entity.id}</option>
              ))}
            </select>
          </label>
          {selectedId && (
            <a
              href={`/api/export/ics?${viewType}=${encodeURIComponent(selectedId)}`}
              download
              className="inline-flex items-center gap-1.5 rounded-lg bg-leaf hover:bg-forest text-white px-3.5 py-2 text-sm font-medium transition shadow-sm hover:shadow"
              title="Export calendar schedule to .ics (Google Calendar / Outlook / Apple Calendar)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Export .ics</span>
            </a>
          )}
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {viewError && <p className="text-red-600" role="alert">{viewError}</p>}
      {loading ? (
        <p className="py-4 text-center">Loading timetable view…</p>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="sticky left-0 border-b p-3">Period</th>
                {days.map((day) => (
                  <th key={day} className="border-b p-3">{dayNames[day] ?? `Day ${day}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period, rowIndex) => (
                <tr key={period.index}>
                  <th className="sticky left-0 whitespace-nowrap border-b bg-white p-3 font-medium dark:bg-gray-900">
                    {period.label}
                  </th>
                  {days.map((day, columnIndex) => {
                    const cell = view?.grid?.[rowIndex]?.[columnIndex] ?? null;
                    return (
                      <td key={day} className="h-24 min-w-36 border-b border-l p-2 align-top">
                        {cell ? (
                          viewType === 'batch' ? (
                            <button
                              type="button"
                              className="h-full w-full rounded p-2 text-left hover:bg-blue-50"
                              aria-label={`Edit ${cell.subject} on ${dayNames[day] ?? `day ${day}`} ${period.label}`}
                              onClick={() => openEditor(day, period.index)}
                            >
                              <span className="block font-semibold">{cell.subject}</span>
                              <span className="block text-gray-600">{cell.teacher}</span>
                              <span className="block text-gray-500">{cell.room}</span>
                            </button>
                          ) : (
                            <div className="p-2">
                              <span className="block font-semibold">{cell.subject}</span>
                              <span className="block text-gray-600">{cell.teacher}</span>
                              <span className="block text-gray-500">{cell.room}</span>
                            </div>
                          )
                        ) : (
                          <span className="p-2 text-gray-400">free</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && editForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <section className="w-full max-w-lg rounded bg-white p-5 shadow-xl dark:bg-gray-800" role="dialog" aria-modal="true" aria-labelledby="edit-title">
            <h3 id="edit-title" className="mb-4 text-lg font-semibold">Edit timetable slot</h3>
            <form className="space-y-4" onSubmit={handleEdit}>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span>New day</span>
                  <select className="rounded border p-2" value={editForm.day} onChange={(event) => setEditForm({ ...editForm, day: event.target.value })}>
                    {days.map((day) => <option key={day} value={day}>{dayNames[day] ?? `Day ${day}`}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span>New period</span>
                  <select className="rounded border p-2" value={editForm.period} onChange={(event) => setEditForm({ ...editForm, period: event.target.value })}>
                    {periods.map((period) => <option key={period.index} value={period.index}>{period.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Teacher</span>
                  <select className="rounded border p-2" value={editForm.teacher_id} onChange={(event) => setEditForm({ ...editForm, teacher_id: event.target.value })}>
                    {problem.teachers?.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name ?? teacher.id}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Room</span>
                  <select className="rounded border p-2" value={editForm.room_id} onChange={(event) => setEditForm({ ...editForm, room_id: event.target.value })}>
                    {problem.rooms?.map((room) => <option key={room.id} value={room.id}>{room.name ?? room.id}</option>)}
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-sm">
                <span>Commit message</span>
                <input className="rounded border p-2" required value={editForm.message} onChange={(event) => setEditForm({ ...editForm, message: event.target.value })} />
              </label>
              {editError && <p className="text-red-600" role="alert">{editError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded border px-3 py-2" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="rounded bg-primary px-3 py-2 text-white disabled:opacity-50" disabled={saving}>
                  {saving ? 'Saving…' : 'Commit edit'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}