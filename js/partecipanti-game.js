const STORAGE_KEY = "gb_whos_who_bormio_v3";

let people = [];
let translations = {};
let activeId = null;
let state = { score: 0, results: {} };

function currentLanguage() {
    return localStorage.getItem("gb_lang") || "it";
}

async function loadGameTranslations() {
    const response = await fetch(`../lang/${currentLanguage()}.json`);
    translations = await response.json();
}

function t(key, fallback = "") {
    return translations[key] !== undefined ? translations[key] : fallback;
}

function shuffle(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && saved.results && typeof saved.score === "number") {
            state = saved;
        }
    } catch (_) {
        state = { score: 0, results: {} };
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatScore(value) {
    return Number(value).toLocaleString(currentLanguage() === "es" ? "es-ES" : "it-IT");
}

function completedCount() {
    return people.filter(person => {
        const result = state.results[person.id];
        return result && (result.status === "guessed" || result.status === "failed");
    }).length;
}

function allCompleted() {
    return people.length > 0 && completedCount() === people.length;
}

function stars(value) {
    return "★".repeat(value) + "☆".repeat(5 - value);
}

function ratingBlock(person) {
    const rows = [
        ["🍾", "game.alcohol", "alcolizzato"],
        ["⛷", "game.sport", "sportivo"],
        ["🔥", "game.crazy", "locura"],
        ["☾", "game.calm", "tranquillo"]
    ];
    return `<div class="ratings">${rows.map(([icon,key,value]) => `
        <div><span>${icon} ${t(key)}</span><b>${stars(person.ratings[value])}</b></div>
    `).join("")}</div>`;
}

function ensureResult(person) {
    if (!state.results[person.id]) {
        state.results[person.id] = {
            stage: 1,
            status: "playing",
            points: 0,
            options: shuffle(person.options)
        };
        saveState();
    }
    return state.results[person.id];
}

function updateStatus() {
    document.getElementById("playedCount").textContent = `${completedCount()} / ${people.length}`;
    document.getElementById("playedLabel").textContent = t("game.played");
    document.getElementById("score").textContent = `${formatScore(state.score)} / ${people.length}`;
    document.getElementById("pointsLabel").textContent = t("game.points");
    document.getElementById("gridInstruction").textContent = t("game.chooseFace");
}

function renderGrid() {
    activeId = null;
    document.getElementById("quizView").classList.add("hidden");
    document.getElementById("gridView").classList.remove("hidden");
    updateStatus();

    const finished = allCompleted();

    document.getElementById("peopleGrid").innerHTML = people.map((person, index) => {
        const result = state.results[person.id];

        let cssClass = "unplayed";
        let name = "???";
        let status = t("game.unplayed");
        let disabled = "";

        if (result && result.status === "guessed") {
            cssClass = "guessed";
            name = person.name;
            status = result.points === 1
                ? `✓ ${t("game.firstHit")}`
                : `✓ ${t("game.secondHit")}`;
            disabled = "disabled";
        } else if (result && result.status === "failed") {
            cssClass = "failed";
            name = finished ? person.name : "???";
            status = `✕ ${t("game.notGuessed")}`;
            disabled = "disabled";
        }

        if (finished) {
            disabled = "disabled";
        }

        return `
            <button
                class="person-tile ${cssClass} ${finished ? "game-finished" : ""}"
                type="button"
                data-person="${person.id}"
                ${disabled}
                aria-label="${name === "???" ? `${t("game.character")} ${index + 1}` : name}"
            >
                <div class="tile-photo">
                    <img src="${person.image}" alt="${finished || result?.status === "guessed" ? person.name : ""}">
                    <span class="mystery">?</span>
                </div>

                <div class="tile-body">
                    <span class="tile-name">${name}</span>
                    <span class="tile-status">${status}</span>
                </div>
            </button>
        `;
    }).join("");

    document.querySelectorAll("[data-person]:not([disabled])").forEach(button => {
        button.addEventListener("click", () => openPerson(button.dataset.person));
    });

    if (finished) {
        document.getElementById("gridInstruction").textContent = t("game.finalText");
    }
}

function openPerson(id) {
    const person = people.find(p => p.id === id);
    if (!person) return;
    const existing = state.results[id];
    if (existing && ["guessed","failed"].includes(existing.status)) return;
    activeId = id;
    ensureResult(person);
    renderQuiz();
}

function renderQuiz() {
    const person = people.find(p => p.id === activeId);
    if (!person) return renderGrid();
    const result = ensureResult(person);
    const key = result.stage === 1 ? person.question1Key : person.question2Key;

    document.getElementById("gridView").classList.add("hidden");
    const quiz = document.getElementById("quizView");
    quiz.classList.remove("hidden");
    quiz.innerHTML = `<article class="quiz-card">
        <div class="quiz-photo ${result.stage === 1 ? "hard" : "soft"}">
            <img src="${person.image}" alt=""><span class="mystery">?</span>
        </div>
        <div class="quiz-content">
            <div class="eyebrow">${t("game.clue")} ${result.stage} · 2</div>
            <h2>${t(key)}</h2>
            ${result.stage === 2 ? `<p>${t("game.firstWrong")}</p>` : ""}
            <div class="answers">${result.options.map(name =>
                `<button type="button" data-answer="${name}">${name}</button>`).join("")}
            </div>
        </div>
    </article>`;

    quiz.querySelectorAll("[data-answer]").forEach(button => {
        button.addEventListener("click", () => answer(button.dataset.answer));
    });
}

function answer(name) {
    const person = people.find(p => p.id === activeId);
    if (!person) return;
    const result = ensureResult(person);

    if (name === person.name) {
        const points = result.stage === 1 ? 1 : 0.5;
        result.status = "guessed";
        result.points = points;
        state.score += points;
        saveState();
        renderReveal(person,result);
    } else if (result.stage === 1) {
        result.stage = 2;
        saveState();
        renderQuiz();
    } else {
        result.status = "failed";
        result.points = 0;
        saveState();
        renderFailure(person);
    }
}

function renderReveal(person,result) {
    const label = result.points === 1 ? t("game.firstHit") : t("game.secondHit");
    document.getElementById("quizView").innerHTML = `<article class="quiz-card">
        <div class="quiz-photo clear"><img src="${person.image}" alt="${person.name}"></div>
        <div class="quiz-content">
            <div class="result-line success">✓ ${label}</div>
            <h2>${person.name}</h2>
            ${ratingBlock(person)}
            <button class="quiz-action" id="backToGrid" type="button">${t("game.backGrid")}</button>
        </div>
    </article>`;
    document.getElementById("backToGrid").addEventListener("click",renderGrid);
}

function renderFailure(person) {
    document.getElementById("quizView").innerHTML = `<article class="quiz-card">
        <div class="quiz-photo soft"><img src="${person.image}" alt=""><span class="mystery">?</span></div>
        <div class="quiz-content">
            <div class="result-line fail">✕ ${t("game.notGuessed")}</div>
            <p>${t("game.hiddenUntilEnd")}</p>
            <button class="quiz-action" id="backToGrid" type="button">${t("game.backGrid")}</button>
        </div>
    </article>`;
    document.getElementById("backToGrid").addEventListener("click",renderGrid);
}


async function refreshGameLanguage() {
    await loadGameTranslations();

    if (activeId) {
        const person = people.find(item => item.id === activeId);
        const result = person ? state.results[person.id] : null;

        if (person && result && result.status === "guessed") {
            renderReveal(person, result);
        } else if (person && result && result.status === "failed") {
            renderFailure(person);
        } else {
            renderQuiz();
        }
    } else {
        renderGrid();
    }
}


const originalSetLanguage = window.setLanguage;
if (typeof originalSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await originalSetLanguage(lang);
        await refreshGameLanguage();
    };
}

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("../data/whos-who-bormio.json");
    people = (await response.json()).participants || [];
    loadState();
    await loadGameTranslations();
    renderGrid();
});
