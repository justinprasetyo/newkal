const userSubject = document.getElementById('daily-subject');
const userSubjectBtn = document.getElementById('daily-subject-btn');

const allTopicsBtn = document.getElementById('all-topics-btn');

const monthLabel = document.getElementById('month-label');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');

const skillsPanel = document.getElementById('skills-list');
const skillsPanelCloseBtn = document.getElementById('skills-list-close-btn');
const skillsTable = document.getElementById('skills-table');

const statsPanel = document.getElementById('stats');
const statsPanelCloseBtn = document.getElementById('stats-close-btn');
const deleteSkillReviewBtn = document.getElementById('delete-skill-review');
const completeSkillReviewBtn = document.getElementById('complete-skill-review');

let exampleObj = {'created_at': "2026-09-28", 'interval_step': 0,
'level': "Beginner", 'name': "Sliding windows leetcode", 'next_review': "2026-09-29",
'progress': 0}

let exampleObj2 = {'created_at': "2026-09-28", 'interval_step': 0,
'level': "Advanced", 'name': "Hash leet", 'next_review': "2026-09-29",
'progress': 0}

let exampleObj3 = {'created_at': "2026-09-28", 'interval_step': 0,
'level': "Intermediate", 'name': "Trig sub integrals", 'next_review': "2026-09-29",
'progress': 0}

let exampleReviews = {'2026-09-29': [exampleObj, exampleObj2, exampleObj3]}

let currentYear = 2026; //dont hardcode, make this dynamic later
let currentMonth = 9;
loadReviews()

async function getInput(input) {
    const response = await fetch('/api/topics', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'input': input
        })
    })
    //const today = new Date();
    //const todayString = today.toDateString()

    const result = await response.json() // skills list array
    console.log(result[result.length - 1])
    loadReviews()
};

async function updateReviewById(id) {
    const response = await fetch('/api/topics/update', {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'id': id
        })
    })

    const result = await response.json() 
    loadReviews()
};

async function loadReviews() {
    const response = await fetch('/api/topics')
    const reviewsList = await response.json()
    console.log(reviewsList)
    renderCalendar(currentYear, currentMonth, reviewsList)
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

function getMonthGrid(year, month) {  //0 = January
    const firstDay = new Date(year, month, 1).getDay(); //0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // day 0 = last day of last month

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null); // skipping w/ blank padding before first actual day (if 0, no padding cuz calendar starts at sunday anyway)
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    return cells;
};

function renderCalendar(year, month, reviewsByDate) {
    const grid = getMonthGrid(year, month);
    const container = document.getElementById("calendar");
    container.innerHTML = "";
    const date = new Date(year, month);
    monthLabel.textContent = date.toLocaleDateString('default', { month: 'long', year: 'numeric' })

    for (const day of grid) {
        const cell = document.createElement("div");
        if (day === null) {
            cell.className = "day-cell empty";
        } else {
            cell.className = "day-cell";
            cell.textContent = day;
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            if (reviewsByDate[dateKey]) {
                cell.style.background = "#dbeafe";   // highlight days with a scheduled review
                cell.addEventListener("click", () => openSkillsPanel(reviewsByDate[dateKey]));
            }
        }
        container.appendChild(cell);
    }
};

function openSkillsPanel(skills_list) {
    statsPanel.classList.remove('active')
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
        skillsTable.append(newRow)
        console.log(newRow)
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
    topicRetRate.textContent = '50%'//`${int(obj['progress']) + 50}%`
    topicNextInterval.textContent = obj['next_review']
    topicLevel.textContent = obj['level']
    deleteSkillReviewBtn.value = obj['id']
    completeSkillReviewBtn.value = obj['id']
}

userSubjectBtn.addEventListener('click', async () => {
        getInput(userSubject.value)
    }
);

allTopicsBtn.addEventListener('click', async () => {
        const response = await fetch('/api/topics')
        const result = await response.json()
    }
);

prevMonthBtn.addEventListener('click', async () => {
        const response = await fetch('/api/topics')
        const reviewsList = await response.json()
        currentMonth -= 1
        renderCalendar(currentYear, currentMonth, reviewsList)
    }
);

nextMonthBtn.addEventListener('click', async () => {
        const response = await fetch('/api/topics')
        const reviewsList = await response.json()
        currentMonth += 1
        renderCalendar(currentYear, currentMonth, reviewsList)
    }
);

skillsPanelCloseBtn.addEventListener('click', () => {
        skillsPanel.classList.remove('active')
    }
);

statsPanelCloseBtn.addEventListener('click', () => {
        statsPanel.classList.remove('active')
    }
);

deleteSkillReviewBtn.addEventListener('click', async () => {
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
    statsPanel.classList.remove('active')
    skillsPanel.classList.remove('active') // i need to fix it, make it update after deletion, it only updates when i click again for now.
});

completeSkillReviewBtn.addEventListener('click', async () => {
    //update in postgre table
    statsPanel.classList.remove('active')  
    skillsPanel.classList.remove('active') // i need to fix it, make it update after deletion, it only updates when i click again for now.
    updateReviewById(completeSkillReviewBtn.value)
});

function reviewButtons() { // make skills clickable
    const buttons = document.querySelectorAll('.skill-row-btn');

    buttons.forEach((btn, index) => {
        if (!btn.classList.value.includes('button')) {
            btn.classList.add('button')
            btn.addEventListener('click', () => {
                statsPanel.classList.add('active');
                openStatsPanel(btn.id)
            });
        }
            
    });
}
