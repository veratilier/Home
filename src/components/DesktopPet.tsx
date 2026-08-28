import { useRef, useEffect, useState } from "react";
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

export default function DesktopPet() {
  const settings = loadSettings();
  const scale = settings.petScale || DEFAULT_SCALE;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [petState, setPetState] = useState<PetState>("idle");
  const [jumping, setJumping] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const stateRef = useRef(petState);
  stateRef.current = petState;

  if (!settings.petVisible) return null;

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

  const handleClick = () => {
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
      className="fixed bottom-4 right-4 z-30 select-none cursor-pointer"
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
            : "petBob 2s ease-in-out infinite",
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            width: W * scale,
            height: H * scale,
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
}
