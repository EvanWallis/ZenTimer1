// DOM Elements
const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const timeInput = document.getElementById("timeInput");

// Timer State
let timer;
let isRunning = false;
let globalAudio = null;
let wakeLock = null;

// ----------------- Audio Handling -----------------
function initializeAudio() {
  if (!globalAudio) {
    globalAudio = new Audio("bell.mp3");
    globalAudio.load(); // Preload the audio
  }
}

function setupAudioContext() {
  // Create AudioContext for iOS wakeup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const audioContext = new AudioContext();
    // Resume context during user interaction
    document.addEventListener('touchstart', () => {
      if (audioContext.state !== 'running') {
        audioContext.resume();
      }
    }, { once: true });
  }
}

async function unlockAudio() {
  initializeAudio();
  // Play/pause during user gesture to unlock audio
  try {
    await globalAudio.play();
    globalAudio.pause();
    globalAudio.currentTime = 0;
    return Promise.resolve();
  } catch (err) {
    console.error("Audio unlock failed:", err);
    return Promise.reject(err);
  }
}

// ----------------- Wake Lock -----------------
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake lock activated');
    } catch (err) {
      console.error(`Wake Lock error: ${err.name}, ${err.message}`);
    }
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().then(() => {
      wakeLock = null;
      console.log('Wake lock released');
    });
  }
}

// ----------------- Timer Functions -----------------
function updateDisplay(timeLeft) {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');
  minutesDisplay.textContent = minutes;
  secondsDisplay.textContent = seconds;
}

function randomTimeShift(timeLeft) {
  // 30% chance of time shift
  if (Math.random() < 0.3) {
    const shift = Math.floor(Math.random() * 601) - 300; // Between -300 and +300 seconds
    return Math.max(10, timeLeft + shift); // Ensure at least 10 seconds remain
  }
  return timeLeft;
}

async function startTimer() {
  if (isRunning) return;
  
  try {
    // Unlock audio during user gesture
    await unlockAudio();
    await requestWakeLock();
  } catch (err) {
    alert("Error initializing timer. Please try again.");
    console.error("Timer initialization error:", err);
    return;
  }
  
  let timeLeft = parseInt(timeInput.value, 10) * 60;
  if (isNaN(timeLeft) || timeLeft <= 0) {
    timeLeft = 5 * 60; // Default to 5 minutes if invalid input
  }
  
  updateDisplay(timeLeft);
  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  
  timer = setInterval(() => {
    timeLeft--;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      playSound();
      releaseWakeLock();
    } else {
      // 5% chance of random time shift each second
      if (Math.random() < 0.05) {
        timeLeft = randomTimeShift(timeLeft);
      }
      updateDisplay(timeLeft);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  releaseWakeLock();
}

function playSound() {
  if (!globalAudio) {
    console.error("Audio not initialized");
    initializeAudio(); // Try to initialize if missing
  }
  
  // Reset and play
  globalAudio.currentTime = 0;
  
  // Create a promise to track successful playback
  const playPromise = globalAudio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.error("Play failed:", err);
      
      // Multiple fallback strategies
      
      // 1. Vibration API if available
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 200, 300, 200, 300]);
      }
      
      // 2. Visual notification
      document.body.classList.add('timer-ended');
      setTimeout(() => document.body.classList.remove('timer-ended'), 3000);
      
      // 3. Touch event listener for iOS
      document.body.addEventListener('touchstart', function retryPlay() {
        globalAudio.play().finally(() => {
          document.body.removeEventListener('touchstart', retryPlay);
        });
      }, { once: true });
      
      // 4. Loop attempts for a minute
      let attempts = 0;
      const maxAttempts = 30;
      const retryInterval = setInterval(() => {
        if (attempts >= maxAttempts) {
          clearInterval(retryInterval);
          return;
        }
        
        attempts++;
        globalAudio.play().then(() => {
          clearInterval(retryInterval);
        }).catch(e => {
          console.warn(`Retry attempt ${attempts} failed:`, e);
        });
      }, 2000);
    });
  }
}

// ----------------- Visibility Change Handler -----------------
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isRunning) {
    // Re-unlock audio when app becomes visible again
    unlockAudio().catch(e => console.warn("Visibility audio unlock failed:", e));
    
    // Re-request wake lock if needed
    if (!wakeLock && isRunning) {
      requestWakeLock();
    }
  }
});

// ----------------- Initialization -----------------
document.addEventListener('DOMContentLoaded', () => {
  // Initialize audio
  initializeAudio();
  setupAudioContext();
  
  // Set up event listeners
  startBtn.addEventListener("click", startTimer);
  stopBtn.addEventListener("click", stopTimer);
  
  // iOS input focus helper
  timeInput.addEventListener("touchstart", function() {
    this.focus();
  });
  
  // Add a touch anywhere to unlock audio
  document.body.addEventListener('touchstart', () => {
    unlockAudio().catch(e => console.warn("Initial audio unlock failed:", e));
  }, { once: true });
  
  // Initial UI state
  stopBtn.disabled = true;
  updateDisplay(0);
  
  // Add CSS for visual notification
  const style = document.createElement('style');
  style.textContent = `
    .timer-ended {
      animation: flash 0.5s ease-in-out infinite alternate;
    }
    @keyframes flash {
      from { background-color: transparent; }
      to { background-color: rgba(255, 0, 0, 0.3); }
    }
  `;
  document.head.appendChild(style);
});