import { useState, useEffect, useRef } from "react";

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
  aiMode: "subscription" | "api";
  subscriptionProvider: "claude" | "chatgpt";
  apiProvider: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  mcpServers: McpServer[];
  ttsProvider: string;
  ttsApiKey: string;
  ttsVoiceId: string;
  sttProvider: string;
  sttApiKey: string;
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
  backgroundImage: string;
  backgroundOpacity: number;
}

const DEFAULTS: AppSettings = {
  userName: "Vera",
  userAvatar: "",
  assistantName: "Rowan",
  assistantAvatar: "",
  aiMode: "subscription",
  subscriptionProvider: "claude",
  apiProvider: "anthropic",
  apiKey: "",
  apiEndpoint: "",
  model: "claude-sonnet-4-20250514",
  mcpServers: [],
  ttsProvider: "none",
  ttsApiKey: "",
  ttsVoiceId: "",
  sttProvider: "none",
  sttApiKey: "",
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
  backgroundImage: "",
  backgroundOpacity: 0.3,
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

type View =
  | "main"
  | "profile"
  | "ai"
  | "mcp"
  | "voice"
  | "notify"
  | "appearance"
  | "pet"
  | "data"
  | "about";

const ACCENT_COLORS = [
  "#c96442", "#e85d75", "#b05cba", "#4a90d9",
  "#1abc9c", "#5cb85c", "#e6a817", "#6c7a89",
];

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)] opacity-40">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-[var(--color-accent)] mb-5 -ml-1 hover:opacity-80 transition-opacity">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      设置
    </button>
  );
}

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
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-[var(--color-border)] last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {desc && <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
      <div className="px-5 divide-y divide-[var(--color-border)]">{children}</div>
    </div>
  );
}

function MenuItem({ label, desc, onClick }: { label: string; desc?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3.5 w-full py-3.5 text-left border-b border-[var(--color-border)] last:border-b-0 hover:opacity-80 transition-opacity">
      <div className="flex-1 min-w-0">
        <div className="text-sm">{label}</div>
        {desc && <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{desc}</div>}
      </div>
      <Chevron />
    </button>
  );
}

const inputCls = "px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-accent)] bg-transparent w-full";

function AvatarUpload({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("图片不能超过 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="py-4">
      <div className="text-sm mb-3">{label}</div>
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full border-2 border-[var(--color-border)] overflow-hidden flex items-center justify-center bg-black/[0.03] cursor-pointer hover:border-[var(--color-accent)] transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-text-secondary)] opacity-50">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-1.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            上传照片
          </button>
          {value && (
            <button
              onClick={() => onChange("")}
              className="text-xs text-red-400 hover:text-red-500"
            >
              移除
            </button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <p className="text-xs text-[var(--color-text-secondary)] mt-2">支持 JPG、PNG，不超过 2MB</p>
    </div>
  );
}

/* ── Sub-views ── */

function ProfileView({ s, set, goBack }: SubViewProps) {
  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-5">个人资料</h2>
      <SectionCard>
        <Row label="用户昵称" desc="在日记等页面显示的名字">
          <input className={`${inputCls} !w-28 text-right`} value={s.userName} onChange={(e) => set("userName", e.target.value)} />
        </Row>
      </SectionCard>
      <div className="mt-4">
        <SectionCard>
          <AvatarUpload value={s.userAvatar} onChange={(v) => set("userAvatar", v)} label="用户头像" />
        </SectionCard>
      </div>
      <div className="border-b border-[var(--color-border)] my-6" />
      <SectionCard>
        <Row label="助手昵称">
          <input className={`${inputCls} !w-28 text-right`} value={s.assistantName} onChange={(e) => set("assistantName", e.target.value)} />
        </Row>
      </SectionCard>
      <div className="mt-4">
        <SectionCard>
          <AvatarUpload value={s.assistantAvatar} onChange={(v) => set("assistantAvatar", v)} label="助手头像" />
        </SectionCard>
      </div>
    </>
  );
}

const API_PROVIDERS = [
  { value: "anthropic", label: "Anthropic", placeholder: "sk-ant-..." },
  { value: "openai", label: "OpenAI", placeholder: "sk-..." },
  { value: "google", label: "Google AI", placeholder: "AIza..." },
  { value: "deepseek", label: "DeepSeek", placeholder: "sk-..." },
  { value: "moonshot", label: "Moonshot", placeholder: "sk-..." },
  { value: "zhipu", label: "智谱 AI", placeholder: "..." },
  { value: "custom", label: "自定义", placeholder: "..." },
];

