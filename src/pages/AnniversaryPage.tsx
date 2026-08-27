import { useState } from "react";
import { PlusIcon, CloseIcon } from "../components/Icons";

interface Anniversary {
  id: string;
  title: string;
  date: string;
  emoji: string;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  target.setFullYear(now.getFullYear());
  if (target < now) target.setFullYear(now.getFullYear() + 1);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function daysSince(dateStr: string): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86400000);
}

export default function AnniversaryPage() {
  const [items, setItems] = useState<Anniversary[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("anniversaries") || "[]");
    } catch {
      return [];
    }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", emoji: "🎉" });

  const save = (next: Anniversary[]) => {
    setItems(next);
    try { localStorage.setItem("anniversaries", JSON.stringify(next)); } catch { /* noop */ }
  };

  const add = () => {
    if (!form.title || !form.date) return;
    save([...items, { id: crypto.randomUUID(), ...form }]);
    setForm({ title: "", date: "", emoji: "🎉" });
    setShowForm(false);
  };

  const remove = (id: string) => save(items.filter((i) => i.id !== id));

  const emojis = ["🎉", "❤️", "🎂", "🌟", "🎓", "💍", "✈️", "🏠"];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">纪念日</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            记录重要的日子
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm hover:opacity-90 transition-opacity"
        >
          <PlusIcon size={14} />
          添加
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 rounded-2xl border border-[var(--color-border)] space-y-4">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="纪念日名称"
            className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)]"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)]"
          />
          <div className="flex gap-2">
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => setForm({ ...form, emoji: e })}
                className={`
                  w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors
                  ${form.emoji === e ? "bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]" : "hover:bg-black/5"}
                `}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl hover:bg-black/5">
              取消
            </button>
            <button onClick={add} className="px-4 py-2 text-sm rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90">
              保存
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-secondary)] text-sm">
          还没有纪念日，点击"添加"开始记录
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const days = daysUntil(item.date);
            const total = daysSince(item.date);
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border)] hover:shadow-sm transition-shadow group"
              >
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {item.date} · 已经 {total} 天
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold text-[var(--color-accent)] tabular-nums">
                    {days}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">天后</p>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-black/5 transition-all"
                  aria-label="删除"
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
