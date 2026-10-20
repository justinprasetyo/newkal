const percentageOnTime = document.getElementById('percentage-ontime');
const userSubject = document.getElementById('daily-subject');
const userSubjectBtn = document.getElementById('daily-subject-btn');
const topicTermConfirmation = document.getElementById('topic-term-confirmation');
const shortTermTopicBtn = document.getElementById('short-term-confirm');
const longTermTopicBtn = document.getElementById('long-term-confirm');

const allTopicsBtn = document.getElementById('all-topics-btn');

const monthLabel = document.getElementById('month-label');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const todayMonthBtn = document.getElementById('today-month-btn');

const skillsPanel = document.getElementById('skills-list');
const skillsPanelCloseBtn = document.getElementById('skills-list-close-btn');
const skillsTable = document.getElementById('skills-table');

const tabSkillsBtn = document.getElementById('tab-skills-btn');
const tabDailyBtn = document.getElementById('tab-daily-btn');
const skillsPanel2 = document.getElementById('skills-panel');
const dailyPanel = document.getElementById('daily-panel');
const dailyTable = document.getElementById('daily-table');

const statsPanel = document.getElementById('stats');
const statsPanelCloseBtn = document.getElementById('stats-close-btn');
const deleteSkillReviewBtn = document.getElementById('delete-skill-review');
const completeSkillReviewBtn = document.getElementById('complete-skill-review');
const completeReviewConfirmation = document.getElementById('finish-review-confirmation');
const completeReviewConfirmationTxt = document.getElementById('finish-review-confirmation-text');
const completeReviewCancel = document.getElementById('finish-review-cancel');
const ratingButtons = document.querySelectorAll('.finish-review-rating');

const logContentPanel = document.getElementById('log');
const logDescriptionEditBtn = document.getElementById('log-description-edit-btn');
const logContentPanelCloseBtn = document.getElementById('log-close-btn');
const deleteLogBtn = document.getElementById('delete-log');
const deleteLogConfirmation = document.getElementById('delete-log-confirmation');
const deleteLogConfirmBtn = document.getElementById('delete-log-confirm');
const deleteLogCancelBtn = document.getElementById('delete-log-cancel');
const logEditTools = document.getElementById('log-description-edit-tools');
const logEditConfirmBtn = document.getElementById('log-description-edit-confirm-btn');

const deleteReviewConfirmation = document.getElementById('delete-review-confirmation');
const deleteReviewConfirmBtn = document.getElementById('delete-review-confirm');
const deleteReviewCancelBtn = document.getElementById('delete-review-cancel');

const undoReviewBtn = document.getElementById('undo-skill-review');
const undoReviewConfirmation = document.getElementById('undo-review-confirmation');
const undoReviewConfirmBtn = document.getElementById('undo-review-confirm');
const undoReviewCancelBtn = document.getElementById('undo-review-cancel');

const LEVEL_COLORS = {
    'Beginner': 'var(--level-0)',
    'Washed': 'var(--level-1)',
    'Intermediate': 'var(--level-2)',
    'Advanced': 'var(--level-3)',
    'Mastered': 'var(--level-4)'
};

let currentDate = new Date()
console.log(currentDate.toLocaleDateString('en-CA'))
loadReviews()

async function getInput(input, dailylog) {
    const response = await fetch('/api/topics', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'input': input,
            'daily_log': dailylog
        })
    })
    //const today = new Date();
    //const todayString = today.toDateString()

    const result = await response.json() // skills list array
    //console.log(result[result.length - 1])
    loadReviews()
};

async function updateReviewById(id, rating) {
    ratingInt = parseInt(rating)
    if (ratingInt == NaN) {
        return 'Error: rating is not valid', 404
    }
    const response = await fetch('/api/topics/update', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id,
            'rating': ratingInt
        })
    })

    await loadReviews()
};

