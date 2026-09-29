let veneziaRestaurants = null;

function currentRestaurantLanguage() {
    return localStorage.getItem("gb_lang") === "es" ? "es" : "it";
}

async function renderVeneziaRestaurants() {
    if (!veneziaRestaurants) {
        const response = await fetch("../data/ristoranti-venezia.json");
        veneziaRestaurants = await response.json();
    }

    const lang = currentRestaurantLanguage();
    const container = document.getElementById("veneziaRestaurantList");
    if (!container) return;

    const labels = lang === "es"
        ? { map: "MAPA", website: "SITIO WEB", title: "Restaurantes", subtitle: "Nuestra selección de restaurantes en Venecia." }
        : { map: "MAPPA", website: "SITO WEB", title: "Ristoranti", subtitle: "La nostra selezione di ristoranti a Venezia." };

    document.getElementById("veneziaRestaurantsTitle").textContent = labels.title;
    document.getElementById("veneziaRestaurantsSubtitle").textContent = labels.subtitle;

    container.innerHTML = veneziaRestaurants.restaurants.map(item => `
        <article class="vr-card">
            <div class="vr-photo">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <div class="vr-date-badge" aria-label="${item.day} ${item.month} ${item.meal[lang]}">
                    <strong>${item.day}</strong>
                    <span>${item.month}</span>
                    <span>${item.meal[lang]}</span>
                </div>
            </div>
            <div class="vr-content">
                <h2>${item.name}</h2>
                <div class="vr-area">📍 ${item.area}</div>
                <div class="vr-tags">${item.tags[lang].map(tag => `<span>${tag}</span>`).join("")}</div>
                <p>${item.description[lang]}</p>
                <div class="vr-actions">
                    <a class="vr-primary" href="${item.map}" target="_blank" rel="noopener">📍 ${labels.map} <span>›</span></a>
                    <a class="vr-secondary" href="${item.website}" target="_blank" rel="noopener">🌐 ${labels.website} <span>›</span></a>
                </div>
            </div>
        </article>
    `).join("");
}

document.addEventListener("DOMContentLoaded", renderVeneziaRestaurants);

const originalSetLanguageRestaurantsVenezia = window.setLanguage;
if (typeof originalSetLanguageRestaurantsVenezia === "function") {
    window.setLanguage = async function(lang) {
        await originalSetLanguageRestaurantsVenezia(lang);
        await renderVeneziaRestaurants();
    };
}
