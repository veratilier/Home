import { useState, useRef, useEffect } from "react";
import { SendIcon } from "../components/Icons";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "这是一条示例回复。聊天功能待接入后端服务。",
      };
      setMessages((prev) => [...prev, reply]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
            发送消息开始对话
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-[var(--color-accent)] text-white rounded-br-md"
                      : "bg-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-md"
                    }
                  `}
                >
                  {msg.content}
                </div>
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
