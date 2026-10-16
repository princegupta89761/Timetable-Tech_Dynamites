/* src/components/Topbar.jsx */
import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function Topbar() {
  const [dark, setDark] = React.useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setDark(!dark);
  };

  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 shadow-sm">
      <h1 className="text-2xl font-semibold text-primary">Timetable Generator</h1>
      <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </header>
  );
}
