import { replay, tween, showLoading, hideLoading } from "./animation.js";
import { api } from "./api.js";
import { renderCalendar } from "./calendar.js";
import { loadInbox } from  "./inbox.js"

const loggedInView = document.getElementById('logged-in-view');
const loggedOutView = document.getElementById('logged-out-view');

let percentageOnTime, streakCounter

let userSubject, userSubjectBtn, topicTermConfirmation, shortTermTopicBtn, longTermTopicBtn, allTopicsBtn 

let tabSkillsBtn, tabDailyBtn, skillsPanel, dailyPanel

let skillLevelBadge 

export let currentDate, userTimeZone

export const LEVEL_COLORS = {
    'Beginner': 'var(--level-0)',
    'Washed': 'var(--level-1)',
    'Intermediate': 'var(--level-2)',
    'Advanced': 'var(--level-3)',
    'Mastered': 'var(--level-4)'
};

function cacheElements() {
    percentageOnTime = document.getElementById('percentage-ontime');
    streakCounter = document.getElementById('streak-count');

    userSubject = document.getElementById('daily-subject');
    userSubjectBtn = document.getElementById('daily-subject-btn');
    topicTermConfirmation = document.getElementById('topic-term-confirmation');
    shortTermTopicBtn = document.getElementById('short-term-confirm');
    longTermTopicBtn = document.getElementById('long-term-confirm');

    allTopicsBtn = document.getElementById('all-topics-btn');

    tabSkillsBtn = document.getElementById('tab-skills-btn');
    tabDailyBtn = document.getElementById('tab-daily-btn');
    skillsPanel = document.getElementById('skills-panel');
    dailyPanel = document.getElementById('daily-panel');

    skillLevelBadge = document.getElementById('skill-level');
}

async function initializeApp() {
    currentDate = new Date();
    userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(userTimeZone)
    await api('/api/timezone', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'timezone': userTimeZone
            })
        }, false, false)
    await loadReviews();
    await loadInbox();
    loadUserConsistency()
}

export async function checkSession() {
    showLoading()
    try {
        await fetch('/api/me')
        .then(r => r.json())
        .then(data => {
            if (data.logged_in && data?.username) {
                loggedOutView.classList.remove('active');
                loggedInView.classList.add('active');
                initializeApp();

                //greeting, soon we can make it say Goodmorning, afternoon or night depending on time in tz
                const inboxGreeting = document.getElementById('inbox-greeting');
                inboxGreeting.textContent = `Hey, ${data.username}!`;
            } else {
                loggedInView.classList.remove('active');
                loggedOutView.classList.add('active');
            }
        });

    } finally {
        hideLoading()
    }
}

export async function showError(msg) {
    const errorDiv = document.getElementById('error-messages');
    const errorPopup = document.createElement("div");
    errorPopup.id = 'error-popup';
    errorPopup.classList.add('error-popup');

    const text = document.createElement("h4");
    text.id = 'error-popup-text';
    text.textContent = msg;

    errorPopup.append(text)
    errorDiv.append(errorPopup);
    errorPopup.classList.add('active');
    setTimeout(() => errorPopup.classList.remove('active'), 3000);
    setTimeout(() => errorPopup.remove(), 3500);
    
}

//UNHANDLED ERRORS HANDLING
window.addEventListener('unhandledrejection', (event) => {
    const err = event.reason;
    if (err?.status === 401) {
        checkSession();
        showError("Please log in again. Your session has expired");
    }

    if (err?.shown || err?.quiet) return;
    if (err?.status) {
        showError(err?.message);
        return;
    };
    showError("Something went wrong");
    console.error(err);
});

window.addEventListener('error', (event) => { 
    console.error(event.error || event.message);
    showError("Something went wrong");
});

cacheElements();   // safe to run immediately, needs the DOM to exist, not login state
checkSession();    // decides whether initializeApp() runs

async function getInput(input, dailylog) {
    if (input == "") return "Invalid input", 400;
    await api('/api/topics', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'input': input,
            'daily_log': dailylog
            })
        }, false, true)
    await loadReviews()
    loadUserConsistency()
};

export async function loadReviews() {
    const [responseReviews, responseLogs] = await Promise.all([
        fetch('/api/topics'), fetch('/api/daily_logs')
    ]);

    const [reviewsList, daily_logsList] = await Promise.all([
        responseReviews.json(), responseLogs.json()
    ]);

    renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), reviewsList, daily_logsList)
};

export async function loadUserConsistency() {
    const [percentageOnTimeReviews, streakCount] = await Promise.all([
        fetch('/api/topics/percentage'), fetch('/api/streak')
    ]);

    const [percentage, streak] = await Promise.all([
        percentageOnTimeReviews.json(), streakCount.json()
    ]);
    percentageOnTime.textContent = percentage //+ "% reviews done on time"
    streakCounter.textContent = streak
};

userSubjectBtn.addEventListener('click', async () => {
    topicTermConfirmation.classList.add('active')
});

longTermTopicBtn.addEventListener('click', async () => {
    getInput(userSubject.value, false)
    topicTermConfirmation.classList.remove('active')
});

shortTermTopicBtn.addEventListener('click', async () => {
    getInput(userSubject.value, true)
    topicTermConfirmation.classList.remove('active')
});

allTopicsBtn.addEventListener('click', async () => { //testing button
    //showError('test test error lol')
    loadInbox()
    const response = await api('/api/test')
    //const result = await response.json()
    //console.log(result)
    skillLevelBadge.style.borderColor = LEVEL_COLORS["Mastered"];
    replay(skillLevelBadge, 'stamp');
});

export function switchTab(activeBtn, inactiveBtn, activePanel, inactivePanel) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
    inactiveBtn.classList.remove('active');
    inactiveBtn.setAttribute('aria-selected', 'false');
    activePanel.classList.add('active');
    inactivePanel.classList.remove('active');
}

tabSkillsBtn.addEventListener('click', () =>
    switchTab(tabSkillsBtn, tabDailyBtn, skillsPanel, dailyPanel))

tabDailyBtn.addEventListener('click', () =>
    switchTab(tabDailyBtn, tabSkillsBtn, dailyPanel, skillsPanel))