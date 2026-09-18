/* =========================================================
   BORMIO · RISTORANTI
   Rendering delle cene e delle opzioni pranzo.
========================================================= */

let restaurantsData = null;

function currentLanguage() {
    return localStorage.getItem("gb_lang") || "it";
}

async function getRestaurantTranslations() {
    const response = await fetch("../lang/" + currentLanguage() + ".json");
    return response.json();
}

function formatRestaurantDate(dateString) {
    if (!dateString) {
        return "";
    }

    const [year, month, day] = dateString.split("-");

    const months = {
        "01": "GEN",
        "02": "FEB",
        "03": "MAR",
        "04": "APR",
        "05": "MAG",
        "06": "GIU",
        "07": "LUG",
        "08": "AGO",
        "09": "SET",
        "10": "OTT",
        "11": "NOV",
        "12": "DIC"
    };

    return day + " " + (months[month] || month);
}

function restaurantCard(item, t) {
    const date = formatRestaurantDate(item.date);

    const metaParts = [];

    if (date) {
        metaParts.push(date);
    }

    if (item.mealKey && t[item.mealKey]) {
        metaParts.push(t[item.mealKey]);
    }

    const meta = metaParts.join(" · ");

    return `
        <article class="restaurant-card">
            <img
                class="restaurant-image"
                src="${item.image}"
                alt="${item.name}"
                loading="lazy"
            >

            <div class="restaurant-card-body">
                ${meta ? `<div class="restaurant-meta">${meta}</div>` : ""}

                <h3>${item.name}</h3>

                ${item.address ? `
                    <p class="restaurant-address">${item.address}</p>
                ` : ""}

                <div class="restaurant-actions">
                    ${item.map ? `
                        <a
                            class="restaurant-action"
                            href="${item.map}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            📍 ${t["restaurants.map"] || "MAPPA"}
                        </a>
                    ` : ""}

                    ${item.website ? `
                        <a
                            class="restaurant-action"
                            href="${item.website}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ↗ ${t["restaurants.website"] || "SITO"}
                        </a>
                    ` : ""}
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

    const t = await getRestaurantTranslations();
    const restaurants = restaurantsData.restaurants || [];

    const dinners = restaurants.filter(
        item => item.mealKey === "restaurants.dinner"
    );

    /*
     * lunchRestaurants contiene:
     * - i pranzi già programmati, come Pizza da Lollo;
     * - le opzioni pranzo sci, anche se non hanno ancora una data.
     */
    const lunches = restaurants.filter(
        item =>
            item.mealKey === "restaurants.lunch" ||
            item.category === "ski-lunch-option"
    );

    const dinnerContainer = document.getElementById("dinnerRestaurants");
    const lunchContainer = document.getElementById("lunchRestaurants");

    if (dinnerContainer) {
        dinnerContainer.innerHTML = dinners
            .map(item => restaurantCard(item, t))
            .join("");
    }

    if (lunchContainer) {
        lunchContainer.innerHTML = lunches
            .map(item => restaurantCard(item, t))
            .join("");
    }
}

document.addEventListener("DOMContentLoaded", renderRestaurants);

/*
 * Se l'utente cambia lingua mentre si trova nella pagina,
 * ridisegniamo anche le card dei ristoranti.
 */
const restaurantsOriginalSetLanguage = window.setLanguage;

if (typeof restaurantsOriginalSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await restaurantsOriginalSetLanguage(lang);
        await renderRestaurants();
    };
}
