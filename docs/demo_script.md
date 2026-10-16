# Buildsaur Demo Script (3 to 5 Minutes)

> **Goal:** Wow judges within the first 30 seconds by highlighting our twist: **Git-style version control and plain-English diffs for university timetables**.

---

## 🎬 Roles & Timing

| Speaker | Section | Duration | Key Action |
|---|---|---|---|
| **P1** | The Problem & Solver Engine | 45 sec | Problem pitch + Click **Generate** |
| **P2** | **The Hook:** Version Control, Diff & Revert | 90 sec | Edit slot, inspect Diff, Revert, trigger Clash rejection |
| **P3** | Interactive Grid & Multi-Entity Views | 45 sec | Switch Batch / Teacher / Room views |
| **P4** | Architecture, Deployment & Wrap-Up | 30 sec | Live URL, single-service deployment, Q&A |

---

## ⏱️ Step-by-Step Script

### Minute 0:00 - 0:45: The Problem & Automatic Generation (P1)
1. **The Hook:**
   > *"Every semester, university admins spend days manually scheduling classes, only to discover teachers double-booked or lab rooms overcrowded. Most timetable tools just give you a static grid. Buildsaur does something completely different: it generates clash-free schedules in seconds, and remembers every single change like Git."*
2. **Action:**
   - Show the app pre-loaded with seeded demo data: **6 batches, 12 teachers, 8 rooms**.
   - Click **Generate**.
3. **Voiceover:**
   > *"Under the hood, Google OR-Tools CP-SAT solves all 8 hard constraints—teacher availability, room capacity, room types, and 2-period consecutive lab blocks—in under 3 seconds. The moment it solves, it automatically creates commit `c0001`."*

---

### Minute 0:45 - 2:15: The Twist: Git Version Control for Schedules (P2)
1. **Making an Edit:**
   > *"In real life, timetables change constantly. A professor asks to move their lecture. Let's move Prof. Sharma's DBMS lecture from Tuesday 11:15 to Wednesday 14:00."*
   - Drag or edit the slot. The edit succeeds and creates commit `c0002`.
2. **Plain-English Diff:**
   - Switch to the **Diff** tab comparing `c0001` to `c0002`.
   > *"Look at this diff. Instead of messy JSON or cell highlights, Buildsaur explains the exact impact in human language:  
   `SE-A DBMS (Prof. Sharma): Tue 11:15 Room 101 -> Wed 14:00 Room 104`."*
3. **Catching Clashes Pre-Commit:**
   > *"What if an admin makes an illegal move? Let's try moving a class into a room that's already booked at the exact same hour."*
   - Attempt a clashing move.
   - The UI displays an error toast: `400 CLASH: Room double-booked`.
   > *"The system validates against all 8 hard constraints before touching the history. Zero corrupted timetables, zero clashing commits."*
4. **Instant Revert:**
   - Click **Revert**.
   > *"Made a mistake? One click on Revert creates commit `c0003` restoring the exact previous state without rewriting history."*

---

### Minute 2:15 - 3:00: Multi-Entity Grid Views (P3)
1. **Action:**
   - Switch between **Batch View (`b_se_a`)**, **Teacher View (`t01`)**, and **Room View (`r101`)**.
2. **Voiceover:**
   > *"Admins, department heads, and professors see the timetable from their own perspective. The `/api/view` endpoint automatically aggregates schedules into 2D matrices formatted for instant display on any device."*

---

### Minute 3:00 - 3:30: Engineering & Deployment (P4)
1. **Voiceover:**
   > *"Buildsaur is architected for zero-maintenance deployment:  
   - Pure Python backend with FastAPI and Google OR-Tools.  
   - Atomic disk-based JSON persistence with crash recovery.  
   - Compiled React frontend served directly by the FastAPI backend as a single deployable unit on free cloud tiers.  
   - 39 automated tests guaranteeing 100% clash freedom and contract compliance."*
2. **Close:**
   > *"Thank you! We'd love to take your questions."*

---

## 🛡️ Backup Contingencies
- **Slow Server Wakeup:** Ping the live URL 5 minutes before presentation to ensure the instance is warm.
- **Network Drop:** Run locally with one command: `python main.py` on `localhost:8000`.
- **Hardware Failure:** Keep the pre-recorded backup demo video ready on a smartphone.
