import { useState } from "react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("zh-CN");

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">设置</h1>
      <p className="text-[var(--color-text-secondary)] text-sm mb-8">
        自定义你的体验
      </p>

      <div className="space-y-6">
        <section className="p-5 rounded-2xl border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold mb-4">外观</h2>
          <div className="flex gap-3">
            {[
              { value: "light", label: "浅色" },
              { value: "dark", label: "深色" },
              { value: "system", label: "跟随系统" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`
                  flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${theme === opt.value
                    ? "bg-[var(--color-accent)] text-white"
                    : "border border-[var(--color-border)] hover:bg-black/[0.03]"
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-2xl border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold mb-4">语言</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-accent)] bg-transparent"
          >
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </section>

        <section className="p-5 rounded-2xl border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold mb-4">关于</h2>
          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p>版本: 0.1.0</p>
            <p>一个 Claude 风格的个人生活助手界面</p>
          </div>
        </section>
      </div>
    </div>
  );
}
