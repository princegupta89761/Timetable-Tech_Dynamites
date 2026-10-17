import React, { useState } from 'react';
import { Users, BookOpen, Clock, Calendar, AlertTriangle, CheckCircle, FileText, Bell, BarChart2, Shield, Sprout, Leaf, Zap } from 'lucide-react';

export default function RoleDashboardPage({ role = 'admin', onNavigate }) {
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Bulbasaur Nature Vital Signs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bulba-card p-4 bg-white dark:bg-gray-800 border-l-4 border-l-leaf">
          <div className="flex items-center justify-between text-xs text-text_secondary">
            <span>Faculty Members</span>
            <Users className="w-4 h-4 text-leaf" />
          </div>
          <div className="text-2xl font-black text-deep_forest dark:text-white mt-1.5">48 Active</div>
          <span className="text-[11px] text-leaf font-semibold mt-1 inline-flex items-center gap-1">
            <Sprout className="w-3 h-3" /> 100% Availability logged
          </span>
        </div>
        <div className="bulba-card p-4 bg-white dark:bg-gray-800 border-l-4 border-l-lagoon_teal">
          <div className="flex items-center justify-between text-xs text-text_secondary">
            <span>Lecture Halls / Labs</span>
            <BookOpen className="w-4 h-4 text-lagoon_teal" />
          </div>
          <div className="text-2xl font-black text-deep_forest dark:text-white mt-1.5">24 Allocated</div>
          <span className="text-[11px] text-lagoon_teal font-semibold mt-1 inline-flex items-center gap-1">
            <Leaf className="w-3 h-3" /> 4 smart labs ready
          </span>
        </div>
        <div className="bulba-card p-4 bg-white dark:bg-gray-800 border-l-4 border-l-leaf">
          <div className="flex items-center justify-between text-xs text-text_secondary">
            <span>Active Clashes</span>
            <Zap className="w-4 h-4 text-sunshine_yellow" />
          </div>
          <div className="text-2xl font-black text-deep_forest dark:text-white mt-1.5">0 Clashes</div>
          <span className="text-[11px] text-leaf font-semibold mt-1 inline-flex items-center gap-1">
            🌱 Bulbasaur Zero-Clash
          </span>
        </div>
        <div className="bulba-card p-4 bg-white dark:bg-gray-800 border-l-4 border-l-bulb_green">
          <div className="flex items-center justify-between text-xs text-text_secondary">
            <span>Publication State</span>
            <CheckCircle className="w-4 h-4 text-bulb_green" />
          </div>
          <div className="text-2xl font-black text-deep_forest dark:text-white mt-1.5">Published</div>
          <span className="text-[11px] text-text_secondary mt-1 inline-block">Term Fall 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bulba-card p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-deep_forest dark:text-white flex items-center gap-2">
              <Sprout className="w-4 h-4 text-leaf" />
              <span>Institution Garden Controls</span>
            </h3>
            <span className="leaf-badge text-[10px]">Full Access</span>
          </div>
          <p className="text-xs text-text_secondary mb-4 leading-relaxed">
            Manage academic faculties, trigger CP-SAT solar beam timetable generation, and inspect atomic commit histories with visual rollback.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => onNavigate('generate')} className="bg-gradient-to-r from-forest to-leaf hover:from-leaf hover:to-forest text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-sm">
              Trigger Solar Beam Solver
            </button>
            <button onClick={() => onNavigate('timetable')} className="bg-light_mint text-deep_forest hover:bg-fresh_mint text-xs px-4 py-2.5 rounded-xl font-bold transition border border-fresh_mint">
              Inspect Schedule Grid
            </button>
            <button onClick={() => onNavigate('history')} className="border border-fresh_mint text-forest hover:bg-light_mint text-xs px-4 py-2.5 rounded-xl font-bold transition">
              View VCS Commit Logs
            </button>
          </div>
        </div>

        <div className="bulba-card p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-deep_forest dark:text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-leaf" />
              <span>Resource Growth Analytics</span>
            </h3>
            <span className="leaf-badge text-[10px]">Optimal</span>
          </div>
          <div className="space-y-3 text-xs text-text_secondary">
            <div className="flex justify-between items-center py-1.5 border-b border-fresh_mint/40">
              <span>Average Faculty Weekly Load</span>
              <strong className="text-deep_forest dark:text-white font-bold">18.4 hrs/wk (Balanced)</strong>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-fresh_mint/40">
              <span>Room Utilization Efficiency</span>
              <strong className="text-deep_forest dark:text-white font-bold">92.6% (Eco-friendly)</strong>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span>Solver Convergence Time</span>
              <strong className="text-deep_forest dark:text-white font-bold">1.2s (Bounded &lt; 10s)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCoordinatorDashboard = () => (
    <div className="space-y-6">
      <div className="bulba-card p-6 bg-white dark:bg-gray-800 border-l-4 border-l-lagoon_teal">
        <div className="flex items-center justify-between">
          <div>
            <span className="leaf-badge text-[10px] mb-2">Department Node</span>
            <h3 className="font-bold text-base text-deep_forest dark:text-white">
              CSE Department Workload & Review
            </h3>
            <p className="text-xs text-text_secondary mt-1">
              12 batches, 36 weekly lecture blocks, 0 cross-department room collisions.
            </p>
          </div>
          <button onClick={() => onNavigate('timetable')} className="bg-leaf hover:bg-forest text-white text-xs px-4 py-2 rounded-xl font-bold transition">
            View Dept Grid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bulba-card p-5 bg-white dark:bg-gray-800">
          <span className="text-xs text-text_secondary font-medium">Pending Change Requests</span>
          <div className="text-2xl font-black text-sunshine_yellow mt-1">2 Pending</div>
          <span className="text-[11px] text-text_secondary mt-1 block">Room swap: Prof. Alan → Lab 3</span>
        </div>
        <div className="bulba-card p-5 bg-white dark:bg-gray-800">
          <span className="text-xs text-text_secondary font-medium">Department Timetable Draft</span>
          <div className="text-2xl font-black text-leaf mt-1">Approved</div>
          <span className="text-[11px] text-text_secondary mt-1 block">Ready for semester release</span>
        </div>
        <div className="bulba-card p-5 bg-white dark:bg-gray-800">
          <span className="text-xs text-text_secondary font-medium">Department Alerts</span>
          <div className="text-2xl font-black text-deep_forest dark:text-white mt-1">1 New</div>
          <span className="text-[11px] text-text_secondary mt-1 block">Faculty meeting at 4:00 PM</span>
        </div>
      </div>
    </div>
  );

  const renderTeacherDashboard = () => (
    <div className="space-y-6">
      <div className="bulba-card p-6 bg-white dark:bg-gray-800 border-l-4 border-l-leaf">
        <div className="flex items-center justify-between">
          <div>
            <span className="leaf-badge text-[10px] mb-1">Faculty Portal</span>
            <h3 className="font-bold text-base text-deep_forest dark:text-white">
              My Teaching Schedule — Dr. Alan Turing
            </h3>
            <p className="text-xs text-text_secondary mt-1">
              Current Load: 16 teaching hours/week • 4 Assigned Subjects
            </p>
          </div>
          <button onClick={() => onNavigate('timetable')} className="bg-leaf hover:bg-forest text-white text-xs px-4 py-2 rounded-xl font-bold transition">
            Open My Schedule
          </button>
        </div>
      </div>

      <div className="bulba-card p-6 bg-white dark:bg-gray-800">
        <h4 className="font-bold text-xs uppercase tracking-wider text-forest dark:text-fresh_mint mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-leaf" />
          <span>Today's Classes</span>
        </h4>
        <div className="space-y-2.5 text-xs">
          <div className="p-3.5 rounded-xl bg-light_mint/80 border border-fresh_mint flex items-center justify-between">
            <div>
              <strong className="text-deep_forest text-sm block">Algorithms & Optimization (CS204)</strong>
              <span className="text-[11px] text-text_secondary mt-0.5 block">09:00 AM – 10:00 AM | Room 102 | Batch B1</span>
            </div>
            <span className="leaf-badge">Completed</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-gray-700 border border-fresh_mint flex items-center justify-between shadow-xs">
            <div>
              <strong className="text-deep_forest dark:text-white text-sm block">Machine Learning (CS402)</strong>
              <span className="text-[11px] text-text_secondary mt-0.5 block">11:15 AM – 12:15 PM | Lab 2 | Batch B3</span>
            </div>
            <span className="bg-sunshine_yellow/25 text-earth_brown border border-sunshine_yellow/50 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Upcoming Next
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      <div className="bulba-card p-6 bg-white dark:bg-gray-800 border-l-4 border-l-fresh_mint">
        <div className="flex items-center justify-between">
          <div>
            <span className="leaf-badge text-[10px] mb-1">Student Portal</span>
            <h3 className="font-bold text-base text-deep_forest dark:text-white">
              Student Timetable — Batch CSE-B1
            </h3>
            <p className="text-xs text-text_secondary mt-1">
              Semester 4 • Academic Year 2026 • Division B
            </p>
          </div>
          <button onClick={() => onNavigate('timetable')} className="bg-leaf hover:bg-forest text-white text-xs px-4 py-2 rounded-xl font-bold transition">
            View Batch Schedule
          </button>
        </div>
      </div>

      <div className="bulba-card p-6 bg-white dark:bg-gray-800">
        <h4 className="font-bold text-xs uppercase tracking-wider text-forest dark:text-fresh_mint mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-leaf" />
          <span>Today's Lectures</span>
        </h4>
        <div className="space-y-2.5 text-xs">
          <div className="p-3.5 rounded-xl bg-light_mint/80 border border-fresh_mint flex items-center justify-between">
            <div>
              <strong className="text-deep_forest text-sm block">Data Structures (CS201)</strong>
              <span className="text-[11px] text-text_secondary mt-0.5 block">09:00 AM | Room 201 | Prof. Grace Hopper</span>
            </div>
            <span className="leaf-badge">Attended</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-gray-700 border border-fresh_mint flex items-center justify-between shadow-xs">
            <div>
              <strong className="text-deep_forest dark:text-white text-sm block">Computer Architecture (CS202)</strong>
              <span className="text-[11px] text-text_secondary mt-0.5 block">10:15 AM | Hall 3 | Prof. John von Neumann</span>
            </div>
            <span className="bg-fresh_mint text-forest text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Next Lecture
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-fresh_mint/60 pb-4">
        <div>
          <span className="leaf-badge capitalize">
            <Sprout className="w-3.5 h-3.5 text-leaf" />
            {role} Workspace
          </span>
          <h2 className="text-2xl font-black text-deep_forest dark:text-fresh_mint mt-1">
            {role === 'admin' && 'Institutional Administrator Console'}
            {role === 'coordinator' && 'Department Coordinator Workspace'}
            {role === 'teacher' && 'Faculty Member Workspace'}
            {role === 'student' && 'Student Academic Hub'}
          </h2>
        </div>
      </div>

      {role === 'admin' && renderAdminDashboard()}
      {role === 'coordinator' && renderCoordinatorDashboard()}
      {role === 'teacher' && renderTeacherDashboard()}
      {role === 'student' && renderStudentDashboard()}
    </div>
  );
}
