import { useState, useMemo, useEffect } from "react";

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  author: "user" | "assistant";
}

interface Reminder {
  id: string;
  title: string;
  note: string;
  date: string;
  time: string;
  done: boolean;
  priority: "low" | "medium" | "high";
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayKey() {
  const t = new Date();
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const days: { day: number; current: boolean; key: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    days.push({ day: d, current: false, key: dateKey(py, pm, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, current: true, key: dateKey(year, month, d) });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    days.push({ day: d, current: false, key: dateKey(ny, nm, d) });
  }
  return days;
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function DiaryPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [activeTab, setActiveTab] = useState<"user" | "assistant">("user");
  const [newTodo, setNewTodo] = useState("");
  const [isWriting, setIsWriting] = useState(false);

  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("diary_v2") || "[]");
    } catch {
      return [];
    }
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const stored = localStorage.getItem("reminders_v1");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const today = todayKey();

  const entryMap = useMemo(() => {
    const map: Record<string, DiaryEntry[]> = {};
    for (const e of entries) {
      if (!e.content) continue;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [entries]);

  const calDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const dateTodos = useMemo(
    () => reminders.filter((r) => r.date === selectedDate),
    [reminders, selectedDate],
  );
  const activeTodoCount = dateTodos.filter((r) => !r.done).length;
  const currentEntry = entries.find(
    (e) => e.date === selectedDate && e.author === activeTab,
  );

  useEffect(() => {
    setIsWriting(false);
  }, [selectedDate, activeTab]);

  const [selY, selM, selD] = selectedDate.split("-").map(Number);
  const selDateObj = new Date(selY, selM - 1, selD);
  const dateDisplay = `${WEEKDAY_FULL[selDateObj.getDay()]}, ${MONTH_NAMES[selM - 1]} ${selD}`;
  const isToday = selectedDate === today;

  const saveDiary = (next: DiaryEntry[]) => {
    setEntries(next);
    try {
      localStorage.setItem("diary_v2", JSON.stringify(next));
    } catch {}
  };

  const saveReminders = (next: Reminder[]) => {
    setReminders(next);
    try {
      localStorage.setItem("reminders_v1", JSON.stringify(next));
    } catch {}
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(todayKey());
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    saveReminders([
      ...reminders,
      {
        id: crypto.randomUUID(),
        title: newTodo.trim(),
        note: "",
        date: selectedDate,
        time: "",
        done: false,
        priority: "medium",
      },
    ]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    saveReminders(
      reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
    );
  };

  const removeTodo = (id: string) => {
    saveReminders(reminders.filter((r) => r.id !== id));
  };

  const updateDiary = (content: string) => {
    if (currentEntry) {
      saveDiary(
        entries.map((e) =>
          e.id === currentEntry.id ? { ...e, content } : e,
        ),
      );
    } else if (content) {
      saveDiary([
        ...entries,
        {
          id: crypto.randomUUID(),
          date: selectedDate,
          content,
          author: activeTab,
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-1">
        <h1 className="text-xl font-bold tracking-tight mb-3">Diary</h1>

        {/* Tab switcher */}
        <div className="flex bg-black/[0.05] rounded-xl p-1 mb-3">
          <button
            onClick={() => setActiveTab("user")}
            className={`flex-1 py-2 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === "user"
                ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Vera
          </button>
          <button
            onClick={() => setActiveTab("assistant")}
            className={`flex-1 py-2 text-[13px] font-medium rounded-lg transition-all ${
              activeTab === "assistant"
                ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            Rowan
          </button>
        </div>

        {/* Date display */}
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-2">
          {dateDisplay}
        </p>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg hover:bg-black/[0.05] transition-colors"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={goToday}
            className="text-[13px] font-semibold hover:text-[var(--color-accent)] transition-colors"
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg hover:bg-black/[0.05] transition-colors"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center text-[11px] font-medium py-1 ${
                i === 0 || i === 6
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px mb-4">
          {calDays.map((cell, i) => {
            const isTodayCell = cell.key === today;
            const isSelected = cell.key === selectedDate;
            const hasEntry = !!entryMap[cell.key];
            const hasTodo = reminders.some(
              (r) => r.date === cell.key && !r.done,
            );

            return (
              <button
                key={`${cell.key}-${i}`}
                onClick={() => setSelectedDate(cell.key)}
                className={`
                  relative flex flex-col items-center py-2 rounded-xl transition-all duration-150
                  ${cell.current ? "" : "opacity-30"}
                  ${isSelected ? "bg-[var(--color-accent)] text-white shadow-sm" : "hover:bg-black/[0.04]"}
                  ${!isSelected && isTodayCell ? "ring-1.5 ring-[var(--color-accent)]" : ""}
                `}
              >
                <span
                  className={`
                  text-[13px] font-medium leading-none
                  ${isSelected ? "text-white" : isTodayCell ? "text-[var(--color-accent)] font-bold" : ""}
                `}
                >
                  {cell.day}
                </span>
                {(hasEntry || hasTodo) && (
                  <div className="flex gap-[3px] mt-1.5">
                    {hasEntry && (
                      <span
                        className={`w-[4px] h-[4px] rounded-full ${isSelected ? "bg-white/80" : "bg-[var(--color-accent)]"}`}
                      />
                    )}
                    {hasTodo && (
                      <span
                        className={`w-[4px] h-[4px] rounded-full ${isSelected ? "bg-white/60" : "bg-blue-400"}`}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-b border-[var(--color-border)] mb-4" />

        {/* Today's To Do */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[14px] font-semibold">Today's To Do</h2>
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              {activeTodoCount} left ›
            </span>
          </div>

          {dateTodos.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-secondary)]/60 py-3 text-center">
              这一天还没有待办。
            </p>
          ) : (
            <div className="space-y-0.5 mb-2">
              {dateTodos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-3 py-2 group">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                      todo.done
                        ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                    }`}
                  >
                    {todo.done && (
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`flex-1 text-[13px] ${todo.done ? "line-through text-[var(--color-text-secondary)]" : ""}`}
                  >
                    {todo.title}
                  </span>
                  <button
                    onClick={() => removeTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/[0.05] transition-all"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-text-secondary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Inline add input */}
          <div className="flex items-center gap-2 mt-1">
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder={`添加 ${selM} 月 ${selD} 日的待办...`}
              className="flex-1 px-3 py-2 text-[13px] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent"
            />
            <button
              onClick={addTodo}
              className="w-8 h-8 rounded-xl bg-[var(--color-accent)] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-[var(--color-border)] mb-4" />

        {/* Diary section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[14px] font-semibold">
              {dateDisplay}
              {isToday && (
                <span className="ml-1.5 text-[12px] text-[var(--color-accent)] font-normal">
                  今天
                </span>
              )}
            </h2>
            {activeTab === "user" && !isWriting && !currentEntry?.content && (
              <button
                onClick={() => setIsWriting(true)}
                className="text-[13px] text-[var(--color-accent)] font-medium hover:opacity-80 transition-opacity"
              >
                写日记
              </button>
            )}
          </div>

          {activeTab === "user" ? (
            isWriting || currentEntry?.content ? (
              <textarea
                value={currentEntry?.content || ""}
                onChange={(e) => updateDiary(e.target.value)}
                placeholder="写下今天的想法…"
                rows={5}
                autoFocus={isWriting && !currentEntry?.content}
                className="w-full text-[14px] leading-[1.8] outline-none resize-none bg-transparent placeholder:text-[var(--color-text-secondary)]/40"
              />
            ) : (
              <p className="text-[13px] text-[var(--color-text-secondary)]/60 py-3 text-center">
                这一天还没有写日记。
              </p>
            )
          ) : currentEntry?.content ? (
            <p className="text-[14px] leading-[1.8] whitespace-pre-wrap">
              {currentEntry.content}
            </p>
          ) : (
            <p className="text-[13px] text-[var(--color-text-secondary)]/60 py-3 text-center">
              这一天还没有日记。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
