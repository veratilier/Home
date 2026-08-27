import { useState, useRef, useEffect, useCallback } from "react";
import { SendIcon } from "../components/Icons";

interface Attachment {
  id: string;
  name: string;
  type: "image" | "video" | "file";
  url: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  isThinkingStreaming?: boolean;
  time: string;
  attachments?: Attachment[];
  bookmarked?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  time: string;
  messages: Message[];
}

const mockThinkingTexts = [
  "用户在询问今天的天气情况。我需要给出一个合理的天气描述，包括温度、风力和天气状况。考虑到这是一个日常对话场景，我应该用自然亲切的语气回答，同时给出一些实用的建议，比如是否适合出门、需不需要带伞等。让我组织一下回复的结构。",
  "用户想要一首适合下午听的音乐推荐。下午的时光通常比较悠闲，适合轻柔、舒缓、有氛围感的音乐。我可以推荐一些钢琴曲或者新世纪音乐。Yiruma 的 River Flows in You 是一个很好的选择，旋律优美且不会太吵闹。也可以推荐坂本龍一的作品作为备选。",
  "这是一个创作类请求，用户希望我写一段关于秋天的短诗。我需要构思秋天的意象：落叶、微风、金色光线、桂花香、大雁南飞。选择简洁的五言或七言形式，注重韵律和画面感，让读者能够感受到秋天的氛围和意境。",
];

const mockReplies = [
  "今天天气晴朗，气温大约 26°C，微风轻拂，非常适合出门走走。傍晚可能会有些许云层，但不影响整体的好天气。记得带上防晒哦。",
  "推荐你听 Yiruma 的《River Flows in You》，钢琴旋律如流水般轻柔，特别适合午后安静的时光。如果你喜欢更有氛围感的音乐，坂本龍一的《Merry Christmas Mr. Lawrence》也是不错的选择。",
  "秋风起，叶知归。\n一抹斜阳穿林过，\n金黄铺满旧时径。\n雁声远去天际尽，\n唯余桂香入梦轻。",
];

