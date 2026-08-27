import { useState, useRef, useEffect, useCallback } from "react";
import { SendIcon } from "../components/Icons";

interface ThinkingStep {
  text: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: ThinkingStep[];
  isStreaming?: boolean;
  isThinking?: boolean;
}

const mockThinkingSteps = [
  [
    { text: "分析用户的问题意图…" },
    { text: "检索相关知识库内容…" },
    { text: "组织回复结构，确保回答准确且有帮助。" },
  ],
  [
    { text: "理解用户对音乐推荐的需求…" },
    { text: "考虑下午适合的音乐风格：轻柔、舒缓、有氛围感…" },
    { text: "筛选曲目，综合考虑旋律和情绪匹配度。" },
  ],
  [
    { text: "收到创作类请求，切换到文学模式…" },
    { text: "构思秋天的意象：落叶、微风、金色光线…" },
    { text: "选择简洁的诗歌形式，注重韵律和画面感。" },
  ],
];

const mockReplies = [
  "今天天气晴朗，气温大约 26°C，微风轻拂，非常适合出门走走。傍晚可能会有些许云层，但不影响整体的好天气。记得带上防晒哦。",
  "推荐你听 Yiruma 的《River Flows in You》，钢琴旋律如流水般轻柔，特别适合午后安静的时光。如果你喜欢更有氛围感的音乐，坂本龍一的《Merry Christmas Mr. Lawrence》也是不错的选择。",
  "秋风起，叶知归。\n一抹斜阳穿林过，\n金黄铺满旧时径。\n雁声远去天际尽，\n唯余桂香入梦轻。",
];

function ThinkingBlock({ steps, expanded, onToggle }: {
  steps: ThinkingStep[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-1"
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <SparkleIcon />
        <span className="font-medium">思考过程</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="ml-5 mt-1 pl-3 border-l-2 border-[var(--color-accent)]/20 space-y-1.5">
          {steps.map((step, i) => (
            <p key={i} className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {step.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
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

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-2 py-1">
      <SparkleIcon />
      <span className="text-xs text-[var(--color-text-secondary)] font-medium">正在思考</span>
      <span className="flex gap-1">
        <span className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-[bounce_1.2s_ease-in-out_infinite]" />
        <span className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-[bounce_1.2s_ease-in-out_0.2s_infinite]" />
        <span className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-[bounce_1.2s_ease-in-out_0.4s_infinite]" />
      </span>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const replyIndexRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStreamDone = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const toggleThinking = (id: string) => {
    setExpandedThinking((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const idx = replyIndexRef.current % mockReplies.length;
    replyIndexRef.current++;

    const thinkingId = crypto.randomUUID();
    const thinkingMsg: Message = {
      id: thinkingId,
      role: "assistant",
      content: "",
      isThinking: true,
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, thinkingMsg]);
    }, 300);

    setTimeout(() => {
      const replyId = thinkingId;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === replyId
            ? {
                ...m,
                content: mockReplies[idx],
                thinking: mockThinkingSteps[idx],
                isThinking: false,
                isStreaming: true,
              }
            : m
        )
      );
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#e8956e] flex items-center justify-center">
              <SparkleIcon />
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm">
              发送消息开始对话
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed bg-[var(--color-accent)] text-white whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#e8956e] flex items-center justify-center shrink-0">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Assistant
                        </span>
                      </div>

                      {msg.isThinking && <ThinkingAnimation />}

                      {!msg.isThinking && msg.thinking && (
                        <ThinkingBlock
                          steps={msg.thinking}
                          expanded={expandedThinking.has(msg.id)}
                          onToggle={() => toggleThinking(msg.id)}
                        />
                      )}

                      {!msg.isThinking && msg.content && (
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--color-border)]/60 text-sm leading-relaxed text-[var(--color-text-primary)] whitespace-pre-wrap">
                          {msg.isStreaming ? (
                            <StreamingText
                              text={msg.content}
                              onDone={() => handleStreamDone(msg.id)}
                            />
                          ) : (
                            msg.content
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--color-border)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="输入消息…"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-sm outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-[var(--color-accent)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <SendIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
