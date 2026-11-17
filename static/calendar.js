import { openLogsPanel, openSkillsPanel, switchTab, currentDate, userTimeZone, LEVEL_COLORS } from "./app.js";
import { api } from "./api.js";

const monthLabel = document.getElementById('month-label');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const todayMonthBtn = document.getElementById('today-month-btn');

const tabSkillsBtn = document.getElementById('tab-skills-btn');
const tabDailyBtn = document.getElementById('tab-daily-btn');
const skillsPanel = document.getElementById('skills-panel');
const dailyPanel = document.getElementById('daily-panel');

function getMonthGrid(year, month) {  //0 = January
    const firstDay = new Date(year, month, 1).getDay(); //0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // day 0 = last day of last month

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null); // skipping w/ blank padding before first actual day (if 0, no padding cuz calendar starts at sunday anyway)
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    return cells;
};

export function renderCalendar(year, month, reviewsByDate, dailylogByDate) {
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
                    switchTab(tabSkillsBtn, tabDailyBtn, skillsPanel, dailyPanel)
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
                    switchTab(tabSkillsBtn, tabDailyBtn, skillsPanel, dailyPanel)
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
                    switchTab(tabDailyBtn, tabSkillsBtn, dailyPanel, skillsPanel)
                });
                
            }
        } 
        container.appendChild(cell);
    }
};

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
