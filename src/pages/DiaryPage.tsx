import { useState } from "react";
import { PlusIcon } from "../components/Icons";

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("diary") || "[]");
    } catch {
      return [];
    }
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const save = (next: DiaryEntry[]) => {
    setEntries(next);
    try { localStorage.setItem("diary", JSON.stringify(next)); } catch { /* noop */ }
  };

  const add = () => {
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      content: "",
    };
    save([entry, ...entries]);
    setActiveId(entry.id);
  };

  const update = (id: string, content: string) => {
    save(entries.map((e) => (e.id === id ? { ...e, content } : e)));
  };

  const remove = (id: string) => {
    save(entries.filter((e) => e.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const active = entries.find((e) => e.id === activeId);

  return (
    <div className="flex h-full">
      <div className="w-[240px] shrink-0 border-r border-[var(--color-border)] flex flex-col">
        <div className="flex items-center justify-between px-4 h-[52px] shrink-0">
          <h2 className="text-sm font-semibold">日记</h2>
          <button
            onClick={add}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="新建日记"
          >
            <PlusIcon size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {entries.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)] px-2 py-4">
              还没有日记
            </p>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setActiveId(entry.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors mb-0.5
                  ${entry.id === activeId
                    ? "bg-black/[0.06] font-medium"
                    : "hover:bg-black/[0.03]"
                  }
                `}
              >
                <p className="truncate">{entry.content || "空白日记"}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {formatDate(entry.date)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {active ? (
          <>
            <div className="flex items-center justify-between px-6 h-[52px] shrink-0 border-b border-[var(--color-border)]">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {formatDate(active.date)}
              </span>
              <button
                onClick={() => remove(active.id)}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                删除
              </button>
            </div>
            <textarea
              value={active.content}
              onChange={(e) => update(active.id, e.target.value)}
              placeholder="写下今天的想法…"
              className="flex-1 px-6 py-4 text-sm leading-relaxed outline-none resize-none bg-transparent"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
            选择或创建一篇日记
          </div>
        )}
      </div>
    </div>
  );
}
