import { showLoading, hideLoading } from "./animation.js";
import { checkSession, showError } from "./app.js";
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
        await api('/api/login', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'username': loginUsername.value,
            'password': loginPassword.value
            })
        })
        checkSession()
        
    } catch(error) {
        if (error?.status == 429) loginWarningTxt.textContent = error?.message;
        if (error?.status == 401) loginWarningTxt.textContent = "Invalid username or password, " + error?.message;
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
        await api('/api/register', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            'username': loginUsername.value,
            'password': loginPassword.value
            })
        })
        checkSession()

    } catch(error) {
        if (error?.status == 429) loginWarningTxt.textContent = error?.message;
        if (error?.status == 409) loginWarningTxt.textContent = "Username already taken, " + error?.message;
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
        await api('/api/logout', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            })
        })
        logoutConfirmation.classList.remove('active')
        checkSession()

    } catch(error) {
        console.error(error.message)
        showError("Something went wrong.")
    } finally {
        hideLoading()
    }
    
    
})