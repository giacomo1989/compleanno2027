import {
    watchBacaroLive,
    googleMapsSearch,
    formatLiveTime
} from "./firebase-live.js";

function lang() {
    return localStorage.getItem("gb_lang") === "es" ? "es" : "it";
}

function renderPublicBacaroLive(state) {
    document.querySelectorAll("[data-bacaro-live]").forEach(box => {
        if (!state?.currentStop) {
            box.hidden = true;
            return;
        }

        const time = formatLiveTime(state.updatedAt, lang());
        box.hidden = false;
        box.innerHTML = `
            <div class="smallcap">${lang() === "es" ? "LIVE · EL GRUPO ESTÁ AQUÍ" : "LIVE · IL GRUPPO È QUI"}</div>
            <strong>${state.name || state.currentStop}</strong>
            <span>${time ? (lang() === "es" ? `Actualizado a las ${time}` : `Aggiornato alle ${time}`) : ""}</span>
            <a href="${googleMapsSearch(state.mapsQuery || state.name || state.currentStop)}"
               target="_blank" rel="noopener">
                ${lang() === "es" ? "LLÉVAME AQUÍ →" : "PORTAMI QUI →"}
            </a>
        `;
    });
}

watchBacaroLive(renderPublicBacaroLive);
