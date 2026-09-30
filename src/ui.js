import { MENU_ITEMS } from './game.js';
import { MAX_TIER, formatTime, getRemaining, pointsFor, streakMultiplier, rankFor } from './rules.js';

function escapeHTML(text) {
    const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
    return String(text).replace(/[&<>"']/g, (char) => replacements[char]);
}

function key(label) {
    return `<kbd>${escapeHtml(label)}</kbd>`;
}

function pane(title, content, className= '') {
    return `
    <section class="pane ${className}">
     <h2 class="pane-title">${escapeHtml(title)}</h2>
     ${content}
    </section> `;
}

export function render(state) {
    const inGame = state.screen === 'playing' || state.screen === 'paused';

    document.getElementById('app').innerHTML = `
      ${inGame ? statusbar(state) : ''}
      <main class="screen">${SCREENS[state.screen](state)}</main>
      ${shortcutBar(state)}
      ${stateOpen ? helpScreen() : ''}
    `;

    if (state.screen === 'playing' && state.challenge.input === 'text' && !state.helpOpen) {
        document.getElementById('answer').focus();
    }
}

export function updateTimer(ms) {
    const timer = document.getElementById('timer');
    if (!timer) return;
    timer.textContent = formatTime(ms);
    timer.className = `timer ${timerClass(ms)}`;
}

let messageTimeout = null;
export function showMessage(text) {
    const line = document.getElementById('message');
    line.textContent = text;
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => { line.textContent = ''; }, 2000);
}

function timerClass(ms) {
    if (ms <= 60 * 1000) return 'danger';
    if (ms <= 3 * 60 * 1000) return 'warning';
    return '';
}

function statusBar(state) {
    const remaining = getRemaining(state.timer);
    const tierMeter = ''.repeat(state.tier) + ''.repeat(MAX_TIER - state.tier);
    return `
      <header class="status-bar">
        <span class="status-name">15mh</span>
        <span>tier <span class="meter">${tierMeter}</span></span>
        <span>streak ${state.streak} <span class="dim">${streakMultiplier(state.streak).toFixed(1)}</span></span>
        <span>${state.score} pts</span>
        <span id="timer" class="timer ${timerClass(remaining)}">${formatTime(remaining)}</span>
      </header>`;
}

const SHORTCUTS = {
    help: [['Esc', 'close']],
    menu: [['↑↓', 'move'], ['Enter', 'select'], ['?', 'help']],
    briefing: [['Enter', 'connect'], ['Esc', 'back'], ['?', 'help']],
    text: [['Enter', 'submit'], ['Tab', 'skip -20s'], ['Esc', 'pause']],
    choice: [['1-4', 'answer'], ['↑↓', 'move'], ['Enter', 'confirm'], ['Tab', 'skip -20s'], ['Esc', 'pause']],
    paused: [['Esc', 'resume'], ['Q', 'end run'], ['?', 'help']],
    results: [['Enter', 'play again'], ['Esc', 'menu']],
};
 
function shortcutBar(state){
    let shortcuts = SHORTCUTS[state.screen];
    if(state.screen === 'playing') shortcuts = SHORTCUTS[state.challenge.input];
    if (state.screen === 'playing') shortcuts = SHORTCUTS.help;

    const items = shortcuts.map(([keyLabel, action]) => `<span>${key(keyLabel)} ${action}</span>`).join('');
    return `<footer class="shortcuts" aria-label="Keyboard shortcuts">${items}</footer>`;
}