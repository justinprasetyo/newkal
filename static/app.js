import { replay, tween, showLoading, hideLoading } from "./animation.js";

const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

const loggedInView = document.getElementById('logged-in-view');
const loggedOutView = document.getElementById('logged-out-view');
const loginWarningTxt = document.getElementById('login-warning-text');

let percentageOnTime, streakCounter

let userSubject, userSubjectBtn, topicTermConfirmation, shortTermTopicBtn, longTermTopicBtn, allTopicsBtn 

let monthLabel, prevMonthBtn, nextMonthBtn, todayMonthBtn 

let skillsPanel, skillsPanelCloseBtn, skillsTable 

let tabSkillsBtn, tabDailyBtn, skillsPanel2, dailyPanel, dailyTable

let statsPanel, statsPanelCloseBtn, deleteSkillReviewBtn, completeSkillReviewBtn, completeReviewConfirmation, completeReviewConfirmationTxt, completeReviewCancel, ratingButtons, skillLevelBadge 

let logContentPanel, logDescriptionEditBtn, logContentPanelCloseBtn, deleteLogBtn, deleteLogConfirmation, deleteLogConfirmBtn, deleteLogCancelBtn, logEditTools, logEditConfirmBtn

let deleteReviewConfirmation, deleteReviewConfirmBtn, deleteReviewCancelBtn 

let undoReviewBtn, undoReviewConfirmation, undoReviewConfirmBtn, undoReviewCancelBtn 

let logoutBtn, logoutConfirmation, logoutConfirmBtn, logoutCancelBtn

let currentDate, userTimeZone

const LEVEL_COLORS = {
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

    monthLabel = document.getElementById('month-label');
    prevMonthBtn = document.getElementById('prev-month-btn');
    nextMonthBtn = document.getElementById('next-month-btn');
    todayMonthBtn = document.getElementById('today-month-btn');

    skillsPanel = document.getElementById('skills-list');
    skillsPanelCloseBtn = document.getElementById('skills-list-close-btn');
    skillsTable = document.getElementById('skills-table');

    tabSkillsBtn = document.getElementById('tab-skills-btn');
    tabDailyBtn = document.getElementById('tab-daily-btn');
    skillsPanel2 = document.getElementById('skills-panel');
    dailyPanel = document.getElementById('daily-panel');
    dailyTable = document.getElementById('daily-table');

    statsPanel = document.getElementById('stats');
    statsPanelCloseBtn = document.getElementById('stats-close-btn');
    deleteSkillReviewBtn = document.getElementById('delete-skill-review');
    completeSkillReviewBtn = document.getElementById('complete-skill-review');
    completeReviewConfirmation = document.getElementById('finish-review-confirmation');
    completeReviewConfirmationTxt = document.getElementById('finish-review-confirmation-text');
    completeReviewCancel = document.getElementById('finish-review-cancel');
    ratingButtons = document.querySelectorAll('.finish-review-rating');
    skillLevelBadge = document.getElementById('skill-level');

    logContentPanel = document.getElementById('log');
    logDescriptionEditBtn = document.getElementById('log-description-edit-btn');
    logContentPanelCloseBtn = document.getElementById('log-close-btn');
    deleteLogBtn = document.getElementById('delete-log');
    deleteLogConfirmation = document.getElementById('delete-log-confirmation');
    deleteLogConfirmBtn = document.getElementById('delete-log-confirm');
    deleteLogCancelBtn = document.getElementById('delete-log-cancel');
    logEditTools = document.getElementById('log-description-edit-tools');
    logEditConfirmBtn = document.getElementById('log-description-edit-confirm-btn');

    deleteReviewConfirmation = document.getElementById('delete-review-confirmation');
    deleteReviewConfirmBtn = document.getElementById('delete-review-confirm');
    deleteReviewCancelBtn = document.getElementById('delete-review-cancel');

    undoReviewBtn = document.getElementById('undo-skill-review');
    undoReviewConfirmation = document.getElementById('undo-review-confirmation');
    undoReviewConfirmBtn = document.getElementById('undo-review-confirm');
    undoReviewCancelBtn = document.getElementById('undo-review-cancel');

}

