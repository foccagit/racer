import { fetchRanking, submitToRanking } from './supabase.js';

const STORAGE_KEY = 'interlagos_ranking_cache';
const TOTAL_LAPS = 3;

export const raceState = {
  status: 'menu',     // 'menu' | 'racing' | 'finished'
  currentLap: 0,      // 1, 2, 3 durante corrida
  lapTimes: [],       // tempos finalizados em ms
};

export function startRace() {
  raceState.status = 'racing';
  raceState.currentLap = 1;
  raceState.lapTimes = [];
}

export function registerLapCompleted(lapTimeMs) {
  if (raceState.status !== 'racing') return 'menu';
  raceState.lapTimes.push(lapTimeMs);
  if (raceState.lapTimes.length >= TOTAL_LAPS) {
    raceState.status = 'finished';
    return 'finished';
  }
  raceState.currentLap++;
  return 'continue';
}

export function getTotalTime() {
  return raceState.lapTimes.reduce((sum, t) => sum + t, 0);
}

export function getBestLap() {
  if (raceState.lapTimes.length === 0) return 0;
  return Math.min(...raceState.lapTimes);
}

function getRankingFromCache() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

export async function getRanking() {
  const remote = await fetchRanking(10);
  if (remote.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
    return remote;
  }
  return getRankingFromCache();
}

export async function saveToRanking(name, totalTimeMs, lapTimes) {
  const result = await submitToRanking(name, totalTimeMs, lapTimes);

  if (result.success) {
    const newRanking = await fetchRanking(10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRanking));
    return result.position;
  }

  // Fallback: salva localmente se Supabase tiver fora
  const cached = getRankingFromCache();
  const cleanName = (name || 'PILOTO').substring(0, 12).toUpperCase();
  cached.push({
    name: cleanName,
    totalTime: totalTimeMs,
    bestLap: Math.min(...lapTimes),
    lapTimes: [...lapTimes],
    date: new Date().toISOString(),
    _local: true,
  });
  cached.sort((a, b) => a.totalTime - b.totalTime);
  const top10 = cached.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));

  const position = top10.findIndex(e =>
    e.name === cleanName && e.totalTime === totalTimeMs
  );
  return position >= 0 ? position + 1 : null;
}

export function formatTime(ms) {
  const totalSec = ms / 1000;
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  const cs  = Math.floor((totalSec % 1) * 100);
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}
