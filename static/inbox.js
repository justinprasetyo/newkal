import { api } from "./api.js";

const RATINGS_LIST = {
    100: 'perfect!!!',
    75: 'well!',
    50: 'okay.',
    25: 'eh :)',
    0: 'forgot :('
}

const inboxTable = document.getElementById('inbox-content')

export async function loadInbox() {
    const todayStr = new Date().toLocaleDateString('en-CA');
    inboxTable.innerHTML = "";

    const response = await api('/api/inbox');
    for (const rev of response) {
        const newRow = document.createElement("tr");
        const name_col = document.createElement("th");
        name_col.textContent = rev?.name;
        newRow.append(name_col);
        
        if (rev?.review_log.length > 0 && rev?.review_log[rev?.review_log.length - 1]?.rating >= 0) {
            const rating_col = document.createElement("th");
            if (rev?.review_log[rev?.review_log.length - 1]?.completed_on == todayStr) { //if its completed today, grey out
                rating_col.textContent = RATINGS_LIST[rev?.review_log[rev?.review_log.length - 1]?.rating] ?? ':/';
            } else {
                rating_col.textContent = ':/';
            }
            newRow.append(rating_col);
        }
        inboxTable.append(newRow);
    }
}