# CampusWeave — Intelligent College Timetable Generation & Scheduling

> Built for Hackathon: **Buildasaur – Indigo Tech Fest, Round 2: The Twist**  
> Team: **Tech Dynamites**  
> Theme: **Bulbasaur Botanical Aesthetic**

---

## 🌟 The Three Mandatory Twists

### 🌿 Twist 1: Bulbasaur-Inspired Theme
- **Color Palette:** Curated botanical palette using CSS tokens:
  - Forest Green (`#174D35`), Deep Forest (`#103B2B`), Leaf Green (`#29965B`)
  - Fresh Mint (`#CFF4D7`), Light Mint (`#EAF9ED`), Botanical Cream (`#FAF8EF`)
  - Earth Brown (`#8B6745`), Sunshine Yellow (`#F3C969`), Flower Coral (`#E98176`), Lagoon Teal (`#278F89`)
- **Aesthetic:** Organic rounded cards, custom leaf badges, subtle botanical gradients, dark/light mode toggle.
- **Role Hubs:** Four dedicated views for **Administrator**, **Department Coordinator**, **Teacher**, and **Student**.

### 🌱 Twist 2: Multilingual AI Chatbot ("CampusSprout Assistant")
- **Placement:** Floating widget bottom-right on all pages.
- **Languages Supported:** Native **English** and natural **Hindi** in authentic Devanagari script (`Noto Sans Devanagari`), with dynamic language switching.
- **Capabilities:**
  - Guided help (timetable generation, conflict explanation, navigation).
  - Role-aware schedule answers ("Where is my next class?").
  - Clickable action buttons that navigate directly to relevant pages.
- **Architecture:** Communicates with backend `POST /api/chat`, never leaking AI provider keys to the browser.
- **Fallback Engine:** Deterministic rule-based localized engine when no external AI key is configured.

### 🏛️ Twist 3: Complete System Architecture
- **In-App Blueprint:** Live interactive **System Architecture** page (`/architecture`).
- **Mermaid Diagram:** Available in [`docs/architecture.mmd`](./architecture.mmd).
- **Presentation Support:**
  - 2-Minute spoken architecture script: [`docs/architecture-2min-script.md`](./architecture-2min-script.md)
  - 3-4 Minute live judge demo flow: [`docs/demo-flow.md`](./demo-flow.md)
  - Slide presentation guide: [`docs/presentation-outline.md`](./presentation-outline.md)
  - draw.io / eraser.io text format: [`docs/architecture-drawio.txt`](./architecture-drawio.txt)

---

## 🚀 Quickstart & Running the App

### 1. Frontend (React 18 + Vite)
```bash
cd frontend
npm install
npm run dev
# App will run at http://localhost:5185 or http://localhost:5186
```

### 2. Backend (FastAPI + OR-Tools)
```bash
# In repository root
pip install -r requirements.txt
py -m uvicorn main:app --reload --port 8000
# API will run at http://localhost:8000
```

### 3. Running Backend Tests
```bash
py -m pytest api/tests/
```

### 4. Running Frontend Production Build
```bash
cd frontend
npm run build
```
