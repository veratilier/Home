import { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  url?: string;
}

const mockPlaylist: Track[] = [
  { id: "1", title: "夜的钢琴曲", artist: "石进", album: "夜的钢琴曲", duration: 272, cover: generateMockCover("1") },
  { id: "2", title: "River Flows in You", artist: "Yiruma", album: "First Love", duration: 238, cover: generateMockCover("2") },
  { id: "3", title: "Clair de Lune", artist: "Debussy", album: "Suite bergamasque", duration: 312, cover: generateMockCover("3") },
  { id: "4", title: "Comptine d'un autre été", artist: "Yann Tiersen", album: "Amélie OST", duration: 140, cover: generateMockCover("4") },
  { id: "5", title: "A Thousand Years", artist: "Christina Perri", album: "The Twilight Saga", duration: 285, cover: generateMockCover("5") },
  { id: "6", title: "春泥", artist: "庾澄庆", album: "哈林天堂", duration: 267, cover: generateMockCover("6") },
  { id: "7", title: "晴天", artist: "周杰伦", album: "叶惠美", duration: 269, cover: generateMockCover("7") },
  { id: "8", title: "起风了", artist: "买辣椒也用券", album: "起风了", duration: 325, cover: generateMockCover("8") },
];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatListenTime(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h} 小时 ${m} 分钟`;
}

function generateCoverGradient(id: string) {
  const hues: Record<string, [number, number]> = {
    "1": [220, 260], "2": [180, 220], "3": [270, 310],
    "4": [30, 60], "5": [340, 20], "6": [120, 160],
    "7": [200, 240], "8": [10, 40],
  };
  const [h1, h2] = hues[id] || [0, 40];
  return `linear-gradient(135deg, hsl(${h1}, 40%, 25%), hsl(${h2}, 35%, 15%))`;
}

function generateBgGradient(id: string) {
  const hues: Record<string, number> = {
    "1": 240, "2": 200, "3": 290, "4": 45,
    "5": 350, "6": 140, "7": 220, "8": 25,
  };
  const h = hues[id] || 0;
  return `linear-gradient(180deg, hsl(${h}, 25%, 18%) 0%, hsl(${h}, 30%, 10%) 100%)`;
}

function generateMockCover(id: string): string {
  const palettes: Record<string, [string, string, string, string]> = {
    "1": ["#0d1b40", "#1a3175", "#2e4ea0", "#6b88cc"],
    "2": ["#0a2830", "#145060", "#1e8090", "#4eb8c8"],
    "3": ["#1a0835", "#2d1260", "#4a2090", "#7e50c8"],
    "4": ["#3d2800", "#6e4a00", "#a07000", "#d4a830"],
    "5": ["#350818", "#601228", "#901a40", "#c83a68"],
    "6": ["#082818", "#124e2e", "#1a7a48", "#30b068"],
    "7": ["#081830", "#102858", "#184088", "#2868b8"],
    "8": ["#381008", "#601810", "#902818", "#c84828"],
  };
  const p = palettes[id] || palettes["1"];
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><radialGradient id="g" cx="30%" cy="30%"><stop offset="0%" stop-color="${p[2]}"/><stop offset="100%" stop-color="${p[0]}"/></radialGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="300" cy="320" r="180" fill="${p[1]}" opacity=".4"/><circle cx="100" cy="80" r="120" fill="${p[3]}" opacity=".2"/><circle cx="200" cy="200" r="60" fill="${p[3]}" opacity=".15"/></svg>`
  )}`;
}

function extractDominantColors(imgSrc: string): Promise<[number, number, number, number, number, number] | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const sz = 64;
      canvas.width = sz;
      canvas.height = sz;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0, sz, sz);
      const data = ctx.getImageData(0, 0, sz, sz).data;
      let r1 = 0, g1 = 0, b1 = 0, r2 = 0, g2 = 0, b2 = 0;
      let n1 = 0, n2 = 0;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (data[i + 3] < 128) continue;
        const lum = r * 0.299 + g * 0.587 + b * 0.114;
        if (lum < 128) { r1 += r; g1 += g; b1 += b; n1++; }
        else { r2 += r; g2 += g; b2 += b; n2++; }
      }
      if (n1 === 0 && n2 === 0) { resolve(null); return; }
      if (n1 === 0) { n1 = 1; r1 = r2 / n2; g1 = g2 / n2; b1 = b2 / n2; }
      if (n2 === 0) { n2 = n1; r2 = r1; g2 = g1; b2 = b1; }
      resolve([
        Math.round(r1 / n1), Math.round(g1 / n1), Math.round(b1 / n1),
        Math.round(r2 / n2), Math.round(g2 / n2), Math.round(b2 / n2),
      ]);
    };
    img.onerror = () => resolve(null);
    img.src = imgSrc;
  });
}

export default function MusicPage() {
  const [playlist] = useState<Track[]>(mockPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("all");
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("music_liked") || "[]")); }
    catch { return new Set(); }
  });
  const [coverColors, setCoverColors] = useState<[number, number, number, number, number, number] | null>(null);
  const [listenSeconds, setListenSeconds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("music_listen_seconds") || "0"); }
    catch { return 0; }
  });
  const [mcpSettingsOpen, setMcpSettingsOpen] = useState(false);
  const [mcpUrl, setMcpUrl] = useState(() => localStorage.getItem("music_mcp_url") || "");
  const [mcpCookie, setMcpCookie] = useState(() => localStorage.getItem("music_mcp_cookie") || "");
  const [mcpAuthMode, setMcpAuthMode] = useState<"cookie" | "oauth">(() => (localStorage.getItem("music_mcp_auth_mode") as "cookie" | "oauth") || "cookie");
  const [mcpOAuthUrl, setMcpOAuthUrl] = useState(() => localStorage.getItem("music_mcp_oauth_url") || "");
  const progressRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const current = playlist[currentIndex];
  if (!current) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!current.cover) { setCoverColors(null); return; }
    let cancelled = false;
    extractDominantColors(current.cover).then((c) => { if (!cancelled) setCoverColors(c); });
    return () => { cancelled = true; };
  }, [current.cover, current.id]);

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("music_liked", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const startProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      progressRef.current += 1;
      if (progressRef.current >= current.duration) {
        progressRef.current = 0;
        setProgress(0);
        if (repeatMode === "one") {
          // replay
        } else if (repeatMode === "all") {
          setCurrentIndex((i) => (i + 1) % playlist.length);
        } else {
          if (currentIndex < playlist.length - 1) {
            setCurrentIndex((i) => i + 1);
          } else {
            setIsPlaying(false);
            clearInterval(intervalRef.current);
          }
        }
        return;
      }
      setProgress(progressRef.current);
    }, 1000);
  }, [current.duration, repeatMode, currentIndex, playlist.length]);

  useEffect(() => {
    if (isPlaying) startProgress();
    else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, startProgress]);

  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [currentIndex]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setListenSeconds((prev: number) => {
        const next = prev + 1;
        try { localStorage.setItem("music_listen_seconds", JSON.stringify(next)); } catch {}
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    try {
      localStorage.setItem("music_now_playing", JSON.stringify({
        title: current.title, artist: current.artist, cover: current.cover, isPlaying,
      }));
    } catch {}
  }, [current.title, current.artist, current.cover, isPlaying]);

  const togglePlay = () => setIsPlaying((p) => !p);
  const prev = () => { setCurrentIndex((i) => (i - 1 + playlist.length) % playlist.length); };
  const next = () => { setCurrentIndex((i) => (i + 1) % playlist.length); };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = Math.floor(ratio * current.duration);
    progressRef.current = newTime;
    setProgress(newTime);
  };

  const cycleRepeat = () => {
    setRepeatMode((m) => m === "off" ? "all" : m === "all" ? "one" : "off");
  };

  const bgGradient = useMemo(() => {
    if (coverColors) {
      const [r1, g1, b1, r2, g2, b2] = coverColors;
      const d = (r: number, g: number, b: number, f: number) =>
        `${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)}`;
      return `linear-gradient(180deg, rgb(${d(r1, g1, b1, 0.45)}) 0%, rgb(${d(r2, g2, b2, 0.2)}) 50%, rgb(${d(r1, g1, b1, 0.15)}) 100%)`;
    }
    return generateBgGradient(current.id);
  }, [coverColors, current.id]);

  const coverGradient = generateCoverGradient(current.id);

  return (
    <div className="flex flex-col h-full overflow-hidden text-white/90" style={{ background: bgGradient, transition: "background 0.8s ease" }}>
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4">
        <button onClick={() => setSearchOpen(true)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <span className="text-[13px] font-medium opacity-70">一起听</span>
        <button onClick={() => setPlaylistOpen(true)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>

      {/* Avatars - "一起听" */}
      <div className="shrink-0 flex flex-col items-center mt-2 mb-4">
        <div className="flex items-center -space-x-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#e8956e] flex items-center justify-center ring-2 ring-white/20 z-[1]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
            </svg>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
        <p className="text-[11px] text-white/40 mt-2">一起听了 {formatListenTime(listenSeconds)}</p>
      </div>

      {/* Album art disc */}
      <div className="flex-1 flex items-center justify-center px-8 min-h-0">
        <div className="relative w-full max-w-[300px] aspect-square">
          {/* Glow */}
          <div
            className="absolute inset-[-12px] rounded-full opacity-40 blur-md"
            style={{
              background: coverColors
                ? `radial-gradient(circle, rgba(${coverColors[0]},${coverColors[1]},${coverColors[2]},0.35) 0%, transparent 70%)`
                : "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
              transition: "background 0.8s ease",
            }}
          />
          {/* Disc */}
          <div
            className={`w-full h-full rounded-full relative overflow-hidden shadow-2xl ${isPlaying ? "animate-[spin_20s_linear_infinite]" : ""}`}
            style={!current.cover ? { background: coverGradient } : undefined}
          >
            {current.cover ? (
              <img
                src={current.cover}
                alt=""
                className="absolute inset-0 w-full h-full object-cover select-none"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[42px] font-bold text-white/10 select-none" style={{ marginTop: "-12%", marginLeft: "20%" }}>
                  {current.title.charAt(0)}
                </span>
              </div>
            )}
            {/* Vinyl grooves overlay */}
            <div className="absolute inset-0 rounded-full" style={{
              background: "repeating-radial-gradient(circle at center, transparent 0px, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 5px)",
            }} />
            {/* Center hole */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[28%] h-[28%] rounded-full bg-black/50 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Song info */}
      <div className="shrink-0 px-8 mt-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold truncate">{current.title}</h2>
            <p className="text-[13px] text-white/50 truncate mt-0.5">{current.artist} · {current.album}</p>
          </div>
          <button
            onClick={() => toggleLike(current.id)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors ml-3 shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24"
              fill={likedIds.has(current.id) ? "#ff4757" : "none"}
              stroke={likedIds.has(current.id) ? "#ff4757" : "currentColor"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div
            ref={progressBarRef}
            onClick={seekTo}
            className="relative h-[3px] bg-white/15 rounded-full cursor-pointer group"
          >
            <div
              className="absolute left-0 top-0 h-full bg-white/70 rounded-full transition-[width] duration-200"
              style={{ width: `${(progress / current.duration) * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${(progress / current.duration) * 100}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-white/35 tabular-nums">{formatTime(progress)}</span>
            <span className="text-[11px] text-white/35 tabular-nums">{formatTime(current.duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 flex items-center justify-center gap-6 py-6 px-8">
        <button onClick={cycleRepeat} className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
          {repeatMode === "one" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              <text x="11" y="15" fontSize="8" fill="currentColor" fontWeight="bold" textAnchor="middle">1</text>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={repeatMode === "off" ? 0.4 : 1}>
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          )}
        </button>

        <button onClick={prev} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="8,5 20,12 8,19" />
            </svg>
          )}
        </button>

        <button onClick={next} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" />
          </svg>
        </button>

        <button onClick={() => setPlaylistOpen(true)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>

      {/* Bottom indicator */}
      <div className="shrink-0 flex justify-center pb-4">
        <button onClick={() => setMcpSettingsOpen(true)} className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-white/8 hover:bg-white/15 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          <span className="text-[11px] text-white/50 ml-1">网易云音乐 · MCP</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 opacity-40">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Playlist drawer */}
      {playlistOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setPlaylistOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(0,0%,12%)] rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]" style={{ maxHeight: "60vh" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-[15px] font-semibold text-white/90">播放列表 ({playlist.length})</h3>
              <button onClick={() => setPlaylistOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-3 pb-6" style={{ maxHeight: "calc(60vh - 70px)" }}>
              {playlist.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => { setCurrentIndex(i); setPlaylistOpen(false); setIsPlaying(true); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${i === currentIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5">
                    {track.cover ? (
                      <img src={track.cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-white/30">{i + 1}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] truncate ${i === currentIndex ? "text-[var(--color-accent)] font-medium" : "text-white/80"}`}>{track.title}</p>
                    <p className="text-[11px] text-white/35 truncate">{track.artist}</p>
                  </div>
                  {i === currentIndex && (
                    <span className="text-[var(--color-accent)] text-[12px] shrink-0">{isPlaying ? "♫" : "▶"}</span>
                  )}
                  <span className="text-[11px] text-white/25 tabular-nums shrink-0">{formatTime(track.duration)}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Search drawer */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setSearchOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(0,0%,12%)] rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]" style={{ maxHeight: "70vh" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center gap-3 px-5 pb-4">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-40">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索歌曲、歌手…"
                  className="flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/30"
                  autoFocus
                />
              </div>
              <button onClick={() => setSearchOpen(false)} className="text-[13px] text-white/50 hover:text-white/80 transition-colors shrink-0">
                取消
              </button>
            </div>
            <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: "calc(70vh - 80px)" }}>
              {searchQuery ? (
                <div className="flex flex-col items-center py-8">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 mb-3">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                  <p className="text-[12px] text-white/30">接入 netease-music-mcp 后可搜索</p>
                  <p className="text-[11px] text-white/20 mt-1">通过聊天页面调用搜歌工具</p>
                </div>
              ) : (
                <div>
                  <p className="text-[12px] text-white/40 mb-3">推荐功能</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "每日推荐", desc: "30首个性化推荐" },
                      { label: "私人FM", desc: "算法猜你喜欢" },
                      { label: "红心列表", desc: "收藏的歌曲" },
                      { label: "听歌排行", desc: "最常听的歌" },
                    ].map((item) => (
                      <button key={item.label} className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
                        <div>
                          <p className="text-[12px] text-white/80 font-medium">{item.label}</p>
                          <p className="text-[10px] text-white/30">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/20 text-center mt-4">需接入 netease-music-mcp 服务</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MCP settings drawer */}
      {mcpSettingsOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setMcpSettingsOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(0,0%,12%)] rounded-t-2xl shadow-2xl animate-[slideUp_0.3s_ease-out]" style={{ maxHeight: "65vh" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-[15px] font-semibold text-white/90">MCP 设置</h3>
              <button onClick={() => setMcpSettingsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "calc(65vh - 60px)" }}>
              {/* Connection status */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${mcpUrl ? "bg-emerald-400" : "bg-white/20"}`} />
                <div className="flex-1">
                  <p className="text-[13px] text-white/80 font-medium">netease-music-mcp</p>
                  <p className="text-[11px] text-white/35">{mcpUrl ? "已连接" : "未连接"}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mb-5">
                <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-center">
                  <p className="text-[18px] font-bold text-white/80 tabular-nums">{Math.floor(listenSeconds / 3600)}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">小时</p>
                </div>
                <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-center">
                  <p className="text-[18px] font-bold text-white/80 tabular-nums">{Math.floor((listenSeconds % 3600) / 60)}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">分钟</p>
                </div>
                <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-center">
                  <p className="text-[18px] font-bold text-white/80 tabular-nums">{playlist.length}</p>
                  <p className="text-[10px] text-white/35 mt-0.5">歌曲</p>
                </div>
              </div>

              {/* Server URL */}
              <div className="mb-4">
                <label className="text-[11px] text-white/40 mb-1.5 block">服务器地址</label>
                <input
                  value={mcpUrl}
                  onChange={(e) => {
                    setMcpUrl(e.target.value);
                    try { localStorage.setItem("music_mcp_url", e.target.value); } catch {}
                  }}
                  placeholder="http://localhost:3000"
                  className="w-full px-3 py-2.5 text-[13px] text-white/80 rounded-xl bg-white/8 border border-white/10 outline-none focus:border-white/25 transition-colors placeholder:text-white/20"
                />
              </div>

              {/* Auth mode toggle */}
              <div className="mb-4">
                <label className="text-[11px] text-white/40 mb-1.5 block">认证方式</label>
                <div className="flex gap-2">
                  {([
                    { value: "cookie" as const, label: "Cookie", icon: "🔑" },
                    { value: "oauth" as const, label: "OAuth", icon: "🔐" },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setMcpAuthMode(opt.value);
                        try { localStorage.setItem("music_mcp_auth_mode", opt.value); } catch {}
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all border"
                      style={{
                        borderColor: mcpAuthMode === opt.value ? "var(--color-accent)" : "rgba(255,255,255,0.1)",
                        background: mcpAuthMode === opt.value ? "var(--color-accent)" : "rgba(255,255,255,0.05)",
                        color: mcpAuthMode === opt.value ? "#fff" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {mcpAuthMode === "cookie" ? (
                <div className="mb-5">
                  <label className="text-[11px] text-white/40 mb-1.5 block">Cookie / 登录凭证</label>
                  <textarea
                    value={mcpCookie}
                    onChange={(e) => {
                      setMcpCookie(e.target.value);
                      try { localStorage.setItem("music_mcp_cookie", e.target.value); } catch {}
                    }}
                    placeholder="MUSIC_U=..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-[13px] text-white/80 rounded-xl bg-white/8 border border-white/10 outline-none focus:border-white/25 transition-colors placeholder:text-white/20 resize-none"
                  />
                </div>
              ) : (
                <div className="mb-5">
                  <label className="text-[11px] text-white/40 mb-1.5 block">OAuth 授权地址</label>
                  <input
                    value={mcpOAuthUrl}
                    onChange={(e) => {
                      setMcpOAuthUrl(e.target.value);
                      try { localStorage.setItem("music_mcp_oauth_url", e.target.value); } catch {}
                    }}
                    placeholder="https://music.example.com/oauth/authorize"
                    className="w-full px-3 py-2.5 text-[13px] text-white/80 rounded-xl bg-white/8 border border-white/10 outline-none focus:border-white/25 transition-colors placeholder:text-white/20 mb-3"
                  />
                  <button
                    onClick={() => {
                      const url = mcpOAuthUrl.trim();
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    disabled={!mcpOAuthUrl.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    前往授权
                  </button>
                  <p className="text-[10px] text-white/25 mt-2 text-center">点击后将跳转至第三方授权页面完成登录</p>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => setMcpSettingsOpen(false)}
                className="w-full py-2.5 text-[13px] font-medium rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
              >
                保存
              </button>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setListenSeconds(0);
                    try { localStorage.setItem("music_listen_seconds", "0"); } catch {}
                  }}
                  className="text-[12px] text-white/30 hover:text-white/50 transition-colors"
                >
                  重置播放时长
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
