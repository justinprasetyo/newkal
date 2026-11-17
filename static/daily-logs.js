import { loadReviews, loadUserConsistency } from "./app.js";
import { api } from "./api.js";

const skillsList = document.getElementById('skills-list');
const dailyTable = document.getElementById('daily-table');

const logContentPanel = document.getElementById('log');
const logDescriptionEditBtn = document.getElementById('log-description-edit-btn');
const logContentPanelCloseBtn = document.getElementById('log-close-btn');
const deleteLogBtn = document.getElementById('delete-log');
const deleteLogConfirmation = document.getElementById('delete-log-confirmation');
const deleteLogConfirmBtn = document.getElementById('delete-log-confirm');
const deleteLogCancelBtn = document.getElementById('delete-log-cancel');
const logEditTools = document.getElementById('log-description-edit-tools');
const logEditConfirmBtn = document.getElementById('log-description-edit-confirm-btn');

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

export function openLogsPanel(logs_list) {
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

function logButtons() { // make logs clickable
    const buttons = document.querySelectorAll('.log-row-btn');

    buttons.forEach((btn) => {
        if (!btn.classList.value.includes('button')) {
            btn.classList.add('button')
            btn.addEventListener('click', async () => {
                logContentPanel.classList.add('active'); // am i sure?
                await openLogContent(btn.id)
            });
        }
            
    });
}

logContentPanelCloseBtn.addEventListener('click', () => {
    logContentPanel.classList.remove('active')
});

deleteLogBtn.addEventListener('click', async () => {
    const topicName = document.getElementById('log-name');
    const deleteLogConfirmationTxt = document.getElementById('delete-log-confirmation-text')
    deleteLogConfirmationTxt.textContent = topicName.textContent

    deleteLogConfirmation.classList.add('active')
    logContentPanel.classList.remove('active')
    skillsList.classList.remove('active')
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