async function loadReviews() {
    const responseReviews = await fetch('/api/topics')
    const reviewsList = await responseReviews.json()

    const responseLogs = await fetch('/api/daily_logs')
    const daily_logsList = await responseLogs.json()

    const percentageOnTimeReviews = await fetch('/api/topics/percentage')
    const percentage = await percentageOnTimeReviews.json()
    percentageOnTime.textContent = percentage + "% reviews done on time"
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), reviewsList, daily_logsList)
};

async function getStatsById(id) {
    const response = await fetch('/api/topics/stats', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id
        })
    })
    const topicObj = await response.json()
    return topicObj
};

function formatSkills(list) {
    for (skill of list) {
        if (skill['next_review'] in exampleReviews) {
            exampleReviews[skill['next_review']].push(skill);
        } else {
            exampleReviews[skill['next_review']] = [skill];
        }
    }
};

async function getLogById(id) {
    const response = await fetch('/api/daily_logs/content', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id
        })
    })
    const logObj = await response.json()
    return logObj
};

async function editLogDesc(id, desc) {
    const response = await fetch('/api/daily_logs/update/description', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id,
            'description': desc
        })
    })
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
    console.log(dailylogByDate)
    const grid = getMonthGrid(year, month);
    const container = document.getElementById("calendar");
    container.innerHTML = "";
    const date = new Date(year, month);
    const actualCurrentDate = new Date();
    monthLabel.textContent = date.toLocaleDateString('default', { month: 'long', year: 'numeric' })

    for (const day of grid) {
        //<span class="due-tick" style="background: var(--level-${levelIndex})"></span>
        const cell = document.createElement("div");
        if (day === null) {
            cell.className = "day-cell empty";
        } else {
            cell.className = "day-cell";
            cell.textContent = day;
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            if (dateKey == actualCurrentDate.toLocaleDateString('en-CA')) {
                    cell.style.border = '2px solid #4a89dc';
                    cell.style.borderRadius = '5px';
            } //make today's date special yayyy
            if (reviewsByDate[dateKey]) {
                if (dateKey < actualCurrentDate.toLocaleDateString('en-CA')) {
                    cell.style.background = "#d2d8e7"; 
                } else {
                    cell.style.background = "#dbeafe"; 
                } // highlight days with a scheduled review
                cell.addEventListener("click", () => {
                    switchTab(tabSkillsBtn, tabDailyBtn, skillsPanel2, dailyPanel)
                    openSkillsPanel(reviewsByDate[dateKey], dateKey)
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
            }
            
            if (dailylogByDate[dateKey]) {
                if (!reviewsByDate[dateKey] && dateKey < actualCurrentDate.toLocaleDateString('en-CA')) {
                    cell.style.background = "rgb(212, 229, 218)";
                } else if (!reviewsByDate[dateKey] && dateKey > actualCurrentDate.toLocaleDateString('en-CA')) {
                    cell.style.background = "#dbfee7"
                }
                if (!reviewsByDate[dateKey]) {
                    cell.addEventListener("click", () => {
                        openSkillsPanel([], dateKey)
                        openLogsPanel(dailylogByDate[dateKey])
                        switchTab(tabDailyBtn, tabSkillsBtn, dailyPanel, skillsPanel2)
                    });
                } else {
                     cell.addEventListener("click", () => { 
                        openLogsPanel(dailylogByDate[dateKey])
                        openSkillsPanel(reviewsByDate[dateKey], dateKey)
                    });
                }
            }
        } 
        container.appendChild(cell);
    }
};

function openLogsPanel(logs_list) {
    //statsPanel.classList.remove('active')
    //skillsPanel.classList.add('active')
    dailyTable.innerHTML = ""
    logEditTools.classList.remove('active');

    for (log of logs_list) {
        //<div id="myClickableDiv" role="button" tabindex="0" class="interactive-box">
        const newRow = document.createElement("tr")
        newRow.id = log['id'] // make a forEach like in Overstimulated that makes each skill section clickable
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

    for (skill of skills_list) {
        //<div id="myClickableDiv" role="button" tabindex="0" class="interactive-box">
        const newRow = document.createElement("tr")
        newRow.id = skill['id'] // make a forEach like in Overstimulated that makes each skill section clickable
        newRow.classList.add('skill-row-btn')
        newRow.role = 'button'
        newRow.tabIndex = '0'

        const name_col = document.createElement("th")
        const mastery_col = document.createElement("th")
        name_col.textContent = skill["name"]
        mastery_col.textContent = skill["level"]
        newRow.append(name_col)
        newRow.append(mastery_col)
        console.log(dateKey)

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
        const response = await fetch('/api/topics')
        const reviewsList = await response.json()

        const responseLogs = await fetch('/api/daily_logs')
        const daily_logsList = await responseLogs.json()
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), reviewsList, daily_logsList)
    }
);

