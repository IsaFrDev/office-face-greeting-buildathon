/**
 * OfficeMap3D — Senior-level production rewrite
 *
 * Key fixes & upgrades vs original:
 * 1. Drag-to-rotate: uses useMotionValue + pointer events correctly.
 *    Original wired dragX/dragY into BOTH x/y (position) AND rotateX/rotateZ,
 *    so the element flew off screen. Now pointer-delta is captured manually and
 *    used only for rotation; position stays fixed.
 * 2. Path-following NAV_BOT: CSS `offset-path` requires a px-based path on the
 *    element itself — not on a child div. Fixed + path converted to canvas px.
 * 3. Zone click state: selected zone lifts and shows a tooltip panel.
 * 4. Inertia/damping on rotation via spring physics.
 * 5. Momentum flick: on pointer-up the rotation continues decelerating.
 * 6. Compass ring replaced with a proper animated SVG compass needle.
 * 7. Keyboard / escape-key close.
 * 8. ARIA roles for accessibility.
 */

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { X, Move, Navigation } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type OfficeMap3DProps = {
  onClose: () => void;
};

type Zone = {
  id: string;
  name: string;
  description: string;
  x: number; // percent of canvas width
  y: number; // percent of canvas height
  w: number;
  h: number;
  type: "start" | "main" | "sub";
  gradient: string; // Tailwind gradient classes
  accent: string;   // hex for glow/border
  images?: string[]; // Array of image URLs
};

// ─── Data ────────────────────────────────────────────────────────────────────

const ZONES: Zone[] = [
  {
    id: "01",
    name: "Entrance",
    description: "Asosiy kirish va ro'yxatga olish joyi.",
    x: 35, y: 3, w: 20, h: 18,
    type: "start",
    gradient: "from-amber-400 to-orange-500",
    accent: "#f97316",
  },
  {
    id: "02",
    name: "Founders Café",
    description: "Qornimni toyg'azib darsliklarimni qildim.",
    x: 35, y: 24, w: 42, h: 24,
    type: "main",
    gradient: "from-orange-500 to-red-600",
    accent: "#ef4444",
  },
  {
    id: "mutolaa",
    name: "Mutolaa",
    description: "Buni sotib oldim! (Kitoblar va mutolaa burchagi).",
    x: 35, y: 51, w: 18, h: 12,
    type: "sub",
    gradient: "from-emerald-400 to-teal-500",
    accent: "#14b8a6",
    images: ["/assets/office-zones/mutolaa/mutola1.jpg", "/assets/office-zones/mutolaa/mutola2.jpg"]
  },
  {
    id: "03",
    name: "Open Space",
    description: "Dam oldim, madaniy hordiq va hamkorlik.",
    x: 55, y: 51, w: 22, h: 20,
    type: "sub",
    gradient: "from-blue-400 to-indigo-500",
    accent: "#6366f1",
    images: ["/assets/office-zones/open-space/open1.jpg", "/assets/office-zones/open-space/open2.jpg"]
  },
  {
    id: "uzchess",
    name: "UzChess",
    description: "Shaxmat o'ynashni o'rgandim.",
    x: 65, y: 65, w: 18, h: 15,
    type: "sub",
    gradient: "from-purple-400 to-fuchsia-500",
    accent: "#a855f7",
    images: ["/assets/office-zones/uzchess/uzchess1.jpg", "/assets/office-zones/uzchess/uzchess2.jpg"]
  },
  {
    id: "04",
    name: "UzCombinator",
    description: "Startupimni rivojlantirdim.",
    x: 6, y: 60, w: 27, h: 22,
    type: "main",
    gradient: "from-orange-600 to-rose-700",
    accent: "#f43f5e",
    images: ["/assets/office-zones/uzcombinator/uzcombinator1.jpg", "/assets/office-zones/uzcombinator/uzcombinator2.jpg"]
  },
  {
    id: "05",
    name: "Founders House",
    description: "Yopiq hudud. Kirish mumkin emas!",
    x: 55, y: 74, w: 30, h: 24,
    type: "main",
    gradient: "from-red-900 to-black",
    accent: "#000000",
  },
];

