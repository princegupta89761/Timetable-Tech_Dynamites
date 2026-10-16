import React, { useState, useEffect } from "react";
import AppShell from "./components/AppShell";
import HistoryPage from "./pages/HistoryPage";
import TimetablePage from "./pages/TimetablePage";
import GeneratePage from "./pages/GeneratePage";
import DataManagementPage from "./pages/DataManagementPage";

function App() {
  const [page, setPage] = useState("history");

  const renderPage = () => {
    switch (page) {
      case "history":
        return <HistoryPage />;
      case "timetable":
        return <TimetablePage />;
      case "generate":
        return <GeneratePage />;
      case "data":
        return <DataManagementPage />;
      default:
        return <HistoryPage />;
    }
  };

  return (
    <AppShell currentPage={page} onChangePage={setPage}>
      {renderPage()}
    </AppShell>
  );
}

export default App;
