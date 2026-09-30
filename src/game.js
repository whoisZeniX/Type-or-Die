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

const listeners = []

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