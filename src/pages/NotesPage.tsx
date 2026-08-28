import { useState } from "react";

interface StickyNote {
  id: string;
  text: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

const COLORS = [
  { key: "yellow", bg: "#fef9c3", border: "#f5e6a3", text: "#78660a" },
  { key: "green", bg: "#dcfce7", border: "#b8e6c8", text: "#14532d" },
  { key: "blue", bg: "#dbeafe", border: "#b5cff0", text: "#1e3a5f" },
  { key: "pink", bg: "#fce7f3", border: "#f0c6dd", text: "#831843" },
  { key: "orange", bg: "#ffedd5", border: "#f0d4b0", text: "#7c2d12" },
  { key: "purple", bg: "#f3e8ff", border: "#dcc8f0", text: "#581c87" },
];

const STORAGE_KEY = "sticky_notes";

function getColor(key: string) {
  return COLORS.find((c) => c.key === key) || COLORS[0];
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<StickyNote[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addText, setAddText] = useState("");
  const [addColor, setAddColor] = useState("yellow");

  const save = (next: StickyNote[]) => {
    setNotes(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const addNote = () => {
    if (!addText.trim()) return;
    const note: StickyNote = {
      id: crypto.randomUUID(),
      text: addText.trim(),
      color: addColor,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    save([note, ...notes]);
    setAddText("");
    setAddColor("yellow");
    setAddOpen(false);
  };

  const updateNote = () => {
    if (!detailId || !editText.trim()) return;
    save(notes.map((n) => n.id === detailId ? { ...n, text: editText.trim(), updatedAt: Date.now() } : n));
    setEditing(false);
  };

  const deleteNote = (id: string) => {
    save(notes.filter((n) => n.id !== id));
    setDetailId(null);
  };

  const detailNote = detailId ? notes.find((n) => n.id === detailId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">便笺</h1>
          <button
            onClick={() => setAddOpen(true)}
            className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notes grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#fef9c3] flex items-center justify-center mb-4 rotate-3" style={{ boxShadow: "2px 3px 8px rgba(0,0,0,0.08)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#78660a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><polyline points="14 3 14 8 21 8" />
              </svg>
            </div>
            <p className="text-[14px] text-[var(--color-text-secondary)] mb-1">还没有便笺</p>
            <p className="text-[12px] text-[var(--color-text-secondary)]/60">点击右上角 + 添加第一条</p>
          </div>
        ) : (
          <div className="columns-2 gap-3 sm:columns-3">
            {notes.map((note, i) => {
              const c = getColor(note.color);
              const rotate = ["-1deg", "0.8deg", "-0.5deg", "1.2deg", "-0.3deg", "0.6deg"][i % 6];
              return (
                <button
                  key={note.id}
                  onClick={() => { setDetailId(note.id); setEditing(false); }}
                  className="w-full mb-3 break-inside-avoid text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ transform: `rotate(${rotate})` }}
                >
                  <div
                    className="rounded-lg px-4 pt-4 pb-3 relative"
                    style={{
                      background: c.bg,
                      borderTop: `3px solid ${c.border}`,
                      boxShadow: "1px 2px 6px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* Torn top effect */}
                    <div className="absolute top-0 left-3 right-3 h-[3px] rounded-b-sm" style={{ background: c.border, opacity: 0.4 }} />
                    <p
                      className="text-[13px] leading-relaxed whitespace-pre-wrap"
                      style={{ color: c.text, display: "-webkit-box", WebkitLineClamp: 8, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      {note.text}
                    </p>
                    <p className="text-[10px] mt-2 opacity-50" style={{ color: c.text }}>
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail bottom sheet */}
      {detailNote && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setDetailId(null)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]"
            style={{ maxHeight: "75vh", background: getColor(detailNote.color).bg }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: getColor(detailNote.color).border }} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-5 pb-3">
              <button onClick={() => setDetailId(null)} className="p-1 rounded-lg hover:bg-black/[0.05] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={getColor(detailNote.color).text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (editing) { updateNote(); }
                    else { setEditText(detailNote.text); setEditing(true); }
                  }}
                  className="px-3 py-1 rounded-lg text-[12px] font-medium hover:bg-black/[0.05] transition-colors"
                  style={{ color: getColor(detailNote.color).text }}
                >
                  {editing ? "保存" : "编辑"}
                </button>
                <button
                  onClick={() => deleteNote(detailNote.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: "calc(75vh - 80px)" }}>
              {editing ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  className="w-full min-h-[200px] text-[14px] leading-relaxed bg-transparent outline-none resize-none"
                  style={{ color: getColor(detailNote.color).text }}
                />
              ) : (
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: getColor(detailNote.color).text }}>
                  {detailNote.text}
                </p>
              )}
              <p className="text-[11px] mt-4 opacity-40" style={{ color: getColor(detailNote.color).text }}>
                {new Date(detailNote.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add bottom sheet */}
      {addOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setAddOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]" style={{ maxHeight: "70vh" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <button onClick={() => setAddOpen(false)} className="text-[14px] text-[var(--color-text-secondary)]">取消</button>
              <h3 className="text-[15px] font-semibold">新建便笺</h3>
              <button onClick={addNote} className="text-[14px] font-semibold text-[var(--color-accent)]">保存</button>
            </div>
            <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "calc(70vh - 60px)" }}>
              {/* Color picker */}
              <div className="flex gap-2 mb-4">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setAddColor(c.key)}
                    className={`w-8 h-8 rounded-full transition-all ${addColor === c.key ? "ring-2 ring-offset-2 ring-[var(--color-text-primary)]/30 scale-110" : "hover:scale-105"}`}
                    style={{ background: c.bg, border: `2px solid ${c.border}` }}
                  />
                ))}
              </div>
              {/* Text input */}
              <textarea
                value={addText}
                onChange={(e) => setAddText(e.target.value)}
                placeholder="写点什么..."
                autoFocus
                className="w-full min-h-[180px] px-4 py-3 text-[14px] leading-relaxed rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent resize-none"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
