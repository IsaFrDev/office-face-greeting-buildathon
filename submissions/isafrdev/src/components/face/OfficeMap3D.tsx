import { motion, useMotionValue, useTransform } from "framer-motion";
import { Compass, Map as MapIcon, X, Move } from "lucide-react";
import { useState } from "react";

export type OfficeMap3DProps = {
  onClose: () => void;
};

const ZONES = [
  { id: "01", name: "Start", x: 40, y: 15, w: 15, h: 25, type: "start", color: "from-amber-400 to-orange-500" },
  { id: "02", name: "Founders Cafe", x: 42, y: 35, w: 35, h: 30, type: "main", color: "from-orange-500 to-red-600" },
  { id: "mutolaa", name: "Mutolaa", x: 42, y: 65, w: 15, h: 10, type: "sub", color: "from-emerald-400 to-teal-500" },
  { id: "03", name: "Open Space", x: 57, y: 65, w: 20, h: 25, type: "sub", color: "from-blue-400 to-indigo-500" },
  { id: "uzchess", name: "UzChess", x: 70, y: 75, w: 15, h: 15, type: "sub", color: "from-purple-400 to-fuchsia-500" },
  { id: "04", name: "UzCombinator", x: 10, y: 70, w: 30, h: 25, type: "main", color: "from-orange-600 to-rose-700" },
  { id: "05", name: "Founders House", x: 60, y: 100, w: 25, h: 45, type: "main", color: "from-red-500 to-orange-600" },
];

