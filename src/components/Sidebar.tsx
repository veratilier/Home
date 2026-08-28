import { NavLink, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ChatIcon,
  MusicIcon,
  DiaryIcon,
  NoteIcon,
  AnniversaryIcon,
  SettingsIcon,
  CloseIcon,
  PlusIcon,
} from "./Icons";

const navItems = [
  { to: "/", icon: HomeIcon, label: "主页" },
  { to: "/chat", icon: ChatIcon, label: "聊天" },
  { to: "/music", icon: MusicIcon, label: "音乐" },
  { to: "/diary", icon: DiaryIcon, label: "日记" },
  { to: "/notes", icon: NoteIcon, label: "便笺" },
  { to: "/anniversary", icon: AnniversaryIcon, label: "纪念日" },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

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
          flex flex-col
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex items-center justify-between px-4 h-[56px] shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-sidebar-hover)] transition-colors"
            aria-label="关闭侧边栏"
          >
            <CloseIcon size={18} />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-[var(--color-sidebar-hover)] transition-colors"
            aria-label="新建聊天"
          >
            <PlusIcon size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors duration-150
                  ${active
                    ? "bg-[var(--color-sidebar-active)] text-white"
                    : "text-[var(--color-text-sidebar)] hover:bg-[var(--color-sidebar-hover)]"
                  }
                `}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-2 pb-4 shrink-0">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-colors duration-150
              ${location.pathname === "/settings"
                ? "bg-[var(--color-sidebar-active)] text-white"
                : "text-[var(--color-text-sidebar)] hover:bg-[var(--color-sidebar-hover)]"
              }
            `}
          >
            <SettingsIcon size={18} />
            设置
          </NavLink>
        </div>
      </aside>
    </>
  );
}
