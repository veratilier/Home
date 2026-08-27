import { useState, useMemo } from "react";

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  author: "user" | "assistant";
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayKey() {
  const t = new Date();
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SparkleIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function PenIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </svg>
  );
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const days: { day: number; current: boolean; key: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ day: d, current: false, key: dateKey(y, m, d) });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, current: true, key: dateKey(year, month, d) });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ day: d, current: false, key: dateKey(y, m, d) });
  }

  return days;
}

function formatDisplayDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][date.getDay()];
  return `${y}年${m}月${d}日 ${weekday}`;
}

export default function DiaryPage() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("diary_v2") || "[]");
    } catch {
      return [];
    }
  });

  const today = todayKey();

  const entryMap = useMemo(() => {
    const map: Record<string, DiaryEntry[]> = {};
    for (const e of entries) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [entries]);

  const calDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const save = (next: DiaryEntry[]) => {
    setEntries(next);
    try { localStorage.setItem("diary_v2", JSON.stringify(next)); } catch {}
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const selectedEntries = selectedDate ? (entryMap[selectedDate] || []) : [];
  const userEntry = selectedEntries.find((e) => e.author === "user");
  const assistantEntries = selectedEntries.filter((e) => e.author === "assistant");

  const updateUserEntry = (content: string) => {
    if (!selectedDate) return;
    if (userEntry) {
      save(entries.map((e) => (e.id === userEntry.id ? { ...e, content } : e)));
    } else {
      const newEntry: DiaryEntry = {
        id: crypto.randomUUID(),
        date: selectedDate,
        content,
        author: "user",
      };
      save([...entries, newEntry]);
    }
  };

  const deleteUserEntry = () => {
    if (!userEntry) return;
    save(entries.filter((e) => e.id !== userEntry.id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="shrink-0 px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold tracking-tight">
            {viewYear}年{MONTH_NAMES[viewMonth]}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={goToday}
              className="px-3 py-1 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-black/[0.03] transition-colors mr-1"
            >
              今天
            </button>
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors">
              <ChevronLeft />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors">
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`text-center text-[11px] font-medium py-1 ${i === 0 || i === 6 ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}>
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 px-5 pb-4 overflow-y-auto">
        <div className="grid grid-cols-7 gap-px">
          {calDays.map((cell, i) => {
            const isToday = cell.key === today;
            const hasEntries = !!entryMap[cell.key];
            const hasUser = entryMap[cell.key]?.some((e) => e.author === "user");
            const hasAssistant = entryMap[cell.key]?.some((e) => e.author === "assistant");
            const isSelected = cell.key === selectedDate;
            const isWeekend = i % 7 === 0 || i % 7 === 6;

            return (
              <button
                key={`${cell.key}-${i}`}
                onClick={() => setSelectedDate(cell.key)}
                className={`
                  relative flex flex-col items-center py-2 rounded-xl transition-all duration-150
                  ${cell.current ? "" : "opacity-30"}
                  ${isSelected ? "bg-[var(--color-accent)] text-white shadow-sm" : "hover:bg-black/[0.04]"}
                  ${!isSelected && isToday ? "ring-1.5 ring-[var(--color-accent)]" : ""}
                `}
              >
                <span className={`
                  text-[13px] font-medium leading-none
                  ${isSelected ? "text-white" : isToday ? "text-[var(--color-accent)] font-bold" : isWeekend && cell.current ? "text-[var(--color-accent)]/70" : ""}
                `}>
                  {cell.day}
                </span>
                {hasEntries && (
                  <div className="flex gap-[3px] mt-1.5">
                    {hasUser && (
                      <span className={`w-[5px] h-[5px] rounded-full ${isSelected ? "bg-white/80" : "bg-[var(--color-accent)]"}`} />
                    )}
                    {hasAssistant && (
                      <span className={`w-[5px] h-[5px] rounded-full ${isSelected ? "bg-white/60" : "bg-[var(--color-text-secondary)]/50"}`} />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-[6px] h-[6px] rounded-full bg-[var(--color-accent)]" />
            <span className="text-[11px] text-[var(--color-text-secondary)]">我的日记</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-[6px] h-[6px] rounded-full bg-[var(--color-text-secondary)]/50" />
            <span className="text-[11px] text-[var(--color-text-secondary)]">AI 日记</span>
          </div>
        </div>
      </div>

      {/* Diary detail drawer */}
      {selectedDate && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setSelectedDate(null)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]"
            style={{ maxHeight: "70vh" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded-lg hover:bg-black/[0.05] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h3 className="text-[14px] font-semibold">{formatDisplayDate(selectedDate)}</h3>
              <div className="w-[30px]" />
            </div>

            {/* Content */}
            <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: "calc(70vh - 80px)" }}>
              {/* Assistant entries (read-only) */}
              {assistantEntries.length > 0 && (
                <div className="mb-5">
                  {assistantEntries.map((entry) => (
                    <div key={entry.id} className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#e8956e] flex items-center justify-center">
                          <SparkleIcon size={9} />
                        </div>
                        <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">AI 日记</span>
                      </div>
                      <div className="pl-[26px]">
                        <p className="text-[14px] leading-[1.8] text-[var(--color-text-primary)] whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-b border-[var(--color-border)] mt-4 mb-4" />
                </div>
              )}

              {/* User entry (editable) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-text-primary)] flex items-center justify-center">
                      <PenIcon size={9} />
                    </div>
                    <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">我的日记</span>
                  </div>
                  {userEntry && (
                    <button
                      onClick={deleteUserEntry}
                      className="text-[11px] text-red-400 hover:text-red-500 transition-colors px-2 py-0.5 rounded-md hover:bg-red-50"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="pl-[26px]">
                  <textarea
                    value={userEntry?.content || ""}
                    onChange={(e) => updateUserEntry(e.target.value)}
                    placeholder="写下今天的想法…"
                    rows={5}
                    className="w-full text-[14px] leading-[1.8] outline-none resize-none bg-transparent placeholder:text-[var(--color-text-secondary)]/40"
                  />
                </div>
              </div>

              {/* Empty state */}
              {assistantEntries.length === 0 && !userEntry?.content && (
                <div className="flex flex-col items-center py-6 text-[var(--color-text-secondary)]/60">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-40">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <p className="text-[12px]">这一天还没有日记</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