nextMonthBtn.addEventListener('click', async () => {
        const response = await fetch('/api/topics')
        const reviewsList = await response.json()

        const responseLogs = await fetch('/api/daily_logs')
        const daily_logsList = await responseLogs.json()
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), reviewsList, daily_logsList)
    }
);

todayMonthBtn.addEventListener('click', async () => {
        const response = await fetch('/api/topics')
        const reviewsList = await response.json()

        const responseLogs = await fetch('/api/daily_logs')
        const daily_logsList = await responseLogs.json()
        today = new Date
        currentDate.setMonth(today.getMonth())
        currentDate.setFullYear(today.getFullYear())
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth(), reviewsList, daily_logsList)
    }
);

userSubjectBtn.addEventListener('click', async () => {
        topicTermConfirmation.classList.add('active')
    }
);

longTermTopicBtn.addEventListener('click', async () => {
        getInput(userSubject.value, false)
        topicTermConfirmation.classList.remove('active')
    }
);

shortTermTopicBtn.addEventListener('click', async () => {
        getInput(userSubject.value, true) //make a load daily_log function that fetches to api/daily_log
        topicTermConfirmation.classList.remove('active')
    }
);

allTopicsBtn.addEventListener('click', async () => { //testing button
        const response = await fetch('/api/test')
        const result = await response.json()
        console.log(result)
    }
);

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
    }
);

statsPanelCloseBtn.addEventListener('click', () => {
        statsPanel.classList.remove('active')
    }
);

logContentPanelCloseBtn.addEventListener('click', () => {
        logContentPanel.classList.remove('active')
    }
);

completeReviewCancel.addEventListener('click', () => {
        completeReviewConfirmation.classList.remove('active')
    }
);

deleteSkillReviewBtn.addEventListener('click', async () => {
    const topicName = document.getElementById('skill-name');
    const deleteReviewConfirmationTxt = document.getElementById('delete-review-confirmation-text')
    deleteReviewConfirmationTxt.textContent = topicName.textContent

    deleteReviewConfirmation.classList.add('active')
    statsPanel.classList.remove('active')
    skillsPanel.classList.remove('active') // i need to fix it, make it update after deletion, it only updates when i click again for now.
});

deleteReviewConfirmBtn.addEventListener('click', async () => {
        //delete in postgre table
        const response = await fetch('/api/topics/delete', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': deleteSkillReviewBtn.value
        })
    })
    await loadReviews()
    deleteReviewConfirmation.classList.remove('active')
});

deleteReviewCancelBtn.addEventListener('click', async () => {
    deleteReviewConfirmation.classList.remove('active')
});

completeSkillReviewBtn.addEventListener('click', async () => {
    statsPanel.classList.remove('active')  
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
        const response = await fetch('/api/topics/undo', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': undoReviewBtn.value
        })
    })
    undoReviewConfirmation.classList.remove('active')
    openStatsPanel(undoReviewBtn.value)
    await loadReviews()
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

ratingButtons.forEach((btn, index) => {
    btn.addEventListener('click', async () => {
        completeReviewConfirmation.classList.remove('active');
        updateReviewById(completeSkillReviewBtn.value, btn.value)
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
        const response = await fetch('/api/daily_logs/delete', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': deleteLogBtn.value
        })
    })
    await loadReviews()
    deleteLogConfirmation.classList.remove('active')
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