async function api(url, options, background, toast) {
    if (!background) showLoading();
    try {
        let response;
        try {
            response = await fetch(url, options);
        } catch {
            throw new Error("can't reach the server");
        } 
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const err = new Error(data?.error || `request failed (${response.status})`);
            err.status = response.status;
            throw err;
        }
        return data;
    } catch (err) {
        if (toast && !background) {
            showError(err.message);
            err.shown = true;   // so global listener can skip it
        }
        throw err;
    } finally {
        if (!background) hideLoading();
    }
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
    loadUserConsistency()
}

export async function checkSession() {
    showLoading()
    try {
        await fetch('/api/me')
        .then(r => r.json())
        .then(data => {
            if (data.logged_in) {
                loggedOutView.classList.remove('active');
                loggedInView.classList.add('active');
                initializeApp();
            } else {
                loggedInView.classList.remove('active');
                loggedOutView.classList.add('active');
            }
        });

    } finally {
        hideLoading()
    }
}

async function showError(msg) {
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

async function updateReviewById(id, rating) {
    let ratingInt = parseInt(rating);
    if (Number.isNaN(ratingInt)) return 'Invalid rating', 400;

    const result = await api('/api/topics/update', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id,
            'rating': ratingInt
            })
        }, false, true)
    await loadReviews()
    loadUserConsistency()
    return result
};

async function loadReviews() {
    const [responseReviews, responseLogs] = await Promise.all([
        fetch('/api/topics'), fetch('/api/daily_logs')
    ]);

    const [reviewsList, daily_logsList] = await Promise.all([
        responseReviews.json(), responseLogs.json()
    ]);

    renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), reviewsList, daily_logsList)
};

async function loadUserConsistency() {
    const [percentageOnTimeReviews, streakCount] = await Promise.all([
        fetch('/api/topics/percentage'), fetch('/api/streak')
    ]);

    const [percentage, streak] = await Promise.all([
        percentageOnTimeReviews.json(), streakCount.json()
    ]);
    percentageOnTime.textContent = percentage + "% reviews done on time"
    streakCounter.textContent = "Daily-learning streak: " + streak
};

async function getStatsById(id) {
    const topicObj = await api('/api/topics/stats', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id
            })
        }, true, true)
    return topicObj
};

async function getLogById(id) {
    const logObj = await api('/api/daily_logs/content', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id
            })
        }, true, true)
    return logObj
};

async function editLogDesc(id, desc) {
    await api('/api/daily_logs/update/description', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id,
            'description': desc
            })
        }, false, true)
}

function getMonthGrid(year, month) {  //0 = January
    const firstDay = new Date(year, month, 1).getDay(); //0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // day 0 = last day of last month

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null); // skipping w/ blank padding before first actual day (if 0, no padding cuz calendar starts at sunday anyway)
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    return cells;
};