// NAV_BOT path calculated to hit the center of each zone (Canvas 520x620)
const NAV_PATH =
  "M 234 74 L 291 223 L 228 353 L 343 378 L 384 449 L 101 440 Z";

// ─── Sub-components ───────────────────────────────────────────────────────────

function CompassSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <circle cx="24" cy="24" r="18" stroke="rgba(162,215,41,0.3)" strokeWidth="0.5" />
      {/* Cardinal letters */}
      {[["N", 24, 5], ["S", 24, 45], ["E", 43, 26], ["W", 5, 26]].map(
        ([label, x, y]) => (
          <text
            key={label as string}
            x={x as number}
            y={y as number}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="5"
            fontWeight="700"
            fill={label === "N" ? "#A2D729" : "rgba(255,255,255,0.3)"}
            fontFamily="monospace"
          >
            {label}
          </text>
        )
      )}
      {/* Needle — north red, south white */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ originX: "24px", originY: "24px" }}
      >
        <polygon points="24,8 21,24 24,22 27,24" fill="#A2D729" />
        <polygon points="24,40 21,24 24,26 27,24" fill="rgba(255,255,255,0.3)" />
        <circle cx="24" cy="24" r="2" fill="rgba(255,255,255,0.6)" />
      </motion.g>
    </svg>
  );
}

