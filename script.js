// Application State
const state = {
    isRunning: false,
    isPaused: false,
    currentMode: 'work',
    timeLeft: 25 * 60, // in seconds
    sessionStartTime: null,
    sessionPausedTime: 0,
    totalSessionTime: 0,

    // Settings
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    dailyGoalMinutes: 120,
    soundEnabled: true,
    autoStartBreak: true,
    focusMode: false,

    // Statistics
    stats: {
        sessionsCompleted: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        longestSession: 0,
        sessionHistory: [],
        lastReset: new Date().toDateString()
    },
    
    // Tasks
    tasks: []
};

// DOM Elements
const digitalClock = document.getElementById('digitalClock');
const dateDisplay = document.getElementById('dateDisplay');
const greeting = document.getElementById('greeting');
const timerMinutes = document.getElementById('timerMinutes');
const timerSeconds = document.getElementById('timerSeconds');
const progressRing = document.getElementById('progressRing');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const themeSelect = document.getElementById('themeSelect');
const settingsBtn = document.getElementById('settingsBtn');
const statsBtn = document.getElementById('statsBtn');
const statsPanel = document.getElementById('statsPanel');
const settingsPanel = document.getElementById('settingsPanel');
const toast = document.getElementById('toast');
const modal_close = document.querySelectorAll('.close-btn');
const todayFocus = document.getElementById('todayFocus');
const sessionCount = document.getElementById('sessionCount');
const dailyGoalEl = document.getElementById('dailyGoal');
const focusModeToggle = document.getElementById('focusModeToggle');
const focusModeIndicator = document.getElementById('focusModeIndicator');
const panelOverlay = document.getElementById('panelOverlay');

// Clock hands
const hourHand = document.getElementById('hourHand');
const minuteHand = document.getElementById('minuteHand');
const secondHand = document.getElementById('secondHand');

// Timer mode buttons
const modeBtns = document.querySelectorAll('.mode-btn');

// Settings inputs
const focusDurationInput = document.getElementById('focusDuration');
const breakDurationInput = document.getElementById('breakDuration');
const longBreakDurationInput = document.getElementById('longBreakDuration');
const dailyGoalMinutesInput = document.getElementById('dailyGoalMinutes');
const soundToggle = document.getElementById('soundToggle');
const autoToggle = document.getElementById('autoToggle');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const resetStatsBtn = document.getElementById('resetStatsBtn');

// Load saved state
loadState();
updateTimerDisplay();
updateStats();

// ===================
// INITIALIZATION
// ===================

function init() {
    // Clock updates
    updateDigitalClock();
    updateAnalogClock();
    setInterval(updateDigitalClock, 1000);
    setInterval(updateAnalogClock, 50);

    // Fix SVG size on analog clock
    fixAnalogClockSize();



    // Event listeners
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    skipBtn.addEventListener('click', skipSession);
    themeSelect.addEventListener('change', (e) => setTheme(e.target.value));
    settingsBtn.addEventListener('click', () => openPanel('settings'));
    statsBtn.addEventListener('click', () => openPanel('stats'));

    modeBtns.forEach(btn => {
        btn.addEventListener('click', changeMode);
    });

    // Panel close buttons
    modal_close.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const panel = e.target.closest('.stats-panel, .settings-panel');
            if (panel) closePanel(panel);
        });
    });

    // Close panel when clicking overlay
    panelOverlay.addEventListener('click', () => {
        if (statsPanel.classList.contains('open')) closePanel(statsPanel);
        if (settingsPanel.classList.contains('open')) closePanel(settingsPanel);
    });

    // Close panel with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (statsPanel.classList.contains('open')) closePanel(statsPanel);
            if (settingsPanel.classList.contains('open')) closePanel(settingsPanel);
        }
    });

    // Settings
    saveSettingsBtn.addEventListener('click', saveSettings);
    resetSettingsBtn.addEventListener('click', resetToDefaultSettings);
    resetStatsBtn.addEventListener('click', confirmResetStats);
    focusModeToggle.addEventListener('change', () => {
        state.focusMode = focusModeToggle.checked;
        applyFocusMode();
        saveState();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'dracula';
    setTheme(savedTheme);

    // Restore settings UI
    updateSettingsUI();
}

// ===================
// CLOCK FUNCTIONS
// ===================

function updateDigitalClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    digitalClock.textContent = `${hours}:${minutes}:${seconds}`;
    updateDate();
    updateGreeting();
}