function renderCalendar(year, month, reviewsByDate, dailylogByDate) {
    const grid = getMonthGrid(year, month);
    const container = document.getElementById("calendar");
    container.innerHTML = "";
    const date = new Date(year, month);
    const actualCurrentDate = new Date();
    monthLabel.textContent = date.toLocaleDateString('default', { month: 'long', year: 'numeric', timeZone: userTimeZone })

    for (const day of grid) {
        //<span class="due-tick" style="background: var(--level-${levelIndex})"></span>
        const cell = document.createElement("div");
        if (day === null) {
            cell.className = "day-cell empty";
        } else {
            cell.className = "day-cell";
            cell.textContent = day;
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            if (dateKey == actualCurrentDate.toLocaleDateString('en-CA', {timeZone: userTimeZone})) {
                    cell.style.border = '2px solid #4a89dc';
                    cell.style.borderRadius = '5px';
            } //make today's date special yayyy
            if (reviewsByDate[dateKey] && dailylogByDate[dateKey]) {
                if (dateKey < actualCurrentDate.toLocaleDateString('en-CA', {timeZone: userTimeZone})) {
                    cell.style.background = "#d2d8e7"; 
                } else {
                    cell.style.background = "#dbeafe"; 
                } // highlight days with a scheduled review
                cell.addEventListener("click", () => {
                    switchTab(tabSkillsBtn, tabDailyBtn, skillsPanel2, dailyPanel)
                    openSkillsPanel(reviewsByDate[dateKey], dateKey)
                    openLogsPanel(dailylogByDate[dateKey])
                });
                const tickContainer = document.createElement("div")
                tickContainer.className = "due-ticks"

                for (const topic of reviewsByDate[dateKey]) {
                    const tick = document.createElement("span")
                    tick.className = "due-tick"
                    tick.style.background = LEVEL_COLORS[topic.level] || LEVEL_COLORS['Beginner'];
                    tickContainer.append(tick)
                }
                cell.append(tickContainer)
            } else if (reviewsByDate[dateKey]) {
                if (dateKey < actualCurrentDate.toLocaleDateString('en-CA', {timeZone: userTimeZone})) {
                    cell.style.background = "#d2d8e7"; 
                } else {
                    cell.style.background = "#dbeafe"; 
                } // highlight days with a scheduled review
                cell.addEventListener("click", () => {
                    switchTab(tabSkillsBtn, tabDailyBtn, skillsPanel2, dailyPanel)
                    openSkillsPanel(reviewsByDate[dateKey], dateKey)
                    openLogsPanel([])
                });
                const tickContainer = document.createElement("div")
                tickContainer.className = "due-ticks"

                for (const topic of reviewsByDate[dateKey]) {
                    const tick = document.createElement("span")
                    tick.className = "due-tick"
                    tick.style.background = LEVEL_COLORS[topic.level] || LEVEL_COLORS['Beginner'];
                    tickContainer.append(tick)
                }
                cell.append(tickContainer)
            } else if (dailylogByDate[dateKey]) {
                if (dateKey < actualCurrentDate.toLocaleDateString('en-CA', {timeZone: userTimeZone})) {
                    cell.style.background = "rgb(212, 229, 218)";
                } else {
                    cell.style.background = "#dbfee7"
                }
                cell.addEventListener("click", () => {
                    openSkillsPanel([], dateKey)
                    openLogsPanel(dailylogByDate[dateKey])
                    switchTab(tabDailyBtn, tabSkillsBtn, dailyPanel, skillsPanel2)
                });
                
            }
        } 
        container.appendChild(cell);
    }
};

function openLogsPanel(logs_list) {
    dailyTable.innerHTML = ""
    logEditTools.classList.remove('active');

    for (const log of logs_list) {
        const newRow = document.createElement("tr")
        newRow.id = log['id'] 
        newRow.classList.add('log-row-btn')
        newRow.role = 'button'
        newRow.tabIndex = '0'

        const name_col = document.createElement("th")
        name_col.textContent = log["name"]
        newRow.append(name_col)
        dailyTable.append(newRow)
    }

    logButtons()
}

async function openLogContent(log_id) {
    const topicName = document.getElementById('log-name');
    const topicStartDate = document.getElementById('log-start-date');
    const topicDescription = document.getElementById('log-description');
    const obj = await getLogById(log_id)
    topicName.textContent = obj['name']
    topicStartDate.textContent = obj['created_at']
    topicDescription.textContent = obj['description']
    logDescriptionEditBtn.value = obj['id']
    deleteLogBtn.value = obj['id']
}

function openSkillsPanel(skills_list, dateKey) {
    statsPanel.classList.remove('active')
    logContentPanel.classList.remove('active')
    skillsPanel.classList.add('active')
    skillsTable.innerHTML = ""

    for (const skill of skills_list) {
        const newRow = document.createElement("tr")
        newRow.id = skill['id'] 
        newRow.classList.add('skill-row-btn')
        newRow.role = 'button'
        newRow.tabIndex = '0'

        const name_col = document.createElement("th")
        const mastery_col = document.createElement("th")
        name_col.textContent = skill["name"]
        mastery_col.textContent = skill["level"]
        newRow.append(name_col)
        newRow.append(mastery_col)

        if (skill['next_review'] > dateKey.slice(0, 10)) {
            newRow.style.background = '#d9d9dcb6';
        } //grey out completed topics

        skillsTable.append(newRow)
    }

    reviewButtons()
}

