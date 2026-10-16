# workflow.md: Project Overview and Team Workflow

Read this first. Then read `contract.md` (the exact data shapes and API routes).

---

## 1. What we are building

**Buildsaur / Indigo Tech Fest, Software Track 1: Timetable Generator (Campus).**

The problem: timetables made by hand cause clashes. The same teacher is in two places, a room is double-booked, or a batch has two lectures at once.

Our solution: a web app that

1. **Generates a clash-free timetable** automatically from teachers, rooms, batches, and subjects.
2. **Tracks every change like Git.** Each generation or edit is a commit. You can see what changed, compare any two versions, and revert.

**Our twist is the version control.** Most teams will build a generator with a grid. We also answer "what changed, who changed it, and can we undo it?", which is what real timetable admins struggle with.

**One-line pitch:** *"A timetable generator that never clashes, and remembers every change like Git."*

---

## 2. How the system fits together

```
 React UI  --->  FastAPI (api/)  --->  solver/   (OR-Tools CP-SAT: builds a timetable)
 (frontend/)          |
                      +----------->  vcs/        (commits, diff, revert, validation)
                      |
                      +----------->  data/       (seed data + stored commits)
```

- The **frontend** only talks to the **API**.
- The **API** is thin. It calls the solver and the version-control code, and returns JSON.
- The **solver** is a pure function: problem in, timetable out. It touches no files or database.
- The **vcs** code stores snapshots, builds diffs, and validates manual edits.
- The whole app deploys as **one service**: FastAPI serves the built React files.

### Core user flow (this is also the demo)

1. Open the app with seeded data (6 batches, 12 teachers, 8 rooms).
2. Click **Generate**. A clash-free timetable appears and commit `c0001` is created.
3. **Edit** a slot (e.g. move a lecture). If it causes a clash, it's rejected with a clear message. If valid, commit `c0002` is created.
4. Open **History** and **Diff** between `c0001` and `c0002`, shown as plain English.
5. Click **Revert** and a new commit restores the old version.

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| Solver | Python + Google OR-Tools CP-SAT |
| Backend | Python + FastAPI |
| Frontend | React + Tailwind, built to static files |
| Storage | JSON files or SQLite, re-seeded on startup |
| Host | Render or Railway (free tier) |
| AI tools | Antigravity (features), Copilot (inline fixes, tests) |

---

## 4. Who owns what

| Person | Role | Folder | Main job |
|---|---|---|---|
| P1 | Solver lead | `solver/` | OR-Tools model, constraints, clash tests, infeasibility reasons |
| P2 | Version-control lead | `vcs/` | Commits, snapshots, diff, revert, edit validation |
| P3 | Frontend lead | `frontend/` | Forms, timetable grid, history page, diff view |
| P4 | Integration / DevOps | `api/`, `main.py`, `data/`, `docs/`, `contract.md` | API routes, seed data, deploy, demo script, backup video |

**Rule: only edit files in your own folder.** Need something from another folder? Ask the owner in chat.

---

## 5. Day-one setup (first 45 minutes, everyone together)

1. **P4:** create the GitHub repo, add all members, push `contract.md` and `workflow.md`.
2. **P4:** push a FastAPI "hello world" and deploy it to Render or Railway. Confirm the live URL works.
3. **P1:** run a tiny OR-Tools model locally *and on the deployed server*. If it fails on the host, tell the team immediately.
4. **P3:** build mock JSON from `contract.md` so the UI can start without the backend.
5. **P2:** write the commit and diff functions against hand-written sample snapshots.
6. **Everyone:** agree on how to run the project locally with one command, and write it in the README.

---

## 6. Timeline (24 hours)

