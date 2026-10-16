import React, { useState } from "react";
import AppShell from "./components/AppShell";
import HistoryPage from "./pages/HistoryPage";
import TimetablePage from "./pages/TimetablePage";
import GeneratePage from "./pages/GeneratePage";
import DataManagementPage from "./pages/DataManagementPage";

function App() {
  const [page, setPage] = useState("history");
  const [commitRefreshKey, setCommitRefreshKey] = useState(0);
  const notifyCommitCreated = () => setCommitRefreshKey((key) => key + 1);

  const renderPage = () => {
    switch (page) {
      case "history":
        return <HistoryPage refreshKey={commitRefreshKey} />;
      case "timetable":
        return <TimetablePage />;
      case "generate":
        return <GeneratePage onCommitCreated={notifyCommitCreated} />;
      case "data":
        return <DataManagementPage />;
      default:
        return <HistoryPage refreshKey={commitRefreshKey} />;
    }
  };

  return (
    <AppShell currentPage={page} onChangePage={setPage}>
      {renderPage()}
    </AppShell>
  );
}

export default App;
