# CampusWeave — 3 to 4 Minute Live Demo Script
**Judge Demo Flow for Buildasaur Round 2**

---

### Step 1: Landing Page & Botanical Aesthetic (45 seconds)
1. **Show Topbar:** Highlight the Bulbasaur Botanical Theme (Forest Green `#174D35`, Leaf Green `#29965B`, Fresh Mint `#CFF4D7`).
2. **Toggle Theme:** Demonstrate seamless switching between Light Botanical Cream and Dark Mode.
3. **Role Switcher:** Open the Topbar Role Selector. Switch between:
   - **Administrator:** Shows institution faculty load, room allocations, and conflict overview.
   - **Coordinator:** Shows department timetable review and pending change requests.
   - **Teacher:** Shows Dr. Alan Turing's daily classes and teaching load.
   - **Student:** Shows Batch CSE-B1 today's lecture schedule and classroom locations.

---

### Step 2: Clash-Free Timetable Generation (45 seconds)
1. Navigate to **Solver Generator** (`/generate`).
2. Explain: *"Our backend runs Google OR-Tools CP-SAT to solve constraint satisfaction across teachers, rooms, and batches within 10 seconds."*
3. Click **"Generate Clash-Free Timetable"**.
4. Observe the success notification and the newly created VCS commit hash.
5. Navigate to **Timetable Grid** (`/timetable`) to view the interactive schedule filtered by Batch, Teacher, or Room.

---

### Step 3: Version Control & Conflict Inspection (45 seconds)
1. Navigate to **VCS Commit History** (`/history`).
2. Show the commit history list: each commit contains author, message, timestamp, and slot count.
3. Select two commits and click **Compare Diffs**.
4. Point out the visual slot-level diff table showing exactly which periods were moved or swapped.
5. Explain: *"Our immutable VCS structure guarantees zero silent regressions and allows instant 1-click rollbacks."*

---

### Step 4: Multilingual AI Chatbot (CampusSprout) (60 seconds)
1. Click the floating **CampusSprout Assistant** widget in the bottom-right corner.
2. Notice the welcome message and role badge.
3. **English Query:** Click suggestion chip: *"How does timetable generation work?"*
   - Chatbot responds with the exact steps and displays a direct button: **"→ Go to Solver Generator"**.
   - Click the button to demonstrate deep-linking navigation.
4. **Hindi Switch:** Click the language toggle button **"हिन्दी"** in the chat header.
   - The welcome message dynamically translates into correct Hindi in Devanagari script.
5. **Hindi Query:** Click suggestion chip: *"आज का मेरा टाइमटेबल दिखाएं"*.
   - Chatbot answers naturally in Hindi with role-aware class and room information and a button: **"→ टाइमटेबल ग्रिड देखें"**.

---

### Step 5: System Architecture Page (30 seconds)
1. Navigate to **System Architecture** (`/architecture`) in the sidebar.
2. Show the 4-tier visual diagram: System Actors → Frontend SPA → CampusSprout AI → FastAPI Solver & VCS Engine.
3. Highlight the Chatbot dataflow: prompt → `/api/chat` → Role validation → Rule-based fallback.
4. Conclude: *"All three hackathon twists are completely implemented, verified, and running live."*
