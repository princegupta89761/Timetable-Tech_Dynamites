# CampusWeave — Presentation Outline & Slide Deck Guide
**Event:** Indigo Tech Fest, Round 2: "Buildasaur — The Twist"  
**Theme:** Nature-Inspired Academic Scheduling with Bulbasaur Botanical Styling  
**Primary Color Tokens:** Forest Green (`#174D35`), Leaf Green (`#29965B`), Fresh Mint (`#CFF4D7`), Botanical Cream (`#FAF8EF`)

---

### Slide 1: Title & Team
- **Title:** CampusWeave — Intelligent Academic Scheduling & Timetable VCS
- **Subtitle:** Nature-Inspired Efficiency, Constraint Solvers, and Multilingual AI Assistance
- **Team:** Tech Dynamites
- **Aesthetic:** Forest Green header, sprout icon, botanical borders.

### Slide 2: The Problem
- Complex university constraints: faculty preferences, room capacities, course dependencies.
- Manual scheduling takes weeks and frequently causes double-booking and room collisions.
- Schedule changes often cause cascade failures with no history or undo capabilities.

### Slide 3: The Solution
- **Automated Generation:** OR-Tools CP-SAT solver generates clash-free schedules in seconds.
- **Git-like VCS:** Track every slot edit with commit IDs, author stamps, visual diffs, and instant reverts.
- **Role Workspaces:** Administrator, Department Coordinator, Teacher, and Student views.

### Slide 4: Twist 1 — Bulbasaur-Inspired Theme
- Palette tokens: Forest Green, Deep Forest, Leaf Green, Fresh Mint, Botanical Cream, Flower Coral.
- Organic card borders, leaf accent badges, clear readability, and dark mode support.
- Fully accessible typography combining Inter and Noto Sans Devanagari.

### Slide 5: Twist 2 — CampusSprout Multilingual AI Assistant
- Live floating assistant available across all dashboards.
- Native bilingual support: Fluent English and natural Hindi in Devanagari.
- Role-aware query handling: answers "Where is my next class?", "How does generation work?", "Explain conflicts".
- Clickable deep-links that guide users directly to app actions.
- Secure backend proxy: zero frontend API key leaks with automatic rule-based fallback.

### Slide 6: Twist 3 — Complete System Architecture
- 4-Tier Blueprint: Actors → React SPA → FastAPI Solver → Immutable VCS Storage.
- Clear dataflow showing user prompt → `/api/chat` → Role Filter → Bilingual Response.
- Software-only cloud deployment with zero hardware prerequisites.

### Slide 7: Live Demo Highlights
- Step 1: Switch between Admin, Coordinator, Teacher, and Student roles.
- Step 2: Run 1-click clash-free timetable generation.
- Step 3: Inspect commit history and view visual diffs.
- Step 4: Chat with CampusSprout in English.
- Step 5: Switch language to Hindi and test localized schedule questions.
- Step 6: Review the interactive in-app System Architecture page.

### Slide 8: Technical Limitations & Future Scope
- **Current Limitations:** In-memory VCS state persists for server session; seed.json stores base data.
- **Future Scope:** Multi-campus cross-semester optimization, biometric attendance sync, WhatsApp/SMS schedule change alerts.
- **Closing:** CampusWeave simplifies college logistics with nature-inspired harmony and mathematical precision.
