let startTime;
let intervalId;
let playerName = localStorage.getItem('playerName'); // Laden des Spielernamens

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
  intervalId = setInterval(updateTimer, 1000);
}

function updateTimer() {
  let currentTime = new Date(Date.now() - startTime);
  const minutes = Math.floor(currentTime / (1000 * 60)).toString().padStart(2, '0');
  const seconds = (Math.floor(currentTime / 1000) % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
  saveTimerData();
}

function resetTimer() {
  clearInterval(intervalId);
  startTime = Date.now();
  timerDisplay.textContent = "00:00";
  localStorage.removeItem('timerData');
}

function saveTimerData() {
  const timerData = {
    playerName: playerName,
    startTime: startTime,
    elapsedTime: Date.now() - startTime
  };
  localStorage.setItem('timerData', JSON.stringify(timerData));
}

function loadTimerData() {
  const timerData = JSON.parse(localStorage.getItem('timerData'));
  if (timerData && timerData.playerName === playerName) {
    startTime = Date.now() - timerData.elapsedTime;
    updateTimer(); // Aktualisiere den Timer basierend auf den geladenen Daten
  } else {
    resetTimer(); // Initialisiere den Timer, wenn keine Daten vorhanden sind
  }
}

function endGame() {
  clearInterval(intervalId);
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  saveEndTime(elapsedTime);
  displayBestTimes(); // Beste Zeiten anzeigen, wenn das Spiel endet
}

function saveEndTime(timeInSeconds) {
  let times = JSON.parse(localStorage.getItem('gameTimes')) || [];
  let existingPlayer = times.find(item => item.name === playerName);
  if (existingPlayer) {
    existingPlayer.time = timeInSeconds;
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

function addTime(secondsToAdd) {
  if (secondsToAdd < 0) {
    return;
  }
  startTime -= secondsToAdd * 1000; // Zeit abziehen, um die Zeit zu erhöhen
  updateTimer(); // Timer aktualisieren, um die neue Zeit anzuzeigen
}

function resetRanking() {
  localStorage.removeItem('gameTimes');
  console.log('Ranking has been reset.');
}

// Ereignislistener für das Laden und Verlassen der Seite
window.addEventListener('beforeunload', endGame);
window.addEventListener('load', startGame);
