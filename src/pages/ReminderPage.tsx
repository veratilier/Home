import { useState, useMemo } from "react";

interface Reminder {
  id: string;
  title: string;
  note: string;
  date: string;
  time: string;
  done: boolean;
  priority: "low" | "medium" | "high";
}

const PRIORITY_COLORS: Record<string, { dot: string; bg: string; label: string }> = {
  high: { dot: "#f43f5e", bg: "rgba(244,63,94,0.06)", label: "高" },
  medium: { dot: "#f59e0b", bg: "rgba(245,158,11,0.06)", label: "中" },
  low: { dot: "#94a3b8", bg: "rgba(148,163,184,0.06)", label: "低" },
};

const STORAGE_KEY = "reminders_v1";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatRelativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  if (diff < -1) return `已过期 ${Math.abs(diff)} 天`;
  if (diff <= 7) return `${diff} 天后`;

  const m = target.getMonth() + 1;
  const d = target.getDate();
  if (target.getFullYear() === today.getFullYear()) return `${m}月${d}日`;
  return `${target.getFullYear()}年${m}月${d}日`;
}

function isOverdue(r: Reminder): boolean {
  if (r.done) return false;
  const now = new Date();
  const target = new Date(r.date + "T" + (r.time || "23:59"));
  return target < now;
}

function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

const SAMPLE: Reminder[] = [
  { id: "r1", title: "完成项目报告", note: "包含Q3数据分析和下季度计划", date: todayStr(), time: "14:00", done: false, priority: "high" },
  { id: "r2", title: "回复邮件", note: "", date: todayStr(), time: "10:30", done: true, priority: "medium" },
  { id: "r3", title: "预约牙医", note: "记得带医保卡", date: tomorrowStr(), time: "09:00", done: false, priority: "medium" },
  { id: "r4", title: "购买生日礼物", note: "考虑一本书或者耳机", date: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })(), time: "", done: false, priority: "low" },
  { id: "r5", title: "健身房", note: "腿部训练日", date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })(), time: "18:00", done: false, priority: "low" },
  { id: "r6", title: "交水电费", note: "", date: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })(), time: "", done: false, priority: "high" },
];

