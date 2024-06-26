let startTime;
let totalPausedTime = 0;
let pauseStartTime;
let isPaused = false;
let intervalId;
let playerName = localStorage.getItem('playerName'); // Laden des Spielername

const timerDisplay = document.querySelector('.timer');

function startGame() {
  if (!playerName) {
    alert('Player name not found. Please enter your name first.');
    window.location.href = 'index.html'; // Weiterleitung zur Namenseingabe-Seite
    return;
  }
  loadTimerData();
  startTimer();
}

function startTimer() {
  startTime = Date.now();
  intervalId = setInterval(updateTimer, 1000);
}

function updateTimer() {
  let currentTime;
  if (isPaused) {
    currentTime = new Date(pauseStartTime - startTime - totalPausedTime);
  } else {
    currentTime = new Date(Date.now() - startTime - totalPausedTime);
  }
  const minutes = Math.floor(currentTime / (1000 * 60)).toString().padStart(2, '0');
  const seconds = (Math.floor(currentTime / 1000) % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
  saveTimerData();
}

function addTime(secondsToAdd) {
  if (secondsToAdd < 0) {
    return;
  }
  totalPausedTime += secondsToAdd * 1000;
  saveTimerData();
}

function pauseTimer() {
  if (!isPaused) {
    isPaused = true;
    pauseStartTime = Date.now();
    clearInterval(intervalId);
    saveTimerData();
  }
}

function continueTimer() {
  if (isPaused) {
    isPaused = false;
    totalPausedTime += Date.now() - pauseStartTime;
    startTime = Date.now() - (pauseStartTime - startTime);
    intervalId = setInterval(updateTimer, 1000);
    saveTimerData();
  }
}

function resetTimer() {
  clearInterval(intervalId);
  startTime = 0;
  totalPausedTime = 0;
  isPaused = false;
  timerDisplay.textContent = "00:00";
  localStorage.removeItem('timerData');
}

function saveTimerData() {
  const timerData = {
    startTime,
    totalPausedTime,
    isPaused,
    pauseStartTime
  };
  localStorage.setItem('timerData', JSON.stringify(timerData));
}

function loadTimerData() {
  const timerData = JSON.parse(localStorage.getItem('timerData'));
  if (timerData) {
    startTime = timerData.startTime || 0;
    totalPausedTime = timerData.totalPausedTime || 0;
    isPaused = timerData.isPaused || false;
    pauseStartTime = timerData.pauseStartTime || 0;
    updateTimer(); // Aktualisiere den Timer basierend auf den geladenen Daten
  }
}

function endGame() {
  clearInterval(intervalId);
  const elapsedTime = Math.floor((Date.now() - startTime - totalPausedTime) / 1000);
  saveEndTime(elapsedTime);
  displayBestTimes(); // Beste Zeiten anzeigen, wenn das Spiel endet
}

function saveEndTime(timeInSeconds) {
  let times = JSON.parse(localStorage.getItem('gameTimes')) || [];
  let existingPlayer = times.find(item => item.name === playerName);
  if (existingPlayer) {
    existingPlayer.time += timeInSeconds;
  } else {
    times.push({ name: playerName, time: timeInSeconds });
  }
  localStorage.setItem('gameTimes', JSON.stringify(times));
}

function displayBestTimes() {
  let times = JSON.parse(localStorage.getItem('gameTimes')) || [];
  times.sort((a, b) => a.time - b.time); // Sortiert die Zeiten aufsteigend

  console.log('Best Times:');
  times.forEach((playerData) => {
    const minutes = Math.floor(playerData.time / 60).toString().padStart(2, '0');
    const seconds = (playerData.time % 60).toString().padStart(2, '0');
    console.log(`${playerData.name}: ${minutes}:${seconds}`);
  });
}

function resetRanking() {
  localStorage.removeItem('gameTimes');
  console.log('Ranking has been reset.');
}

// Ereignislistener für das Laden und Verlassen der Seite
window.addEventListener('beforeunload', saveTimerData);
window.addEventListener('load', startGame);
