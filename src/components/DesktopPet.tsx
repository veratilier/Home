import { useRef, useEffect, useState } from "react";

const SCALE = 4;
const W = 20;
const H = 16;

const PALETTE: Record<number, string> = {
  1: "#c96442",
  2: "#a34f33",
  3: "#1a1a1a",
  4: "#e8956e",
};

const IDLE: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,3,3,1,1,1,1,3,3,1,1,1,0,0,0],
  [0,0,0,1,1,1,3,3,1,1,1,1,3,3,1,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [2,2,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,2,2],
  [0,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,0],
  [2,2,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,2,2],
  [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,0,2,2,0,0,0,0,0,0,2,2,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

type PetState = "idle" | "blink" | "happy";

function getFrame(state: PetState): number[][] {
  if (state === "idle") return IDLE;
  const f = IDLE.map((row) => [...row]);
  if (state === "blink") {
    f[4] = [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0];
    f[5] = [0,0,0,1,1,1,2,2,1,1,1,1,2,2,1,1,1,0,0,0];
  } else {
    f[4] = [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0];
    f[5] = [0,0,0,1,1,1,2,2,1,1,1,1,2,2,1,1,1,0,0,0];
    f[6] = [0,0,0,1,4,4,1,1,2,2,2,2,1,1,4,4,1,0,0,0];
  }
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
      ctx.fillStyle = PALETTE[c];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

export default function DesktopPet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [petState, setPetState] = useState<PetState>("idle");
  const [jumping, setJumping] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const stateRef = useRef(petState);
  stateRef.current = petState;

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
      { id: Date.now(), x: 30 + Math.random() * 40 },
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
            color: "var(--color-accent)",
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
        className="absolute bottom-0 left-1/2 rounded-full bg-black/10"
        style={{
          width: 56,
          height: 6,
          transform: `translateX(-50%) scaleX(${jumping ? 0.6 : 1})`,
          transition: "transform 0.25s",
        }}
      />

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
            width: W * SCALE,
            height: H * SCALE,
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  );
}
