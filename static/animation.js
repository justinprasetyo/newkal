const skillLevelBadge = document.getElementById('skill-level')
const skillRetentionRate = document.getElementById('skill-retention-rate')
//import { skillLevelBadge } from "./app.js";

export function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;   // forces the browser to apply the removal first
    el.classList.add(cls);
}

skillLevelBadge.addEventListener('animationend', () => {
    skillLevelBadge.classList.remove('stamp');
});

export function tween(el, from, to, ms) {
    const t0 = performance.now();
    function step(t) {
        const p = Math.min((t - t0) / ms, 1);
        const eased = 1 - Math.pow(1 - p, 3);   // fast start, slow finish
        el.textContent = Math.round(from + (to - from) * eased) + '%';
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

export function showLoading() {
    const loadingBar = document.getElementById('loading-bar');
    loadingBar.classList.remove('done');
    loadingBar.classList.add('active');
}

export function hideLoading() {
    const loadingBar = document.getElementById('loading-bar');
    loadingBar.classList.add('done');
    setTimeout(() => loadingBar.classList.remove('active', 'done'), 300);
}