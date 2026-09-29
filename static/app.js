const userSubject = document.getElementById('daily-subject')
const userSubjectBtn = document.getElementById('daily-subject-btn')

const allTopicsBtn = document.getElementById('all-topics-btn')

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

    const result = await response.json()
    console.log(result)
}

function getMonthGrid(year, month) {  //0 = January
    const firstDay = new Date(year, month, 1).getDay(); //0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // day 0 = last day of last month

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null); // skipping w/ blank padding before first actual day (if 0, no padding cuz calendar starts at sunday anyway)
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    return cells;
}

function renderCalendar(year, month, reviewsByDate) {
    const grid = getMonthGrid(year, month);
    const container = document.getElementById("calendar");
    container.innerHTML = "";

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
                cell.addEventListener("click", () => openStatsPanel(reviewsByDate[dateKey]));
            }
        }
        container.appendChild(cell);
    }
}

renderCalendar(2026,10,{})

userSubjectBtn.addEventListener('click', async () => {
        getInput(userSubject.value)

    }
) 

allTopicsBtn.addEventListener('click', async () => {
        const response = await fetch('/api/topics')
        const result = await response.json()
        console.log(result)
    }
) 