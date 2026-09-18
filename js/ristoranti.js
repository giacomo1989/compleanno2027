let restaurantsData = null;

function restaurantLang() {
    return localStorage.getItem("gb_lang") || "it";
}

async function loadRestaurantTranslations() {
    const response = await fetch(`../lang/${restaurantLang()}.json`);
    return response.json();
}

function dateParts(dateString) {
    const [, month, day] = dateString.split("-");
    return { day, month: month === "02" ? "FEB" : month };
}

function restaurantCard(item, translations) {
    const date = dateParts(item.date);
    const website = item.website
        ? `<a class="primary" href="${item.website}" target="_blank" rel="noopener">${translations["restaurants.website"]}</a>`
        : "";

    return `
        <article class="restaurant-card">
            <div class="restaurant-image">
                <img src="${item.image}" alt="${item.name}">
                <div class="restaurant-date">
                    <strong>${date.day}</strong>
                    <span>${date.month}</span>
                    <span>${translations[item.mealKey] || ""}</span>
                </div>
            </div>
            <div class="restaurant-card-content">
                <h3>${item.name}</h3>
                <p class="restaurant-address">📍 ${item.address}</p>
                <div class="restaurant-actions">
                    <a href="${item.map}" target="_blank" rel="noopener">${translations["restaurants.map"]}</a>
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
    const dinners = restaurantsData.restaurants.filter(item => item.mealKey === "restaurants.dinner");
    const lunches = restaurantsData.restaurants.filter(item => item.mealKey === "restaurants.lunch");

    document.getElementById("dinnerRestaurants").innerHTML =
        dinners.map(item => restaurantCard(item, translations)).join("");

    document.getElementById("lunchRestaurants").innerHTML =
        lunches.map(item => restaurantCard(item, translations)).join("");
}

document.addEventListener("DOMContentLoaded", renderRestaurants);

const restaurantOriginalSetLanguage = window.setLanguage;
if (typeof restaurantOriginalSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await restaurantOriginalSetLanguage(lang);
        await renderRestaurants();
    };
}
