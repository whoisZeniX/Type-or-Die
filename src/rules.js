export const GAME_LENGTH_MS = 15 * 60 * 1000;
export const WRONG_PENALTY_MS = 15 * 1000;
export const SKIP_PENALTY_MS = 20 * 1000;
export const MAX_TIER = 5;
export const SOLVES_PER_TIER = 4;

export function createTimer(durationMs, now = Date.now()) {
  return { endsAt: now + durationMs, pausedRemaining: null };
}

export function getRemaining(timer, now = Date.now()) {
  if (timer.pausedRemaining !== null) return timer.pausedRemaining;
  return Math.max(0, timer.endsAt - now);
}

export function pauseTimer(timer, now = Date.now()) {
  return { ...timer, pausedRemaining: getRemaining(timer, now) };
}

export function resumeTimer(timer, now = Date.now()) {
  return { endsAt: now + timer.pausedRemaining, pausedRemaining: null };
}

export function addTime(timer, deltaMs) {
  return { ...timer, endsAt: timer.endsAt + deltaMs };
}

export function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function streakMultiplier(streak) {
  return Math.min(1 + streak * 0.1, 2);
}

export function pointsFor(tier, streak) {
  return Math.round(100 * tier * streakMultiplier(streak));
}

const RANKS = [
  [10000, 'legendary hacker'],
  [6000, 'security engineer'],
  [3000, 'sysadmin'],
  [1000, 'junior analyst'],
  [0, 'intern'],
];

export function rankFor(score) {
  return RANKS.find(([minScore]) => score >= minScore)[1];
}

export function tierFor(solved) {
  return Math.min(MAX_TIER, 1 + Math.floor(solved / SOLVES_PER_TIER));
}