async function openStatsPanel(skill_id) {
    const topicName = document.getElementById('skill-name');
    const topicStartDate = document.getElementById('skill-start-date');
    const topicRetRate = document.getElementById('skill-retention-rate');
    const topicNextInterval = document.getElementById('skill-next-interval');
    const topicLevel = document.getElementById('skill-level');
    const obj = await getStatsById(skill_id)
    topicName.textContent = obj['name']
    topicStartDate.textContent = obj['created_at']
    topicRetRate.textContent = Math.min(obj['progress'], 100) + '%'
    topicNextInterval.textContent = obj['next_review']
    topicLevel.textContent = obj['level']
    deleteSkillReviewBtn.value = obj['id']
    completeSkillReviewBtn.value = obj['id']
    undoReviewBtn.value = obj['id']
}

prevMonthBtn.addEventListener('click', async () => {
    const [topicsResponse, logsResponse] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/daily_logs')
    ]);

    const [topics, logs] = await Promise.all([
        topicsResponse.json(),
        logsResponse.json()
    ]);

        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), topics, logs)
    }
);

nextMonthBtn.addEventListener('click', async () => {
    const [topicsResponse, logsResponse] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/daily_logs')
    ]);

    const [topics, logs] = await Promise.all([
        topicsResponse.json(),
        logsResponse.json()
    ]);

    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), topics, logs)
});

todayMonthBtn.addEventListener('click', async () => {
    const reviewsList = await api('/api/topics', {}, true, true)
    const daily_logsList = await api('/api/daily_logs', {}, true, true)
    const today = new Date()
    currentDate.setMonth(today.getMonth())
    currentDate.setFullYear(today.getFullYear())
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), reviewsList, daily_logsList)
});

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
    showError('test test error lol')
    const response = await api('/api/test')
    //const result = await response.json()
    //console.log(result)
    skillLevelBadge.style.borderColor = LEVEL_COLORS["Mastered"];
    replay(skillLevelBadge, 'stamp');
});

function switchTab(activeBtn, inactiveBtn, activePanel, inactivePanel) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
    inactiveBtn.classList.remove('active');
    inactiveBtn.setAttribute('aria-selected', 'false');
    activePanel.classList.add('active');
    inactivePanel.classList.remove('active');
}

tabSkillsBtn.addEventListener('click', () =>
    switchTab(tabSkillsBtn, tabDailyBtn, skillsPanel2, dailyPanel))

tabDailyBtn.addEventListener('click', () =>
    switchTab(tabDailyBtn, tabSkillsBtn, dailyPanel, skillsPanel2))

skillsPanelCloseBtn.addEventListener('click', () => {
    skillsPanel.classList.remove('active')
});

statsPanelCloseBtn.addEventListener('click', () => {
    statsPanel.classList.remove('active')
});

logContentPanelCloseBtn.addEventListener('click', () => {
    logContentPanel.classList.remove('active')
});

completeReviewCancel.addEventListener('click', () => {
    completeReviewConfirmation.classList.remove('active')
});

deleteSkillReviewBtn.addEventListener('click', async () => {
    const topicName = document.getElementById('skill-name');
    const deleteReviewConfirmationTxt = document.getElementById('delete-review-confirmation-text')
    deleteReviewConfirmationTxt.textContent = topicName.textContent

    deleteReviewConfirmation.classList.add('active')
    statsPanel.classList.remove('active')
    skillsPanel.classList.remove('active') // i need to fix it, make it update after deletion, it only updates when i click again for now.
});

deleteReviewConfirmBtn.addEventListener('click', async () => {
    deleteReviewConfirmation.classList.remove('active')
    await api('/api/topics/delete', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': deleteSkillReviewBtn.value
            })
        }, false, true)
    await loadReviews()
    loadUserConsistency()
});

deleteReviewCancelBtn.addEventListener('click', async () => {
    deleteReviewConfirmation.classList.remove('active')
});

completeSkillReviewBtn.addEventListener('click', async () => {
    //you can add a blocker here to disallow users from clicking done if next review > today
    skillsPanel.classList.remove('active')

    const topicName = document.getElementById('skill-name');
    completeReviewConfirmationTxt.textContent = topicName.textContent
    completeReviewConfirmation.classList.add('active')
});

