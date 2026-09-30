import './style.css';
import { state, subscribe, tick, pauseGame } from './game.js';
import { render, updateTimer, showMessage } from './ui.js';
import { handleKey } from './keyboard.js';

subscribe(render);

window.addEventListener('keydown', handleKey);

for (const eventName of ['mousedown', 'contextmenu']) {
    document.addEventListener(eventName, (event) => {
        event.preventDefault();
        showMessage('E1: mouse input is disabled, use the keyboard');
    });
}