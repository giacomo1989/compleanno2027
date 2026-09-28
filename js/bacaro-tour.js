import {
    adminLogin,
    adminLogout,
    watchAdmin,
    watchBacaroLive,
    publishBacaroStop,
    googleMapsSearch,
    formatLiveTime
} from "./firebase-live.js";

let bacaroData = null;
let isAdmin = false;
let currentLiveStopId = null;
let gpsWatchId = null;
let lastGpsSuggestion = null;

function currentLang() {
    const saved = localStorage.getItem("gb_lang");
    if (saved === "es" || saved === "it") return saved;
    return navigator.language?.toLowerCase().startsWith("es") ? "es" : "it";
}

function mapsSearch(name) {
    return googleMapsSearch(`${name}, Venezia`);
}

function renderRoute() {
    const route = document.getElementById("routeLine");
    route.innerHTML = bacaroData.stops.map((stop, i) =>
        `<span class="route-node ${i === 0 ? "start" : ""}">${i === 0 ? "S" : i}</span>`
    ).join("");

    const points = bacaroData.stops.map(s => encodeURIComponent(s.mapsQuery));
    const origin = points[0];
    const destination = points[points.length - 1];
    const waypoints = points.slice(1, -1).join("%7C");
    document.getElementById("fullRoute").href =
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking&waypoints=${waypoints}`;
}

function renderStops() {
    const lang = currentLang();

    document.getElementById("bacaroStops").innerHTML = bacaroData.stops.map((stop, i) => {
        const start = i === 0;
        const number = start ? "START" : String(i).padStart(2, "0");
        const location = stop.location[lang] || stop.location.it;
        const active = stop.id === currentLiveStopId;

        return `
            <article class="stop ${start ? "start" : ""} ${active ? "is-live-stop" : ""}">
                <div class="stop-index">${number}</div>
                <div class="stop-card">
                    <div class="stop-photo">
                        <img src="${stop.image}" alt="${stop.name}" loading="lazy">
                    </div>
                    <div class="stop-body">
                        <div class="stop-time">${stop.time}</div>
                        <h3>${stop.name}</h3>
                        <div class="stop-location">${location}</div>
                        <div class="stop-actions">
                            <a href="${mapsSearch(stop.mapsQuery)}" target="_blank" rel="noopener">MAPS ↗</a>
                            ${isAdmin ? `<button class="secondary admin-live-button" type="button" data-live-stop="${stop.id}">
                                ${active ? "✓ SIAMO QUI" : "SIAMO QUI"}
                            </button>` : ""}
                        </div>
                    </div>
                </div>
            </article>`;
    }).join("");

    document.querySelectorAll("[data-live-stop]").forEach(button => {
        button.addEventListener("click", async () => {
            const stop = bacaroData.stops.find(item => item.id === button.dataset.liveStop);
            if (!stop) return;

            button.disabled = true;
            try {
                await publishBacaroStop(stop);
                document.getElementById("groupLive").scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            } catch (error) {
                alert(currentLang() === "es"
                    ? "No se ha podido actualizar el LIVE."
                    : "Non sono riuscito ad aggiornare il LIVE.");
            } finally {
                button.disabled = false;
            }
        });
    });
}

function renderLive(state) {
    const place = document.getElementById("livePlace");
    const meta = document.getElementById("liveMeta");
    const map = document.getElementById("liveMap");

    currentLiveStopId = state?.currentStop || null;

    if (!state?.currentStop) {
        place.textContent = currentLang() === "es"
            ? "La posición del grupo aparecerá aquí."
            : "La posizione del gruppo apparirà qui.";
        meta.textContent = currentLang() === "es"
            ? "Cuando empiece el tour, aquí verás dónde está el grupo."
            : "Quando inizierà il tour, qui vedrai dove si trova il gruppo.";
        map.classList.add("is-disabled");
        map.setAttribute("aria-disabled", "true");
        map.removeAttribute("href");
        if (bacaroData) renderStops();
        return;
    }

    const stop = bacaroData?.stops.find(item => item.id === state.currentStop);
    const name = stop?.name || state.name || state.currentStop;
    const query = stop?.mapsQuery || state.mapsQuery || name;
    const time = formatLiveTime(state.updatedAt, currentLang());

    place.textContent = name;
    meta.textContent = currentLang() === "es"
        ? `Grupo aquí${time ? ` · actualizado a las ${time}` : ""}`
        : `Il gruppo è qui${time ? ` · aggiornato alle ${time}` : ""}`;

    map.href = googleMapsSearch(query);
    map.classList.remove("is-disabled");
    map.removeAttribute("aria-disabled");

    if (bacaroData) renderStops();
}

function setupAdminUI() {
    const trigger = document.getElementById("adminTrigger");
    const panel = document.getElementById("adminPanel");
    const form = document.getElementById("adminLoginForm");
    const logout = document.getElementById("adminLogout");
    const status = document.getElementById("adminStatus");

    trigger.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        status.textContent = "";
        const email = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value;

        try {
            await adminLogin(email, password);
            form.reset();
            panel.hidden = true;
        } catch (error) {
            status.textContent = currentLang() === "es"
                ? "Acceso no válido."
                : "Accesso non valido.";
        }
    });

    logout.addEventListener("click", async () => {
        await adminLogout();
        panel.hidden = true;
    });

    watchAdmin(admin => {
        isAdmin = admin;
        document.body.classList.toggle("is-admin", admin);
        trigger.textContent = admin ? "ADMIN ✓" : "ADMIN";
        logout.hidden = !admin;
        form.hidden = admin;
        if (bacaroData) renderStops();

        if (admin) {
            startGpsHelper();
        } else {
            stopGpsHelper();
        }
    });
}

function distanceMetres(lat1, lon1, lat2, lon2) {
    const radius = 6371000;
    const toRad = value => value * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function startGpsHelper() {
    if (!("geolocation" in navigator) || gpsWatchId !== null) return;

    gpsWatchId = navigator.geolocation.watchPosition(position => {
        if (!bacaroData || !isAdmin) return;

        const candidates = bacaroData.stops
            .filter(stop => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
            .map(stop => ({
                stop,
                distance: distanceMetres(
                    position.coords.latitude,
                    position.coords.longitude,
                    stop.lat,
                    stop.lng
                )
            }))
            .sort((a, b) => a.distance - b.distance);

        const nearest = candidates[0];
        if (!nearest || nearest.distance > 50) return;
        if (nearest.stop.id === currentLiveStopId) return;
        if (lastGpsSuggestion === nearest.stop.id) return;

        lastGpsSuggestion = nearest.stop.id;
        showGpsSuggestion(nearest.stop, Math.round(nearest.distance));
    }, () => {
        // GPS is only a convenience: manual controls remain available.
    }, {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000
    });
}

function stopGpsHelper() {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    document.getElementById("gpsSuggestion").hidden = true;
}

function showGpsSuggestion(stop, distance) {
    const box = document.getElementById("gpsSuggestion");
    const text = document.getElementById("gpsSuggestionText");
    const confirm = document.getElementById("gpsConfirm");
    const dismiss = document.getElementById("gpsDismiss");

    text.textContent = currentLang() === "es"
        ? `Estás a unos ${distance} m de ${stop.name}. ¿Publicar esta parada?`
        : `Sei a circa ${distance} m da ${stop.name}. Vuoi pubblicare questa tappa?`;

    box.hidden = false;

    confirm.onclick = async () => {
        await publishBacaroStop(stop);
        box.hidden = true;
        document.getElementById("groupLive").scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    };

    dismiss.onclick = () => {
        box.hidden = true;
    };
}

async function initBacaroTour() {
    const response = await fetch("../data/bacaro-tour.json");
    bacaroData = await response.json();

    renderRoute();
    renderStops();
    setupAdminUI();
    watchBacaroLive(renderLive);
}

document.addEventListener("DOMContentLoaded", initBacaroTour);

const originalSetLanguage = window.setLanguage;
window.setLanguage = async function(lang) {
    await originalSetLanguage(lang);
    if (bacaroData) renderStops();
};