function updateAnalogClock() {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    const secondDegrees = (seconds / 60) * 360;
    const minuteDegrees = (minutes / 60) * 360;
    const hourDegrees = (hours / 12) * 360;

    secondHand.setAttribute('transform', `rotate(${secondDegrees} 100 100)`);
    minuteHand.setAttribute('transform', `rotate(${minuteDegrees} 100 100)`);
    hourHand.setAttribute('transform', `rotate(${hourDegrees} 100 100)`);
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-US', options);
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greetingText = '';

    if (hour < 12) greetingText = 'Good Morning';
    else if (hour < 17) greetingText = 'Good Afternoon';
    else if (hour < 21) greetingText = 'Good Evening';
    else greetingText = 'Good Night';

    greeting.textContent = greetingText;
}

// Fix analog clock SVG sizing
function fixAnalogClockSize() {
    const svg = document.querySelector('.analog-clock');
    if (svg) {
        svg.setAttribute('viewBox', '0 0 200 200');
    }
}

// ===================
// TIMER FUNCTIONS
// ===================

function startTimer() {
    if (state.isRunning) return;

    // Request Notification permission on explicit user interaction
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    state.isRunning = true;
    state.isPaused = false;
    state.sessionStartTime = Date.now() - (state.sessionPausedTime * 1000);

    startBtn.style.display = 'none';
    pauseBtn.style.display = 'flex';

    const timerInterval = setInterval(() => {
        if (!state.isRunning) {
            clearInterval(timerInterval);
            return;
        }

        const elapsed = Math.floor((Date.now() - state.sessionStartTime) / 1000);
        const initialDuration = state.currentMode === 'work'
            ? state.focusDuration * 60
            : state.currentMode === 'break'
            ? state.breakDuration * 60
            : state.longBreakDuration * 60;

        state.timeLeft = Math.max(0, initialDuration - elapsed);
        updateTimerDisplay();

        if (state.timeLeft === 0) {
            completeSession();
            clearInterval(timerInterval);
        }
    }, 100);
}

function pauseTimer() {
    state.isRunning = false;
    state.isPaused = true;
    state.sessionPausedTime += Math.floor((Date.now() - state.sessionStartTime) / 1000);

    pauseBtn.style.display = 'none';
    startBtn.style.display = 'flex';
}

function resetTimer() {
    state.isRunning = false;
    state.isPaused = false;
    state.sessionPausedTime = 0;
    state.timeLeft = state.currentMode === 'work'
        ? state.focusDuration * 60
        : state.currentMode === 'break'
        ? state.breakDuration * 60
        : state.longBreakDuration * 60;

    pauseBtn.style.display = 'none';
    startBtn.style.display = 'flex';
    updateTimerDisplay();
    showToast('Timer reset');
}

function skipSession() {
    state.isRunning = false;
    state.isPaused = false;
    state.sessionPausedTime = 0;
    state.timeLeft = 0;
    completeSession();
    showToast('Session skipped');
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    
    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(seconds).padStart(2, '0');

    timerMinutes.textContent = minStr;
    timerSeconds.textContent = secStr;
    
    // Dynamic Page Title
    if (state.isRunning) {
        const modeName = state.currentMode === 'work' ? 'FocusFlow' : 'Break';
        document.title = `${minStr}:${secStr} - ${modeName}`;
    } else {
        document.title = 'FocusFlow - Study Clock & Focus Timer';
    }

    // Update progress ring
    const initialDuration = state.currentMode === 'work'
        ? state.focusDuration * 60
        : state.currentMode === 'break'
        ? state.breakDuration * 60
        : state.longBreakDuration * 60;

    const progress = 1 - (state.timeLeft / initialDuration);
    const circumference = 565.48;
    const strokeDashoffset = circumference * (1 - progress);
    progressRing.style.strokeDashoffset = strokeDashoffset;
}

function completeSession() {
    const sessionTime = state.currentMode === 'work'
        ? state.focusDuration
        : state.currentMode === 'break'
        ? state.breakDuration
        : state.longBreakDuration;

    if (state.currentMode === 'work') {
        state.stats.totalFocusTime += sessionTime;
        state.stats.longestSession = Math.max(state.stats.longestSession, sessionTime);
        playNotificationSound();
        showToast('🎉 Focus session completed! Time for a break.');
        sendBrowserNotification('Focus session completed!', 'Time for a break. Great job!');
    } else {
        state.stats.totalBreakTime += sessionTime;
        playNotificationSound();
        showToast('☕ Break time over! Ready to focus?');
        sendBrowserNotification('Break time over!', 'Ready to get back into focus?');
    }

    state.stats.sessionsCompleted++;
    state.stats.sessionHistory.push({
        type: state.currentMode,
        duration: sessionTime,
        date: new Date().toISOString()
    });

    // Auto-cycle to next session
    if (state.autoStartBreak) {
        if (state.currentMode === 'work') {
            // Every 4th work session triggers a long break
            const workSessions = state.stats.sessionHistory.filter(s => s.type === 'work' && new Date(s.date).toDateString() === new Date().toDateString()).length;
            if (workSessions % 4 === 0) {
                changeMode({ target: { dataset: { mode: 'long-break' } } });
            } else {
                changeMode({ target: { dataset: { mode: 'break' } } });
            }
            startTimer();
        } else {
            // Coming back from a break: check if daily goal is reached
            if (state.stats.totalFocusTime < state.dailyGoalMinutes) {
                changeMode({ target: { dataset: { mode: 'work' } } });
                startTimer();
            } else {
                showToast('🎉 Daily Goal Reached! Auto-cycle stopped.');
                sendBrowserNotification('Daily Goal Reached!', 'You have completed your focus goal for the day!');
                resetTimer();
            }
        }
    } else {
        resetTimer();
    }

    updateStats();
    saveState();
}

