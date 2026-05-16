import { motion } from "framer-motion";
import { Compass, Map as MapIcon, X } from "lucide-react";

export type OfficeMap3DProps = {
  onClose: () => void;
};

const ZONES = [
  { id: "01", name: "Start", x: 40, y: 15, w: 15, h: 25, type: "start" },
  { id: "02", name: "Founders Cafe", x: 42, y: 35, w: 35, h: 30, type: "main" },
  { id: "mutolaa", name: "Mutolaa", x: 42, y: 65, w: 15, h: 10, type: "sub" },
  { id: "03", name: "Open Space", x: 57, y: 65, w: 20, h: 25, type: "sub" },
  { id: "uzchess", name: "UzChess", x: 70, y: 75, w: 15, h: 15, type: "sub" },
  { id: "04", name: "UzCombinator", x: 10, y: 70, w: 30, h: 25, type: "main" },
  { id: "05", name: "Founders House", x: 60, y: 100, w: 25, h: 45, type: "main" },
];

export function OfficeMap3D({ onClose }: OfficeMap3DProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 md:p-10 backdrop-blur-xl"
    >
      <div className="relative h-full w-full max-w-6xl overflow-hidden rounded-[3rem] border border-white/10 bg-[#A2D729] shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-black/90 flex items-center justify-center border border-white/20 shadow-xl">
              <Compass className="h-6 w-6 text-[#A2D729] animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black uppercase tracking-tighter text-black leading-none">
                UzCombinator Office
              </h2>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-black/40 mt-1">
                Interactive 3D Navigation // v1.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group h-12 w-12 rounded-2xl bg-black/10 flex items-center justify-center hover:bg-black/90 transition-all duration-500 border border-black/5 hover:border-white/20"
          >
            <X className="h-6 w-6 text-black group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* 3D Map Container */}
        <div className="flex h-full w-full items-center justify-center pt-20" style={{ perspective: "1500px" }}>
          <motion.div
            initial={{ rotateX: 60, rotateZ: -25, scale: 0.8, opacity: 0 }}
            animate={{ rotateX: 45, rotateZ: -15, scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative h-[600px] w-[500px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Grid Overlay */}
            <div className="absolute inset-0 border-[0.5px] border-black/5 pointer-events-none" style={{ backgroundSize: '20px 20px', backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)' }} />

            {ZONES.map((zone) => (
              <motion.div
                key={zone.id}
                whileHover={{ translateZ: 20 }}
                className="absolute shadow-2xl transition-all duration-300"
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
                  className={`absolute inset-0 rounded-lg border border-black/20 ${
                    zone.type === "main" ? "bg-[#F15A24]" : "bg-black/5"
                  } shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]`}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                    <div className="text-[8px] font-mono font-bold text-black/30 mb-1">{zone.id}</div>
                    <div className="text-[10px] font-black uppercase tracking-tight text-black leading-tight">
                      {zone.name}
                    </div>
                  </div>
                </div>

                {/* 3D Depth (Sides) */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-4 bg-black/20 rounded-b-lg origin-top"
                  style={{ transform: "rotateX(-90deg) translateY(0px)" }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 w-4 bg-black/10 rounded-r-lg origin-left"
                  style={{ transform: "rotateY(90deg) translateX(0px)" }}
                />
              </motion.div>
            ))}

            {/* Path indicator */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ transform: 'translateZ(-5px)' }}>
                <motion.path 
                    d="M 47 15 L 47 35 M 59 65 L 70 100" 
                    stroke="black" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                    fill="none" 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.2 }}
                    transition={{ duration: 2, delay: 1 }}
                />
            </svg>

            {/* "You Are Here" Marker */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute left-[47%] top-[15%] z-50 h-6 w-6"
              style={{ transform: "translateZ(40px)" }}
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-20" />
                <div className="h-3 w-3 rounded-full bg-red-600 border-2 border-white shadow-glow-red" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[8px] font-bold text-white shadow-xl">
                  Siz shu yerdasiz
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-0 left-0 p-8">
           <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {ZONES.filter(z => z.id.match(/^\d+$/)).map(z => (
                <div key={z.id} className="flex items-center gap-3">
                   <span className="text-[10px] font-mono font-bold text-black/40">{z.id}</span>
                   <span className="text-[11px] font-black uppercase tracking-tight text-black">{z.name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Branding Footer */}
        <div className="absolute bottom-8 right-8 flex items-center gap-2">
           <div className="h-0.5 w-12 bg-black/10" />
           <div className="text-[10px] font-display font-black uppercase text-black tracking-widest">UzCombinator Maps</div>
        </div>
      </div>
    </motion.div>
  );
}
