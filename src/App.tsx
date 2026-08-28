import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { MenuIcon } from "./components/Icons";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import MusicPage from "./pages/MusicPage";
import DiaryPage from "./pages/DiaryPage";
import NotesPage from "./pages/NotesPage";
import AnniversaryPage from "./pages/AnniversaryPage";
import SettingsPage from "./pages/SettingsPage";
import DesktopPet from "./components/DesktopPet";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <DesktopPet />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center h-[56px] px-4 shrink-0 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="打开侧边栏"
          >
            <MenuIcon size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/anniversary" element={<AnniversaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
