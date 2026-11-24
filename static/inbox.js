import { api } from "./api.js";
import { openStatsPanel } from "./topics.js"

const RATINGS_LIST = {
    100: 'perfect!!!',
    75: 'well!',
    50: 'okay.',
    25: 'eh :)',
    0: 'forgot :('
}

const inboxTable = document.getElementById('inbox-content');
const inboxTasks = document.getElementById('inbox-tasks');
const statsPanel = document.getElementById('stats');

export async function loadInbox() {
    const todayStr = new Date().toLocaleDateString('en-CA');
    inboxTable.innerHTML = "";

    const response = await api('/api/inbox');
    if (!response.length) {
        inboxTasks.textContent = "nothing due today.";
        return;
    }

    let completed = 0;
    for (const rev of response) {
        const newRow = document.createElement("tr");
        newRow.classList.add('inbox-task');
        newRow.classList.remove('completed');
        newRow.id = rev?.id;

        const due_col = document.createElement("th");
        due_col.textContent = 'today!';
        if (rev?.next_review > todayStr) {
            due_col.textContent = '(DONE)';
            completed += 1;
        } else if (rev?.next_review < todayStr) {
            due_col.textContent = `OVERDUE (${rev?.next_review})`;
        }
        newRow.append(due_col);

        const name_col = document.createElement("th");
        name_col.textContent = rev?.name;
        newRow.append(name_col);

        const rating_col = document.createElement("th");
        const ratingNum = rev?.review_log[rev?.review_log.length - 1]?.rating
        rating_col.textContent = ':/';              //default no completion state.
        if (RATINGS_LIST?.[ratingNum]) {
            rating_col.textContent = RATINGS_LIST[ratingNum];
            newRow.classList.add('done');
        } 
        newRow.append(rating_col);
        inboxTable.append(newRow);

        inboxTasks.textContent = `${completed}/${response.length} tasks completed.`;
        if (completed == response.length) inboxTasks.textContent = "all tasks completed today. YAYYY!";
    }
    inboxTaskButtons();
}

function inboxTaskButtons() {
    const buttons = document.querySelectorAll('.inbox-task');

    buttons.forEach((btn) => {
        if (!btn.classList.value.includes('button')) {
            btn.classList.add('button')
            btn.addEventListener('click', async () => {
                statsPanel.classList.add('active');
                await openStatsPanel(btn.id)
            });
        }
    });
}