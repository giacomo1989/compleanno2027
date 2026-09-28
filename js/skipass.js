let skipassData = null;

function getSkipassLang() {
    const saved = localStorage.getItem("gb_lang");
    if (saved === "it" || saved === "es") return saved;
    return navigator.language?.toLowerCase().startsWith("es") ? "es" : "it";
}

function renderSkiSunrise() {
    const target = document.getElementById("skiSunriseCard");
    if (!target || !skipassData?.skiSunrise) return;

    const experience = skipassData.skiSunrise;
    const copy = experience[getSkipassLang()] || experience.it;

    target.innerHTML = `
        <div class="sunrise-image">
            <img src="${experience.image}" alt="${experience.title}">
        </div>
        <div class="sunrise-content">
            <small>${copy.eyebrow}</small>
            <h3>${experience.title}</h3>
            <div class="sunrise-subtitle">${copy.subtitle}</div>
            <p>${copy.description}</p>
            <div class="sunrise-facts">
                ${copy.facts.map(fact => `<div class="sunrise-fact">${fact}</div>`).join("")}
            </div>
            <div class="sunrise-footer">
                <div class="sunrise-date">📅 ${copy.date}</div>
                <div class="sunrise-price">${copy.price}</div>
                <a class="action sunrise-action" href="${experience.url}" target="_blank" rel="noopener">${copy.button}</a>
            </div>
        </div>
    `;
}

async function initSkipass() {
    try {
        const response = await fetch("../data/skipass.json");
        if (!response.ok) throw new Error("skipass.json non disponibile");
        skipassData = await response.json();
        renderSkiSunrise();
    } catch (error) {
        console.error("Impossibile caricare Ski Sunrise:", error);
    }
}

document.addEventListener("DOMContentLoaded", initSkipass);

const originalSetLanguage = window.setLanguage;
window.setLanguage = async function(lang) {
    await originalSetLanguage(lang);
    renderSkiSunrise();
};