function changeMode(e) {
    const mode = e.target.dataset.mode || e.target.closest('.mode-btn').dataset.mode;
    state.currentMode = mode;

    modeBtns.forEach(btn => {
        btn.classList.remove('active', 'break-mode', 'long-break-mode');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
            if (mode === 'break') btn.classList.add('break-mode');
            if (mode === 'long-break') btn.classList.add('long-break-mode');
        }
    });

    // Update timer label
    const labels = { work: 'Focus Time', break: 'Short Break', 'long-break': 'Long Break' };
    document.getElementById('timerModeLabel').textContent = labels[mode];

    // Update timer
    const newTime = mode === 'work'
        ? state.focusDuration * 60
        : mode === 'break'
        ? state.breakDuration * 60
        : state.longBreakDuration * 60;

    state.timeLeft = newTime;
    state.sessionPausedTime = 0;
    state.isRunning = false;
    state.isPaused = false;
    pauseBtn.style.display = 'none';
    startBtn.style.display = 'flex';
    updateTimerDisplay();
}

// ===================
// STATISTICS FUNCTIONS
// ===================

function updateStats() {
    // Today's focus time
    const todayFocusSeconds = state.stats.totalFocusTime * 60;
    const focusHours = Math.floor(todayFocusSeconds / 3600);
    const focusMinutes = Math.floor((todayFocusSeconds % 3600) / 60);
    todayFocus.textContent = `${focusHours}h ${focusMinutes}m`;

    // Session count
    sessionCount.textContent = state.stats.sessionsCompleted;

    // Daily goal
    const goalHours = Math.floor(state.dailyGoalMinutes / 60);
    const goalMinutes = state.dailyGoalMinutes % 60;
    dailyGoalEl.textContent = `${goalHours}h ${goalMinutes}m`;

    // Update stats panel if open
    if (statsPanel.classList.contains('open')) {
        updateStatsPanelContent();
    }
}

function updateStatsPanelContent() {
    document.getElementById('totalSessions').textContent = state.stats.sessionsCompleted;

    const focusHours = Math.floor(state.stats.totalFocusTime / 60);
    const focusMinutes = state.stats.totalFocusTime % 60;
    document.getElementById('totalFocusTime').textContent = `${focusHours}h ${focusMinutes}m`;

    const breakHours = Math.floor(state.stats.totalBreakTime / 60);
    const breakMinutes = state.stats.totalBreakTime % 60;
    document.getElementById('totalBreakTime').textContent = `${breakHours}h ${breakMinutes}m`;

    document.getElementById('longestSession').textContent = `${state.stats.longestSession}m`;

    // Goal progress
    const goalProgress = Math.min(100, (state.stats.totalFocusTime / state.dailyGoalMinutes) * 100);
    document.getElementById('goalProgress').style.width = `${goalProgress}%`;
    document.getElementById('goalProgressText').textContent = `${Math.round(goalProgress)}%`;

    // Week chart
    updateWeekChart();
}

function updateWeekChart() {
    const weekChart = document.getElementById('weekChart');
    weekChart.innerHTML = '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekStats = Array(7).fill(0);

    state.stats.sessionHistory.forEach(session => {
        const sessionDate = new Date(session.date);
        const dayOfWeek = sessionDate.getDay();
        const isThisWeek = (today - sessionDate) < 7 * 24 * 60 * 60 * 1000;

        if (isThisWeek && session.type === 'work') {
            weekStats[dayOfWeek] += session.duration;
        }
    });

    const maxMinutes = Math.max(...weekStats, state.focusDuration);

    days.forEach((day, index) => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.title = `${day}: ${weekStats[index]}m`;

        const fill = document.createElement('div');
        fill.className = 'chart-bar-fill';
        fill.style.width = `${(weekStats[index] / maxMinutes) * 100}%`;

        bar.appendChild(fill);
        weekChart.appendChild(bar);
    });
}

// ===================
// SETTINGS FUNCTIONS
// ===================

