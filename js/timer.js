let startTime;
const timerDisplay = document.querySelector('.timer');

function startTimer() {
    startTime = Date.now();
    setInterval(updateTimer, 1000);
}

function updateTimer() {
    const currentTime = new Date(Date.now() - startTime);
    const minutes = Math.floor(currentTime / (1000 * 60)).toString().padStart(2, '0');
    const seconds = (Math.floor(currentTime / 1000) % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
}

window.addEventListener('load', startTimer);
