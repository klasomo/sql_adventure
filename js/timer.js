let startTime;
let pausedTime = 0;
let isPaused = false;
let intervalId;
const timerDisplay = document.querySelector('.timer');

function startTimer() {
    startTime = Date.now();
    intervalId = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const currentTime = new Date(Date.now() - startTime + pausedTime);
    const minutes = Math.floor(currentTime / (1000 * 60)).toString().padStart(2, '0');
    const seconds = (Math.floor(currentTime / 1000) % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
}

function addTime(secondsToAdd) {
    console.log("addTime called");
    pausedTime += secondsToAdd * 1000;
}

function pauseTimer() {
    if (!isPaused) {
        isPaused = true;
        pausedTime += Date.now() - startTime;
        clearInterval(intervalId);
    }
}

function continueTimer() {
    if (isPaused) {
        isPaused = false;
        startTime = Date.now();
        intervalId = setInterval(updateTimer, 1000);
    }
}

window.addEventListener('load', startTimer);