undoReviewBtn.addEventListener('click', async () => {
    const topicName = document.getElementById('skill-name');
    const undoReviewConfirmationTxt = document.getElementById('undo-review-confirmation-text')
    undoReviewConfirmationTxt.textContent = topicName.textContent

    undoReviewConfirmation.classList.add('active')
    skillsPanel.classList.remove('active')
});

undoReviewCancelBtn.addEventListener('click', async () => {
    undoReviewConfirmation.classList.remove('active')
});

undoReviewConfirmBtn.addEventListener('click', async () => {
    undoReviewConfirmation.classList.remove('active')
    const result = await api('/api/topics/undo', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': undoReviewBtn.value
            })
        }, false, true)
    skillLevelBadge.style.borderColor = LEVEL_COLORS[result.level];
    await openStatsPanel(undoReviewBtn.value)
    const topicRetRate = document.getElementById('skill-retention-rate');
    tween(topicRetRate, Math.min(Math.round(result['old_progress']), 100), Math.min(Math.round(result['progress']), 100), 800)
    await loadReviews()
    loadUserConsistency()
});

function reviewButtons() { // make skills clickable
    const buttons = document.querySelectorAll('.skill-row-btn');

    buttons.forEach((btn, index) => {
        if (!btn.classList.value.includes('button')) {
            btn.classList.add('button')
            btn.addEventListener('click', async () => {
                statsPanel.classList.add('active');
                await openStatsPanel(btn.id)
            });
        }
            
    });
}

function logButtons() { // make logs clickable
    const buttons = document.querySelectorAll('.log-row-btn');

    buttons.forEach((btn, index) => {
        if (!btn.classList.value.includes('button')) {
            btn.classList.add('button')
            btn.addEventListener('click', async () => {
                logContentPanel.classList.add('active'); // am i sure?
                await openLogContent(btn.id)
            });
        }
            
    });
}

ratingButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
        completeReviewConfirmation.classList.remove('active');
        const level_up = await updateReviewById(completeSkillReviewBtn.value, btn.value)

        if (level_up['error']) return "couldn't update review", 400

        await openStatsPanel(completeSkillReviewBtn.value)
        if (level_up['leveled_up']) {
            replay(skillLevelBadge, 'stamp');
        }
        skillLevelBadge.style.borderColor = LEVEL_COLORS[level_up.level];
        const topicRetRate = document.getElementById('skill-retention-rate');
        tween(topicRetRate, Math.min(Math.round(level_up['old_progress']), 100), Math.min(Math.round(level_up['progress']), 100), 800)
        
    });     
});

deleteLogBtn.addEventListener('click', async () => {
    const topicName = document.getElementById('log-name');
    const deleteLogConfirmationTxt = document.getElementById('delete-log-confirmation-text')
    deleteLogConfirmationTxt.textContent = topicName.textContent

    deleteLogConfirmation.classList.add('active')
    logContentPanel.classList.remove('active')
    skillsPanel.classList.remove('active')
});

deleteLogCancelBtn.addEventListener('click', async () => {
    deleteLogConfirmation.classList.remove('active')
});

deleteLogConfirmBtn.addEventListener('click', async () => {
    deleteLogConfirmation.classList.remove('active')
    await api('/api/daily_logs/delete', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': deleteLogBtn.value
            })
        }, false, true)
    await loadReviews()
    loadUserConsistency()
});
        

logDescriptionEditBtn.addEventListener('click', () => {
    const topicDescription = document.getElementById('log-description');
    const topicDescriptionEdit = document.getElementById('log-description-edit');
    logEditTools.classList.add('active');
    topicDescriptionEdit.value = topicDescription.textContent;
});

logEditConfirmBtn.addEventListener('click', async () => {
    const topicDescription = document.getElementById('log-description');
    const topicDescriptionEdit = document.getElementById('log-description-edit');
    await editLogDesc(logDescriptionEditBtn.value, topicDescriptionEdit.value);
    topicDescription.textContent = topicDescriptionEdit.value;
    logEditTools.classList.remove('active');
});
