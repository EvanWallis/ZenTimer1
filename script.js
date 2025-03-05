let timer;
let isRunning = false;
let globalAudio; // We'll store our audio object here

const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const timeInput = document.getElementById("timeInput");

// Function to update the timer display
function updateDisplay(timeLeft) {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  minutesDisplay.textContent = String(minutes).padStart(2, '0');
  secondsDisplay.textContent = String(seconds).padStart(2, '0');
}

// Random time shift
function randomTimeShift(timeLeft) {
  if (Math.random() < 0.3) { // 30% chance
    let shift = Math.floor(Math.random() * 600) - 300; // +/- up to 5 min
    timeLeft = Math.max(10, timeLeft + shift);
    console.log(`Time shifted by ${shift / 60} min`);
  }
  return timeLeft;
}

// Start the timer
function startTimer() {
  if (!isRunning) {
    // 1) Create & "unlock" the audio
    if (!globalAudio) {
      globalAudio = new Audio("bell.mp3");
      globalAudio.load();
      // Do a quick play/pause to unlock
      globalAudio.play().then(() => {
        globalAudio.pause();
        globalAudio.currentTime = 0;
      }).catch(err => console.log("Audio unlock failed:", err));
    }

    // 2) Set the timer
    let timeLeft = parseInt(timeInput.value) * 60;
    updateDisplay(timeLeft);

    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;

    timer = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timer);
        isRunning = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        playSound();
      } else {
        timeLeft--;
        updateDisplay(timeLeft);
        if (Math.random() < 0.05) {
          timeLeft = randomTimeShift(timeLeft);
        }
      }
    }, 1000);
  }
}

// Stop the timer
function stopTimer() {
  clearInterval(timer);
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// Actually play the sound
function playSound() {
  if (globalAudio) {
    globalAudio.currentTime = 0; // Reset to start
    globalAudio.play().catch(e => console.log("Play error:", e));
  } else {
    console.log("No audio object found");
  }
}

// Event Listeners
startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);