/* src/api.js
   Mockable API client.
    If VITE_USE_MOCK is "true", uses in-memory mock store seeded from data/seed.json.
   Otherwise forwards requests to the real backend.
*/

let mockStore = null;

// Mock commit generation
function generateMockCommits() {
  const now = Date.now();
  const msgs = [
    'Initial timetable created.',
    'Database lecture moved to Tuesday.',
    'Computer laboratory room changed.',
    'Teacher availability updated.',
    'Previous timetable version restored.'
  ];
  return msgs.map((msg, idx) => ({
    id: `c${1000 + idx}`,
    parent_id: idx === 0 ? null : `c${1000 + idx - 1}`,
    branch: 'main',
    message: msg,
    author: 'mock_user',
    timestamp: new Date(now - (msgs.length - idx) * 60000).toISOString(),
    kind: idx === 0 ? 'generate' : 'edit',
    snapshot: {},
    diff: { changed: true, text: msg }
  }));
}


async function loadMockData() {
  if (mockStore) return;
  const response = await fetch('/data/seed.json');
  const data = await response.json();
  // Deep clone to avoid mutation of original seed
  const seed = JSON.parse(JSON.stringify(data));
  mockStore = {
    problem: seed.problem ?? seed,
    commits: seed.commits ?? [],
  };
  // Ensure mock commits exist
  if (!Array.isArray(mockStore.commits) || mockStore.commits.length === 0) {
    mockStore.commits = generateMockCommits();
  }
}

// Helper to parse JSON safely
async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  if (!isJson) {
    const text = await response.text();
    throw new Error(`Expected JSON but got ${contentType}: ${text}`);
  }
  return await response.json();
}

async function getApiErrorMessage(response, fallback) {
  const payload = await response.json().catch(() => null);
  return payload?.error?.message || fallback;
}

// Determine whether to use mock mode (opt-in)
function useMock() {
  return import.meta.env?.VITE_USE_MOCK === 'true';
}

export async function getProblem() {
  if (useMock()) {
    await loadMockData();
    return mockStore.problem;
  }
  const res = await fetch('/api/problem');
  if (!res.ok) throw new Error(`GET /api/problem failed: ${res.status}`);
  return await parseJsonResponse(res);
}

export async function putProblem(updatedProblem) {
  if (useMock()) {
    await loadMockData();
    mockStore.problem = updatedProblem;
    return { success: true };
  }
  const res = await fetch('/api/problem', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedProblem),
  });
  if (!res.ok) throw new Error(`PUT /api/problem failed: ${res.status}`);
  return await parseJsonResponse(res);
}

export async function getCommitList() {
  if (useMock()) {
    await loadMockData();
    return (mockStore.commits || [])
      .map(({ snapshot, ...summary }) => summary)
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
  }
  const res = await fetch('/api/commits');
  if (!res.ok) {
    throw new Error(await getApiErrorMessage(res, `GET /api/commits failed: ${res.status}`));
  }
  return await parseJsonResponse(res);
}

export async function getCommitDiff(commitId) {
  if (useMock()) {
    await loadMockData();
    const commit = mockStore.commits.find(c => c.id === commitId);
    return commit?.parent_id ? commit.diff : null;
  }

  const commitRes = await fetch(`/api/commits/${encodeURIComponent(commitId)}`);
  if (!commitRes.ok) {
    throw new Error(`GET /api/commits/${commitId} failed: ${commitRes.status}`);
  }
  const commit = await parseJsonResponse(commitRes);
  if (!commit.parent_id) return null;

  const query = new URLSearchParams({ from: commit.parent_id, to: commit.id });
  const res = await fetch(`/api/diff?${query}`);
  if (!res.ok) throw new Error(`GET /api/diff failed: ${res.status}`);
  return await parseJsonResponse(res);
}

export async function postCommit(message) {
  if (useMock()) {
    await loadMockData();
    const newId = `c${Date.now()}`;
    const diff = { /* Very simplified diff */ changed: true };
    const commit = { id: newId, message, diff, timestamp: new Date().toISOString() };
    mockStore.commits.unshift(commit);
    return commit;
  }
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`POST /api/generate failed: ${res.status}`);
  const data = await parseJsonResponse(res);
  // Backend returns { commit: {...} }; unwrap for callers expecting a commit object
  return data.commit ?? data;
}

