const userSubject = document.getElementById('daily-subject');
const userSubjectBtn = document.getElementById('daily-subject-btn');

const allTopicsBtn = document.getElementById('all-topics-btn');

const monthLabel = document.getElementById('month-label');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');

const skillsPanel = document.getElementById('skills-list');
const skillsPanelCloseBtn = document.getElementById('skills-list-close-btn');
const skillsTable = document.getElementById('skills-table');

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
let currentMonth = 8;
renderCalendar(currentYear, currentMonth, exampleReviews);

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
    formatSkills(result)
    renderCalendar(currentYear, currentMonth, exampleReviews)
    console.log(exampleReviews)
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
    const monthName = date.toLocaleString('default', { month: 'long' });
    monthLabel.textContent = monthName;

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
    skillsPanel.classList.add('active')
    skillsTable.innerHTML = ""

    for (skill of skills_list) {
        const newRow = document.createElement("tr")
        const name_col = document.createElement("th")
        const mastery_col = document.createElement("th")
        name_col.textContent = skill["name"]
        mastery_col.textContent = skill["level"]
        newRow.append(name_col)
        newRow.append(mastery_col)
        skillsTable.append(newRow)
    }
}

function openStatsPanel(skill) {

}

userSubjectBtn.addEventListener('click', async () => {
        getInput(userSubject.value)

    }
);

allTopicsBtn.addEventListener('click', async () => {
        const response = await fetch('/api/topics')
        const result = await response.json()
        console.log(result)
    }
);

prevMonthBtn.addEventListener('click', () => {
        currentMonth -= 1
        renderCalendar(currentYear, currentMonth, exampleReviews)
    }
);

nextMonthBtn.addEventListener('click', () => {
        currentMonth += 1
        renderCalendar(currentYear, currentMonth, exampleReviews)
    }
);

skillsPanelCloseBtn.addEventListener('click', () => {
        skillsPanel.classList.remove('active')
    }
);