export default function ReminderPage() {
  const [items, setItems] = useState<Reminder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE));
      return SAMPLE;
    } catch {
      return SAMPLE;
    }
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [form, setForm] = useState({
    title: "", note: "", date: todayStr(), time: "", priority: "medium" as "low" | "medium" | "high",
  });

  const save = (next: Reminder[]) => {
    setItems(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const toggleDone = (id: string) => {
    save(items.map((i) => i.id === id ? { ...i, done: !i.done } : i));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ title: "", note: "", date: todayStr(), time: "", priority: "medium" });
    setDrawerOpen(true);
  };

  const openEdit = (item: Reminder) => {
    setEditingId(item.id);
    setForm({ title: item.title, note: item.note, date: item.date, time: item.time, priority: item.priority });
    setDrawerOpen(true);
  };

  const submit = () => {
    if (!form.title) return;
    if (editingId) {
      save(items.map((i) => i.id === editingId ? { ...i, ...form } : i));
    } else {
      save([...items, { id: crypto.randomUUID(), ...form, done: false }]);
    }
    setDrawerOpen(false);
  };

  const remove = (id: string) => {
    save(items.filter((i) => i.id !== id));
    setDrawerOpen(false);
  };

  const { overdue, today, upcoming, completed } = useMemo(() => {
    const overdueList: Reminder[] = [];
    const todayList: Reminder[] = [];
    const upcomingList: Reminder[] = [];
    const completedList: Reminder[] = [];

    for (const r of items) {
      if (r.done) { completedList.push(r); continue; }
      if (isOverdue(r)) { overdueList.push(r); continue; }
      if (isToday(r.date)) { todayList.push(r); continue; }
      upcomingList.push(r);
    }

    overdueList.sort((a, b) => a.date.localeCompare(b.date));
    todayList.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
    upcomingList.sort((a, b) => a.date.localeCompare(b.date) || (a.time || "99:99").localeCompare(b.time || "99:99"));

    return { overdue: overdueList, today: todayList, upcoming: upcomingList, completed: completedList };
  }, [items]);

  const activeCount = items.filter((i) => !i.done).length;

  const renderItem = (item: Reminder, showDate = true) => {
    const pc = PRIORITY_COLORS[item.priority];
    const od = !item.done && isOverdue(item);
    return (
      <div
        key={item.id}
        className={`flex items-start gap-3 px-4 py-3.5 rounded-xl transition-all group ${item.done ? "opacity-50" : ""}`}
        style={{ background: od ? "rgba(244,63,94,0.04)" : undefined }}
      >
        {/* Checkbox */}
        <button
          onClick={() => toggleDone(item.id)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            item.done
              ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
              : od
                ? "border-red-300 hover:border-red-400"
                : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
          }`}
        >
          {item.done && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Content */}
        <button onClick={() => openEdit(item)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <p className={`text-[14px] font-medium truncate ${item.done ? "line-through text-[var(--color-text-secondary)]" : ""}`}>
              {item.title}
            </p>
            {!item.done && (
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: pc.dot }} />
            )}
          </div>
          {item.note && (
            <p className="text-[12px] text-[var(--color-text-secondary)] truncate mt-0.5">{item.note}</p>
          )}
          {showDate && (
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={od ? "#f43f5e" : "var(--color-text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className={`text-[11px] ${od ? "text-red-400 font-medium" : "text-[var(--color-text-secondary)]"}`}>
                {formatRelativeDate(item.date)}
              </span>
              {item.time && (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={od ? "#f43f5e" : "var(--color-text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className={`text-[11px] ${od ? "text-red-400 font-medium" : "text-[var(--color-text-secondary)]"}`}>
                    {item.time}
                  </span>
                </>
              )}
            </div>
          )}
        </button>

        {/* Delete on hover */}
        <button
          onClick={() => remove(item.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-black/[0.05] transition-all shrink-0 mt-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">提醒</h1>
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
              {activeCount > 0 ? `${activeCount} 项待办` : "全部完成"}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-1">没有提醒事项</p>
            <p className="text-[12px] text-[var(--color-text-secondary)]/60">点击右上角 + 添加新提醒</p>
          </div>
        ) : (
          <>
            {/* Overdue */}
            {overdue.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-[12px] font-semibold text-red-400">已过期 ({overdue.length})</span>
                </div>
                <div className="space-y-1 rounded-2xl border border-red-100 overflow-hidden">
                  {overdue.map((r) => renderItem(r))}
                </div>
              </div>
            )}

            {/* Today */}
            {today.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                  <span className="text-[12px] font-semibold text-[var(--color-accent)]">今天 ({today.length})</span>
                </div>
                <div className="space-y-1 rounded-2xl border border-[var(--color-border)] overflow-hidden">
                  {today.map((r) => renderItem(r, false))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[12px] font-semibold text-blue-400">即将到来 ({upcoming.length})</span>
                </div>
                <div className="space-y-1 rounded-2xl border border-[var(--color-border)] overflow-hidden">
                  {upcoming.map((r) => renderItem(r))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 mb-2 px-1 group"
                >
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform ${showCompleted ? "rotate-90" : ""}`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">已完成 ({completed.length})</span>
                </button>
                {showCompleted && (
                  <div className="space-y-1 rounded-2xl border border-[var(--color-border)] overflow-hidden">
                    {completed.map((r) => renderItem(r))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit bottom sheet */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]" style={{ maxHeight: "80vh" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <button onClick={() => setDrawerOpen(false)} className="text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                取消
              </button>
              <h3 className="text-[15px] font-semibold">{editingId ? "编辑提醒" : "新建提醒"}</h3>
              <button
                onClick={submit}
                className="text-[14px] font-semibold text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                保存
              </button>
            </div>

            <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "calc(80vh - 60px)" }}>
              {/* Title */}
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">标题</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="提醒内容"
                  className="w-full px-4 py-2.5 text-[14px] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent"
                  autoFocus
                />
              </div>

              {/* Note */}
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">备注</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="添加备注（可选）"
                  rows={2}
                  className="w-full px-4 py-2.5 text-[14px] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent resize-none"
                />
              </div>

              {/* Date & Time */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-2.5 text-[14px] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">时间</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-4 py-2.5 text-[14px] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent"
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">优先级</label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((p) => {
                    const pc = PRIORITY_COLORS[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setForm({ ...form, priority: p })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors text-[13px] font-medium ${
                          form.priority === p
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)]"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/[0.02]"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: pc.dot }} />
                        {pc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delete button for editing */}
              {editingId && (
                <button
                  onClick={() => remove(editingId)}
                  className="w-full py-2.5 text-[13px] font-medium text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-2"
                >
                  删除此提醒
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
