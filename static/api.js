import { showLoading, hideLoading } from "./animation.js";

export async function api(url, options, background, toast) {
    if (!background) showLoading();
    try {
        let response;
        try {
            response = await fetch(url, options);
        } catch {
            throw new Error("can't reach the server");
        } 
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const err = new Error(data?.error || `request failed (${response.status})`);
            err.status = response.status;
            throw err;
        }
        return data;
    } catch (err) {
        if (toast && !background) {
            showError(err.message);
            err.shown = true;   // so global listener can skip it
        }
        throw err;
    } finally {
        if (!background) hideLoading();
    }
}