export function OfficeMap3D({ onClose }: OfficeMap3DProps) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  
  // Transform drag values into rotation
  const rotateX = useTransform(dragY, [-200, 200], [60, 30]);
  const rotateZ = useTransform(dragX, [-200, 200], [-45, 15]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10 backdrop-blur-2xl"
    >
      <div className="relative h-full w-full max-w-6xl overflow-hidden rounded-[3rem] border border-white/5 bg-[#121212] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 h-full w-full bg-[#A2D729]/20 blur-[150px] animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 h-full w-full bg-orange-500/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-8">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-xl">
              <Compass className="h-7 w-7 text-[#A2D729] animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-white leading-none">
                UzCombinator <span className="text-[#A2D729]">Hub</span>
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#A2D729] animate-pulse" />
                <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-white/40">
                  Interactive 3D Navigation // v2.0
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <Move className="h-4 w-4 text-[#A2D729]" />
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Suring (Rotate)</span>
             </div>
            <button
              onClick={onClose}
              className="group h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all duration-500 border border-white/10"
            >
              <X className="h-7 w-7 text-white/50 group-hover:text-white group-hover:rotate-90 transition-all" />
            </button>
          </div>
        </div>

        {/* 3D Map Container - Drag to Rotate */}
        <div 
          className="flex h-full w-full items-center justify-center pt-20 cursor-move" 
          style={{ perspective: "2000px" }}
        >
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            style={{ 
                rotateX, 
                rotateZ, 
                x: dragX, 
                y: dragY,
                transformStyle: "preserve-3d" 
            }}
            className="relative h-[650px] w-[550px]"
          >
            {/* Floor Plane */}
            <div className="absolute inset-[-10%] bg-gradient-to-br from-white/[0.03] to-transparent rounded-[4rem] border border-white/[0.05] shadow-inner" style={{ transform: 'translateZ(-10px)' }} />
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 border-[0.5px] border-white/5 pointer-events-none rounded-3xl" style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, rgba(162, 215, 41, 0.1) 1px, transparent 1px)' }} />

            {ZONES.map((zone, idx) => (
              <motion.div
                key={zone.id}
                initial={{ translateZ: -100, opacity: 0 }}
                animate={{ translateZ: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                whileHover={{ translateZ: 30, scale: 1.02 }}
                className="absolute transition-all duration-300"
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.w}%`,
                  height: `${zone.h}%`,
                  transformStyle: "preserve-3d",
                }}
              >
                {/* 3D Base */}
                <div
                  className={`absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br ${zone.color} shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden`}
                >
                  {/* Glass Highlight */}
                  <div className="absolute inset-0 bg-white/10 opacity-30 pointer-events-none" />
                  <div className="absolute -top-full -left-full w-[200%] h-[200%] bg-gradient-to-br from-white/20 to-transparent rotate-45 pointer-events-none" />

                  <div className="relative flex flex-col items-center justify-center p-3 text-center">
                    <div className="text-[9px] font-mono font-black text-black/40 mb-1 tracking-widest">{zone.id}</div>
                    <div className="text-[12px] font-black uppercase tracking-tight text-white drop-shadow-lg leading-tight">
                      {zone.name}
                    </div>
                  </div>
                </div>

                {/* 3D Depth (Sides) */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-8 bg-black/40 rounded-b-2xl origin-top"
                  style={{ transform: "rotateX(-90deg) translateY(0px)" }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 w-8 bg-black/30 rounded-r-2xl origin-left"
                  style={{ transform: "rotateY(90deg) translateX(0px)" }}
                />
              </motion.div>
            ))}

            {/* Path indicator */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ transform: 'translateZ(-5px)' }}>
                <motion.path 
                    d="M 47.5 27.5 C 47.5 35, 52 35, 52 45 C 52 65, 67 65, 67 77 L 72.5 122.5" 
                    id="mapPath"
                    stroke="rgba(162, 215, 41, 0.3)" 
                    strokeWidth="3" 
                    strokeDasharray="8 12" 
                    fill="none" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                />
            </svg>

            {/* Moving Tracker Dot */}
            <motion.div
              className="absolute z-50 h-8 w-8"
              style={{ 
                  transformStyle: "preserve-3d",
                  transform: "translateZ(50px)"
              }}
              animate={{
                offsetDistance: ["0%", "100%"]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
            >
               {/* This is a CSS feature supported in modern browsers for path following */}
               <div style={{ offsetPath: "path('M 47.5 27.5 C 47.5 35, 52 35, 52 45 C 52 65, 67 65, 67 77 L 72.5 122.5')", offsetRotate: "auto" }}>
                    <div className="relative flex items-center justify-center">
                        <div className="absolute h-10 w-10 animate-ping rounded-full bg-[#A2D729] opacity-30" />
                        <div className="h-4 w-4 rounded-full bg-[#A2D729] border-2 border-white shadow-[0_0_20px_#A2D729]" />
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-black/80 px-3 py-1.5 text-[9px] font-black text-[#A2D729] border border-[#A2D729]/30 backdrop-blur-md shadow-2xl">
                        NAV_BOT v2
                        </div>
                    </div>
               </div>
            </motion.div>

            {/* Static "Siz shu yerdasiz" Marker at Start */}
            <motion.div
              className="absolute left-[47%] top-[15%] z-50 h-6 w-6"
              style={{ transform: "translateZ(40px)" }}
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-20" />
                <div className="h-4 w-4 rounded-full bg-red-600 border-2 border-white shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-0 left-0 p-10 bg-gradient-to-t from-black to-transparent w-full">
           <div className="flex flex-wrap gap-8 items-center">
              {ZONES.filter(z => z.id.match(/^\d+$/)).map(z => (
                <div key={z.id} className="flex items-center gap-3 group cursor-default">
                   <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${z.color} shadow-lg group-hover:scale-150 transition-transform`} />
                   <div className="flex flex-col">
                     <span className="text-[8px] font-mono font-bold text-white/20 uppercase tracking-widest leading-none mb-1">{z.id}</span>
                     <span className="text-[11px] font-black uppercase tracking-tight text-white/70 group-hover:text-[#A2D729] transition-colors">{z.name}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Branding Footer */}
        <div className="absolute bottom-10 right-10 flex items-center gap-4">
           <div className="text-right">
              <div className="text-[10px] font-black uppercase text-[#A2D729] tracking-widest">VisionGate Analytics</div>
              <div className="text-[8px] font-mono text-white/30 uppercase mt-1">Spatial Intelligence Module</div>
           </div>
           <div className="h-10 w-[1px] bg-white/10" />
           <MapIcon className="h-8 w-8 text-white/10" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .shadow-glow-red {
          box-shadow: 0 0 15px rgba(220, 38, 38, 0.8);
        }
      `}} />
    </motion.div>
  );
}
