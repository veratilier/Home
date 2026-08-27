export default function HomePage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          {greeting} ✦
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base">
          有什么我可以帮你的吗？
        </p>

        <div className="mt-12 grid grid-cols-2 gap-3">
          {[
            { title: "写一篇日记", desc: "记录今天的想法" },
            { title: "播放音乐", desc: "听一首放松的歌" },
            { title: "查看纪念日", desc: "重要日子提醒" },
            { title: "开始聊天", desc: "随便聊聊" },
          ].map((item) => (
            <button
              key={item.title}
              className="text-left p-4 rounded-2xl border border-[var(--color-border)] hover:bg-white/80 transition-colors"
            >
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
