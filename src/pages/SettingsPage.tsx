import { useState, useEffect } from "react";

const STORAGE_KEY = "app_settings";

interface McpServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface AppSettings {
  userName: string;
  userAvatar: string;
  assistantName: string;
  assistantAvatar: string;
  aiProvider: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  mcpServers: McpServer[];
  voiceEnabled: boolean;
  voiceId: string;
  voiceSpeed: number;
  notifyReminders: boolean;
  notifyAnniversary: boolean;
  notifyDiary: boolean;
  theme: string;
  accentColor: string;
  fontSize: string;
  language: string;
  petVisible: boolean;
  petScale: number;
}

const DEFAULTS: AppSettings = {
  userName: "Vera",
  userAvatar: "",
  assistantName: "Rowan",
  assistantAvatar: "",
  aiProvider: "anthropic",
  apiKey: "",
  apiEndpoint: "",
  model: "claude-sonnet-4-20250514",
  mcpServers: [],
  voiceEnabled: false,
  voiceId: "",
  voiceSpeed: 1,
  notifyReminders: true,
  notifyAnniversary: true,
  notifyDiary: false,
  theme: "light",
  accentColor: "#c96442",
  fontSize: "normal",
  language: "zh-CN",
  petVisible: true,
  petScale: 5,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

function saveSettings(s: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const ACCENT_COLORS = [
  "#c96442", "#e85d75", "#b05cba", "#4a90d9",
  "#1abc9c", "#5cb85c", "#e6a817", "#6c7a89",
];

const AI_PROVIDERS = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "custom", label: "自定义" },
];

const MODELS: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "o3-mini", label: "o3-mini" },
  ],
  custom: [],
};

