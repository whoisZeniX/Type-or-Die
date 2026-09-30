import { MENU_ITEMS } from './game.js';
import { MAX_TIER, formatTime, getRemaining, pointsFor, streakMultiplier, rankFor } from './rules.js';


function escapeHtml(text) {
  const replacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, (char) => replacements[char]);
}

function key(label) {
  return `<kbd>${escapeHtml(label)}</kbd>`;
}

function pane(title, content, className = '') {
  return `
    <section class="pane ${className}">
      <h2 class="pane-title">${escapeHtml(title)}</h2>
      ${content}
    </section>`;
}


export function render(state) {
  const inGame = state.screen === 'playing' || state.screen === 'paused';

  document.getElementById('app').innerHTML = `
    ${inGame ? statusBar(state) : ''}
    <main class="screen">${SCREENS[state.screen](state)}</main>
    ${shortcutBar(state)}
    ${state.helpOpen ? helpScreen() : ''}
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
  const tierMeter = '■'.repeat(state.tier) + '□'.repeat(MAX_TIER - state.tier);
  return `
    <header class="status-bar">
      <span class="status-name">15mh</span>
      <span>tier <span class="meter">${tierMeter}</span></span>
      <span>streak ${state.streak} <span class="dim">×${streakMultiplier(state.streak).toFixed(1)}</span></span>
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

function shortcutBar(state) {
  let shortcuts = SHORTCUTS[state.screen];
  if (state.screen === 'playing') shortcuts = SHORTCUTS[state.challenge.input];
  if (state.helpOpen) shortcuts = SHORTCUTS.help;

  const items = shortcuts.map(([keyLabel, action]) => `<span>${key(keyLabel)} ${action}</span>`).join('');
  return `<footer class="shortcuts" aria-label="Keyboard shortcuts">${items}</footer>`;
}


function menuScreen(state) {
  const items = MENU_ITEMS.map((label, i) => {
    const selected = i === state.menuIndex;
    return `<li class="${selected ? 'selected' : ''}">${selected ? '>' : ' '} ${label} <span class="dim">[${i + 1}]</span></li>`;
  }).join('');

  return `
    <div class="menu">
      <h1 class="title">the 15-minute hacker<span class="cursor"></span></h1>
      <p class="dim">a keyboard-only survival run through binary, hex,<br>ciphers, number patterns and logic gates.</p>
      <ul class="menu-list">${items}</ul>
      <p class="dim">best score: ${state.bestScore} pts</p>
    </div>`;
}

function briefingScreen() {
  return pane('mission briefing', `
    <dl class="manual">
      <dt>OBJECTIVE</dt>
      <dd>You have 15:00. Crack as many nodes as you can before the connection drops.</dd>
      <dt>RULES</dt>
      <dd>
        <ul>
          <li>every 4 correct answers you reach the next tier: harder, but worth more</li>
          <li>answers in a row build a streak multiplier, up to ×2</li>
          <li>a wrong answer costs 15 seconds and resets your streak</li>
          <li>stuck? ${key('Tab')} skips for 20 seconds</li>
          <li>there is no mouse. the bar at the bottom always shows your keys</li>
        </ul>
      </dd>
    </dl>
    <p>Press ${key('Enter')} to connect.</p>
  `);
}

function playingScreen(state) {
  const challenge = state.challenge;
  const node = String(state.solved + state.wrong + state.skipped + 1).padStart(2, '0');
  const title = `node ${node} · ${challenge.title} · +${pointsFor(state.tier, state.streak)} pts`;

  const body = `
    <p>${escapeHtml(challenge.prompt)}</p>
    <p class="data">${escapeHtml(challenge.data)}</p>
    ${challenge.input === 'text' ? answerBox(challenge) : choiceList(challenge, state.choiceIndex)}
  `;
  return pane(title, body) + pane('log', logList(state.log));
}

function answerBox(challenge) {
  return `
    <label class="answer">
      <span class="dim">$</span>
      <input id="answer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer" />
    </label>
    <p class="hint dim">${escapeHtml(challenge.hint)}</p>`;
}

function choiceList(challenge, choiceIndex) {
  const items = challenge.choices
    .map((choice, i) => `<li class="${i === choiceIndex ? 'selected' : ''}">[${i + 1}] ${escapeHtml(choice)}</li>`)
    .join('');
  return `<ol class="choices">${items}</ol>`;
}

const LOG_TAGS = { ok: ' OK ', fail: 'FAIL', skip: 'SKIP', info: 'INFO' };

function logList(log) {
  if (log.length === 0) return '<p class="dim">no answers yet.</p>';

  const entries = log.map((entry, i) => `
    <li class="log-${entry.kind} ${i > 0 ? 'old' : ''}">
      <span class="tag">[${LOG_TAGS[entry.kind]}]</span> ${escapeHtml(entry.label)}
      <span class="dim">${escapeHtml(entry.detail)}</span>
      ${i === 0 ? `<div class="explanation">${escapeHtml(entry.explanation)}</div>` : ''}
    </li>`).join('');
  return `<ol class="log" role="status">${entries}</ol>`;
}

function pausedScreen() {
  return pane('paused', `
    <p class="mode">-- PAUSED --</p>
    <p class="dim">the clock is frozen.</p>
  `);
}

function resultsScreen(state) {
  const attempts = state.solved + state.wrong;
  const accuracy = attempts === 0 ? 0 : Math.round((state.solved / attempts) * 100);
  const heading = state.endReason === 'timeout' ? "time's up. connection terminated." : 'you disconnected.';

  const rows = [
    ['score', `${state.score} pts`],
    ['rank', rankFor(state.score)],
    ['best', state.isNewBest ? `${state.bestScore} pts  << new best` : `${state.bestScore} pts`],
    ['cracked', state.solved],
    ['wrong', state.wrong],
    ['skipped', state.skipped],
    ['accuracy', `${accuracy}%`],
    ['best streak', state.bestStreak],
    ['tier reached', `${state.tier}/${MAX_TIER}`],
  ];

  const report = rows.map(([label, value]) => `${label.padEnd(14, '.')} ${value}`).join('\n');

  return pane('session report', `
    <p class="report-heading">${heading}</p>
    <pre class="report">${escapeHtml(report)}</pre>
  `);
}

function helpScreen() {
  return `
    <div class="overlay" role="dialog" aria-modal="true" aria-label="Help">
      ${pane('man 15mh', `
        <dl class="manual">
          <dt>NAME</dt>
          <dd>15mh: survive 15 minutes of computer challenges</dd>
          <dt>MENUS</dt>
          <dd>${key('↑')} ${key('↓')} or ${key('W')} ${key('S')} move, ${key('Enter')} select, ${key('1')} ${key('2')} jump</dd>
          <dt>CHALLENGES</dt>
          <dd>type, then ${key('Enter')} to submit. ${key('1')} to ${key('4')} picks a choice.<br>
              ${key('Tab')} skips (-20s), ${key('Esc')} pauses</dd>
          <dt>PAUSED</dt>
          <dd>${key('Esc')} resume, ${key('Q')} end the run</dd>
          <dt>SCORING</dt>
          <dd>100 × tier × streak multiplier (max ×2).<br>wrong answer -15s, skip -20s. every 4 solves = next tier.</dd>
        </dl>
      `)}
    </div>`;
}

const SCREENS = {
  menu: menuScreen,
  briefing: briefingScreen,
  playing: playingScreen,
  paused: pausedScreen,
  results: resultsScreen,
};
