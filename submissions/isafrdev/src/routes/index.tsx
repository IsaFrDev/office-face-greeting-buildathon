import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Settings, Map as MapIcon } from "lucide-react";

import { VideoPlayer } from "@/components/face/VideoPlayer";
import { GreetingOverlay } from "@/components/face/GreetingOverlay";
import { RecognitionEngine } from "@/components/face/RecognitionEngine";
import { OfficeMap3D } from "@/components/face/OfficeMap3D";
import { AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import type { PlaylistItem, Person, Reminder } from "@/lib/face/types";
import { speakAndWait, listen, birthdaySpeechLine } from "@/lib/face/voice";
import { sendTelegram } from "@/lib/face/telegram";
import { getWeather } from "@/lib/face/weather";
import {
  PLAYLIST_LS_KEY,
  PLAYLIST_DAY_LS_KEY,
  PLAYLIST_CHANGE_EVENT,
  loadPlaylistFromStorage,
  writePlaylistLocal,
  addLog,
} from "@/lib/face/db";
import {
  loadKioskPrefs,
  DEFAULT_KIOSK_PREFS,
  KIOSK_PREFS_CHANGE_EVENT,
  isInScheduledDayWindow,
} from "@/lib/face/kioskPrefs";
import { fetchPlaylistRemote } from "@/lib/face/playlistSync";
import {
  buildHourlyQuestion,
  shouldAskHourlyCheck,
  saveHourlyResponse,
  getHourlyMem,
} from "@/lib/face/hourlyMemory";
import { hasBeenCelebratedToday, markCelebratedToday } from "@/lib/face/birthdayMemory";
import { polishHourlyFollowUp } from "@/lib/face/openaiBrief";

import { supabase } from "@/lib/supabase";

const REMOTE_TS_KEY = "visiongate:playlist_remote_ts";

function computeEffectivePlaylist(): PlaylistItem[] {
  if (typeof window === "undefined") return [];
  const prefs = loadKioskPrefs();
  const main = loadPlaylistFromStorage(PLAYLIST_LS_KEY);
  const day = loadPlaylistFromStorage(PLAYLIST_DAY_LS_KEY);
  if (
    prefs.scheduleEnabled &&
    day.length > 0 &&
    isInScheduledDayWindow(prefs.dayStartHour, prefs.dayEndHour)
  ) {
    return day;
  }
  return main;
}

export const Route = createFileRoute("/")({
  component: KioskPage,
  head: () => ({
    meta: [
      { title: "VisionGate · AI Qabulxona" },
      { name: "description", content: "Sun'iy intellekt asosida yuzni tanish va aqlli salomlashish tizimi." },
    ],
  }),
});

function KioskPage() {
  const [active, setActive] = useState<{ results: any[] } | null>(null);
  const [voice] = useState(true);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(() =>
    typeof window !== "undefined" ? computeEffectivePlaylist() : [],
  );
  const [apiKey, setApiKey] = useState("");
  const [showHud, setShowHud] = useState(true);
  const [now, setNow] = useState<Date | null>(null);
  const [spokenText, setSpokenText] = useState<string | null>(null);
  const [birthdayHighlight, setBirthdayHighlight] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [kioskPrefs, setKioskPrefs] = useState(() =>
    typeof window !== "undefined" ? loadKioskPrefs() : { ...DEFAULT_KIOSK_PREFS },
  );
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);

  const bumpPlaylist = useCallback(() => setPlaylist(computeEffectivePlaylist()), []);

  // ── HUD auto-hide ──
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleMove = () => {
      setShowHud(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowHud(false), 3000);
    };
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      clearTimeout(timer);
    };
  }, []);

  // ── Init ──
  useEffect(() => {
    const envKey = import.meta.env.VITE_ELEVENLABS_KEY;
    const localKey = localStorage.getItem("visiongate:elevenlabs_key");
    const key = localKey || envKey;

    console.log("[Kiosk] ElevenLabs Key Source:", localKey ? "Local" : envKey ? "Env" : "None");
    if (key) setApiKey(key);

    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);

    const refreshData = async () => {
      const { listPeople, listLogs } = await import("@/lib/face/db");
      await listPeople();
      await listLogs(100);
    };
    refreshData();
    const interval = setInterval(refreshData, 10000);

    bumpPlaylist();

    const onPlaylistCustom = () => bumpPlaylist();
    const onPlaylistStorage = (e: StorageEvent) => {
      if (e.key === PLAYLIST_LS_KEY || e.key === PLAYLIST_DAY_LS_KEY || e.key === null) bumpPlaylist();
    };
    window.addEventListener(PLAYLIST_CHANGE_EVENT, onPlaylistCustom);
    window.addEventListener("storage", onPlaylistStorage);

    const onPrefs = () => setKioskPrefs(loadKioskPrefs());
    window.addEventListener(KIOSK_PREFS_CHANGE_EVENT, onPrefs);

    return () => {
      clearInterval(t);
      clearInterval(interval);
      window.removeEventListener(PLAYLIST_CHANGE_EVENT, onPlaylistCustom);
      window.removeEventListener("storage", onPlaylistStorage);
      window.removeEventListener(KIOSK_PREFS_CHANGE_EVENT, onPrefs);
    };
  }, [bumpPlaylist]);

  // ── Re-evaluate day/night playlist each minute ──
  useEffect(() => {
    const id = setInterval(() => bumpPlaylist(), 60_000);
    return () => clearInterval(id);
  }, [bumpPlaylist]);

  // ── Pull playlist from Supabase (optional) ──
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    if (!url) return;

    let cancelled = false;

    const pull = async () => {
      if (!loadKioskPrefs().cloudPlaylistSync) return;
      const remote = await fetchPlaylistRemote();
      if (!remote || cancelled) return;
      const prevTs = Number(localStorage.getItem(REMOTE_TS_KEY) || "0");
      if (remote.updatedAt <= prevTs) return;
      writePlaylistLocal(remote.items, PLAYLIST_LS_KEY);
      localStorage.setItem(REMOTE_TS_KEY, String(remote.updatedAt));
      bumpPlaylist();
    };

    void pull();
    const poll = setInterval(() => void pull(), 45_000);

    const ch = supabase
      .channel("settings-playlist-kiosk")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings", filter: "key=eq.visiongate_playlist" },
        () => void pull(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(poll);
      void supabase.removeChannel(ch);
    };
  }, [bumpPlaylist]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const scheduleDismiss = (ms: number) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setActive(null);
      setSpokenText(null);
      setActiveReminder(null);
      dismissTimerRef.current = null;
    }, ms);
  };

  // ── Alarm (Blacklist) ──
  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 4000);
    } catch (e) {
      console.error("Alarm error", e);
    }
  };

  // ── Birthday Celebration ──
  const playCelebrateSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.error("Celebration sound error", e);
    }
  };

  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleRecognize = async (results: { person: Person; confidence: number; expression: string }[], logId: string) => {
    if (active) return;
    const mainResult = results[0];
    if (mainResult) {
      try {
        setLoading(true);
        const prefs = loadKioskPrefs();
        
        setActive({ results });

        const h = new Date().getHours();
        const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const todayMD = todayStr.slice(5, 10);
        
        const isBirthdayToday = mainResult.person.birthday?.slice(5, 10) === todayMD;
        const shouldCelebrate = isBirthdayToday && !hasBeenCelebratedToday(mainResult.person.id);

        // Check for today's reminders
        const todayReminder = mainResult.person.reminders?.find(r => r.date === todayStr && !r.isDone);
        let lateMessage = "";
        
        if (todayReminder) {
          setActiveReminder(todayReminder);
          
          if (todayReminder.time) {
             const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
             if (nowStr > todayReminder.time) {
                lateMessage = `Wait, ${mainResult.person.name}. Why are you late? You have a ${todayReminder.message} at ${todayReminder.time}!`;
             }
          }
          
          sendTelegram(`<b>Eslatma:</b> ${mainResult.person.name} keldi. Xabar: "${todayReminder.message}" ${lateMessage ? " (KECH QOLDI)" : ""}`);
        }
        
        // Force English as requested
        const timeGreeting = h < 12 ? "Good morning" : h < 18 ? "Good day" : "Good evening";

        setBirthdayHighlight(shouldCelebrate);
        const weather = await getWeather("en");
        let greetText = `${timeGreeting}, ${mainResult.person.name}! How are you today? ${weather}`.trim();
        
        if (lateMessage) {
          greetText = `${lateMessage}\n\n${greetText}`;
        }

        setSpokenText(greetText);

        const mightListen =
          voice && prefs.hourlyCheckEnabled && shouldAskHourlyCheck(mainResult.person.id);

        // Safety timeout
        const safetyTimer = setTimeout(() => {
           if (active) scheduleDismiss(0);
        }, 15000);

        try {
          if (voice) {
            const speechLang = "en";
            
            if (lateMessage) {
               await speakAndWait(lateMessage, "en", { elevenKey });
               await new Promise(r => setTimeout(r, 600));
            }
            
            const fullStandardGreet = `${timeGreeting}, ${mainResult.person.name}! How are you today? ${weather}`.trim();
            await speakAndWait(fullStandardGreet, speechLang, { elevenKey });

            if (todayReminder && !lateMessage) {
               await new Promise(r => setTimeout(r, 400));
               await speakAndWait(`Reminder: You have a ${todayReminder.message} today.`, "en", { elevenKey });
            }

            if (shouldCelebrate) {
              playCelebrateSound();
              triggerConfetti();
              await speakAndWait(birthdaySpeechLine(mainResult.person.name, "en"), "en", { elevenKey });
              markCelebratedToday(mainResult.person.id);
            }

            if (mightListen) {
              const prior = getHourlyMem(mainResult.person.id);
              let q = buildHourlyQuestion(mainResult.person.name, "en", prior?.transcript ?? null);
              if (prefs.hourlyUseOpenAI) {
                const polished = await polishHourlyFollowUp(
                  `Employee ${mainResult.person.name}. Previous note: "${prior?.transcript ?? "none"}". One short warm sentence asking mood + today's plan.`,
                  "English",
                );
                if (polished) q = polished;
              }

              setSpokenText(`${greetText}\n\n${q}`);
              await speakAndWait(q, "en", { elevenKey });

              const heard = await listen("en");
              if (heard.trim()) {
                saveHourlyResponse(mainResult.person.id, heard);
                
                // Update Log in Admin Panel (Site)
                addLog({
                  id: logId,
                  personId: mainResult.person.id,
                  name: mainResult.person.name,
                  confidence: mainResult.confidence,
                  timestamp: Date.now(),
                  expression: mainResult.expression,
                  transcript: heard
                });

                // ADMIN FEEDBACK: Send to Telegram
                sendTelegram(`<b>Feedback:</b> ${mainResult.person.name} dedi ki: "${heard}"`);

                const thanks = `Thank you, ${mainResult.person.name}. Have a great day!`;
                setSpokenText(`${greetText}\n\n${q}\n\n(${heard})\n\n${thanks}`);
                await speakAndWait(thanks, "en", { elevenKey });
              }
            }
          }
        } finally {
          clearTimeout(safetyTimer);
          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          scheduleDismiss(mightListen ? 4500 : 3500);
        }
      } catch (e) {
        console.error("Greeting error:", e);
        scheduleDismiss(0);
      } finally {
        setLoading(false);
      }
    }
  };

  const elevenKey =
    apiKey.trim() ||
    (typeof window !== "undefined" ? localStorage.getItem("visiongate:elevenlabs_key")?.trim() : undefined) ||
    import.meta.env.VITE_ELEVENLABS_KEY ||
    undefined;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <VideoPlayer playlist={playlist} paused={!!active} videoUnmuted={kioskPrefs.videoUnmuted} />

      {/* ── HUD Top Bar ── */}
      <header
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 md:p-6 transition-opacity duration-700 ${showHud ? "opacity-100" : "opacity-0"}`}
      >
        <div className="glass-strong pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-2 border border-black/10 bg-white shadow-lg">
          <div className="h-1.5 w-1.5 rounded-full bg-black animate-pulse shadow-sm" />
          <div>
            <div className="font-display text-sm font-black tracking-tighter uppercase leading-none text-black">
              VisionGate AI
            </div>
            <div className="font-mono text-[7px] uppercase tracking-[0.3em] text-black/40 mt-0.5">
              Terminal // Kiosk_Mode
            </div>
          </div>
        </div>
        
        <div className="pointer-events-auto">
          <div className="glass-strong rounded-xl px-4 py-2 border border-black/10 bg-white shadow-lg">
            <div
              className="font-mono text-xl font-bold leading-none tabular-nums text-black tracking-tighter"
              suppressHydrationWarning
            >
              {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--"}
            </div>
          </div>
        </div>
      </header>


      {/* ── Recognition Engine ── */}
      <RecognitionEngine
        voiceEnabled={voice}
        onRecognize={async (results, logId) => {
          if (active) return;

          const blacklisted = results.find((r) => r.person.isBlacklisted);
          if (blacklisted) {
            playAlarm();
            sendTelegram(`<b>⚠️ XAVF! QORA RO'YXATDAGI SHAXS!</b>\n<b>Ism:</b> ${blacklisted.person.name}`);
            setActive({
              results: [
                {
                  person: { ...blacklisted.person, name: "❌ TAQIQLANGAN", role: "XAVF — Eshik bloklandi" },
                  confidence: 1,
                  expression: "angry",
                },
              ] as any,
            });
            setSpokenText("DIQQAT! Tizimga kirish taqiqlangan!");
            setBirthdayHighlight(false);
            scheduleDismiss(8000);
            return;
          }

          await handleRecognize(results, logId);

          results.forEach((r) => {
            const isBirthdayToday = r.person.birthday?.slice(5, 10) === new Date().toISOString().slice(5, 10);
            sendTelegram(`<b>${r.person.role} keldi:</b> ${isBirthdayToday ? "🎂 " : ""}${r.person.name}`);
          });

        }}
        onUnknown={() => {
          console.log("[Kiosk] Unknown detected - Skipping.");
        }}
        onClear={() => {
          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = null;
          setActive(null);
          setSpokenText(null);
          setBirthdayHighlight(false);
          setActiveReminder(null);
        }}
      />

      <GreetingOverlay 
        results={active?.results || null} 
        spokenText={spokenText} 
        birthdayHighlight={birthdayHighlight} 
        language={birthdayHighlight ? "en" : undefined}
        reminder={activeReminder}
      />

      <AnimatePresence>
        {showMap && <OfficeMap3D onClose={() => setShowMap(false)} />}
      </AnimatePresence>


      {/* ── HUD Bottom Bar ── */}
      <footer
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 md:p-6 transition-opacity duration-700 ${showHud ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex gap-2">
          <Link
            to="/admin"
            className="glass-strong pointer-events-auto flex items-center gap-2 rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] transition hover:bg-black/5 hover:text-black border border-black/10 bg-white text-black shadow-lg"
          >
            <Settings className="h-3 w-3" /> Tizim
          </Link>
          <button
            onClick={() => setShowMap(true)}
            className="glass-strong pointer-events-auto flex items-center gap-2 rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] transition hover:bg-black/5 hover:text-black border border-black/10 bg-white text-black shadow-lg"
          >
            <MapIcon className="h-3 w-3" />
            <span className="font-bold">Hub</span>
          </button>
        </div>
        
        <div className="glass-strong pointer-events-auto rounded-lg px-4 py-2 font-mono text-[7px] uppercase tracking-[0.4em] text-black/40 border border-black/10 shadow-lg">
          Kiosk · Media · Supabase
        </div>
      </footer>
    </main>
  );
}