| Hours | P1 Solver | P2 VCS | P3 Frontend | P4 Integration |
|---|---|---|---|---|
| 0-1 | Setup together | | | |
| 1-7 | Solver with all 8 constraints, 3 seeded tests | Commit, snapshot, diff on sample data | Grid, forms, history page on mock JSON | API routes, seed data, deploy pipeline |
| 7-12 | Soft goals, infeasibility reasons | Revert, edit validation | Connect UI to real API | **First integration test** end to end |
| 12-18 | Speed and edge cases | Diff text polish | Diff view, revert button, error toasts | Fix integration bugs, rehearse flow |
| 18-20 | Bug fixes only | Bug fixes only | Final polish | Bug bash on live URL |
| **20** | **FEATURE FREEZE** | | | |
| 20-22 | Final tests | Final tests | Seed demo screens | Demo script, README |
| 22-24 | Rehearse | Rehearse | Rehearse | **Record backup video**, wake the server |

**Stretch goal (only if ahead at hour 12):** branches and merge with conflict detection. If you're behind, cut this first.

---

## 7. Git rules

- `main` is **always deployable**. Never push to it directly.
- One branch per person: `solver`, `vcs`, `ui`, `infra`.
- Open a pull request and have a teammate glance at it before merging.
- Commit small and often, with clear messages (`solver: add room capacity constraint`).
- **Pull `main` every hour** so you don't drift.
- Never edit another person's folder without telling them.
- Shared files (`contract.md`, `main.py`) change only through P4.
- After every working step: commit, push, and check the live URL.

**Why this matters:** your commit history proves the project was built during the event, and it is your rollback if an AI tool breaks something.

---

## 8. Rules for AI tools (Antigravity and Copilot)

- Only prompt inside your **own folder**.
- Paste `contract.md` into every prompt so generated code matches the shared shapes.
- **Antigravity** builds features. **Copilot** does small inline fixes and tests. Don't let both edit the same file at once.
- **Run the tests yourself** after every AI change. Don't trust "done."
- Ask for small steps, not whole modules. Review each diff before accepting it.
- Never accept code you can't explain. A judge may ask you how it works.

---

## 9. Honest-reuse rule

Nothing in the rules says we can't reuse our own libraries, but nothing says we can. So:

- Build the timetable app, solver, UI, and API **fresh during the event**.
- Public libraries (OR-Tools, FastAPI, React) are fine.
- If anyone reuses their own earlier code (for example, a diff utility), **say so on the first slide**: *"Diff engine adapted from [name]; everything else built today."*
- Ask the organizers once if you can. A one-line message now removes the doubt.

---

## 10. Demo plan (3 to 5 minutes)

| Who | What |
|---|---|
| P1 | Problem in 20 seconds. Click Generate. Show the clash-free grid and say how the solver works. |
| P2 | **The hook:** make an edit, show the plain English diff, then revert. Try a clashing edit and show it rejected. |
| P3 | Drives the screen and switches between batch, teacher, and room views. |
| P4 | Mentions the live URL, handles questions on deployment, has the backup video ready. |

**Open the demo with the diff view, not the grid.** Within 30 seconds the judges should see what makes this different.

**Backup plan:** run the app locally with one command, and keep the recorded video on a phone. Open the live URL 5 minutes before judging to wake the free-tier server.

---

## 11. Common problems

| Problem | Fix |
|---|---|
| Solver is too slow | Set a time limit (10 s). Reduce soft goals. Check the dataset isn't over-constrained. |
| Solver says infeasible | Read `reasons`. Usually a teacher or batch has more lectures than available slots. |
| UI and API shapes don't match | `contract.md` wins. Fix the code, not the contract (unless P4 bumps the version). |
| AI tool broke working code | Roll back to the last good commit. Don't debug the generated mess. |
| Deploy works locally but not on the host | Check the start command and `requirements.txt`. Test OR-Tools on the host early. |
| Free-tier server is asleep | Open the URL before the demo. Keep the local copy ready. |
| Disk wiped on restart | The app re-seeds demo data on startup. |

---

## 12. Checklist before the demo

- [ ] Live URL works and has been opened recently
- [ ] Seed data loads and Generate produces zero clashes
- [ ] Edit, diff, and revert all work on the live site
- [ ] A clashing edit is rejected with a readable message
- [ ] Backup video recorded and on a phone
- [ ] Local one-command run tested on a laptop
- [ ] First slide declares any reused code
- [ ] Everyone knows their part of the demo