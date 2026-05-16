import type { Language } from "@/lib/face/types";

const LS = "visiongate:hourly_mem_v1";

export type HourlyMem = {
  lastAt: number;
  transcript: string;
};

function readAll(): Record<string, HourlyMem> {
  try {
    const raw = localStorage.getItem(LS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, HourlyMem>;
  } catch {
    return {};
  }
}

function writeAll(m: Record<string, HourlyMem>) {
  localStorage.setItem(LS, JSON.stringify(m));
}

export function getHourlyMem(personId: string): HourlyMem | null {
  return readAll()[personId] ?? null;
}

import { loadKioskPrefs } from "./kioskPrefs";

/** ≥ interval since last prompt */
export function shouldAskHourlyCheck(personId: string): boolean {
  const mem = getHourlyMem(personId);
  if (!mem) return true;
  const intervalMinutes = loadKioskPrefs().hourlyIntervalMinutes || 30;
  return Date.now() - mem.lastAt >= intervalMinutes * 60 * 1000;
}

export function saveHourlyResponse(personId: string, transcript: string) {
  const all = readAll();
  all[personId] = {
    lastAt: Date.now(),
    transcript: transcript.trim().slice(0, 280),
  };
  writeAll(all);
}

export function buildHourlyQuestion(name: string, lang: Language, priorNote: string | null): string {
  const shortPrior = priorNote?.length ? priorNote.trim().slice(0, 120) : "";
  const mins = loadKioskPrefs().hourlyIntervalMinutes || 30;

  if (lang === "en") {
    if (shortPrior) {
      return `${name}, some time ago you shared: "${shortPrior}". How are you feeling now, and what's on your agenda?`;
    }
    return `${name}, checking in every ${mins} minutes — how do you feel, and what's your main plan today?`;
  }

  if (lang === "ru") {
    if (shortPrior) {
      return `${name}, недавно вы говорили: «${shortPrior}». Как настроение и какие задачи на сегодня?`;
    }
    return `${name}, спрашиваю каждые ${mins} минут: как ваше состояние и план на сегодня?`;
  }

  if (shortPrior) {
    return `${name}, biroz oldin aytdingiz: "${shortPrior}". Endi kayfiyatingiz va bugungi rejangiz qanday?`;
  }
  return `${name}, har ${mins} minutda so‘rayman: ahvolingiz yaxshimi va bugungi asosiy rejangiz nima?`;
}
