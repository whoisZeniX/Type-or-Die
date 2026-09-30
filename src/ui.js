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