export async function revertCommit(commitId) {
  if (useMock()) {
    await loadMockData();
    const commit = mockStore.commits.find(c => c.id === commitId);
    if (!commit) throw new Error(`Commit '${commitId}' not found.`);
    const reverted = {
      id: `c${Date.now()}`,
      parent_id: mockStore.commits[0]?.id ?? null,
      branch: commit.branch ?? 'main',
      message: `Revert to ${commitId}`,
      author: 'mock_user',
      timestamp: new Date().toISOString(),
      kind: 'revert',
      snapshot: commit.snapshot ?? { slots: [] },
    };
    mockStore.commits.unshift(reverted);
    mockStore.problem.timetable = reverted.snapshot;
    return reverted;
  }
  const res = await fetch(`/api/revert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commit_id: commitId }),
  });
  if (!res.ok) throw new Error(`POST /api/revert failed: ${res.status}`);
  const data = await parseJsonResponse(res);
  return data.commit ?? data;
}

export async function getView(params) {
  if (useMock()) {
    await loadMockData();
    const [type, id] = Object.entries(params).find(([, value]) => value) ?? [];
    const problem = mockStore.problem;
    const collections = { batch: problem.batches, teacher: problem.teachers, room: problem.rooms };
    const owner = collections[type]?.find(item => item.id === id);
    if (!owner) throw new Error(`No ${type ?? 'view'} found for '${id ?? ''}'.`);

    const days = problem.config?.days ?? [0, 1, 2, 3, 4];
    const periods = problem.config?.periods ?? [];
    const grid = periods.map(() => days.map(() => null));
    const names = {
      subjects: Object.fromEntries((problem.subjects ?? []).map(item => [item.id, item.name])),
      teachers: Object.fromEntries((problem.teachers ?? []).map(item => [item.id, item.name])),
      rooms: Object.fromEntries((problem.rooms ?? []).map(item => [item.id, item.name])),
    };
    const slots = problem.timetable?.slots ?? [];
    slots.filter(slot => slot[`${type}_id`] === id).forEach(slot => {
      const dayIndex = days.indexOf(slot.day);
      const periodIndex = periods.findIndex(period => period.index === slot.period);
      if (dayIndex >= 0 && periodIndex >= 0) {
        grid[periodIndex][dayIndex] = {
          subject: names.subjects[slot.subject_id] ?? slot.subject_id,
          teacher: names.teachers[slot.teacher_id] ?? slot.teacher_id,
          room: names.rooms[slot.room_id] ?? slot.room_id,
        };
      }
    });
    return { owner: { type, id, name: owner.name ?? id }, grid };
  }
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/view?${query}`);
  if (!res.ok) throw new Error(`GET /api/view failed: ${res.status}`);
  return await parseJsonResponse(res);
}

export async function editSlot({ message, slot_key, new: newSlot }) {
  const body = { message, slot_key, new: newSlot };
  if (useMock()) {
    await loadMockData();
    const slots = mockStore.problem.timetable?.slots ?? [];
    const slotIndex = slots.findIndex(slot =>
      slot.batch_id === slot_key.batch_id &&
      slot.day === slot_key.day &&
      slot.period === slot_key.period
    );
    if (slotIndex < 0) throw new Error('The selected timetable slot no longer exists.');

    const updatedSlots = slots.map((slot, index) =>
      index === slotIndex ? { ...slot, ...newSlot } : slot
    );
    const commit = {
      id: `c${Date.now()}`,
      parent_id: mockStore.commits[0]?.id ?? null,
      branch: 'main',
      message,
      author: 'mock_user',
      timestamp: new Date().toISOString(),
      kind: 'edit',
      snapshot: { slots: updatedSlots },
    };
    mockStore.problem.timetable = commit.snapshot;
    mockStore.commits.unshift(commit);
    return commit;
  }

  const res = await fetch('/api/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await getApiErrorMessage(res, `POST /api/edit failed: ${res.status}`));
  }
  const data = await parseJsonResponse(res);
  return data.commit ?? data;
}

export async function seedData() {
  if (useMock()) {
    // Reset mock store to original seed
    mockStore = null;
    await loadMockData();
    return { success: true };
  }
  const res = await fetch('/api/seed', { method: 'POST' });
  if (!res.ok) throw new Error(`POST /api/seed failed: ${res.status}`);
  return await parseJsonResponse(res);
}
