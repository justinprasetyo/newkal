import { api } from "./api.js";

const RATINGS_LIST = {
    100: 'perfect!!!',
    75: 'well!',
    50: 'okay.',
    25: 'eh :)',
    0: 'forgot :('
}

const inboxTable = document.getElementById('inbox-content');
const inboxTasks = document.getElementById('inbox-tasks');

export async function loadInbox() {
    const todayStr = new Date().toLocaleDateString('en-CA');
    inboxTable.innerHTML = "";

    
    const response = await api('/api/inbox');
    if (response.length == 0) {
        inboxTasks.textContent = "nothing due today.";
    }

    let completed = 0;
    for (const rev of response) {
        const newRow = document.createElement("tr");
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
        rating_col.classList.add('inbox-rating'); //if u want
        rating_col.textContent = ':/'; //default no completion state.
        if (rev?.review_log.length > 0 && rev?.review_log[rev?.review_log.length - 1]?.completed_on == todayStr) { //if its completed today, grey out
            rating_col.textContent = RATINGS_LIST[rev?.review_log[rev?.review_log.length - 1]?.rating] ?? ':/';
        } 
        newRow.append(rating_col);
        inboxTable.append(newRow);

        inboxTasks.textContent = `${completed}/${response.length} tasks completed.`;
        if (completed == response.length) inboxTasks.textContent = "all tasks completed today. YAYYY!";
    }
}