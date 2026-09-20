/* =========================================================
   BORMIO · RISTORANTI
   Mantiene il markup originale previsto da ristoranti.css.
   Gestisce anche ristoranti con data, indirizzo o sito mancanti.
========================================================= */

let restaurantsData = null;

function restaurantLang() {
    return localStorage.getItem("gb_lang") || "it";
}

async function loadRestaurantTranslations() {
    const response = await fetch(`../lang/${restaurantLang()}.json`);
    return response.json();
}

function dateParts(dateString) {
    if (!dateString) {
        return null;
    }

    const [, month, day] = dateString.split("-");

    return {
        day,
        month: month === "02" ? "FEB" : month
    };
}

function restaurantCard(item, translations) {
    const date = dateParts(item.date);

    /*
     * Manteniamo SEMPRE .restaurant-date, perché il CSS originale
     * è costruito su questo badge.
     *
     * Se la data manca, mostriamo soltanto il tipo di pasto.
     */
    const dateBadge = date
        ? `
            <div class="restaurant-date">
                <strong>${date.day}</strong>
                <span>${date.month}</span>
                <span>${translations[item.mealKey] || ""}</span>
            </div>
        `
        : `
            <div class="restaurant-date">
                <span>${translations[item.mealKey] || "PRANZO"}</span>
            </div>
        `;

    const address = item.address
        ? `<p class="restaurant-address">📍 ${item.address}</p>`
        : "";

    const map = item.map
        ? `
            <a href="${item.map}" target="_blank" rel="noopener">
                ${translations["restaurants.map"] || "MAPPA"}
            </a>
        `
        : "";

    const website = item.website
        ? `
            <a class="primary" href="${item.website}" target="_blank" rel="noopener">
                ${translations["restaurants.website"] || "SITO"}
            </a>
        `
        : "";

    return `
        <article class="restaurant-card">
            <div class="restaurant-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                ${dateBadge}
            </div>

            <div class="restaurant-card-content">
                <h3>${item.name}</h3>
                ${address}

                <div class="restaurant-actions">
                    ${map}
                    ${website}
                </div>
            </div>
        </article>
    `;
}

async function renderRestaurants() {
    if (!restaurantsData) {
        const response = await fetch("../data/ristoranti.json");
        restaurantsData = await response.json();
    }

    const translations = await loadRestaurantTranslations();
    const restaurants = restaurantsData.restaurants || [];

    const dinners = restaurants.filter(
        item => item.mealKey === "restaurants.dinner"
    );

    /*
     * Include:
     * - i pranzi già programmati;
     * - le opzioni pranzo sci ancora senza data.
     */
    const lunches = sortDatedFirst(
    restaurants.filter(
        item =>
            item.mealKey === "restaurants.lunch" ||
            item.category === "ski-lunch-option"
    )
   );

    const dinnerContainer = document.getElementById("dinnerRestaurants");
    const lunchContainer = document.getElementById("lunchRestaurants");

    if (dinnerContainer) {
        dinnerContainer.innerHTML = dinners
            .map(item => restaurantCard(item, translations))
            .join("");
    }

    if (lunchContainer) {
        lunchContainer.innerHTML = lunches
            .map(item => restaurantCard(item, translations))
            .join("");
    }
}

document.addEventListener("DOMContentLoaded", renderRestaurants);

const restaurantOriginalSetLanguage = window.setLanguage;

if (typeof restaurantOriginalSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await restaurantOriginalSetLanguage(lang);
        await renderRestaurants();
    };
}

function sortDatedFirst(items) {
    return [...items].sort((a, b) => {
        if (a.date && !b.date) return -1;
        if (!a.date && b.date) return 1;
        if (a.date && b.date) {
            return a.date.localeCompare(b.date);
        }
        return 0;
    });
}
