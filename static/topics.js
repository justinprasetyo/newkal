import { api } from "./api.js";
import { loadReviews, loadUserConsistency, LEVEL_COLORS } from "./app.js";
import { replay, tween } from "./animation.js";
import { loadInbox } from "./inbox.js";

const skillsList = document.getElementById('skills-list');
const skillsPanelCloseBtn = document.getElementById('skills-list-close-btn');
const skillsTable = document.getElementById('skills-table');

const logContentPanel = document.getElementById('log');

const statsPanel = document.getElementById('stats');
const statsPanelCloseBtn = document.getElementById('stats-close-btn');
const deleteSkillReviewBtn = document.getElementById('delete-skill-review');
const completeSkillReviewBtn = document.getElementById('complete-skill-review');
const completeReviewConfirmation = document.getElementById('finish-review-confirmation');
const completeReviewConfirmationTxt = document.getElementById('finish-review-confirmation-text');
const completeReviewCancel = document.getElementById('finish-review-cancel');
const ratingButtons = document.querySelectorAll('.finish-review-rating');
const skillLevelBadge = document.getElementById('skill-level');

const deleteReviewConfirmation = document.getElementById('delete-review-confirmation');
const deleteReviewConfirmBtn = document.getElementById('delete-review-confirm');
const deleteReviewCancelBtn = document.getElementById('delete-review-cancel');

const undoReviewBtn = document.getElementById('undo-skill-review');
const undoReviewConfirmation = document.getElementById('undo-review-confirmation');
const undoReviewConfirmBtn = document.getElementById('undo-review-confirm');
const undoReviewCancelBtn = document.getElementById('undo-review-cancel');

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
    loadInbox()
    return result
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

export function openSkillsPanel(skills_list, dateKey) {
    statsPanel.classList.remove('active')
    logContentPanel.classList.remove('active')
    skillsList.classList.add('active')
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

export async function openStatsPanel(skill_id) {
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

skillsPanelCloseBtn.addEventListener('click', () => {
    skillsList.classList.remove('active')
});

statsPanelCloseBtn.addEventListener('click', () => {
    statsPanel.classList.remove('active')
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
    skillsList.classList.remove('active') // i need to fix it, make it update after deletion, it only updates when i click again for now.
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
    loadInbox()
});

deleteReviewCancelBtn.addEventListener('click', async () => {
    deleteReviewConfirmation.classList.remove('active')
});

completeSkillReviewBtn.addEventListener('click', async () => {
    //you can add a blocker here to disallow users from clicking done if next review > today
    skillsList.classList.remove('active')

    const topicName = document.getElementById('skill-name');
    completeReviewConfirmationTxt.textContent = topicName.textContent
    completeReviewConfirmation.classList.add('active')
});

undoReviewBtn.addEventListener('click', async () => {
    const topicName = document.getElementById('skill-name');
    const undoReviewConfirmationTxt = document.getElementById('undo-review-confirmation-text')
    undoReviewConfirmationTxt.textContent = topicName.textContent

    undoReviewConfirmation.classList.add('active')
    skillsList.classList.remove('active')
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
    loadInbox()
});

function reviewButtons() { // make skills clickable
    const buttons = document.querySelectorAll('.skill-row-btn');

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