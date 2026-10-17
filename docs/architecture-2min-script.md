# CampusWeave — Two-Minute System Architecture Walkthrough

**Target Audience:** Hackathon Judges & Technical Reviewers  
**Speaker Duration:** 2 minutes (120 seconds)

---

### [0:00 - 0:25] Entry Point & Frontend Architecture
> *"Good morning, judges. Welcome to CampusWeave. Our platform is built on a responsive React 18 single-page application styled using our custom Bulbasaur-inspired botanical design system. We use CSS design tokens with Forest Green, Leaf Green, and Mint accents to create an organic, distraction-free environment.*  
> *Users enter through our role-based portal supporting four distinct workflows: Administrator, Department Coordinator, Faculty, and Student. Every role sees only their authorized views and schedules."*

---

### [0:25 - 0:50] Timetable Solver & VCS Commit Tree
> *"At the core of the backend is a high-performance FastAPI service. When an administrator requests a timetable generation, the request is sent to our Constraint Satisfaction Engine powered by Google OR-Tools CP-SAT.*  
> *The engine enforces zero hard conflicts across teachers, room capacities, and student batches within a 10-second bounded window.*  
> *What makes CampusWeave unique is our Git-like Version Control System (VCS). Every timetable generation, slot edit, or manual swap is saved as an immutable commit with parent pointers, author metadata, and automated diff calculations. If a conflict is ever detected, users can instantly inspect visual diffs and revert with zero data loss."*

---

### [0:50 - 1:25] Twist 2: Multilingual AI Chatbot (CampusSprout)
> *"Now, let's examine our second twist: CampusSprout, our multilingual scheduling assistant. It floats on every page and natively supports English and authentic Hindi in Devanagari script.*  
> *When a user asks a question—such as 'Where is my next class?' or 'How does timetable generation work?'—the request is sent securely to `POST /api/chat`.*  
> *Notice our security design: no external API keys are exposed to the client. The backend validates the user's role and retrieves authorized timetable data. If an external AI key like Gemini is configured, it proxies the request; otherwise, our deterministic, localized rule-based engine provides immediate, reliable guidance with direct deep-links to app pages."*

---

### [1:25 - 2:00] Data Tier & Cloud Architecture
> *"Finally, our storage architecture uses a JSON-based seed store combined with in-memory commit snapshots for ultra-fast response times. Our deployment is entirely cloud-native and software-only with no specialized hardware dependencies.*  
> *CampusWeave bridges mathematical rigor, version control safety, and natural multilingual interaction into one cohesive platform. Thank you!"*
