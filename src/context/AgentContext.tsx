import { createContext, useContext, useCallback, useState, type ReactNode } from "react";

export interface AgentAction {
  type: "navigate" | "create_note" | "create_reminder" | "notify";
  [key: string]: unknown;
}

interface Toast {
  id: string;
  message: string;
  kind: "info" | "success" | "error";
}

interface AgentContextValue {
  executeAction: (action: AgentAction) => void;
  executeActions: (actions: AgentAction[]) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
}

const Ctx = createContext<AgentContextValue | null>(null);

export function useAgent() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAgent must be inside AgentProvider");
  return ctx;
}

export function parseActions(text: string): { clean: string; actions: AgentAction[] } {
  const actions: AgentAction[] = [];
  const clean = text.replace(/```vesper-action\s*\n([\s\S]*?)```/g, (_, json: string) => {
    try { actions.push(JSON.parse(json.trim())); } catch { /* skip malformed */ }
    return "";
  }).trim();
  return { clean, actions };
}

export function AgentProvider({ children, navigate }: { children: ReactNode; navigate: (path: string) => void }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const executeAction = useCallback((action: AgentAction) => {
    switch (action.type) {
      case "navigate": {
        const path = action.path as string;
        if (path) {
          navigate(path);
          addToast(`Navigated to ${path}`, "success");
        }
        break;
      }
      case "create_note": {
        const text = action.text as string;
        const color = (action.color as string) || "yellow";
        if (text) {
          try {
            const notes = JSON.parse(localStorage.getItem("sticky_notes") || "[]");
            const note = { id: crypto.randomUUID(), text, color, createdAt: Date.now(), updatedAt: Date.now() };
            localStorage.setItem("sticky_notes", JSON.stringify([note, ...notes]));
            addToast("Note created", "success");
          } catch { addToast("Failed to create note", "error"); }
        }
        break;
      }
      case "create_reminder": {
        const title = action.title as string;
        const date = action.date as string;
        const time = (action.time as string) || "";
        const priority = (action.priority as string) || "low";
        if (title && date) {
          try {
            const all = JSON.parse(localStorage.getItem("reminders_v1") || "[]");
            all.push({ id: crypto.randomUUID(), title, date, time, done: false, priority });
            localStorage.setItem("reminders_v1", JSON.stringify(all));
            addToast("Reminder added", "success");
          } catch { addToast("Failed to add reminder", "error"); }
        }
        break;
      }
      case "notify": {
        const message = action.message as string;
        if (message) addToast(message, "info");
        break;
      }
    }
  }, [navigate, addToast]);

  const executeActions = useCallback((actions: AgentAction[]) => {
    actions.forEach(executeAction);
  }, [executeAction]);

  return (
    <Ctx.Provider value={{ executeAction, executeActions, toasts, dismissToast }}>
      {children}
      {/* Toast overlay */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => dismissToast(t.id)}
              className="pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg text-[13px] font-medium animate-[slideIn_0.25s_ease-out] cursor-pointer"
              style={{
                background: t.kind === "success" ? "#dcfce7" : t.kind === "error" ? "#fee2e2" : "white",
                color: t.kind === "success" ? "#14532d" : t.kind === "error" ? "#991b1b" : "var(--color-text-primary)",
                border: `1px solid ${t.kind === "success" ? "#bbf7d0" : t.kind === "error" ? "#fecaca" : "var(--color-border)"}`,
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}
