/* src/api.js
   Mockable API client.
   If VITE_USE_MOCK is true (default), uses in-memory mock store seeded from data/seed.json.
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
  mockStore = JSON.parse(JSON.stringify(data));
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

// Determine whether to use mock mode (default true)
function useMock() {
  // In environments without Vite's import.meta (e.g., Node tests), default to mock mode.
  try {
    const val = import.meta?.env?.VITE_USE_MOCK;
    return val === undefined || val === true || val === 'true';
  } catch {
    return true;
  }
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
    return mockStore.commits || [];
  }
  try {
    const res = await fetch('/api/commits');
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GET /api/commits failed: ${res.status} - ${text}`);
    }
    return await parseJsonResponse(res);
  } catch (err) {
    console.error('getCommitList error:', err);
    return [];
  }
}

export async function getCommitDiff(commitId) {
  if (useMock()) {
    await loadMockData();
    const commit = mockStore.commits.find(c => c.id === commitId);
    return commit ? commit.diff : null;
  }
  const res = await fetch(`/api/commits/${commitId}`);
  if (!res.ok) throw new Error(`GET /api/commits/${commitId} failed: ${res.status}`);
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
    if (commit) {
      // Naively reset problem to the stored snapshot (not implemented fully)
      mockStore.problem = { ...mockStore.problem, ...commit.diff };
      return { success: true };
    }
    return { success: false };
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
    // mock view returns schedule for a batch/teacher/room
    const { batch, teacher, room } = params;
    // timetable is { slots: [...] }, not a bare array
    const slots = (mockStore.problem.timetable?.slots) ?? [];
    return slots.filter(entry =>
      (batch ? entry.batch_id === batch : true) &&
      (teacher ? entry.teacher_id === teacher : true) &&
      (room ? entry.room_id === room : true)
    );
  }
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/view?${query}`);
  if (!res.ok) throw new Error(`GET /api/view failed: ${res.status}`);
  return await parseJsonResponse(res);
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