const AVATARS = [
  "😊", "🐱", "🐶", "🌸", "⭐", "🎵",
  "💫", "🦊", "🐰", "🌙", "🍀", "🎀",
  "🤖", "✨", "🦀", "🐻",
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
      style={{ background: checked ? "var(--color-accent)" : "#ccc" }}
    >
      <div
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {desc && <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
      <div className="px-5 pt-4 pb-0.5">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="px-5 divide-y divide-[var(--color-border)]">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<AppSettings>(loadSettings);
  const [showKey, setShowKey] = useState(false);
  const [mcpName, setMcpName] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    saveSettings(s);
    document.documentElement.style.setProperty("--color-accent", s.accentColor);
  }, [s]);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const addMcp = () => {
    if (!mcpName.trim() || !mcpUrl.trim()) return;
    set("mcpServers", [
      ...s.mcpServers,
      { id: Date.now().toString(), name: mcpName.trim(), url: mcpUrl.trim(), enabled: true },
    ]);
    setMcpName("");
    setMcpUrl("");
  };

  const removeMcp = (id: string) =>
    set("mcpServers", s.mcpServers.filter((sv) => sv.id !== id));

  const toggleMcp = (id: string) =>
    set("mcpServers", s.mcpServers.map((sv) => (sv.id === id ? { ...sv, enabled: !sv.enabled } : sv)));

  const handleExport = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key) || "";
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vesper-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          for (const [k, v] of Object.entries(data)) {
            localStorage.setItem(k, v as string);
          }
          setS(loadSettings());
        } catch {
          alert("导入失败：文件格式错误");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    localStorage.clear();
    setS({ ...DEFAULTS });
    setConfirmClear(false);
  };

  const inputCls =
    "px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-accent)] bg-transparent";

  const models = MODELS[s.aiProvider] || [];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-24">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">设置</h1>
      <p className="text-[var(--color-text-secondary)] text-sm mb-8">自定义你的体验</p>

      <div className="space-y-5">
        {/* ── 个人资料 ── */}
        <Card title="个人资料">
          <Row label="用户昵称" desc="在日记等页面显示的名字">
            <input
              className={`${inputCls} w-28 text-right`}
              value={s.userName}
              onChange={(e) => set("userName", e.target.value)}
            />
          </Row>
          <div className="py-3.5">
            <div className="text-sm mb-2.5">用户头像</div>
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((a) => (
                <button
                  key={`u-${a}`}
                  onClick={() => set("userAvatar", s.userAvatar === a ? "" : a)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all border-2"
                  style={{
                    borderColor: s.userAvatar === a ? "var(--color-accent)" : "transparent",
                    background: s.userAvatar === a ? "var(--color-accent)" + "1a" : "var(--color-border)",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <Row label="助手昵称">
            <input
              className={`${inputCls} w-28 text-right`}
              value={s.assistantName}
              onChange={(e) => set("assistantName", e.target.value)}
            />
          </Row>
          <div className="py-3.5 pb-4">
            <div className="text-sm mb-2.5">助手头像</div>
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((a) => (
                <button
                  key={`a-${a}`}
                  onClick={() => set("assistantAvatar", s.assistantAvatar === a ? "" : a)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all border-2"
                  style={{
                    borderColor: s.assistantAvatar === a ? "var(--color-accent)" : "transparent",
                    background: s.assistantAvatar === a ? "var(--color-accent)" + "1a" : "var(--color-border)",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── AI 接入 ── */}
        <Card title="AI 接入">
          <Row label="服务商">
            <select
              className={`${inputCls} w-36`}
              value={s.aiProvider}
              onChange={(e) => {
                set("aiProvider", e.target.value);
                const m = MODELS[e.target.value];
                if (m?.length) set("model", m[0].value);
              }}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Row>
          <Row label="API Key" desc="密钥仅保存在本地浏览器">
            <div className="flex items-center gap-2">
              <input
                type={showKey ? "text" : "password"}
                className={`${inputCls} w-40`}
                value={s.apiKey}
                onChange={(e) => set("apiKey", e.target.value)}
                placeholder="sk-..."
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] whitespace-nowrap"
              >
                {showKey ? "隐藏" : "显示"}
              </button>
            </div>
          </Row>
          {s.aiProvider === "custom" && (
            <Row label="API 地址" desc="自定义接口地址">
              <input
                className={`${inputCls} w-52`}
                value={s.apiEndpoint}
                onChange={(e) => set("apiEndpoint", e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </Row>
          )}
          {models.length > 0 ? (
            <Row label="模型">
              <select
                className={`${inputCls} w-48`}
                value={s.model}
                onChange={(e) => set("model", e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </Row>
          ) : (
            <Row label="模型 ID">
              <input
                className={`${inputCls} w-48`}
                value={s.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="model-name"
              />
            </Row>
          )}
        </Card>

        {/* ── MCP 工具 ── */}
        <Card title="MCP 工具">
          {s.mcpServers.length === 0 ? (
            <div className="py-5 text-sm text-[var(--color-text-secondary)] text-center">
              尚未添加 MCP 服务器
            </div>
          ) : (
            s.mcpServers.map((sv) => (
              <div key={sv.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{sv.name}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] truncate">{sv.url}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Toggle checked={sv.enabled} onChange={() => toggleMcp(sv.id)} />
                  <button
                    onClick={() => removeMcp(sv.id)}
                    className="text-xs text-red-400 hover:text-red-500"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
          <div className="py-3.5 pb-4 space-y-2">
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1`}
                value={mcpName}
                onChange={(e) => setMcpName(e.target.value)}
                placeholder="名称"
              />
              <input
                className={`${inputCls} flex-[2]`}
                value={mcpUrl}
                onChange={(e) => setMcpUrl(e.target.value)}
                placeholder="地址或命令"
              />
            </div>
            <button
              onClick={addMcp}
              disabled={!mcpName.trim() || !mcpUrl.trim()}
              className="w-full py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              添加服务器
            </button>
          </div>
        </Card>

        {/* ── 语音设置 ── */}
        <Card title="语音设置">
          <Row label="语音合成" desc="启用文本转语音功能">
            <Toggle checked={s.voiceEnabled} onChange={(v) => set("voiceEnabled", v)} />
          </Row>
          {s.voiceEnabled && (
            <>
              <Row label="语音">
                <select
                  className={`${inputCls} w-44`}
                  value={s.voiceId}
                  onChange={(e) => set("voiceId", e.target.value)}
                >
                  <option value="">系统默认</option>
                  {typeof speechSynthesis !== "undefined" &&
                    speechSynthesis.getVoices().map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </Row>
              <Row label="语速" desc={`${s.voiceSpeed.toFixed(1)}x`}>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={s.voiceSpeed}
                  onChange={(e) => set("voiceSpeed", parseFloat(e.target.value))}
                  className="w-32 accent-[var(--color-accent)]"
                />
              </Row>
            </>
          )}
        </Card>

        {/* ── 通知推送 ── */}
        <Card title="通知推送">
          <Row label="提醒事项" desc="待办到期时发送通知">
            <Toggle checked={s.notifyReminders} onChange={(v) => set("notifyReminders", v)} />
          </Row>
          <Row label="纪念日" desc="纪念日当天提醒">
            <Toggle checked={s.notifyAnniversary} onChange={(v) => set("notifyAnniversary", v)} />
          </Row>
          <Row label="日记提醒" desc="每晚提醒写日记">
            <Toggle checked={s.notifyDiary} onChange={(v) => set("notifyDiary", v)} />
          </Row>
        </Card>

        {/* ── 外观与主题 ── */}
        <Card title="外观与主题">
          <div className="py-3.5">
            <div className="text-sm mb-3">主题</div>
            <div className="flex gap-2">
              {[
                { value: "light", label: "浅色" },
                { value: "dark", label: "深色" },
                { value: "system", label: "跟随系统" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("theme", opt.value)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={
                    s.theme === opt.value
                      ? { background: "var(--color-accent)", color: "#fff" }
                      : { border: "1px solid var(--color-border)" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="py-3.5">
            <div className="text-sm mb-3">强调色</div>
            <div className="flex gap-2.5">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("accentColor", c)}
                  className="w-8 h-8 rounded-full transition-all border-2"
                  style={{
                    background: c,
                    borderColor: s.accentColor === c ? "var(--color-text-primary)" : "transparent",
                    transform: s.accentColor === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="py-3.5">
            <div className="text-sm mb-3">字体大小</div>
            <div className="flex gap-2">
              {[
                { value: "small", label: "小" },
                { value: "normal", label: "标准" },
                { value: "large", label: "大" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("fontSize", opt.value)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={
                    s.fontSize === opt.value
                      ? { background: "var(--color-accent)", color: "#fff" }
                      : { border: "1px solid var(--color-border)" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Row label="语言">
            <select
              className={`${inputCls} w-36`}
              value={s.language}
              onChange={(e) => set("language", e.target.value)}
            >
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </Row>
        </Card>

        {/* ── 桌宠 ── */}
        <Card title="桌宠">
          <Row label="显示桌宠" desc="在页面右下角显示 Clawd">
            <Toggle checked={s.petVisible} onChange={(v) => set("petVisible", v)} />
          </Row>
          {s.petVisible && (
            <Row label="大小" desc={`${s.petScale}x`}>
              <input
                type="range"
                min="3"
                max="8"
                step="1"
                value={s.petScale}
                onChange={(e) => set("petScale", parseInt(e.target.value))}
                className="w-32 accent-[var(--color-accent)]"
              />
            </Row>
          )}
        </Card>

        {/* ── 数据管理 ── */}
        <Card title="数据管理">
          <Row label="导出数据" desc="备份所有本地数据为 JSON 文件">
            <button
              onClick={handleExport}
              className="px-4 py-1.5 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-black/[0.03] transition-colors"
            >
              导出
            </button>
          </Row>
          <Row label="导入数据" desc="从 JSON 备份恢复">
            <button
              onClick={handleImport}
              className="px-4 py-1.5 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-black/[0.03] transition-colors"
            >
              导入
            </button>
          </Row>
          <Row label="清除数据" desc="删除所有本地存储的数据">
            <button
              onClick={handleClear}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: confirmClear ? "#ef4444" : "transparent",
                color: confirmClear ? "#fff" : "#ef4444",
                border: confirmClear ? "none" : "1px solid #ef4444",
              }}
            >
              {confirmClear ? "确认清除" : "清除"}
            </button>
          </Row>
        </Card>

        {/* ── 关于 ── */}
        <Card title="关于">
          <Row label="版本">
            <span className="text-sm text-[var(--color-text-secondary)]">0.1.0</span>
          </Row>
          <div className="py-3.5 pb-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Vesper — 一个 Claude 风格的个人生活助手
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
