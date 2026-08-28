import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadSettings } from "./SettingsPage";

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  done: boolean;
  priority: string;
}

interface Anniversary {
  id: string;
  title: string;
  date: string;
  emoji: string;
  type: "countdown" | "countup";
  repeat: boolean;
}

interface NowPlaying {
  title: string;
  artist: string;
  cover: string;
  isPlaying: boolean;
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function getAnniversaryDays(item: Anniversary): { days: number; prefix: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(item.date + "T00:00:00");
  if (item.type === "countup") {
    return { days: Math.max(0, Math.floor((now.getTime() - target.getTime()) / 86400000)), prefix: "已" };
  }
  const t = new Date(target);
  if (item.repeat) {
    t.setFullYear(now.getFullYear());
    if (t <= now) t.setFullYear(now.getFullYear() + 1);
  }
  const diff = Math.ceil((t.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { days: Math.abs(diff), prefix: "已过" };
  return { days: diff, prefix: "还有" };
}

export default function HomePage() {
  const settings = loadSettings();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem("home_notes") || "[]"); }
    catch { return []; }
  });
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const todayReminders = useMemo(() => {
    try {
      const all: Reminder[] = JSON.parse(localStorage.getItem("reminders_v1") || "[]");
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      return all.filter((r) => r.date === today);
    } catch { return []; }
  }, [now]);

  const doneCount = todayReminders.filter((r) => r.done).length;

  const upcomingAnniversaries = useMemo(() => {
    try {
      const all: Anniversary[] = JSON.parse(localStorage.getItem("anniversaries_v2") || "[]");
      return all
        .map((a) => ({ ...a, ...getAnniversaryDays(a) }))
        .sort((a, b) => a.days - b.days)
        .slice(0, 3);
    } catch { return []; }
  }, [now]);

  const nowPlaying = useMemo((): NowPlaying | null => {
    try {
      const data = localStorage.getItem("music_now_playing");
      if (!data) return null;
      return JSON.parse(data);
    } catch { return null; }
  }, []);

  const saveNotes = (next: Note[]) => {
    setNotes(next);
    try { localStorage.setItem("home_notes", JSON.stringify(next)); } catch {}
  };

  const addNote = () => {
    const text = noteInput.trim();
    if (!text) return;
    saveNotes([{ id: crypto.randomUUID(), text, createdAt: Date.now() }, ...notes]);
    setNoteInput("");
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 pb-10">
          {/* Date + Time + Weather */}
          <div className="flex items-center justify-between pt-6 mb-1">
            <p className="text-[13px] text-[var(--color-text-secondary)]">{dateStr}</p>
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span className="text-[13px]">--°</span>
            </div>
          </div>

          {/* Greeting */}
          <h1 className="text-[28px] font-bold tracking-tight mb-1">
            {greeting}, {settings.userName}
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-8">{timeStr}</p>

          {/* Notes section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-[14px] font-semibold">Notes</span>
              {notes.length > 0 && (
                <span className="text-[11px] text-[var(--color-text-secondary)] bg-black/[0.05] px-1.5 py-0.5 rounded-full">{notes.length}</span>
              )}
            </div>

            {/* Note input */}
            <div className="flex gap-2 mb-3">
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="写点什么..."
                className="flex-1 px-3.5 py-2.5 text-[13px] rounded-xl border border-[var(--color-border)] bg-transparent outline-none focus:border-[var(--color-accent)] transition-colors"
              />
              <button
                onClick={addNote}
                className="px-3 rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>

            {/* Note cards */}
            {notes.length === 0 ? (
              <div className="px-4 py-6 rounded-2xl border border-[var(--color-border)] text-center">
                <p className="text-[12px] text-[var(--color-text-secondary)]">还没有备忘</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.slice(0, 5).map((note) => (
                  <div
                    key={note.id}
                    className="group flex items-start gap-3 px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-black/[0.02]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 opacity-60">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-relaxed">{note.text}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                        {new Date(note.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 rounded-lg opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity shrink-0"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Today's reminders */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span className="text-[14px] font-semibold">Today's reminders</span>
              <span className="text-[11px] text-[var(--color-text-secondary)] bg-black/[0.05] px-1.5 py-0.5 rounded-full">{doneCount} / {todayReminders.length}</span>
            </div>

            {todayReminders.length === 0 ? (
              <div className="px-4 py-6 rounded-2xl border border-[var(--color-border)] text-center">
                <div className="w-8 h-0.5 bg-[var(--color-border)] mx-auto mb-2 rounded-full" />
                <p className="text-[12px] text-[var(--color-text-secondary)]">No reminders yet</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {todayReminders.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--color-border)] ${r.done ? "opacity-50" : ""}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.done ? "bg-emerald-400" : r.priority === "high" ? "bg-rose-400" : r.priority === "medium" ? "bg-amber-400" : "bg-slate-300"}`} />
                    <span className={`text-[13px] flex-1 ${r.done ? "line-through" : ""}`}>{r.title}</span>
                    {r.time && <span className="text-[11px] text-[var(--color-text-secondary)] tabular-nums">{r.time}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Dates / Anniversaries */}
          <section className="mb-8">
            <button onClick={() => navigate("/anniversary")} className="flex items-center gap-2 mb-3 group">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-[14px] font-semibold">Dates</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-30 transition-opacity ml-auto">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {upcomingAnniversaries.length === 0 ? (
              <div className="px-4 py-6 rounded-2xl border border-[var(--color-border)] text-center">
                <p className="text-[12px] text-[var(--color-text-secondary)]">还没有纪念日</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingAnniversaries.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate("/anniversary")}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-[var(--color-border)] text-left hover:bg-black/[0.02] transition-colors"
                  >
                    <div className="relative w-12 h-12 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-border)" strokeWidth="2.5" />
                        <circle
                          cx="18" cy="18" r="16" fill="none" stroke="var(--color-accent)" strokeWidth="2.5"
                          strokeDasharray={`${Math.min(100, (a.type === "countup" ? Math.min(a.days, 365) / 365 : (365 - Math.min(a.days, 365)) / 365) * 100.5)} 100.5`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[11px]">{a.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{a.title}</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">{a.prefix} {a.days} 天</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[24px] font-bold tabular-nums text-[var(--color-accent)]">{a.days}</span>
                      <span className="text-[11px] text-[var(--color-text-secondary)] ml-0.5">天</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Now playing */}
          <section>
            <button onClick={() => navigate("/music")} className="flex items-center gap-2 mb-3 group">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              <span className="text-[14px] font-semibold">Now playing</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-30 transition-opacity ml-auto">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {nowPlaying ? (
              <button
                onClick={() => navigate("/music")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--color-border)] text-left hover:bg-black/[0.02] transition-colors"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-black/[0.05]">
                  {nowPlaying.cover ? (
                    <img src={nowPlaying.cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{nowPlaying.title}</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] truncate">{nowPlaying.artist}</p>
                </div>
                {nowPlaying.isPlaying && (
                  <div className="flex items-end gap-[2px] h-3.5 shrink-0">
                    <div className="w-[3px] bg-[var(--color-accent)] rounded-full animate-[barBounce1_0.8s_ease-in-out_infinite]" style={{ height: "60%" }} />
                    <div className="w-[3px] bg-[var(--color-accent)] rounded-full animate-[barBounce2_0.8s_ease-in-out_infinite]" style={{ height: "100%" }} />
                    <div className="w-[3px] bg-[var(--color-accent)] rounded-full animate-[barBounce3_0.8s_ease-in-out_infinite]" style={{ height: "40%" }} />
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate("/music")}
                className="w-full px-4 py-6 rounded-2xl border border-[var(--color-border)] text-center hover:bg-black/[0.02] transition-colors"
              >
                <p className="text-[12px] text-[var(--color-text-secondary)]">VESPER FM</p>
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