function ZoneBlock({
  zone,
  index,
  isSelected,
  onSelect,
}: {
  zone: Zone;
  index: number;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}) {
  return (
    <motion.div
      key={zone.id}
      initial={{ translateZ: -80, opacity: 0, scale: 0.95 }}
      animate={{ translateZ: isSelected ? 48 : 0, opacity: 1, scale: 1 }}
      transition={{
        translateZ: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.5, delay: index * 0.06 },
        scale: { duration: 0.5, delay: index * 0.06 },
      }}
      whileHover={{ translateZ: 32 }}
      onClick={() => onSelect(isSelected ? null : zone.id)}
      className="absolute cursor-pointer select-none"
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.w}%`,
        height: `${zone.h}%`,
        transformStyle: "preserve-3d",
      }}
      role="button"
      aria-label={zone.name}
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(isSelected ? null : zone.id);
      }}
    >
      {/* Glow ring when selected */}
      {isSelected && (
        <motion.div
          layoutId="zone-glow"
          className="absolute inset-[-4px] rounded-[18px]"
          style={{ boxShadow: `0 0 24px 6px ${zone.accent}80` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Main face */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${zone.gradient} border border-white/20 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] overflow-hidden flex items-center justify-center`}
      >
        {/* Glass sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        {/* Specular highlight */}
        <div className="absolute -top-[60%] -left-[30%] w-[160%] h-[140%] bg-white/10 rotate-[30deg] pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center px-2 py-1 text-center gap-0.5">
          <span className="text-[8px] font-mono font-black text-black/30 tracking-[0.3em] leading-none">
            {zone.id}
          </span>
          <span className="text-[11px] font-black uppercase tracking-tight text-white drop-shadow leading-tight">
            {zone.name}
          </span>
        </div>
      </div>

      {/* Bottom depth face */}
      <div
        className="absolute bottom-0 left-[4%] right-[4%] h-[10px] rounded-b-2xl origin-top"
        style={{
          transform: "rotateX(-90deg)",
          background: "rgba(0,0,0,0.5)",
        }}
      />
      {/* Right depth face */}
      <div
        className="absolute top-[4%] bottom-0 right-0 w-[10px] rounded-r-2xl origin-left"
        style={{
          transform: "rotateY(90deg)",
          background: "rgba(0,0,0,0.35)",
        }}
      />
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OfficeMap3D({ onClose }: OfficeMap3DProps) {
  // ── Rotation state via pointer drag ──────────────────────────────────────
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  // Raw rotation values
  const rotX = useMotionValue(42);   // isometric tilt
  const rotZ = useMotionValue(-18);  // horizontal rotation

  // Smooth spring wrapper for buttery feel
  const springRotX = useSpring(rotX, { stiffness: 120, damping: 22 });
  const springRotZ = useSpring(rotZ, { stiffness: 120, damping: 22 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: dx, y: dy };

      rotZ.set(rotZ.get() + dx * 0.25);
      rotX.set(Math.max(15, Math.min(70, rotX.get() - dy * 0.15)));
    },
    [rotX, rotZ]
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;

    // Momentum decay
    const decay = () => {
      if (Math.abs(velocity.current.x) < 0.1 && Math.abs(velocity.current.y) < 0.1) return;
      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;
      rotZ.set(rotZ.get() + velocity.current.x * 0.18);
      rotX.set(Math.max(15, Math.min(70, rotX.get() - velocity.current.y * 0.1)));
      rafId.current = requestAnimationFrame(decay);
    };
    rafId.current = requestAnimationFrame(decay);
  }, [rotX, rotZ]);

  // ── Zone selection ────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedZone = ZONES.find((z) => z.id === selectedId) ?? null;

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedId) setSelectedId(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [selectedId, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="UzCombinator Hub — Interactive 3D Map"
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="relative h-full w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-[#0e0e0e]"
      >
        {/* ── Ambient background pulses ─────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.2, 0.12] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-[#A2D729] blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-600 blur-[140px]"
          />
        </div>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-xl shadow-[0_0_15px_rgba(241,90,36,0.1)]">
              <CompassSVG className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-black text-2xl uppercase tracking-tighter text-white leading-none">
                UzCombinator{" "}
                <span className="text-primary drop-shadow-[0_0_8px_#F15A24]">Hub</span>
              </h2>
              <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-white/40">
                Interactive 3D Map · Drag to rotate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
              <Move className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/40">
                Drag · Rotate
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close map"
              className="group flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:bg-white/10"
            >
              <X className="h-5 w-5 text-white/40 transition-all group-hover:rotate-90 group-hover:text-white" />
            </button>
          </div>
        </header>

        {/* ── 3D Canvas ─────────────────────────────────────────────────────── */}
        <div
          className="flex h-full w-full cursor-grab items-center justify-center pt-24 active:cursor-grabbing"
          style={{ perspective: "1800px" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <motion.div
            style={{
              rotateX: springRotX,
              rotateZ: springRotZ,
              transformStyle: "preserve-3d",
            }}
            className="relative h-[620px] w-[520px] shrink-0"
          >
            {/* Floor */}
            <div
              className="absolute inset-[-5%] rounded-[3rem] border border-white/[0.04]"
              style={{
                transform: "translateZ(-8px)",
                background:
                  "radial-gradient(ellipse at center, rgba(162,215,41,0.04) 0%, transparent 70%)",
              }}
            />

            {/* Dot-grid overlay */}
            <div
              className="absolute inset-0 rounded-3xl opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(162,215,41,0.18) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />

            {/* ── Zones ──────────────────────────────────────────────────── */}
            {ZONES.map((zone, i) => (
              <ZoneBlock
                key={zone.id}
                zone={zone}
                index={i}
                isSelected={selectedId === zone.id}
                onSelect={setSelectedId}
              />
            ))}

            {/* ── Route path (SVG, behind zones) ─────────────────────────── */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 520 620"
              style={{ transform: "translateZ(-4px)" }}
              aria-hidden="true"
            >
              <motion.path
                d={NAV_PATH}
                stroke="rgba(162,215,41,0.25)"
                strokeWidth="2.5"
                strokeDasharray="7 10"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
              />
            </svg>

            {/* ── NAV_BOT ────────────────────────────────────────────────── */}
            <NavBot 
              path={NAV_PATH} 
              onMilestone={(zoneId) => {
                const zone = ZONES.find(z => z.id === zoneId);
                if (!zone?.images?.length) return; // skip zones without images
                setSelectedId(zoneId);
                setTimeout(() => {
                  setSelectedId((prev) => (prev === zoneId ? null : prev));
                }, 5000);
              }} 
            />

            {/* ── "You are here" pin ─────────────────────────────────────── */}
            <motion.div
              className="absolute z-50"
              style={{
                left: "45%",
                top: "8%",
                transform: "translateZ(50px)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 400 }}
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute h-5 w-5 rounded-full bg-red-500"
                />
                <div className="h-3.5 w-3.5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Zone detail panel (slides up from bottom on selection) ─────────── */}
        <AnimatePresence>
          {selectedZone && (
            <motion.div
              key="zone-panel"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute bottom-0 left-0 right-0 z-50 flex items-end justify-center px-6 pb-20 md:pb-28"
              style={{ pointerEvents: "none" }}
            >
              <div
                className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#181818]/95 p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                style={{ pointerEvents: "all" }}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="mb-2 font-mono text-[8px] font-black uppercase tracking-[0.4em] text-white/30">
                      Spatial Intelligence · Zone {selectedZone.id}
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                      {selectedZone.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">
                      {selectedZone.description}
                    </p>
                    
                    <div className="mt-6 flex items-center gap-3">
                      <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${selectedZone.gradient} animate-pulse shadow-[0_0_10px_${selectedZone.accent}]`} />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/40">
                        Live Status: Optimal
                      </span>
                    </div>
                  </div>

                  {/* Right: Images — prominent auto-slideshow */}
                  <div className="flex gap-3 h-40 md:h-48 shrink-0">
                    {(selectedZone.images || []).map((imgUrl, i) => (
                      <motion.div 
                        key={imgUrl} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.15 }}
                        className="relative aspect-[4/3] h-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 group"
                      >
                        <img 
                          src={imgUrl} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/400x300/181818/A2D729?text=Zone+Photo+${i + 1}`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                           <span className="text-[8px] font-mono font-bold text-white uppercase tracking-widest">View Full</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-[#A2D729]" />
                        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#A2D729]">
                          Yo'nalish olish
                        </span>
                      </div>
                      <div className="h-4 w-[1px] bg-white/10" />
                      <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">NAV_PATH: Active</div>
                   </div>
                   <button 
                    onClick={() => setSelectedId(null)}
                    className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-widest transition"
                   >
                     Yopish [Esc]
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Legend ────────────────────────────────────────────────────────── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-40 px-8 pb-8 pt-20"
          style={{
            background:
              "linear-gradient(to top, rgba(14,14,14,0.95) 40%, transparent)",
            pointerEvents: "none",
          }}
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {ZONES.map((z) => (
              <div
                key={z.id}
                className="group flex cursor-pointer items-center gap-2.5"
                style={{ pointerEvents: "all" }}
                onClick={() => setSelectedId((prev) => (prev === z.id ? null : z.id))}
                role="button"
                tabIndex={0}
                aria-label={`Select zone ${z.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    setSelectedId((prev) => (prev === z.id ? null : z.id));
                }}
              >
                <div
                  className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${z.gradient} shadow-md transition-transform duration-200 group-hover:scale-150`}
                />
                <div>
                  <div className="font-mono text-[7px] font-bold uppercase leading-none tracking-widest text-white/20">
                    {z.id}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-tight text-white/60 transition-colors group-hover:text-[#A2D729]">
                    {z.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Branding ──────────────────────────────────────────────────────── */}
        <div className="absolute bottom-8 right-8 z-50 text-right">
          <div className="font-mono text-[9px] font-black uppercase tracking-widest text-[#A2D729]">
            VisionGate Analytics
          </div>
          <div className="mt-0.5 font-mono text-[7px] uppercase tracking-widest text-white/20">
            Spatial Intelligence v2.0
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── NAV_BOT — Path-following animated dot ────────────────────────────────────

/**
 * Animates a dot along NAV_PATH with pausing and speaking logic.
 */
function NavBot({ path, onMilestone }: { path: string; onMilestone?: (zoneId: string) => void }) {
  const dotRef = useRef<SVGGElement>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  // Define milestones on the 0-1 progress scale based on path length
  const MILESTONES = [
    { p: 0.15, msg: "Sotib oldim! (Mutolaa)", zoneId: "mutolaa" },
    { p: 0.35, msg: "Shaxmat o'ynashni o'rgandim", zoneId: "uzchess" },
    { p: 0.55, msg: "Startupni rivojlantirdim (UzCombinator)", zoneId: "04" },
    { p: 0.75, msg: "Open spacedada dam oldim", zoneId: "03" },
    { p: 0.92, msg: "Founders cafeda to'ydim", zoneId: "02" },
  ];

  useEffect(() => {
    const svgNS = "http://www.w3.org/2000/svg";
    const tempSvg = document.createElementNS(svgNS, "svg");
    const tempPath = document.createElementNS(svgNS, "path") as SVGPathElement;
    tempPath.setAttribute("d", path);
    tempSvg.appendChild(tempPath);
    document.body.appendChild(tempSvg);

    const totalLength = tempPath.getTotalLength();
    const BASE_SPEED = 0.00004; 
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      if (!isPausedRef.current) {
        progressRef.current = (progressRef.current + BASE_SPEED * dt) % 1;

        const milestone = MILESTONES.find(
          (m) => Math.abs(progressRef.current - m.p) < 0.005
        );

        if (milestone) {
          isPausedRef.current = true;
          setCurrentMessage(milestone.msg);
          if (onMilestone && milestone.zoneId) onMilestone(milestone.zoneId);

          setTimeout(() => {
            isPausedRef.current = false;
            setCurrentMessage(null);
          }, 6000);
        }
      }

      const pt = tempPath.getPointAtLength(progressRef.current * totalLength);

      if (dotRef.current) {
        dotRef.current.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.body.removeChild(tempSvg);
    };
  }, [path]);

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      viewBox="0 0 520 620"
      style={{ transform: "translateZ(80px)" }}
      aria-hidden="true"
    >
      <g ref={dotRef}>
        <AnimatePresence>
          {currentMessage && (
            <motion.g
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 5 }}
              transform="translate(0, -55)"
            >
              <rect
                x="-90"
                y="-25"
                width="180"
                height="45"
                rx="14"
                fill="rgba(0,0,0,0.9)"
                stroke="#A2D729"
                strokeWidth="1.5"
                className="backdrop-blur-xl shadow-2xl"
              />
              <path d="M -8 20 L 0 28 L 8 20 Z" fill="rgba(0,0,0,0.9)" stroke="#A2D729" strokeWidth="1.5" />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fontWeight="700"
                fill="#fff"
                fontFamily="sans-serif"
              >
                {currentMessage.length > 28 ? (
                  <>
                    <tspan x="0" dy="-0.6em">{currentMessage.slice(0, 24)}...</tspan>
                    <tspan x="0" dy="1.2em">{currentMessage.slice(24)}</tspan>
                  </>
                ) : (
                  currentMessage
                )}
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        <circle r="14" fill="none" stroke="#A2D729" strokeWidth="1" opacity="0.3">
          <animate attributeName="r" values="10;20;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle r="7" fill="#A2D729" stroke="white" strokeWidth="2.5" />
        <text
          y="20"
          textAnchor="middle"
          fontSize="7"
          fontWeight="900"
          fill="#A2D729"
          fontFamily="monospace"
        >
          NAV_BOT
        </text>
      </g>
    </svg>
  );
}