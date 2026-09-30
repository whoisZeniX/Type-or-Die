import * as game from './game.js';

const { state } = game;

export function handleKey(event) {
    if (event.isComposing) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        return;
    }

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const handler = state.helpOpen ? helpKeys : HANDLERS[state.screen];
    if (handler(key)) event.preventDefault();
}

function helpKeys(key) {
    if (key === 'Escape' || key === '?' || key === 'Enter') game.toggleHelp();
    return true;
}

function menuKeys(key) {
    if (key === 'ArrowUp' || key === 'w') game.moveMenu(-1);
    else if (key === 'ArrowDown' || key === 's') game.moveMenu(1);
    else if (key === '1' || key === '2') game.selectMenu(Number(key) - 1);
    else if (key === 'Enter' || key === ' ') game.selectMenu(state.menuIndex);
    else if (key === '?') game.toggleHelp();
    else return false;
    return true;
}

function briefingKeys(key) {
    if (key === 'Enter' || key === ' ') game.startGame();
    else if (key === 'Escape') game.goToMenu();
    else if (key === '?') game.toggleHelp();
    else return false;
    return true;
}

function playingKeys(key) {
    if (key === 'Escape') {
        game.pauseGame();
        return true;
    }
    if (key === 'Tab') {
        game.skipChallenge();
        return true;
    }
    if (state.challenge.input === 'choice') return choiceKeys(key);

    // Text challenge: Enter submits, every other key types into the answer box.
    const answerBox = document.getElementById('answer');
    if (key === 'Enter') {
        game.submitAnswer(answerBox.value);
        return true;
    }
    if (document.activeElement !== answerBox) answerBox.focus(); // safety net if focus was lost
    return false;
}

function choiceKeys(key) {
    const choices = state.challenge.choices;
    const number = Number(key);
    if (number >= 1 && number <= choices.length) game.submitAnswer(choices[number - 1]);
    else if (key === 'ArrowUp' || key === 'w') game.moveChoice(-1);
    else if (key === 'ArrowDown' || key === 's') game.moveChoice(1);
    else if (key === 'Enter' || key === ' ') game.submitAnswer(choices[state.choiceIndex]);
    else return false;
    return true;
}

function pausedKeys(key) {
    if (key === 'Escape' || key === 'Enter' || key === ' ') game.resumeGame();
    else if (key === 'q') game.endGame('quit');
    else if (key === '?') game.toggleHelp();
    else return false;
    return true;
}