const API_MODELS: Record<string, { value: string; label: string }[]> = {
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
  google: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ],
  deepseek: [
    { value: "deepseek-chat", label: "DeepSeek V3" },
    { value: "deepseek-reasoner", label: "DeepSeek R1" },
  ],
  moonshot: [
    { value: "moonshot-v1-auto", label: "Moonshot v1" },
  ],
  zhipu: [
    { value: "glm-4-plus", label: "GLM-4 Plus" },
    { value: "glm-4-flash", label: "GLM-4 Flash" },
  ],
  custom: [],
};

function AIView({ s, set, goBack }: SubViewProps) {
  const [showKey, setShowKey] = useState(false);
  const models = API_MODELS[s.apiProvider] || [];
  const providerInfo = API_PROVIDERS.find((p) => p.value === s.apiProvider);

  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-2">AI 接入</h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-5">选择 AI 服务的接入方式</p>

      {/* Mode selector */}
      <div className="flex gap-2 mb-5">
        {[
          { value: "subscription" as const, label: "订阅额度", desc: "通过 App 服务器" },
          { value: "api" as const, label: "API 接入", desc: "直接使用 API" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => set("aiMode", opt.value)}
            className="flex-1 py-3 px-3 rounded-2xl text-left transition-all border-2"
            style={{
              borderColor: s.aiMode === opt.value ? "var(--color-accent)" : "var(--color-border)",
              background: s.aiMode === opt.value ? "var(--color-accent)" + "0d" : "transparent",
            }}
          >
            <div className="text-sm font-medium">{opt.label}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      {s.aiMode === "subscription" ? (
        <>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            通过 Vesper 服务器中转请求，使用订阅额度调用 AI 服务。
          </p>
          <SectionCard>
            <div className="py-4">
              <div className="text-sm mb-3">订阅服务</div>
              <div className="space-y-2">
                {[
                  { value: "claude" as const, label: "Claude", desc: "Anthropic Claude 系列模型" },
                  { value: "chatgpt" as const, label: "ChatGPT", desc: "OpenAI GPT 系列模型" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set("subscriptionProvider", opt.value)}
                    className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all border"
                    style={{
                      borderColor: s.subscriptionProvider === opt.value ? "var(--color-accent)" : "var(--color-border)",
                      background: s.subscriptionProvider === opt.value ? "var(--color-accent)" + "0d" : "transparent",
                    }}
                  >
                    <div className="text-left">
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{opt.desc}</div>
                    </div>
                    {s.subscriptionProvider === opt.value && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent)" className="ml-auto">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="py-3.5 pb-4">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-700">订阅模式需要配置后端服务器，目前为演示界面。</p>
              </div>
            </div>
          </SectionCard>
        </>
      ) : (
        <>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">
            直接使用各服务商的 API Key 接入，密钥仅保存在本地。
          </p>
          <SectionCard>
            <div className="py-4">
              <div className="text-sm mb-3">服务商</div>
              <div className="grid grid-cols-2 gap-2">
                {API_PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      set("apiProvider", p.value);
                      const m = API_MODELS[p.value];
                      if (m?.length) set("model", m[0].value);
                    }}
                    className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all border text-center"
                    style={{
                      borderColor: s.apiProvider === p.value ? "var(--color-accent)" : "var(--color-border)",
                      background: s.apiProvider === p.value ? "var(--color-accent)" : "transparent",
                      color: s.apiProvider === p.value ? "#fff" : "inherit",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="mt-4">
            <SectionCard>
              <Row label="API Key" desc="密钥仅保存在本地浏览器">
                <div className="flex items-center gap-2">
                  <input
                    type={showKey ? "text" : "password"}
                    className={`${inputCls} !w-40`}
                    value={s.apiKey}
                    onChange={(e) => set("apiKey", e.target.value)}
                    placeholder={providerInfo?.placeholder || "sk-..."}
                  />
                  <button onClick={() => setShowKey(!showKey)} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] whitespace-nowrap">
                    {showKey ? "隐藏" : "显示"}
                  </button>
                </div>
              </Row>
              {s.apiProvider === "custom" && (
                <Row label="API 地址" desc="兼容 OpenAI 格式的接口地址">
                  <input
                    className={`${inputCls} !w-52`}
                    value={s.apiEndpoint}
                    onChange={(e) => set("apiEndpoint", e.target.value)}
                    placeholder="https://api.example.com/v1"
                  />
                </Row>
              )}
              {models.length > 0 ? (
                <Row label="模型">
                  <select className={`${inputCls} !w-48`} value={s.model} onChange={(e) => set("model", e.target.value)}>
                    {models.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </Row>
              ) : (
                <Row label="模型 ID">
                  <input className={`${inputCls} !w-48`} value={s.model} onChange={(e) => set("model", e.target.value)} placeholder="model-name" />
                </Row>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </>
  );
}

function McpView({ s, set, goBack }: SubViewProps) {
  const [mcpName, setMcpName] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");

  const addMcp = () => {
    if (!mcpName.trim() || !mcpUrl.trim()) return;
    set("mcpServers", [...s.mcpServers, { id: Date.now().toString(), name: mcpName.trim(), url: mcpUrl.trim(), enabled: true }]);
    setMcpName("");
    setMcpUrl("");
  };

  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-2">MCP 工具</h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-5">管理 Model Context Protocol 服务器连接</p>

      {s.mcpServers.length > 0 && (
        <SectionCard>
          {s.mcpServers.map((sv) => (
            <div key={sv.id} className="flex items-center justify-between gap-3 py-3.5 border-b border-[var(--color-border)] last:border-b-0">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{sv.name}</div>
                <div className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{sv.url}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={sv.enabled} onChange={() => set("mcpServers", s.mcpServers.map((v) => (v.id === sv.id ? { ...v, enabled: !v.enabled } : v)))} />
                <button onClick={() => set("mcpServers", s.mcpServers.filter((v) => v.id !== sv.id))} className="text-xs text-red-400 hover:text-red-500">
                  删除
                </button>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {s.mcpServers.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">尚未添加 MCP 服务器</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">添加服务器以扩展 AI 的工具能力</p>
        </div>
      )}

      <div className="mt-4">
        <SectionCard>
          <div className="py-4">
            <div className="text-sm font-medium mb-3">添加服务器</div>
            <div className="space-y-2.5">
              <input className={inputCls} value={mcpName} onChange={(e) => setMcpName(e.target.value)} placeholder="服务器名称" />
              <input className={inputCls} value={mcpUrl} onChange={(e) => setMcpUrl(e.target.value)} placeholder="地址或命令（如 npx @modelcontextprotocol/...）" />
              <button
                onClick={addMcp}
                disabled={!mcpName.trim() || !mcpUrl.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                添加
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

const TTS_PROVIDERS = [
  { value: "none", label: "关闭" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "minimax", label: "MiniMax" },
  { value: "openai", label: "OpenAI TTS" },
  { value: "browser", label: "浏览器内置" },
];

const STT_PROVIDERS = [
  { value: "none", label: "关闭" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "minimax", label: "MiniMax" },
  { value: "openai", label: "OpenAI Whisper" },
  { value: "browser", label: "浏览器内置" },
];

function VoiceView({ s, set, goBack }: SubViewProps) {
  const [showTtsKey, setShowTtsKey] = useState(false);
  const [showSttKey, setShowSttKey] = useState(false);

  const ttsNeedsKey = s.ttsProvider !== "none" && s.ttsProvider !== "browser";
  const sttNeedsKey = s.sttProvider !== "none" && s.sttProvider !== "browser";

  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-2">语音设置</h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-5">配置文本转语音 (TTS) 和语音转文本 (STT) 服务</p>

      {/* TTS */}
      <div className="text-sm font-medium mb-3">文本转语音 (TTS)</div>
      <SectionCard>
        <Row label="TTS 服务">
          <select className={`${inputCls} !w-40`} value={s.ttsProvider} onChange={(e) => set("ttsProvider", e.target.value)}>
            {TTS_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Row>
        {ttsNeedsKey && (
          <Row label="API Key">
            <div className="flex items-center gap-2">
              <input
                type={showTtsKey ? "text" : "password"}
                className={`${inputCls} !w-40`}
                value={s.ttsApiKey}
                onChange={(e) => set("ttsApiKey", e.target.value)}
                placeholder="输入密钥..."
              />
              <button onClick={() => setShowTtsKey(!showTtsKey)} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] whitespace-nowrap">
                {showTtsKey ? "隐藏" : "显示"}
              </button>
            </div>
          </Row>
        )}
        {s.ttsProvider !== "none" && (
          <>
            <Row label="Voice ID" desc="语音角色标识">
              <input className={`${inputCls} !w-40`} value={s.ttsVoiceId} onChange={(e) => set("ttsVoiceId", e.target.value)} placeholder={s.ttsProvider === "browser" ? "系统默认" : "voice-id"} />
            </Row>
            <Row label="语速" desc={`${s.voiceSpeed.toFixed(1)}x`}>
              <input type="range" min="0.5" max="2" step="0.1" value={s.voiceSpeed} onChange={(e) => set("voiceSpeed", parseFloat(e.target.value))} className="w-32 accent-[var(--color-accent)]" />
            </Row>
          </>
        )}
      </SectionCard>

      {/* STT */}
      <div className="text-sm font-medium mb-3 mt-6">语音转文本 (STT)</div>
      <SectionCard>
        <Row label="STT 服务">
          <select className={`${inputCls} !w-40`} value={s.sttProvider} onChange={(e) => set("sttProvider", e.target.value)}>
            {STT_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Row>
        {sttNeedsKey && (
          <Row label="API Key" desc="与 TTS 相同服务商可共用密钥">
            <div className="flex items-center gap-2">
              <input
                type={showSttKey ? "text" : "password"}
                className={`${inputCls} !w-40`}
                value={s.sttApiKey}
                onChange={(e) => set("sttApiKey", e.target.value)}
                placeholder="输入密钥..."
              />
              <button onClick={() => setShowSttKey(!showSttKey)} className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] whitespace-nowrap">
                {showSttKey ? "隐藏" : "显示"}
              </button>
            </div>
          </Row>
        )}
      </SectionCard>
    </>
  );
}

function NotifyView({ s, set, goBack }: SubViewProps) {
  const [permState, setPermState] = useState<string>(() => {
    if (typeof Notification !== "undefined") return Notification.permission;
    return "unsupported";
  });

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermState(result);
  };

  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-2">通知推送</h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-5">管理通知权限和推送偏好</p>

      {/* Permission */}
      <SectionCard>
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">通知权限</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {permState === "granted" && "已授权 — 可以接收推送通知"}
                {permState === "denied" && "已拒绝 — 请在浏览器设置中重新开启"}
                {permState === "default" && "未授权 — 需要获取权限才能发送通知"}
                {permState === "unsupported" && "当前环境不支持通知"}
              </div>
            </div>
            {permState === "granted" ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                <span className="text-xs font-medium">已授权</span>
              </div>
            ) : permState !== "denied" && permState !== "unsupported" ? (
              <button
                onClick={requestPermission}
                className="px-4 py-1.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                获取权限
              </button>
            ) : permState === "denied" ? (
              <span className="text-xs text-red-400 font-medium">已拒绝</span>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <div className="text-sm font-medium mb-3 mt-6">通知类型</div>
      <SectionCard>
        <Row label="提醒事项" desc="待办到期时发送通知">
          <Toggle checked={s.notifyReminders} onChange={(v) => set("notifyReminders", v)} />
        </Row>
        <Row label="纪念日" desc="纪念日当天提醒">
          <Toggle checked={s.notifyAnniversary} onChange={(v) => set("notifyAnniversary", v)} />
        </Row>
        <Row label="日记提醒" desc="每晚提醒写日记">
          <Toggle checked={s.notifyDiary} onChange={(v) => set("notifyDiary", v)} />
        </Row>
      </SectionCard>

      <div className="mt-4 px-1">
        <p className="text-xs text-[var(--color-text-secondary)]">
          如果以 PWA 或原生 App 方式使用，请确保在系统设置中也允许了 Vesper 的通知权限。
        </p>
      </div>
    </>
  );
}

function BackgroundUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("图片不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="py-4">
      {value ? (
        <div className="space-y-3">
          <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[var(--color-border)]">
            <img src={value} alt="Background" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-black/[0.03] transition-colors"
            >
              更换
            </button>
            <button
              onClick={() => onChange("")}
              className="flex-1 py-2 rounded-xl text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
            >
              移除
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-6 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors flex flex-col items-center gap-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)] opacity-50">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-sm text-[var(--color-text-secondary)]">上传背景图片</span>
          <span className="text-xs text-[var(--color-text-secondary)] opacity-60">支持 JPG、PNG，不超过 5MB</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function AppearanceView({ s, set, goBack }: SubViewProps) {
  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-5">外观与主题</h2>

      <div className="text-sm font-medium mb-3">主题</div>
      <div className="flex gap-2 mb-6">
        {[
          { value: "light", label: "浅色" },
          { value: "dark", label: "深色" },
          { value: "system", label: "跟随系统" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => set("theme", opt.value)}
            className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all border-2"
            style={{
              borderColor: s.theme === opt.value ? "var(--color-accent)" : "var(--color-border)",
              background: s.theme === opt.value ? "var(--color-accent)" + "0d" : "transparent",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="text-sm font-medium mb-3">强调色</div>
      <SectionCard>
        <div className="py-4 flex gap-3 flex-wrap">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => set("accentColor", c)}
              className="w-10 h-10 rounded-full transition-all border-[3px]"
              style={{
                background: c,
                borderColor: s.accentColor === c ? "var(--color-text-primary)" : "transparent",
                transform: s.accentColor === c ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </SectionCard>

      <div className="text-sm font-medium mb-3 mt-6">字体大小</div>
      <div className="flex gap-2 mb-6">
        {[
          { value: "small", label: "小", sample: "Aa" },
          { value: "normal", label: "标准", sample: "Aa" },
          { value: "large", label: "大", sample: "Aa" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => set("fontSize", opt.value)}
            className="flex-1 py-3 rounded-2xl font-medium transition-all border-2 flex flex-col items-center gap-0.5"
            style={{
              borderColor: s.fontSize === opt.value ? "var(--color-accent)" : "var(--color-border)",
              background: s.fontSize === opt.value ? "var(--color-accent)" + "0d" : "transparent",
              fontSize: opt.value === "small" ? 12 : opt.value === "large" ? 16 : 14,
            }}
          >
            <span style={{ fontSize: opt.value === "small" ? 16 : opt.value === "large" ? 24 : 20 }}>{opt.sample}</span>
            <span className="text-xs">{opt.label}</span>
          </button>
        ))}
      </div>

      <SectionCard>
        <Row label="语言">
          <select className={`${inputCls} !w-36`} value={s.language} onChange={(e) => set("language", e.target.value)}>
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </Row>
      </SectionCard>

      <div className="text-sm font-medium mb-3 mt-6">背景图片</div>
      <SectionCard>
        <BackgroundUpload value={s.backgroundImage} onChange={(v) => set("backgroundImage", v)} />
        {s.backgroundImage && (
          <Row label="背景透明度" desc={`${Math.round(s.backgroundOpacity * 100)}%`}>
            <input type="range" min="0.1" max="0.8" step="0.05" value={s.backgroundOpacity} onChange={(e) => set("backgroundOpacity", parseFloat(e.target.value))} className="w-32 accent-[var(--color-accent)]" />
          </Row>
        )}
      </SectionCard>
    </>
  );
}

function PetView({ s, set, goBack }: SubViewProps) {
  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-5">桌宠</h2>
      <SectionCard>
        <Row label="显示桌宠" desc="在页面右下角显示 Clawd">
          <Toggle checked={s.petVisible} onChange={(v) => set("petVisible", v)} />
        </Row>
        {s.petVisible && (
          <Row label="大小" desc={`${s.petScale}x`}>
            <input type="range" min="3" max="8" step="1" value={s.petScale} onChange={(e) => set("petScale", parseInt(e.target.value))} className="w-32 accent-[var(--color-accent)]" />
          </Row>
        )}
      </SectionCard>
    </>
  );
}

function DataView({ setS, goBack }: { setS: (s: AppSettings) => void; goBack: () => void }) {
  const [confirmClear, setConfirmClear] = useState(false);

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

  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-5">数据管理</h2>
      <SectionCard>
        <Row label="导出数据" desc="备份所有本地数据为 JSON 文件">
          <button onClick={handleExport} className="px-4 py-1.5 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-black/[0.03] transition-colors">
            导出
          </button>
        </Row>
        <Row label="导入数据" desc="从 JSON 备份恢复">
          <button onClick={handleImport} className="px-4 py-1.5 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-black/[0.03] transition-colors">
            导入
          </button>
        </Row>
        <Row label="清除数据" desc="删除所有本地存储的数据">
          <button
            onClick={handleClear}
            className="px-4 py-1.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: confirmClear ? "#ef4444" : "transparent",
              color: confirmClear ? "#fff" : "#ef4444",
              border: confirmClear ? "none" : "1px solid #ef4444",
            }}
          >
            {confirmClear ? "确认清除" : "清除"}
          </button>
        </Row>
      </SectionCard>
    </>
  );
}

function AboutView({ goBack }: { goBack: () => void }) {
  return (
    <>
      <BackButton onClick={goBack} />
      <h2 className="text-lg font-semibold mb-5">关于</h2>
      <SectionCard>
        <Row label="版本">
          <span className="text-sm text-[var(--color-text-secondary)]">0.1.0</span>
        </Row>
        <div className="py-4">
          <p className="text-sm text-[var(--color-text-secondary)]">Vesper — 一个 Claude 风格的个人生活助手</p>
        </div>
      </SectionCard>
    </>
  );
}

interface SubViewProps {
  s: AppSettings;
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  goBack: () => void;
}

export default function SettingsPage() {
  const [s, setS] = useState<AppSettings>(loadSettings);
  const [view, setView] = useState<View>("main");

  useEffect(() => {
    saveSettings(s);
    document.documentElement.style.setProperty("--color-accent", s.accentColor);
  }, [s]);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const goBack = () => setView("main");

  const aiDesc = s.aiMode === "subscription"
    ? `订阅 · ${s.subscriptionProvider === "claude" ? "Claude" : "ChatGPT"}`
    : `API · ${API_PROVIDERS.find((p) => p.value === s.apiProvider)?.label || s.apiProvider}`;

  const voiceDesc = [
    s.ttsProvider !== "none" ? `TTS: ${TTS_PROVIDERS.find((p) => p.value === s.ttsProvider)?.label}` : null,
    s.sttProvider !== "none" ? `STT: ${STT_PROVIDERS.find((p) => p.value === s.sttProvider)?.label}` : null,
  ].filter(Boolean).join("  ") || "未开启";

  const notifyCount = [s.notifyReminders, s.notifyAnniversary, s.notifyDiary].filter(Boolean).length;

  if (view !== "main") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 pb-24">
        {view === "profile" && <ProfileView s={s} set={set} goBack={goBack} />}
        {view === "ai" && <AIView s={s} set={set} goBack={goBack} />}
        {view === "mcp" && <McpView s={s} set={set} goBack={goBack} />}
        {view === "voice" && <VoiceView s={s} set={set} goBack={goBack} />}
        {view === "notify" && <NotifyView s={s} set={set} goBack={goBack} />}
        {view === "appearance" && <AppearanceView s={s} set={set} goBack={goBack} />}
        {view === "pet" && <PetView s={s} set={set} goBack={goBack} />}
        {view === "data" && <DataView setS={setS} goBack={goBack} />}
        {view === "about" && <AboutView goBack={goBack} />}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-24">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">设置</h1>
      <p className="text-[var(--color-text-secondary)] text-sm mb-8">自定义你的体验</p>

      <div className="space-y-4">
        <SectionCard>
          <MenuItem label="个人资料" desc={`${s.userName} / ${s.assistantName}`} onClick={() => setView("profile")} />
          <MenuItem label="AI 接入" desc={aiDesc} onClick={() => setView("ai")} />
          <MenuItem label="MCP 工具" desc={`${s.mcpServers.length} 个服务器`} onClick={() => setView("mcp")} />
        </SectionCard>

        <SectionCard>
          <MenuItem label="语音设置" desc={voiceDesc} onClick={() => setView("voice")} />
          <MenuItem label="通知推送" desc={`${notifyCount} 项已开启`} onClick={() => setView("notify")} />
        </SectionCard>

        <SectionCard>
          <MenuItem label="外观与主题" desc={s.theme === "dark" ? "深色" : s.theme === "system" ? "跟随系统" : "浅色"} onClick={() => setView("appearance")} />
          <MenuItem label="桌宠" desc={s.petVisible ? `已开启 · ${s.petScale}x` : "已关闭"} onClick={() => setView("pet")} />
        </SectionCard>

        <SectionCard>
          <MenuItem label="数据管理" desc="导出、导入、清除" onClick={() => setView("data")} />
          <MenuItem label="关于" desc="v0.1.0" onClick={() => setView("about")} />
        </SectionCard>
      </div>
    </div>
  );
}
