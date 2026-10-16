# contract.md: Timetable Generator with Git-style Versioning

**Single source of truth for all data shapes and API routes.**
Everyone codes against this file. Paste it into every AI prompt (Antigravity / Copilot).
**Only Person 4 (Integration) edits this file.** Request changes in the team chat; bump the version below.

`contract version: 1.0`

---

## 1. Conventions

| Thing | Rule |
|---|---|
| IDs | Short lowercase strings, unique per type. e.g. `t01`, `r204`, `b_se_a`, `s_dbms` |
| Days | Integer `0`-`4` = Mon-Fri (`5` = Sat if enabled in config) |
| Periods | Integer `0`-`N-1`, index into `config.periods` |
| Timestamps | ISO 8601 UTC string, e.g. `2026-10-17T08:30:00Z` |
| JSON keys | `snake_case` |
| Nulls | Use `null`, never omit a key |
| Slot identity | A slot is uniquely identified by `(batch_id, day, period)` |
| Time units | Never use clock strings in logic. Convert `period` to a label only in the UI |

---

## 2. Config

```json
{
  "days": [0, 1, 2, 3, 4],
  "periods": [
    { "index": 0, "label": "09:00-10:00" },
    { "index": 1, "label": "10:00-11:00" },
    { "index": 2, "label": "11:15-12:15" },
    { "index": 3, "label": "12:15-13:15" },
    { "index": 4, "label": "14:00-15:00" },
    { "index": 5, "label": "15:00-16:00" }
  ]
}
```

---

## 3. Input entities

### Teacher
```json
{
  "id": "t01",
  "name": "Prof. Sharma",
  "unavailable": [ { "day": 2, "period": 4 }, { "day": 2, "period": 5 } ],
  "max_per_day": 5
}
```

### Room
```json
{
  "id": "r204",
  "name": "Room 204",
  "capacity": 60,
  "type": "classroom"
}
```
`type` is one of: `"classroom"`, `"lab"`.

### Batch
```json
{
  "id": "b_se_a",
  "name": "SE-A",
  "size": 55
}
```

### Subject
```json
{
  "id": "s_dbms",
  "name": "DBMS",
  "room_type": "classroom"
}
```

### Requirement (what must be scheduled)
One row means "this batch needs N lectures per week of this subject, taught by this teacher."
```json
{
  "id": "q01",
  "batch_id": "b_se_a",
  "subject_id": "s_dbms",
  "teacher_id": "t01",
  "lectures_per_week": 4,
  "block_size": 1
}
```
`block_size`: `1` for a normal lecture, `2` for a 2-period lab block (consecutive periods).

### ProblemInput (sent to the solver)
```json
{
  "config": { "...": "see section 2" },
  "teachers": [],
  "rooms": [],
  "batches": [],
  "subjects": [],
  "requirements": [],
  "time_limit_seconds": 10
}
```

---

## 4. Timetable

### Slot
```json
{
  "batch_id": "b_se_a",
  "day": 1,
  "period": 2,
  "subject_id": "s_dbms",
  "teacher_id": "t01",
  "room_id": "r204",
  "requirement_id": "q01"
}
```

### Timetable
```json
{
  "slots": [ { "...": "Slot" } ]
}
```
Slots are sorted by `(batch_id, day, period)` before saving, so snapshots and diffs are deterministic.

---

## 5. Hard constraints (the definition of a "clash")

A timetable is **valid** only if all of these hold. The solver must guarantee them, and the edit validator must enforce them.

1. **Batch clash:** a batch has at most one slot per `(day, period)`.
2. **Teacher clash:** a teacher has at most one slot per `(day, period)`, across all batches.
3. **Room clash:** a room has at most one slot per `(day, period)`, across all batches.
4. **Room fit:** `room.capacity >= batch.size` and `room.type == subject.room_type`.
5. **Teacher availability:** no slot falls in a teacher's `unavailable` list.
6. **Teacher max per day:** respect `teacher.max_per_day`.
7. **Coverage:** each requirement gets exactly `lectures_per_week` slots (counting blocks).
8. **Blocks:** a `block_size: 2` requirement occupies two consecutive periods on the same day in the same room.

**Soft goals (solver optimises, never required):** spread a batch's lectures across days, avoid gaps within a day, avoid a subject twice in one day for the same batch.

---

## 6. Solver contract (Person 1)

```python
def solve(problem: dict) -> dict:
    """Takes ProblemInput, returns SolveResult."""
```

### SolveResult: success
```json
{
  "status": "ok",
  "timetable": { "slots": [] },
  "stats": { "solve_ms": 842, "soft_score": 37 }
}
```

### SolveResult: infeasible
```json
{
  "status": "infeasible",
  "timetable": null,
  "reasons": [
    "Teacher t01 needs 31 periods/week but only 25 slots exist.",
    "Batch b_se_a needs 32 lectures/week but only 30 slots exist."
  ]
}
```
`status` is one of: `"ok"`, `"infeasible"`, `"timeout"`.

The solver must be a **pure function** with no file or database access, so it is testable in isolation.

---

## 7. Version control layer (Person 2)

