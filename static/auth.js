import { showLoading, hideLoading } from "./animation.js";
import { checkSession } from "./app.js";
import { api } from "./api.js";

const loginWarningTxt = document.getElementById('login-warning-text');

const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

const logoutBtn = document.getElementById('logout-btn');
const logoutConfirmation = document.getElementById('logout-confirmation');
const logoutConfirmBtn = document.getElementById('logout-confirm');
const logoutCancelBtn = document.getElementById('logout-cancel');

loginBtn.addEventListener('click', async () => { // TODO: switch to api()
    if (loginUsername.value == "" || loginPassword.value == "") {
        loginWarningTxt.textContent = 'Invalid login input'
        return 'Invalid login input', 400
    } 
    showLoading()
    try {
        const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'username': loginUsername.value,
            'password': loginPassword.value
            })
        })
        if (!response.ok) {
            const result = await response.json()
            console.log(result)
            loginWarningTxt.textContent = result.status
            throw new Error('Failed');
        }
        checkSession()
    } catch {
        
    } finally {
        hideLoading()
    }
})

registerBtn.addEventListener('click', async () => { // TODO: switch to api()
    if (loginUsername.value == "" || loginPassword.value == "") {
        loginWarningTxt.textContent = 'Invalid login input'
        return 'Invalid login input', 400
    } 
    showLoading()
    try {
        const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'username': loginUsername.value,
            'password': loginPassword.value
            })
        })

        if (!response.ok) {
            const result = await response.json();
            loginWarningTxt.textContent = result.status
            throw new Error('Failed');
        }
        checkSession()
    } catch {

    } finally {
        hideLoading()
    }
})

logoutBtn.addEventListener('click', async () => {
    logoutConfirmation.classList.add('active')
})

logoutCancelBtn.addEventListener('click', async () => {
    logoutConfirmation.classList.remove('active')
})

logoutConfirmBtn.addEventListener('click', async () => {
    showLoading()
    try {
        const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            })
        })

        if (!response.ok) {
            const message = await response.text();
            console.log(message);
            throw new Error('Failed');
        }

        logoutConfirmation.classList.remove('active')
        checkSession()

    } finally {
        hideLoading()
    }
    
    
})