function formatNow() {
  const d = new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${h}:${m}`;
}

function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function BookmarkIcon({ size = 14, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RefreshIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function ImageIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function PaperclipIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function HistoryIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function ThinkingPill({ isAnimating, onClick }: { isAnimating?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 py-1.5 px-1 mb-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      <ClockIcon size={14} />
      <span className="text-[13px] font-medium">Thought process</span>
      {isAnimating ? (
        <span className="flex gap-[3px] items-center ml-0.5">
          <span className="w-[3px] h-[3px] bg-[var(--color-text-secondary)] rounded-full animate-[pulse_1.4s_ease-in-out_infinite]" />
          <span className="w-[3px] h-[3px] bg-[var(--color-text-secondary)] rounded-full animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
          <span className="w-[3px] h-[3px] bg-[var(--color-text-secondary)] rounded-full animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
        </span>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}

function ThinkingDrawer({ open, text, isStreaming, onClose }: {
  open: boolean;
  text: string;
  isStreaming?: boolean;
  onClose: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const prevTextRef = useRef("");

  useEffect(() => {
    if (!isStreaming || !text) {
      setDisplayed(text);
      return;
    }
    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      indexRef.current = 0;
      setDisplayed("");
    }
    const interval = setInterval(() => {
      indexRef.current += 2;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, 20);
    return () => clearInterval(interval);
  }, [text, isStreaming]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      )}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white rounded-t-2xl shadow-2xl
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ maxHeight: "60vh" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-black/15" />
        </div>
        <div className="flex items-center px-4 pb-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h3 className="flex-1 text-center text-[15px] font-semibold pr-[34px]">Thought process</h3>
        </div>
        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: "calc(60vh - 80px)" }}>
          <p className="text-[14px] leading-[1.8] text-[var(--color-text-primary)]">
            {displayed}
            {isStreaming && displayed.length < text.length && (
              <span className="inline-block w-[2px] h-[14px] bg-[var(--color-text-primary)] ml-0.5 align-middle animate-[blink_0.8s_step-end_infinite]" />
            )}
          </p>
        </div>
      </div>
    </>
  );
}

function StreamingText({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");

    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(interval);
        onDone();
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, onDone]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[14px] bg-[var(--color-text-primary)] ml-0.5 align-middle animate-[blink_0.8s_step-end_infinite]" />
      )}
    </span>
  );
}

function MessageActions({ msg, onBookmark, onCopy, onRegenerate }: {
  msg: Message;
  onBookmark: () => void;
  onCopy: () => void;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-1 mt-1.5">
      <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-black/[0.05] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" title="复制">
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <CopyIcon />
        )}
      </button>
      <button onClick={onBookmark} className={`p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors ${msg.bookmarked ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`} title="收藏">
        <BookmarkIcon filled={msg.bookmarked} />
      </button>
      {msg.role === "assistant" && onRegenerate && (
        <button onClick={onRegenerate} className="p-1.5 rounded-lg hover:bg-black/[0.05] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" title="重新生成">
          <RefreshIcon />
        </button>
      )}
      <span className="text-[11px] text-[var(--color-text-secondary)]/60 ml-1.5 tabular-nums">{msg.time}</span>
    </div>
  );
}

function AttachmentPreview({ att }: { att: Attachment }) {
  if (att.type === "image") return <img src={att.url} alt={att.name} className="max-w-[240px] max-h-[180px] rounded-xl object-cover" />;
  if (att.type === "video") return <video src={att.url} controls className="max-w-[280px] max-h-[200px] rounded-xl" />;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.04] max-w-[240px]">
      <PaperclipIcon size={14} />
      <span className="text-xs truncate">{att.name}</span>
    </div>
  );
}

function ChatHistorySidebar({ open, onClose, sessions, activeId, onSelect, onNew }: {
  open: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <aside className={`
        fixed top-0 right-0 z-50 h-full w-[280px]
        bg-white border-l border-[var(--color-border)]
        flex flex-col shadow-xl
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-4 h-[52px] shrink-0 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold">聊天记录</h2>
          <div className="flex items-center gap-1">
            <button onClick={onNew} className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors" title="新对话">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors" title="关闭">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {sessions.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)] px-2 py-6 text-center">暂无聊天记录</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => { onSelect(s.id); onClose(); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors mb-0.5 ${s.id === activeId ? "bg-black/[0.06] font-medium" : "hover:bg-black/[0.03]"}`}
              >
                <p className="truncate">{s.title}</p>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{s.time} · {s.messages.length} 条消息</p>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => [{
    id: crypto.randomUUID(),
    title: "新对话",
    time: formatNow(),
    messages: [],
  }]);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);
  const [input, setInput] = useState("");
  const [openThinkingId, setOpenThinkingId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyIndexRef = useRef(0);

  const activeSession = sessions.find((s) => s.id === activeSessionId)!;
  const messages = activeSession.messages;

  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: typeof updater === "function" ? updater(s.messages) : updater }
          : s
      )
    );
  }, [activeSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStreamDone = useCallback((id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m)));
  }, [setMessages]);

  const openThinkingMsg = openThinkingId ? messages.find((m) => m.id === openThinkingId) : null;

  const toggleBookmark = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, bookmarked: !m.bookmarked } : m)));
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: Attachment[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type.startsWith("image/") ? "image" as const : f.type.startsWith("video/") ? "video" as const : "file" as const,
      url: URL.createObjectURL(f),
    }));
    setPendingFiles((prev) => [...prev, ...newAtts]);
    e.target.value = "";
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  const newSession = () => {
    const s: ChatSession = { id: crypto.randomUUID(), title: "新对话", time: formatNow(), messages: [] };
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s.id);
  };

  const send = () => {
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      time: formatNow(),
      attachments: pendingFiles.length > 0 ? [...pendingFiles] : undefined,
    };

    // Update session title from first message
    if (messages.length === 0 && text) {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, title: text.slice(0, 20) } : s))
      );
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingFiles([]);

    const idx = replyIndexRef.current % mockReplies.length;
    replyIndexRef.current++;

    const thinkingId = crypto.randomUUID();

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: thinkingId,
        role: "assistant",
        content: "",
        isThinking: true,
        time: formatNow(),
      }]);
    }, 300);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { ...m, thinking: mockThinkingTexts[idx], isThinking: false, isThinkingStreaming: true, time: formatNow() }
            : m
        )
      );
    }, 1200);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { ...m, content: mockReplies[idx], isThinkingStreaming: false, isStreaming: true, time: formatNow() }
            : m
        )
      );
    }, 3200);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Top bar: avatars centered, history button right */}
      <div className="shrink-0 flex items-center justify-center py-3 border-b border-[var(--color-border)] relative">
        <div className="flex items-center -space-x-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#e8956e] flex items-center justify-center shrink-0 ring-2 ring-[var(--color-surface)] z-[1]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
            </svg>
          </div>
          <div className="w-7 h-7 rounded-full bg-[var(--color-text-primary)] flex items-center justify-center shrink-0 ring-2 ring-[var(--color-surface)]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="absolute right-3 p-1.5 rounded-lg hover:bg-black/[0.05] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          title="聊天记录"
        >
          <HistoryIcon size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#e8956e] flex items-center justify-center text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
              </svg>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm">发送消息开始对话</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  <div className="flex flex-col items-end">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 justify-end max-w-[80%]">
                        {msg.attachments.map((att) => <AttachmentPreview key={att.id} att={att} />)}
                      </div>
                    )}
                    {msg.content && (
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed bg-[var(--color-accent)] text-white whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    )}
                    <MessageActions msg={msg} onBookmark={() => toggleBookmark(msg.id)} onCopy={() => copyMessage(msg.content)} />
                  </div>
                ) : (
                  <div className="flex flex-col items-start">
                    {(msg.isThinking || msg.thinking) && (
                      <ThinkingPill
                        isAnimating={msg.isThinking || msg.isThinkingStreaming}
                        onClick={() => setOpenThinkingId(msg.id)}
                      />
                    )}

                    {!msg.isThinking && msg.content && (
                      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--color-border)]/60 text-sm leading-relaxed text-[var(--color-text-primary)] whitespace-pre-wrap">
                        {msg.isStreaming ? (
                          <StreamingText text={msg.content} onDone={() => handleStreamDone(msg.id)} />
                        ) : (
                          msg.content
                        )}
                      </div>
                    )}

                    {!msg.isThinking && msg.content && (
                      <MessageActions msg={msg} onBookmark={() => toggleBookmark(msg.id)} onCopy={() => copyMessage(msg.content)} onRegenerate={() => {}} />
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="shrink-0 border-t border-[var(--color-border)] px-4 pt-3">
          <div className="max-w-2xl mx-auto flex flex-wrap gap-2">
            {pendingFiles.map((f) => (
              <div key={f.id} className="relative group">
                {f.type === "image" ? (
                  <img src={f.url} alt={f.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/[0.04] text-xs">
                    {f.type === "video" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    ) : <PaperclipIcon size={12} />}
                    <span className="max-w-[80px] truncate">{f.name}</span>
                  </div>
                )}
                <button onClick={() => removePendingFile(f.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 border-t border-[var(--color-border)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-black/[0.05] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0" title="添加图片">
            <ImageIcon size={18} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-black/[0.05] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0" title="添加文件">
            <PaperclipIcon size={18} />
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.zip" onChange={handleFileSelect} className="hidden" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="输入消息…"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-sm outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <button onClick={send} disabled={!input.trim() && pendingFiles.length === 0} className="p-2.5 rounded-xl bg-[var(--color-accent)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0">
            <SendIcon size={16} />
          </button>
        </div>
      </div>

      {/* Thinking drawer */}
      <ThinkingDrawer
        open={openThinkingId !== null}
        text={openThinkingMsg?.thinking || ""}
        isStreaming={openThinkingMsg?.isThinkingStreaming}
        onClose={() => setOpenThinkingId(null)}
      />

      {/* History sidebar */}
      <ChatHistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={setActiveSessionId}
        onNew={() => { newSession(); setHistoryOpen(false); }}
      />
    </div>
  );
}