### Commit
```json
{
  "id": "c0007",
  "parent_id": "c0006",
  "branch": "main",
  "message": "Move Prof. Sharma's Tue lecture to Wed",
  "author": "demolisher",
  "timestamp": "2026-10-17T08:30:00Z",
  "kind": "edit",
  "snapshot": { "slots": [] }
}
```
- `kind` is one of: `"generate"`, `"edit"`, `"revert"`, `"merge"`.
- `id` is sequential: `c0001`, `c0002`, ...
- `parent_id` is `null` for the first commit. A merge commit also has `merge_parent_id`.
- `snapshot` is the full Timetable at that commit (no deltas).
- A **revert** creates a *new* commit with the old snapshot. History is never rewritten.

### Diff
```json
{
  "from": "c0006",
  "to": "c0007",
  "changes": [
    {
      "type": "moved",
      "batch_id": "b_se_a",
      "requirement_id": "q01",
      "from": { "day": 1, "period": 2, "room_id": "r204" },
      "to":   { "day": 2, "period": 4, "room_id": "r101" },
      "text": "SE-A DBMS (Prof. Sharma): Tue 11:15 Room 204 -> Wed 14:00 Room 101"
    },
    {
      "type": "added",
      "slot": { "...": "Slot" },
      "text": "Added: TE-B OS (Prof. Rao) Thu 10:00 Room 301"
    },
    {
      "type": "removed",
      "slot": { "...": "Slot" },
      "text": "Removed: SE-A Maths (Prof. Iyer) Mon 09:00 Room 204"
    }
  ],
  "summary": { "moved": 1, "added": 1, "removed": 1 }
}
```
- `type` is one of: `"moved"`, `"added"`, `"removed"`, `"changed"` (same time, different room or teacher).
- `text` is a ready-to-display plain English line. The UI shows `text` and does not rebuild it.

### Edit validation
```python
def validate(timetable: dict, problem: dict) -> list[str]:
    """Returns a list of violation messages. Empty list means valid."""
```
A manual edit that returns any violation is **rejected** and no commit is created.

---

## 8. API (Person 4 owns `api/`)

Base path: `/api`. All bodies and responses are JSON. The frontend talks only to this API.

| Method | Route | Purpose | Body | Response |
|---|---|---|---|---|
| GET | `/api/problem` | Get current input data | none | `ProblemInput` |
| PUT | `/api/problem` | Replace input data | `ProblemInput` | `ProblemInput` |
| POST | `/api/generate` | Run the solver, create a `generate` commit | `{ "message": "..." }` | `{ "commit": Commit }` or `Error` |
| GET | `/api/timetable` | Timetable at HEAD of current branch | none | `Timetable` |
| POST | `/api/edit` | Move or change one slot, validated, creates an `edit` commit | `{ "message": "...", "slot_key": {"batch_id","day","period"}, "new": {"day","period","room_id","teacher_id"} }` | `{ "commit": Commit }` or `Error` |
| GET | `/api/commits` | History, newest first (no snapshots) | none | `[CommitSummary]` |
| GET | `/api/commits/{id}` | One commit with snapshot | none | `Commit` |
| GET | `/api/diff?from=c0006&to=c0007` | Diff two commits | none | `Diff` |
| POST | `/api/revert` | New commit restoring an old snapshot | `{ "commit_id": "c0004" }` | `{ "commit": Commit }` |
| GET | `/api/view?batch=b_se_a` | Grid-friendly view (also `teacher=` and `room=`) | none | `GridView` |
| POST | `/api/seed` | Reset to seeded demo data | none | `{ "ok": true }` |

*Stretch (only if ahead):* `POST /api/branches`, `POST /api/merge`.

### CommitSummary
Same as `Commit` but without `snapshot`.

### GridView
```json
{
  "owner": { "type": "batch", "id": "b_se_a", "name": "SE-A" },
  "grid": [
    [ { "subject": "DBMS", "teacher": "Prof. Sharma", "room": "Room 204" }, null, null ]
  ]
}
```
`grid[period][day]` is a cell or `null`. Names are already resolved for display.

### Error format (every failure uses this)
```json
{
  "error": {
    "code": "CLASH",
    "message": "Prof. Sharma is already teaching SE-B at Wed 14:00.",
    "details": []
  }
}
```
`code` is one of: `"CLASH"`, `"INFEASIBLE"`, `"TIMEOUT"`, `"NOT_FOUND"`, `"BAD_REQUEST"`.
HTTP status: `400` for clash, bad request, and infeasible; `404` for not found; `200` for success.

---

## 9. Folder ownership

```
/
  contract.md          (P4 only)
  main.py              (P4 only: wires everything, serves frontend)
  api/                 (P4)
  solver/              (P1)   solver.py, tests/
  vcs/                 (P2)   commits.py, diff.py, validate.py, tests/
  frontend/            (P3)   React app
  data/seed.json       (P4)   demo data: 6 batches, 12 teachers, 8 rooms
  docs/                (P4)   demo script, README
```

**Rule:** only touch files in your own folder. If you need something from another folder, ask the owner.

---

## 10. Definition of done (per area)

- **Solver:** passes tests on 3 seeded datasets with zero clashes; infeasible input returns readable `reasons`; solves the demo dataset in under 10 seconds.
- **VCS:** diff output matches section 7 exactly; revert never rewrites history; `validate()` catches all 8 constraints.
- **Frontend:** every screen works against mock JSON built from this file *before* the backend exists; the diff view is the first thing a visitor sees.
- **Integration:** live URL works; `main` is always deployable; one-command local run is documented.

---

## 11. Change log

| Version | Date | Change | By |
|---|---|---|---|
| 1.0 | 2026-10-17 | Initial contract | P4 |