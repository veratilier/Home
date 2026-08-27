import { useState } from "react";

const playlist = [
  { id: "1", title: "夜的钢琴曲", artist: "石进", duration: "4:32" },
  { id: "2", title: "River Flows in You", artist: "Yiruma", duration: "3:58" },
  { id: "3", title: "Clair de Lune", artist: "Debussy", duration: "5:12" },
  { id: "4", title: "Comptine d'un autre été", artist: "Yann Tiersen", duration: "2:20" },
  { id: "5", title: "A Thousand Years", artist: "Christina Perri", duration: "4:45" },
];

export default function MusicPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">音乐</h1>
      <p className="text-[var(--color-text-secondary)] text-sm mb-8">
        你的私人播放列表
      </p>

      <div className="space-y-1">
        {playlist.map((track, i) => (
          <button
            key={track.id}
            onClick={() => setActiveId(track.id === activeId ? null : track.id)}
            className={`
              w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors
              ${track.id === activeId
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "hover:bg-black/[0.03]"
              }
            `}
          >
            <span className="w-6 text-center text-xs text-[var(--color-text-secondary)] tabular-nums">
              {track.id === activeId ? "▶" : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{track.title}</p>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                {track.artist}
              </p>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
              {track.duration}
            </span>
          </button>
        ))}
      </div>

      {activeId && (
        <div className="mt-8 p-6 rounded-2xl bg-black/[0.03] text-center">
          <p className="text-sm font-medium">
            {playlist.find((t) => t.id === activeId)?.title}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            播放功能待接入
          </p>
          <div className="mt-4 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-[var(--color-accent)] rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}
