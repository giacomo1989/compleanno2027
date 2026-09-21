const STORAGE_KEY = "gb_whos_who_bormio_v2";

let people = [];
let translations = {};
let state = {
    current: 0,
    score: 0,
    results: {}
};

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

function shuffled(values) {
    return [...values].sort(() => Math.random() - 0.5);
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && typeof saved.current === "number") {
            state = saved;
        }
    } catch (_) {}
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatScore(value) {
    return Number(value).toLocaleString(currentLanguage() === "es" ? "es-ES" : "it-IT");
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

    return `
        <div class="ratings">
            ${rows.map(([icon, labelKey, valueKey]) => `
                <div>
                    <span>${icon} ${t(labelKey)}</span>
                    <b>${stars(person.ratings[valueKey])}</b>
                </div>
            `).join("")}
        </div>
    `;
}

function updateStatus() {
    document.getElementById("score").textContent = formatScore(state.score);
    document.getElementById("characterLabel").textContent = ` ${t("game.character")}`;
    document.getElementById("pointsLabel").textContent = ` / ${people.length} ${t("game.points")}`;
    document.getElementById("resetGame").textContent = t("game.restart");
}

function render() {
    updateStatus();

    if (state.current >= people.length) {
        renderFinal();
        return;
    }

    const person = people[state.current];
    const result = state.results[person.id] || { stage: 1 };

    document.getElementById("progress").textContent =
        `${state.current + 1} / ${people.length}`;

    if (!result.options) {
        result.options = shuffled(person.options);
        state.results[person.id] = result;
        saveState();
    }

    const questionKey =
        result.stage === 1 ? person.question1Key : person.question2Key;

    document.getElementById("game").classList.remove("hidden");
    document.getElementById("game").innerHTML = `
        <article class="game-card">
            <div class="photo ${result.stage === 1 ? "hard" : "soft"}">
                <img src="${person.image}" alt="">
                <span>?</span>
            </div>

            <div class="question">
                <div class="eyebrow">
                    ${t("game.clue")} ${result.stage} · 2
                </div>

                <h2>${t(questionKey)}</h2>

                ${result.stage === 2
                    ? `<p>${t("game.firstWrong")}</p>`
                    : ""
                }

                <div class="answers">
                    ${result.options.map(name => `
                        <button type="button" data-answer="${name}">
                            ${name}
                        </button>
                    `).join("")}
                </div>
            </div>
        </article>
    `;

    document.querySelectorAll("[data-answer]").forEach(button => {
        button.addEventListener("click", () => answer(button.dataset.answer));
    });
}

function answer(name) {
    const person = people[state.current];
    const result = state.results[person.id];

    if (name === person.name) {
        const points = result.stage === 1 ? 1 : 0.5;

        result.status = "guessed";
        result.points = points;
        state.score += points;
        saveState();

        revealPerson(person, result);
        return;
    }

    if (result.stage === 1) {
        result.stage = 2;
        saveState();
        render();
        return;
    }

    result.status = "failed";
    result.points = 0;
    saveState();

    document.getElementById("game").innerHTML = `
        <article class="game-card">
            <div class="photo soft">
                <img src="${person.image}" alt="">
                <span>?</span>
            </div>

            <div class="question">
                <div class="fail">✕ ${t("game.notGuessed")}</div>
                <p>${t("game.hiddenUntilEnd")}</p>
                <button class="next" id="nextPerson" type="button">
                    ${t("game.next")}
                </button>
            </div>
        </article>
    `;

    document.getElementById("nextPerson").addEventListener("click", nextPerson);
}

function revealPerson(person, result) {
    const resultLabel =
        result.points === 1
            ? t("game.firstHit")
            : t("game.secondHit");

    document.getElementById("game").innerHTML = `
        <article class="game-card">
            <div class="photo clear">
                <img src="${person.image}" alt="${person.name}">
            </div>

            <div class="question">
                <div class="success">✓ ${resultLabel}</div>
                <h2 class="name">${person.name}</h2>
                ${ratingBlock(person)}

                <button class="next" id="nextPerson" type="button">
                    ${t("game.next")}
                </button>
            </div>
        </article>
    `;

    document.getElementById("nextPerson").addEventListener("click", nextPerson);
}

function nextPerson() {
    state.current += 1;
    saveState();
    render();
}

function renderFinal() {
    document.getElementById("game").classList.add("hidden");
    document.getElementById("progress").textContent =
        `${people.length} / ${people.length}`;

    const cards = people.map(person => {
        const result = state.results[person.id] || {
            status: "failed",
            points: 0
        };

        const resultLabel =
            result.status === "guessed"
                ? (result.points === 1
                    ? `✓ ${t("game.firstHit")}`
                    : `✓ ${t("game.secondHit")}`)
                : `✕ ${t("game.notGuessed")}`;

        return `
            <article class="final-person ${result.status}">
                <img src="${person.image}" alt="${person.name}">

                <div class="body">
                    <div class="result">${resultLabel}</div>
                    <h3>${person.name}</h3>
                    ${ratingBlock(person)}
                </div>
            </article>
        `;
    }).join("");

    const final = document.getElementById("final");
    final.classList.remove("hidden");
    final.innerHTML = `
        <div class="final-score">
            <small>${t("game.finalResult")}</small>
            <strong>${formatScore(state.score)} / ${people.length}</strong>
            <p>${t("game.finalText")}</p>
        </div>

        <div class="final-grid">
            ${cards}
        </div>
    `;
}

async function refreshGameLanguage() {
    await loadGameTranslations();
    render();
}

document.getElementById("resetGame").addEventListener("click", () => {
    if (window.confirm(t("game.restartConfirm"))) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    }
});

const originalSetLanguage = window.setLanguage;

if (typeof originalSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await originalSetLanguage(lang);
        await refreshGameLanguage();
    };
}

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("../data/whos-who-bormio.json");
    const data = await response.json();

    people = data.participants || [];
    loadState();
    await loadGameTranslations();
    render();
});
