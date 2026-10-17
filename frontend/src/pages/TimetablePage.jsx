/* src/pages/TimetablePage.jsx */
import React, { useEffect, useState } from 'react';
import { editSlot, getProblem, getView } from '../api';
import Toast from '../components/Toast';
import { Calendar, Users, DoorOpen, Download, Edit3, Sparkles, Leaf } from 'lucide-react';

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

  if (problemError) return <p className="text-error font-medium" role="alert">Unable to load timetable: {problemError}</p>;
  if (!problem) return <div className="text-center py-8 text-forest dark:text-fresh_mint flex items-center justify-center gap-2">
    <span className="animate-spin inline-block w-4 h-4 border-2 border-leaf border-t-transparent rounded-full"></span>
    <span>Sprouting timetable data…</span>
  </div>;

  return (
    <div className="space-y-5">
      {/* Botanical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-fresh_mint/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="leaf-badge">
              <Leaf className="w-3 h-3 text-leaf" />
              Bulbasaur Nature Grid
            </span>
            <span className="text-xs text-text_secondary">VCS Verified</span>
          </div>
          <h2 className="text-2xl font-extrabold text-deep_forest dark:text-fresh_mint mt-1">
            Academic Schedule Grid
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {selectedId && (
            <a
              href={`/api/export/ics?${viewType}=${encodeURIComponent(selectedId)}`}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-forest to-leaf hover:from-leaf hover:to-bulba_teal text-white px-4 py-2 text-xs font-semibold transition shadow-sm hover:shadow"
              title="Export calendar schedule to .ics (Google Calendar / Outlook / Apple Calendar)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .ICS Calendar</span>
            </a>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bulba-card p-4 bg-white/95 dark:bg-gray-800/95 flex flex-wrap items-center justify-between gap-4">
        {/* View Type Tabs */}
        <div className="flex items-center bg-light_mint/70 dark:bg-gray-900/60 p-1 rounded-xl border border-fresh_mint/60" role="tablist">
          {viewTypes.map((type) => {
            const active = viewType === type;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setViewType(type)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
                  active
                    ? 'bg-gradient-to-r from-forest to-leaf text-white shadow-sm'
                    : 'text-text_secondary dark:text-gray-300 hover:text-deep_forest hover:bg-white/50'
                }`}
              >
                {type === 'batch' && <Calendar className="w-3.5 h-3.5" />}
                {type === 'teacher' && <Users className="w-3.5 h-3.5" />}
                {type === 'room' && <DoorOpen className="w-3.5 h-3.5" />}
                <span>{type} View</span>
              </button>
            );
          })}
        </div>

        {/* Entity Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-deep_forest dark:text-fresh_mint capitalize">
            Select {viewType}:
          </span>
          <select
            className="rounded-xl border border-fresh_mint/80 bg-botanical_cream/50 dark:bg-gray-900 px-3 py-1.5 text-xs font-medium text-deep_forest dark:text-white focus:outline-none focus:ring-2 focus:ring-leaf cursor-pointer shadow-xs"
            value={selectedId}
            onChange={(event) => setSelections((current) => ({ ...current, [viewType]: event.target.value }))}
          >
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id} className="text-deep_forest">
                {entity.name ?? entity.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {viewError && <p className="text-error font-medium" role="alert">{viewError}</p>}

      {loading ? (
        <div className="py-12 text-center text-forest dark:text-fresh_mint flex items-center justify-center gap-2">
          <span className="animate-spin inline-block w-5 h-5 border-2 border-leaf border-t-transparent rounded-full"></span>
          <span className="text-sm font-medium">Cultivating schedule view…</span>
        </div>
      ) : (
        <div className="bulba-card bg-white dark:bg-gray-900 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-forest via-leaf to-forest text-white">
                  <th className="sticky left-0 bg-forest p-3.5 font-bold uppercase tracking-wider text-[11px] border-b border-forest/80">
                    Period
                  </th>
                  {days.map((day) => (
                    <th key={day} className="p-3.5 font-bold uppercase tracking-wider text-[11px] border-b border-white/20">
                      {dayNames[day] ?? `Day ${day}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-fresh_mint/40 dark:divide-gray-800">
                {periods.map((period, rowIndex) => (
                  <tr key={period.index} className="hover:bg-light_mint/20 dark:hover:bg-gray-800/40 transition-colors">
                    <th className="sticky left-0 whitespace-nowrap bg-white/95 dark:bg-gray-900/95 p-3.5 font-bold text-deep_forest dark:text-fresh_mint border-r border-fresh_mint/60">
                      <div className="text-xs">{period.label}</div>
                      <span className="text-[10px] text-text_secondary font-normal block">Slot {period.index}</span>
                    </th>
                    {days.map((day, columnIndex) => {
                      const cell = view?.grid?.[rowIndex]?.[columnIndex] ?? null;
                      return (
                        <td key={day} className="h-24 min-w-40 p-2 align-top border-r border-fresh_mint/30 dark:border-gray-800 last:border-r-0">
                          {cell ? (
                            viewType === 'batch' ? (
                              <button
                                type="button"
                                className="timetable-slot h-full w-full p-2.5 text-left flex flex-col justify-between group"
                                aria-label={`Edit ${cell.subject} on ${dayNames[day] ?? `day ${day}`} ${period.label}`}
                                onClick={() => openEditor(day, period.index)}
                              >
                                <div>
                                  <span className="block font-bold text-deep_forest dark:text-white group-hover:text-leaf transition-colors leading-tight">
                                    {cell.subject}
                                  </span>
                                  <span className="block text-[11px] text-text_secondary dark:text-gray-300 mt-1 flex items-center gap-1">
                                    <span>👤</span> {cell.teacher}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[10px]">
                                  <span className="bg-fresh_mint/60 text-forest dark:bg-forest/60 dark:text-fresh_mint px-1.5 py-0.5 rounded font-medium">
                                    🏛️ {cell.room}
                                  </span>
                                  <Edit3 className="w-3 h-3 text-leaf opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            ) : (
                              <div className="timetable-slot h-full p-2.5 flex flex-col justify-between">
                                <div>
                                  <span className="block font-bold text-deep_forest dark:text-white leading-tight">
                                    {cell.subject}
                                  </span>
                                  <span className="block text-[11px] text-text_secondary dark:text-gray-300 mt-1">
                                    👥 {cell.batch}
                                  </span>
                                </div>
                                <span className="inline-block mt-1 bg-fresh_mint/60 text-forest dark:bg-forest/60 dark:text-fresh_mint text-[10px] px-1.5 py-0.5 rounded font-medium w-fit">
                                  {cell.room || cell.teacher}
                                </span>
                              </div>
                            )
                          ) : (
                            <div className="h-full rounded-xl border border-dashed border-fresh_mint/80 dark:border-gray-800 p-2 flex items-center justify-center text-[11px] text-text_secondary/60">
                              <span>🌱 Free Slot</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botanical Slot Edit Dialog */}
      {editing && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" role="presentation">
          <section className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-fresh_mint p-6 shadow-2xl animate-in zoom-in-95 duration-200" role="dialog" aria-modal="true" aria-labelledby="edit-title">
            <div className="flex items-center gap-2 mb-4 text-forest dark:text-fresh_mint">
              <Leaf className="w-5 h-5 text-leaf" />
              <h3 id="edit-title" className="text-lg font-bold">Edit Timetable Slot</h3>
            </div>
            <form className="space-y-4" onSubmit={handleEdit}>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs">
                  <span className="font-semibold text-deep_forest dark:text-gray-200">New Day</span>
                  <select className="rounded-xl border border-fresh_mint p-2 text-xs bg-botanical_cream/40 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-leaf" value={editForm.day} onChange={(event) => setEditForm({ ...editForm, day: event.target.value })}>
                    {days.map((day) => <option key={day} value={day}>{dayNames[day] ?? `Day ${day}`}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="font-semibold text-deep_forest dark:text-gray-200">New Period</span>
                  <select className="rounded-xl border border-fresh_mint p-2 text-xs bg-botanical_cream/40 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-leaf" value={editForm.period} onChange={(event) => setEditForm({ ...editForm, period: event.target.value })}>
                    {periods.map((period) => <option key={period.index} value={period.index}>{period.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="font-semibold text-deep_forest dark:text-gray-200">Faculty / Teacher</span>
                  <select className="rounded-xl border border-fresh_mint p-2 text-xs bg-botanical_cream/40 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-leaf" value={editForm.teacher_id} onChange={(event) => setEditForm({ ...editForm, teacher_id: event.target.value })}>
                    {problem.teachers?.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name ?? teacher.id}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="font-semibold text-deep_forest dark:text-gray-200">Classroom / Lab</span>
                  <select className="rounded-xl border border-fresh_mint p-2 text-xs bg-botanical_cream/40 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-leaf" value={editForm.room_id} onChange={(event) => setEditForm({ ...editForm, room_id: event.target.value })}>
                    {problem.rooms?.map((room) => <option key={room.id} value={room.id}>{room.name ?? room.id}</option>)}
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-xs">
                <span className="font-semibold text-deep_forest dark:text-gray-200">Commit Message (VCS Log)</span>
                <input className="rounded-xl border border-fresh_mint p-2 text-xs bg-botanical_cream/40 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-leaf" required value={editForm.message} onChange={(event) => setEditForm({ ...editForm, message: event.target.value })} />
              </label>
              {editError && <p className="text-error text-xs font-medium" role="alert">{editError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded-xl border border-fresh_mint px-4 py-2 text-xs font-semibold hover:bg-light_mint transition" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-forest to-leaf hover:from-leaf hover:to-forest px-4 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50" disabled={saving}>
                  {saving ? 'Saving to VCS…' : 'Commit Slot Edit'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}