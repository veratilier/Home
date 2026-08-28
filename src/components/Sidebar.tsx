import { NavLink, useLocation } from "react-router-dom";
import { loadSettings } from "../pages/SettingsPage";
import {
  HomeIcon,
  ChatIcon,
  MusicIcon,
  DiaryIcon,
  NoteIcon,
  AnniversaryIcon,
  SettingsIcon,
  CloseIcon,
} from "./Icons";

const navItems = [
  { to: "/", icon: HomeIcon, label: "Today" },
  { to: "/chat", icon: ChatIcon, label: "Chat" },
  { to: "/music", icon: MusicIcon, label: "Music" },
  { to: "/diary", icon: DiaryIcon, label: "Diary" },
  { to: "/notes", icon: NoteIcon, label: "Notes" },
  { to: "/anniversary", icon: AnniversaryIcon, label: "Dates" },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const settings = loadSettings();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[260px]
          bg-[var(--color-sidebar)] text-[var(--color-text-sidebar)]
          border-r border-[var(--color-border)]
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Branding header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-white shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)]">Home</h1>
              <p className="text-[10px] tracking-widest uppercase text-[var(--color-text-secondary)]">Your quiet corner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-sidebar-hover)] transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                  transition-colors duration-150 mb-0.5
                  ${active
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-sidebar)] hover:bg-[var(--color-sidebar-hover)]"
                  }
                `}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: user + settings */}
        <div className="px-3 pb-4 shrink-0 space-y-1">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
              transition-colors duration-150
              ${location.pathname === "/settings"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-sidebar)] hover:bg-[var(--color-sidebar-hover)]"
              }
            `}
          >
            <SettingsIcon size={17} />
            Settings
          </NavLink>

          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center text-[11px] font-bold text-[var(--color-accent)] shrink-0">
              {settings.userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[12px] text-[var(--color-text-secondary)] truncate">{settings.userName}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