function saveSettings() {
    state.focusDuration = parseInt(focusDurationInput.value) || 25;
    state.breakDuration = parseInt(breakDurationInput.value) || 5;
    state.longBreakDuration = parseInt(longBreakDurationInput.value) || 15;
    state.dailyGoalMinutes = parseInt(dailyGoalMinutesInput.value) || 120;
    state.soundEnabled = soundToggle.checked;
    state.autoStartBreak = autoToggle.checked;

    saveState();
    updateStats();
    resetTimer();
    closePanel(document.getElementById('settingsPanel'));
    showToast('✅ Settings saved successfully!');
}

function updateSettingsUI() {
    focusDurationInput.value = state.focusDuration;
    breakDurationInput.value = state.breakDuration;
    longBreakDurationInput.value = state.longBreakDuration;
    dailyGoalMinutesInput.value = state.dailyGoalMinutes;
    soundToggle.checked = state.soundEnabled;
    autoToggle.checked = state.autoStartBreak;
    focusModeToggle.checked = state.focusMode;
}

function resetToDefaultSettings() {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
        state.focusDuration = 25;
        state.breakDuration = 5;
        state.longBreakDuration = 15;
        state.dailyGoalMinutes = 120;
        state.soundEnabled = true;
        state.autoStartBreak = true;
        state.focusMode = false;
        
        updateSettingsUI();
        saveState();
        resetTimer();
        showToast('⚙️ Settings reset to default!');
    }
}

function confirmResetStats() {
    if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
        state.stats = {
            sessionsCompleted: 0,
            totalFocusTime: 0,
            totalBreakTime: 0,
            longestSession: 0,
            sessionHistory: [],
            lastReset: new Date().toDateString()
        };
        saveState();
        updateStats();
        showToast('🔄 Statistics reset successfully!');
    }
}

function applyFocusMode() {
    if (state.focusMode) {
        focusModeIndicator.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            focusModeIndicator.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 2000);
    }
}

// ===================
// THEME FUNCTIONS
// ===================

function setTheme(themeName) {
    document.body.dataset.theme = themeName;
    localStorage.setItem('theme', themeName);
    
    if (themeSelect) {
        themeSelect.value = themeName;
    }
}

// ===================
// PANEL FUNCTIONS
// ===================

function openPanel(type) {
    const panel = type === 'stats' ? statsPanel : settingsPanel;
    panel.classList.add('open');
    panelOverlay.classList.add('active');

    if (type === 'stats') {
        updateStatsPanelContent();
    }
}

function closePanel(panel) {
    panel.classList.remove('open');
    panelOverlay.classList.remove('active');
}

// ===================
// UTILITY FUNCTIONS
// ===================

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function sendBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/clock-check.svg',
            requireInteraction: true,
            vibrate: [200, 100, 200]
        });
    }
}

function playNotificationSound() {
    if (!state.soundEnabled) return;

    const audio = new Audio('/alaram.mp3');
    audio.play().catch(e => console.error('Audio playback failed:', e));
}

function handleKeyboard(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        if (state.isRunning) pauseTimer();
        else startTimer();
    }
    if (e.code === 'KeyR') resetTimer();
    if (e.code === 'KeyS') skipSession();
}

// ===================
// STORAGE FUNCTIONS
// ===================

function saveState() {
    // Make sure old cached saving is deleted before new savings, as requested
    localStorage.removeItem('focusflowState');
    localStorage.setItem('focusflowState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('focusflowState');
    if (saved) {
        const loaded = JSON.parse(saved);

        // Check if it's a new day
        if (loaded.stats && loaded.stats.lastReset !== new Date().toDateString()) {
            // Keep total historical stats, only reset today's counters
            loaded.stats.sessionsCompleted = 0;
            // totalFocusTime and sessionHistory shouldn't be wiped entirely, 
            // but the original code wiped them. We will preserve them now.
            loaded.stats.lastReset = new Date().toDateString();
        }

        // Deep merge stats so we don't lose nested properties if state changes
        Object.assign(state, loaded);
        if (loaded.stats) {
            state.stats = { ...state.stats, ...loaded.stats };
        }
        if (!state.tasks) state.tasks = []; // Ensure tasks exist for old states
    }
}

// ===================
// START APPLICATION
// ===================

init();

// ===================
// LIFECYCLE HOOKS
// ===================

// Handle tab closing or reloading
window.addEventListener('beforeunload', (e) => {
    // If the timer is actively running, show the confirmation dialog
    if (state.isRunning) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome to show the prompt
    }
    
    // Always save the exact current stopwatch time and stats before closing
    saveState();
});

// Use visibilitychange as a fallback for mobile devices
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveState();
    }
});

// Update stats every minute
setInterval(() => {
    updateStats();
}, 60000);

// Save state every 30 seconds
setInterval(() => {
    saveState();
}, 30000);
