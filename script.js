let timer;
let timeLeft = 600; // 10 minutes in seconds
let isRunning = false;

const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// Function to update the timer display
function updateDisplay() {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  minutesDisplay.textContent = String(minutes).padStart(2, '0');
  secondsDisplay.textContent = String(seconds).padStart(2, '0');
}

// Function to randomly alter the timer
function randomTimeShift() {
  if (Math.random() < 0.3) { // 30% chance
    let shift = Math.floor(Math.random() * 600) - 300; // +/- up to 5 minutes
    timeLeft = Math.max(10, timeLeft + shift); // Ensure timer never goes below 10 sec
    console.log(`🌀 Time shifted by ${shift / 60} minutes`);
  }
}

// Function to start the timer
function startTimer() {
  if (!isRunning) {
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
        updateDisplay();
        if (Math.random() < 0.05) { // 5% chance per second
          randomTimeShift();
        }
      }
    }, 1000);
  }
}

// Function to stop the timer
function stopTimer() {
  clearInterval(timer);
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// Function to play a sound when the timer ends
function playSound() {
    let audio = new Audio("bell.mp3");
    audio.load();  // Ensure it's loaded before playing
    audio.play().catch(error => console.error("Audio play failed:", error)); // Catch errors
  }

// Event Listeners
startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);

// Initialize the display
updateDisplay();