import { useRef, useEffect, useState, useCallback } from "react";
import { loadSettings } from "../pages/SettingsPage";

const DEFAULT_SCALE = 5;
const W = 15;
const H = 12;

const BODY = "#DE886D";
const EYES = "#000000";

const IDLE: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,2,1,1,1,1,1,2,1,1,0,0],
  [1,1,1,1,2,1,1,1,1,1,2,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,0,1,0,0,0,1,0,1,0,0,0],
  [0,0,0,1,0,1,0,0,0,1,0,1,0,0,0],
  [0,0,0,3,3,3,3,3,3,3,3,3,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

type PetState = "idle" | "blink" | "happy";

function getFrame(state: PetState): number[][] {
  if (state === "idle" || state === "happy") return IDLE;
  const f = IDLE.map((row) => [...row]);
  f[3] = [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}

function drawFrame(canvas: HTMLCanvasElement | null, state: PetState) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  const frame = getFrame(state);
  for (let y = 0; y < frame.length; y++) {
    for (let x = 0; x < frame[y].length; x++) {
      const c = frame[y][x];
      if (!c) continue;
      if (c === 3) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = EYES;
      } else {
        ctx.globalAlpha = 1;
        ctx.fillStyle = c === 1 ? BODY : EYES;
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

function loadPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem("pet_position");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function savePosition(x: number, y: number) {
  try { localStorage.setItem("pet_position", JSON.stringify({ x, y })); } catch {}
}

export default function DesktopPet() {
  const settings = loadSettings();
  const scale = settings.petScale || DEFAULT_SCALE;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [petState, setPetState] = useState<PetState>("idle");
  const [jumping, setJumping] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const stateRef = useRef(petState);
  stateRef.current = petState;

  const petW = W * scale;
  const petH = H * scale;

  const saved = loadPosition();
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (saved) return saved;
    return { x: window.innerWidth - petW - 16, y: window.innerHeight - petH - 16 };
  });

  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const hasMoved = useRef(false);

  if (!settings.petVisible) return null;

  const clamp = useCallback((x: number, y: number) => ({
    x: Math.max(0, Math.min(window.innerWidth - petW, x)),
    y: Math.max(0, Math.min(window.innerHeight - petH, y)),
  }), [petW, petH]);

  useEffect(() => {
    drawFrame(canvasRef.current, petState);
  }, [petState]);

  useEffect(() => {
    const tick = () => {
      if (stateRef.current !== "idle") return;
      setPetState("blink");
      setTimeout(() => {
        if (stateRef.current === "blink") setPetState("idle");
      }, 150);
    };
    const id = setInterval(tick, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!dragging.current) return;
      const dx = cx - dragStart.current.mx;
      const dy = cy - dragStart.current.my;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
      const next = clamp(dragStart.current.px + dx, dragStart.current.py + dy);
      setPos(next);
    };

    const onEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setPos((p) => { savePosition(p.x, p.y); return p; });
      document.body.style.userSelect = "";
    };

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleMouseUp = () => onEnd();
    const handleTouchEnd = () => onEnd();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [clamp]);

  const startDrag = (cx: number, cy: number) => {
    dragging.current = true;
    hasMoved.current = false;
    dragStart.current = { mx: cx, my: cy, px: pos.x, py: pos.y };
    document.body.style.userSelect = "none";
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleClick = () => {
    if (hasMoved.current) return;
    setPetState("happy");
    setJumping(true);
    setHearts((prev) => [
      ...prev,
      { id: Date.now(), x: 25 + Math.random() * 50 },
    ]);
    setTimeout(() => setJumping(false), 500);
    setTimeout(() => setPetState("idle"), 900);
  };

  return (
    <div
      className="fixed z-30 select-none cursor-grab active:cursor-grabbing"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
    >
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute -top-1 pointer-events-none"
          style={{
            left: `${h.x}%`,
            color: BODY,
            fontSize: 16,
            animation: "heartFloat 0.8s ease-out forwards",
          }}
          onAnimationEnd={() =>
            setHearts((prev) => prev.filter((v) => v.id !== h.id))
          }
        >
          ♥
        </span>
      ))}

      <div
        style={{
          animation: jumping
            ? "petJump 0.5s ease-out"
            : dragging.current ? "none" : "petBob 2s ease-in-out infinite",
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            width: petW,
            height: petH,
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
}
