import React, { useState } from 'react';
import { Users, BookOpen, Clock, Calendar, AlertTriangle, CheckCircle, FileText, Bell, BarChart2, Shield } from 'lucide-react';

export default function RoleDashboardPage({ role = 'admin', onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Role-specific customized tabs and content
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="botanical-card p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-text_secondary">
            <span>Faculty Members</span>
            <Users className="w-4 h-4 text-leaf" />
          </div>
          <div className="text-2xl font-bold text-deep_forest dark:text-white mt-2">48 Active</div>
          <span className="text-[11px] text-leaf font-medium mt-1 inline-block">100% Availability logged</span>
        </div>
        <div className="botanical-card p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-text_secondary">
            <span>Lecture Halls / Labs</span>
            <BookOpen className="w-4 h-4 text-lagoon_teal" />
          </div>
          <div className="text-2xl font-bold text-deep_forest dark:text-white mt-2">24 Allocated</div>
          <span className="text-[11px] text-lagoon_teal font-medium mt-1 inline-block">4 smart labs ready</span>
        </div>
        <div className="botanical-card p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-text_secondary">
            <span>Current Clashes</span>
            <AlertTriangle className="w-4 h-4 text-flower_coral" />
          </div>
          <div className="text-2xl font-bold text-deep_forest dark:text-white mt-2">0 Clashes</div>
          <span className="text-[11px] text-leaf font-medium mt-1 inline-block">VCS Verified</span>
        </div>
        <div className="botanical-card p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-text_secondary">
            <span>Publication State</span>
            <CheckCircle className="w-4 h-4 text-leaf" />
          </div>
          <div className="text-2xl font-bold text-deep_forest dark:text-white mt-2">Published</div>
          <span className="text-[11px] text-text_secondary mt-1 inline-block">Fall 2026 Academic Term</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="botanical-card p-5 bg-white dark:bg-gray-800">
          <h3 className="font-bold text-sm text-deep_forest dark:text-white mb-3">Institution Overview & Quick Actions</h3>
          <p className="text-xs text-text_secondary mb-4">
            Manage institutional sessions, trigger CP-SAT solver generations, review conflict logs, and inspect commit diffs.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNavigate('generate')} className="bg-leaf hover:bg-forest text-white text-xs px-3.5 py-2 rounded-lg font-medium transition">
              Run Clash-Free Generator
            </button>
            <button onClick={() => onNavigate('timetable')} className="bg-light_mint text-deep_forest hover:bg-fresh_mint text-xs px-3.5 py-2 rounded-lg font-medium transition">
              Inspect Timetable Grid
            </button>
            <button onClick={() => onNavigate('history')} className="border border-fresh_mint text-forest hover:bg-light_mint text-xs px-3.5 py-2 rounded-lg font-medium transition">
              View VCS Commit Logs
            </button>
          </div>
        </div>

        <div className="botanical-card p-5 bg-white dark:bg-gray-800">
          <h3 className="font-bold text-sm text-deep_forest dark:text-white mb-3">Resource Analytics</h3>
          <div className="space-y-2 text-xs text-text_secondary">
            <div className="flex justify-between items-center py-1 border-b border-fresh_mint/40">
              <span>Average Faculty Weekly Load</span>
              <strong className="text-deep_forest dark:text-white">18.4 hrs/wk</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-fresh_mint/40">
              <span>Room Utilization Efficiency</span>
              <strong className="text-deep_forest dark:text-white">92.6%</strong>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Solver Time Limit</span>
              <strong className="text-deep_forest dark:text-white">10.0 seconds</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCoordinatorDashboard = () => (
    <div className="space-y-6">
      <div className="botanical-card p-5 bg-white dark:bg-gray-800 border-l-4 border-l-lagoon_teal">
        <h3 className="font-bold text-sm text-deep_forest dark:text-white mb-2">Department Workload & Availability Review</h3>
        <p className="text-xs text-text_secondary">
          Computer Science & Engineering: 12 batches, 36 weekly lecture blocks, 0 cross-department room collisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="botanical-card p-4 bg-white dark:bg-gray-800">
          <span className="text-xs text-text_secondary">Change Requests Pending</span>
          <div className="text-xl font-bold text-sunshine_yellow mt-1">2 Pending</div>
          <span className="text-[11px] text-text_secondary">Room swap: Prof. Alan → Lab 3</span>
        </div>
        <div className="botanical-card p-4 bg-white dark:bg-gray-800">
          <span className="text-xs text-text_secondary">Department Timetable Draft</span>
          <div className="text-xl font-bold text-leaf mt-1">Approved</div>
          <span className="text-[11px] text-text_secondary">Ready for publishing</span>
        </div>
        <div className="botanical-card p-4 bg-white dark:bg-gray-800">
          <span className="text-xs text-text_secondary">Department Notifications</span>
          <div className="text-xl font-bold text-deep_forest dark:text-white mt-1">1 New</div>
          <span className="text-[11px] text-text_secondary">Faculty meeting at 4:00 PM</span>
        </div>
      </div>
    </div>
  );

  const renderTeacherDashboard = () => (
    <div className="space-y-6">
      <div className="botanical-card p-5 bg-white dark:bg-gray-800 border-l-4 border-l-leaf">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-deep_forest dark:text-white">My Teaching Schedule — Dr. Alan Turing</h3>
            <p className="text-xs text-text_secondary mt-1">
              Current Load: 16 teaching hours/week | 4 Courses: CS101, CS204, CS305, CS402
            </p>
          </div>
          <button onClick={() => onNavigate('timetable')} className="bg-leaf hover:bg-forest text-white text-xs px-3 py-1.5 rounded-lg transition font-medium">
            Open Full Grid
          </button>
        </div>
      </div>

      <div className="botanical-card p-5 bg-white dark:bg-gray-800">
        <h4 className="font-bold text-xs uppercase tracking-wider text-text_secondary mb-3">Today's Classes</h4>
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg bg-light_mint/80 border border-fresh_mint flex items-center justify-between">
            <div>
              <strong className="text-deep_forest">Algorithms (CS204)</strong>
              <span className="block text-[11px] text-text_secondary">09:00 AM – 10:00 AM | Room 102 | Batch B1</span>
            </div>
            <span className="leaf-badge">Completed</span>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-700 border border-fresh_mint flex items-center justify-between">
            <div>
              <strong className="text-deep_forest dark:text-white">Machine Learning (CS402)</strong>
              <span className="block text-[11px] text-text_secondary">11:15 AM – 12:15 PM | Lab 2 | Batch B3</span>
            </div>
            <span className="bg-sunshine_yellow/20 text-earth_brown border border-sunshine_yellow/40 text-[10px] font-bold px-2 py-0.5 rounded-full">Next Class</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      <div className="botanical-card p-5 bg-white dark:bg-gray-800 border-l-4 border-l-fresh_mint">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-deep_forest dark:text-white">Student Timetable Portal — Batch CSE-B1</h3>
            <p className="text-xs text-text_secondary mt-1">
              Semester 4 | Academic Year 2026 | Division B
            </p>
          </div>
          <button onClick={() => onNavigate('timetable')} className="bg-leaf hover:bg-forest text-white text-xs px-3 py-1.5 rounded-lg transition font-medium">
            View My Timetable
          </button>
        </div>
      </div>

      <div className="botanical-card p-5 bg-white dark:bg-gray-800">
        <h4 className="font-bold text-xs uppercase tracking-wider text-text_secondary mb-3">Today's Class Schedule</h4>
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg bg-light_mint/80 border border-fresh_mint flex items-center justify-between">
            <div>
              <strong className="text-deep_forest">Data Structures (CS201)</strong>
              <span className="block text-[11px] text-text_secondary">09:00 AM | Room 201 | Prof. Grace Hopper</span>
            </div>
            <span className="leaf-badge">Present</span>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-gray-700 border border-fresh_mint flex items-center justify-between">
            <div>
              <strong className="text-deep_forest dark:text-white">Computer Architecture (CS202)</strong>
              <span className="block text-[11px] text-text_secondary">10:15 AM | Hall 3 | Prof. John von Neumann</span>
            </div>
            <span className="bg-fresh_mint text-forest text-[10px] font-bold px-2 py-0.5 rounded-full">Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-fresh_mint/60 pb-4">
        <div>
          <span className="leaf-badge capitalize">{role} Workspace</span>
          <h2 className="text-2xl font-bold text-deep_forest dark:text-fresh_mint mt-1">
            {role === 'admin' && 'Institutional Administrator Console'}
            {role === 'coordinator' && 'Department Coordinator Dashboard'}
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
