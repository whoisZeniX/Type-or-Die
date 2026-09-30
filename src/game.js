import { createRng, nextChallenge, isCorrect } from './challenges.js';
import {
  GAME_LENGTH_MS, WRONG_PENALTY_MS, SKIP_PENALTY_MS,
  createTimer, getRemaining, pauseTimer, resumeTimer, addTime, pointsFor, tierFor,
} from './rules.js';

export const MENU_ITEMS = ['start mission', 'how to play'];
const LOG_LENGTH = 5;
const BEST_SCORE_KEY = '15mh-best-score';

export const state = {
  screen: 'menu',
  menuIndex: 0,
  helpOpen: false,
  bestScore: loadBestScore(),

  timer: null,
  challenge: null,
  choiceIndex: 0,
  log: [],        
  score: 0,
  streak: 0,
  bestStreak: 0,
  solved: 0,
  wrong: 0,
  skipped: 0,
  tier: 1,
  endReason: null,
  isNewBest: false,
};


const listeners = [];

export function subscribe(listener) {
  listeners.push(listener);
}

export function setState(changes) {
  Object.assign(state, changes);
  listeners.forEach((listener) => listener(state));
}

function loadBestScore() {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    
  }
}

export function moveMenu(delta) {
  const count = MENU_ITEMS.length;
  setState({ menuIndex: (state.menuIndex + delta + count) % count }); 
}

export function selectMenu(index) {
  if (index === 0) setState({ screen: 'briefing' });
  if (index === 1) toggleHelp();
}

export function goToMenu() {
  setState({ screen: 'menu', helpOpen: false });
}

export function toggleHelp() {
  setState({ helpOpen: !state.helpOpen });
}

let rng = createRng();

export function startGame() {
  rng = createRng();
  setState({
    screen: 'playing',
    helpOpen: false,
    timer: createTimer(GAME_LENGTH_MS),
    challenge: nextChallenge(1, rng),
    choiceIndex: 0,
    log: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    solved: 0,
    wrong: 0,
    skipped: 0,
    tier: 1,
    endReason: null,
    isNewBest: false,
  });
}

function addToLog(log, entry) {
  return [entry, ...log].slice(0, LOG_LENGTH);
}

export function submitAnswer(input) {
  if (input.trim() === '') return;
  const challenge = state.challenge;

  if (!isCorrect(challenge, input)) {
    setState({
      streak: 0,
      wrong: state.wrong + 1,
      timer: addTime(state.timer, -WRONG_PENALTY_MS),
      log: addToLog(state.log, {
        kind: 'fail',
        label: challenge.title,
        detail: `-15s, answer was ${challenge.answer}`,
        explanation: challenge.explanation,
      }),
      challenge: nextChallenge(state.tier, rng, challenge.type),
      choiceIndex: 0,
    });
    return;
  }

  const points = pointsFor(state.tier, state.streak);
  const solved = state.solved + 1;
  const streak = state.streak + 1;
  const tier = tierFor(solved);

  let log = addToLog(state.log, {
    kind: 'ok',
    label: challenge.title,
    detail: `+${points} pts`,
    explanation: challenge.explanation,
  });
  if (tier > state.tier) {
    log = addToLog(log, { kind: 'info', label: `tier ${tier} unlocked`, detail: '', explanation: 'harder challenges, more points' });
  }

  setState({
    score: state.score + points,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    solved,
    tier,
    log,
    challenge: nextChallenge(tier, rng, challenge.type),
    choiceIndex: 0,
  });
}

export function skipChallenge() {
  const challenge = state.challenge;
  setState({
    skipped: state.skipped + 1,
    timer: addTime(state.timer, -SKIP_PENALTY_MS),
    log: addToLog(state.log, {
      kind: 'skip',
      label: challenge.title,
      detail: `-20s, answer was ${challenge.answer}`,
      explanation: challenge.explanation,
    }),
    challenge: nextChallenge(state.tier, rng, challenge.type),
    choiceIndex: 0,
  });
}

export function moveChoice(delta) {
  const count = state.challenge.choices.length;
  setState({ choiceIndex: (state.choiceIndex + delta + count) % count });
}


export function pauseGame() {
  if (state.screen !== 'playing') return;
  setState({ screen: 'paused', timer: pauseTimer(state.timer) });
}

export function resumeGame() {
  setState({ screen: 'playing', helpOpen: false, timer: resumeTimer(state.timer) });
}

export function endGame(reason) {
  const isNewBest = state.score > state.bestScore;
  if (isNewBest) saveBestScore(state.score);
  setState({
    screen: 'results',
    helpOpen: false,
    endReason: reason,
    isNewBest,
    bestScore: Math.max(state.bestScore, state.score),
  });
}

export function tick() {
  if (state.screen !== 'playing') return null;
  const remaining = getRemaining(state.timer);
  if (remaining <= 0) {
    endGame('timeout');
    return null;
  }
  return remaining;
}
