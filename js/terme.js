let spaData = null;
let spaTranslations = {};

function spaLang() {
    return localStorage.getItem("gb_lang") || "it";
}

async function loadSpaTranslations() {
    const response = await fetch(`../lang/${spaLang()}.json`);
    spaTranslations = await response.json();
}

function spaT(key) {
    return spaTranslations[key] || key;
}

function venueCard(item) {
    const websiteButton = item.website
        ? `
            <a class="venue-button" href="${item.website}" target="_blank" rel="noopener">
                ◉ ${spaT("spa.website")}
            </a>
        `
        : "";

    return `
        <article class="venue-card">
            <div class="venue-photo">
                <img src="${item.image}" alt="${item.name}">
                ${item.area ? `<span class="area-badge">${item.area}</span>` : ""}
            </div>

            <div class="venue-content">
                <h3>${item.name}</h3>
                <p>${spaT(item.descriptionKey)}</p>

                <div class="venue-location">⌖ ${item.location}</div>

                <div class="venue-actions ${item.website ? "" : "single-action"}">
                    ${websiteButton}
                    <a class="venue-button" href="${item.maps}" target="_blank" rel="noopener">
                        ⌖ ${spaT("spa.maps")}
                    </a>
                </div>
            </div>
        </article>
    `;
}

function renderSpaPage() {
    if (!spaData) {
        return;
    }

    document.getElementById("spaGrid").innerHTML =
        spaData.spa.map(venueCard).join("");

    document.getElementById("apresGrid").innerHTML =
        spaData.apresSki.map(venueCard).join("");
}

async function refreshSpaLanguage() {
    await loadSpaTranslations();
    renderSpaPage();
}

const originalSpaSetLanguage = window.setLanguage;

if (typeof originalSpaSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await originalSpaSetLanguage(lang);
        await refreshSpaLanguage();
    };
}

document.addEventListener("DOMContentLoaded", async () => {
    const [dataResponse] = await Promise.all([
        fetch("../data/terme.json"),
        loadSpaTranslations()
    ]);

    spaData = await dataResponse.json();
    renderSpaPage();
});
