import React from 'react';
import { Layers, Bot, Database, Server, Cpu, CheckCircle2, ArrowRight, ShieldCheck, FileText, Code2 } from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-fresh_mint/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="leaf-badge">Twist 3 Verified</span>
            <span className="text-xs text-text_secondary">System Blueprint</span>
          </div>
          <h1 className="text-3xl font-bold text-deep_forest dark:text-fresh_mint mt-1">
            CampusWeave System Architecture
          </h1>
          <p className="text-sm text-text_secondary mt-1">
            Complete architectural mapping of Frontend, Multilingual AI Chatbot, FastAPI Solver Backend, and Version Control Storage.
          </p>
        </div>
      </div>

      {/* Visual Component Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tier 1: Users & Roles */}
        <div className="botanical-card p-5 bg-white dark:bg-gray-800 border-l-4 border-l-leaf">
          <div className="flex items-center gap-2 mb-3 text-forest dark:text-fresh_mint font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>1. Users & Roles</span>
          </div>
          <ul className="space-y-2 text-xs text-text_secondary">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-leaf"></span>Administrator (Full Org & VCS)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-leaf"></span>Dept Coordinator (Workload & Review)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-leaf"></span>Teacher (Schedule & Change Requests)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-leaf"></span>Student (Personalized Classes & Rooms)</li>
          </ul>
        </div>

        {/* Tier 2: Frontend Client */}
        <div className="botanical-card p-5 bg-white dark:bg-gray-800 border-l-4 border-l-lagoon_teal">
          <div className="flex items-center gap-2 mb-3 text-lagoon_teal font-bold text-sm">
            <Layers className="w-4 h-4" />
            <span>2. Frontend Layer</span>
          </div>
          <ul className="space-y-2 text-xs text-text_secondary">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-lagoon_teal"></span>React + Vite SPA</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-lagoon_teal"></span>Bulbasaur Theme Tokens</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-lagoon_teal"></span>i18next Multilingual Engine</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-lagoon_teal"></span>Interactive Grid & Diff Visualizer</li>
          </ul>
        </div>

        {/* Tier 3: Multilingual Chatbot */}
        <div className="botanical-card p-5 bg-white dark:bg-gray-800 border-l-4 border-l-flower_coral">
          <div className="flex items-center gap-2 mb-3 text-flower_coral font-bold text-sm">
            <Bot className="w-4 h-4" />
            <span>3. CampusSprout AI</span>
          </div>
          <ul className="space-y-2 text-xs text-text_secondary">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-flower_coral"></span>Bilingual (English & Hindi)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-flower_coral"></span>POST /api/chat Integration</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-flower_coral"></span>Intent & Role Classification</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-flower_coral"></span>Deterministic Rule Fallback</li>
          </ul>
        </div>

        {/* Tier 4: Backend & VCS Engine */}
        <div className="botanical-card p-5 bg-white dark:bg-gray-800 border-l-4 border-l-earth_brown">
          <div className="flex items-center gap-2 mb-3 text-earth_brown font-bold text-sm">
            <Server className="w-4 h-4" />
            <span>4. Backend & Solver</span>
          </div>
          <ul className="space-y-2 text-xs text-text_secondary">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-earth_brown"></span>FastAPI REST Endpoints</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-earth_brown"></span>OR-Tools / CP-SAT Solver</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-earth_brown"></span>Immutable VCS Commits Tree</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-earth_brown"></span>Conflict Validator & Diff Engine</li>
          </ul>
        </div>
      </div>

      {/* Detailed Chatbot Dataflow Diagram */}
      <div className="botanical-card p-6 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-bold text-deep_forest dark:text-fresh_mint mb-3 flex items-center gap-2">
          <Bot className="w-5 h-5 text-leaf" />
          CampusSprout Chatbot End-to-End Dataflow
        </h3>
        <p className="text-xs text-text_secondary mb-6 leading-relaxed">
          The chatbot is deeply integrated into the security and scheduling pipelines, answering role-specific queries without exposing backend API keys to the browser.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="w-full md:w-1/5 p-3 rounded-xl bg-light_mint dark:bg-gray-700 border border-fresh_mint text-center">
            <span className="font-bold block text-deep_forest dark:text-white">User Prompt</span>
            <span className="text-[11px] text-text_secondary mt-1 block">Hindi or English question entered in widget</span>
          </div>
          <ArrowRight className="hidden md:block w-4 h-4 text-leaf shrink-0" />
          <div className="w-full md:w-1/5 p-3 rounded-xl bg-light_mint dark:bg-gray-700 border border-fresh_mint text-center">
            <span className="font-bold block text-deep_forest dark:text-white">POST /api/chat</span>
            <span className="text-[11px] text-text_secondary mt-1 block">Session role & language dispatched securely</span>
          </div>
          <ArrowRight className="hidden md:block w-4 h-4 text-leaf shrink-0" />
          <div className="w-full md:w-1/5 p-3 rounded-xl bg-light_mint dark:bg-gray-700 border border-fresh_mint text-center">
            <span className="font-bold block text-deep_forest dark:text-white">Intent & Auth Filter</span>
            <span className="text-[11px] text-text_secondary mt-1 block">Validates permissions; checks active timetable</span>
          </div>
          <ArrowRight className="hidden md:block w-4 h-4 text-leaf shrink-0" />
          <div className="w-full md:w-1/5 p-3 rounded-xl bg-light_mint dark:bg-gray-700 border border-fresh_mint text-center">
            <span className="font-bold block text-deep_forest dark:text-white">AI / Rule Fallback</span>
            <span className="text-[11px] text-text_secondary mt-1 block">Generates accurate bilingual response</span>
          </div>
        </div>
      </div>

      {/* Specifications & Hardware / External Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="botanical-card p-6 bg-white dark:bg-gray-800">
          <h4 className="font-bold text-sm text-deep_forest dark:text-white mb-3">External Services & Environment</h4>
          <div className="space-y-3 text-xs text-text_secondary">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
              <div>
                <strong className="text-deep_forest dark:text-gray-200">Hardware Requirements:</strong> Not applicable (Pure web & cloud software platform).
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
              <div>
                <strong className="text-deep_forest dark:text-gray-200">AI Model Provider:</strong> Backend LLM proxy with automatic graceful fallback to the rule-based solver knowledge base.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0 mt-0.5" />
              <div>
                <strong className="text-deep_forest dark:text-gray-200">Data Persistence:</strong> JSON Seed problem store with git-like commit tree tracking every slot change with hash, author, and timestamp.
              </div>
            </div>
          </div>
        </div>

        <div className="botanical-card p-6 bg-white dark:bg-gray-800">
          <h4 className="font-bold text-sm text-deep_forest dark:text-white mb-3">Mermaid Architecture Source</h4>
          <p className="text-xs text-text_secondary mb-2">
            The full source diagram is available under <code className="bg-light_mint px-1.5 py-0.5 rounded text-deep_forest">docs/architecture.mmd</code>.
          </p>
          <pre className="bg-gray-900 text-fresh_mint text-[11px] p-3 rounded-lg overflow-x-auto">
{`graph TD
  Users[Admin, Coordinator, Teacher, Student] <--> UI[React Vite Frontend]
  UI <--> Chat[CampusSprout Floating Assistant]
  UI <--> API[FastAPI Backend /api]
  Chat <--> ChatAPI[POST /api/chat]
  API --> Engine[OR-Tools Solver & Constraint Engine]
  API --> VCS[Immutable VCS Commits Tree]
  ChatAPI --> Resolver[Role Auth & Bilingual Generator]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
