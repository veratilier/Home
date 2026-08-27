import { useState, useMemo } from "react";

interface Anniversary {
  id: string;
  title: string;
  date: string;
  emoji: string;
  type: "countdown" | "countup";
  repeat: boolean;
  pinned: boolean;
  color: string;
}

const COLORS: Record<string, { gradient: string; light: string; solid: string }> = {
  orange: { gradient: "linear-gradient(135deg, #c96442 0%, #e8956e 100%)", light: "rgba(201,100,66,0.06)", solid: "#c96442" },
  blue: { gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)", light: "rgba(59,130,246,0.06)", solid: "#3b82f6" },
  purple: { gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)", light: "rgba(139,92,246,0.06)", solid: "#8b5cf6" },
  pink: { gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)", light: "rgba(236,72,153,0.06)", solid: "#ec4899" },
  green: { gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", light: "rgba(16,185,129,0.06)", solid: "#10b981" },
  teal: { gradient: "linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)", light: "rgba(20,184,166,0.06)", solid: "#14b8a6" },
  amber: { gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)", light: "rgba(245,158,11,0.06)", solid: "#f59e0b" },
  rose: { gradient: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)", light: "rgba(244,63,94,0.06)", solid: "#f43f5e" },
};

const COLOR_KEYS = Object.keys(COLORS);
const EMOJIS = ["🎉", "❤️", "🎂", "🌟", "🎓", "💍", "✈️", "🏠", "🧨", "💼", "🌸", "🎄", "🐾", "🎵"];

const SAMPLE: Anniversary[] = [
  { id: "s1", title: "在一起", date: "2024-02-14", emoji: "❤️", type: "countup", repeat: false, pinned: true, color: "rose" },
  { id: "s2", title: "生日", date: "2026-12-15", emoji: "🎂", type: "countdown", repeat: true, pinned: false, color: "amber" },
  { id: "s3", title: "毕业纪念", date: "2025-06-20", emoji: "🎓", type: "countup", repeat: false, pinned: false, color: "blue" },
  { id: "s4", title: "春节", date: "2027-02-06", emoji: "🧨", type: "countdown", repeat: true, pinned: false, color: "orange" },
  { id: "s5", title: "入职周年", date: "2023-08-01", emoji: "💼", type: "countup", repeat: true, pinned: false, color: "teal" },
];

const STORAGE_KEY = "anniversaries_v2";

function getDayCount(item: Anniversary): { days: number; prefix: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(item.date + "T00:00:00");

  if (item.type === "countup") {
    const diff = Math.max(0, Math.floor((now.getTime() - target.getTime()) / 86400000));
    return { days: diff, prefix: "已" };
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

function formatDateDisplay(s: string): string {
  const [y, m, d] = s.split("-");
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

export default function AnniversaryPage() {
  const [items, setItems] = useState<Anniversary[]>(() => {
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
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", date: "", emoji: "🎉", type: "countdown" as "countdown" | "countup",
    repeat: false, pinned: false, color: "orange",
  });

  const save = (next: Anniversary[]) => {
    setItems(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ title: "", date: "", emoji: "🎉", type: "countdown", repeat: false, pinned: false, color: "orange" });
    setDrawerOpen(true);
  };

  const openEdit = (item: Anniversary) => {
    setEditingId(item.id);
    setForm({ title: item.title, date: item.date, emoji: item.emoji, type: item.type, repeat: item.repeat, pinned: item.pinned, color: item.color });
    setDetailId(null);
    setDrawerOpen(true);
  };

  const submit = () => {
    if (!form.title || !form.date) return;
    if (editingId) {
      save(items.map((i) => i.id === editingId ? { ...i, ...form } : i));
    } else {
      save([...items, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  };

  const remove = (id: string) => {
    save(items.filter((i) => i.id !== id));
    setDetailId(null);
    setDrawerOpen(false);
  };

  const togglePin = (id: string) => {
    save(items.map((i) => i.id === id ? { ...i, pinned: !i.pinned } : i));
  };

  const pinned = useMemo(() => items.filter((i) => i.pinned), [items]);
  const others = useMemo(() => {
    const list = items.filter((i) => !i.pinned);
    return list.sort((a, b) => getDayCount(a).days - getDayCount(b).days);
  }, [items]);

  const detailItem = detailId ? items.find((i) => i.id === detailId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">纪念日</h1>
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-1">还没有纪念日</p>
            <p className="text-[12px] text-[var(--color-text-secondary)]/60">点击右上角 + 开始记录重要的日子</p>
          </div>
        ) : (
          <>
            {/* Pinned featured cards */}
            {pinned.map((item) => {
              const { days, prefix } = getDayCount(item);
              const c = COLORS[item.color] || COLORS.orange;
              return (
                <button
                  key={item.id}
                  onClick={() => setDetailId(item.id)}
                  className="w-full mb-4 rounded-2xl overflow-hidden text-left transition-transform active:scale-[0.98]"
                  style={{ background: c.gradient }}
                >
                  <div className="relative px-6 py-7 text-white">
                    {/* Emoji watermark */}
                    <span className="absolute top-4 right-5 text-[48px] opacity-20 select-none pointer-events-none">
                      {item.emoji}
                    </span>
                    {/* Day count */}
                    <div className="mb-3">
                      <span className="text-[56px] font-bold leading-none tabular-nums tracking-tight">{days}</span>
                      <span className="text-[18px] font-medium ml-1.5 opacity-80">天</span>
                    </div>
                    {/* Info */}
                    <p className="text-[16px] font-semibold mb-1">{item.title}</p>
                    <div className="flex items-center gap-2 text-[12px] opacity-70">
                      <span>{formatDateDisplay(item.date)}</span>
                      <span>·</span>
                      <span>{item.type === "countdown" ? "倒数日" : "累计日"}</span>
                      {item.repeat && (
                        <>
                          <span>·</span>
                          <span>每年</span>
                        </>
                      )}
                    </div>
                    {/* Prefix label */}
                    <div className="absolute top-5 left-6">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/20">{prefix}</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Section label */}
            {others.length > 0 && pinned.length > 0 && (
              <div className="flex items-center gap-2 mt-2 mb-3">
                <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">全部事件</span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>
            )}

            {/* Regular event cards */}
            <div className="space-y-2.5">
              {others.map((item) => {
                const { days, prefix } = getDayCount(item);
                const c = COLORS[item.color] || COLORS.orange;
                return (
                  <button
                    key={item.id}
                    onClick={() => setDetailId(item.id)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all hover:shadow-sm active:scale-[0.99]"
                    style={{ background: c.light, borderLeft: `3px solid ${c.solid}` }}
                  >
                    <span className="text-[24px] shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-[var(--color-text-secondary)]">{formatDateDisplay(item.date)}</span>
                        <span className="text-[11px] text-[var(--color-text-secondary)]">·</span>
                        <span className="text-[11px] text-[var(--color-text-secondary)]">{item.type === "countdown" ? "倒数日" : "累计日"}</span>
                        {item.repeat && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-medium mb-0.5" style={{ color: c.solid }}>{prefix}</p>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[28px] font-bold tabular-nums leading-none" style={{ color: c.solid }}>{days}</span>
                        <span className="text-[12px] font-medium" style={{ color: c.solid, opacity: 0.7 }}>天</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Detail bottom sheet */}
      {detailItem && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setDetailId(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]" style={{ maxHeight: "50vh" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>
            <div className="px-6 pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => setDetailId(null)} className="p-1 rounded-lg hover:bg-black/[0.05] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePin(detailItem.id)}
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors"
                    title={detailItem.pinned ? "取消置顶" : "置顶"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={detailItem.pinned ? "var(--color-accent)" : "none"} stroke={detailItem.pinned ? "var(--color-accent)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openEdit(detailItem)}
                    className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => remove(detailItem.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Detail content */}
              {(() => {
                const { days, prefix } = getDayCount(detailItem);
                const c = COLORS[detailItem.color] || COLORS.orange;
                return (
                  <div className="text-center">
                    <span className="text-[40px] mb-2 block">{detailItem.emoji}</span>
                    <h3 className="text-[18px] font-bold mb-1">{detailItem.title}</h3>
                    <p className="text-[13px] text-[var(--color-text-secondary)] mb-5">
                      {formatDateDisplay(detailItem.date)}
                      {detailItem.repeat && " · 每年重复"}
                    </p>
                    <div className="inline-flex items-baseline gap-1 px-6 py-3 rounded-2xl" style={{ background: c.light }}>
                      <span className="text-[12px] font-medium" style={{ color: c.solid }}>{prefix}</span>
                      <span className="text-[40px] font-bold tabular-nums leading-none" style={{ color: c.solid }}>{days}</span>
                      <span className="text-[14px] font-medium" style={{ color: c.solid, opacity: 0.7 }}>天</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit bottom sheet */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]" style={{ maxHeight: "85vh" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <button onClick={() => setDrawerOpen(false)} className="text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                取消
              </button>
              <h3 className="text-[15px] font-semibold">{editingId ? "编辑纪念日" : "添加纪念日"}</h3>
              <button
                onClick={submit}
                className="text-[14px] font-semibold text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                保存
              </button>
            </div>

            <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "calc(85vh - 60px)" }}>
              {/* Title */}
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">名称</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="输入纪念日名称"
                  className="w-full px-4 py-2.5 text-[14px] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent"
                />
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">日期</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2.5 text-[14px] rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent"
                />
              </div>

              {/* Type toggle */}
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">类型</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, type: "countdown" })}
                    className={`flex-1 py-2.5 text-[13px] font-medium rounded-xl border transition-colors ${
                      form.type === "countdown"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/[0.02]"
                    }`}
                  >
                    倒数日
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: "countup" })}
                    className={`flex-1 py-2.5 text-[13px] font-medium rounded-xl border transition-colors ${
                      form.type === "countup"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/[0.02]"
                    }`}
                  >
                    累计日
                  </button>
                </div>
              </div>

              {/* Emoji picker */}
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">图标</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setForm({ ...form, emoji: e })}
                      className={`w-10 h-10 rounded-xl text-[18px] flex items-center justify-center transition-all ${
                        form.emoji === e
                          ? "bg-[var(--color-accent)]/10 ring-1.5 ring-[var(--color-accent)] scale-110"
                          : "hover:bg-black/[0.04]"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 block">颜色</label>
                <div className="flex gap-2">
                  {COLOR_KEYS.map((key) => {
                    const c = COLORS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setForm({ ...form, color: key })}
                        className={`w-8 h-8 rounded-full transition-all ${
                          form.color === key ? "ring-2 ring-offset-2 ring-[var(--color-text-primary)]/30 scale-110" : "hover:scale-105"
                        }`}
                        style={{ background: c.gradient }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-medium">每年重复</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">每年提醒这个日子</p>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, repeat: !form.repeat })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${form.repeat ? "bg-[var(--color-accent)]" : "bg-black/15"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${form.repeat ? "translate-x-5.5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[13px] font-medium">置顶显示</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">在顶部显示为大卡片</p>
                  </div>
                  <button
                    onClick={() => setForm({ ...form, pinned: !form.pinned })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${form.pinned ? "bg-[var(--color-accent)]" : "bg-black/15"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${form.pinned ? "translate-x-5.5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
