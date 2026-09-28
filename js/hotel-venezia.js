let hotelVeniceData = null;
let activeArrivalId = "airport";
let activeOptionId = null;

const icons = {
    airport: "✈️",
    station: "🚆",
    roma: "🚌",
    alilaguna: "🚤",
    "bus-vaporetto": "🚌",
    walk: "🚶",
    vaporetto: "🚤",
    "water-taxi": "🚕"
};

function lang() {
    return localStorage.getItem("gb_lang") === "es" ? "es" : "it";
}

async function translations() {
    const root = document.body.dataset.root || ".";
    const response = await fetch(`${root}/lang/${lang()}.json`);
    return response.json();
}

function mapsEmbed(option) {
    const origin = encodeURIComponent(option.origin);
    const destinationText = option.waypoint
        ? `${option.waypoint} to: ${option.destination}`
        : option.destination;
    const destination = encodeURIComponent(destinationText);
    const mode = option.travelMode === "walking" ? "w" : "r";
    return `https://www.google.com/maps?output=embed&saddr=${origin}&daddr=${destination}&dirflg=${mode}`;
}

function mapsLink(option) {
    const waypoint = option.waypoint ? `&waypoints=${encodeURIComponent(option.waypoint)}` : "";
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(option.origin)}&destination=${encodeURIComponent(option.destination)}&travelmode=${option.travelMode || "transit"}${waypoint}`;
}

async function renderArrival() {
    const t = await translations();
    const arrival = hotelVeniceData.arrivals.find(item => item.id === activeArrivalId) || hotelVeniceData.arrivals[0];
    if (!activeOptionId || !arrival.options.some(option => option.id === activeOptionId)) {
        activeOptionId = arrival.options[0].id;
    }

    const tabs = document.getElementById("arrivalTabs");
    tabs.innerHTML = hotelVeniceData.arrivals.map(item => `
        <button class="arrival-tab ${item.id === arrival.id ? "active" : ""}" data-arrival="${item.id}">
            <strong>${icons[item.id] || "📍"} ${t[item.labelKey] || item.id}</strong>
            <small>${item.subLabel}</small>
        </button>
    `).join("");

    tabs.querySelectorAll(".arrival-tab").forEach(button => {
        button.addEventListener("click", () => {
            activeArrivalId = button.dataset.arrival;
            activeOptionId = null;
            renderArrival();
        });
    });

    const options = document.getElementById("transportOptions");
    options.innerHTML = arrival.options.map(option => `
        <article class="transport-option ${option.id === activeOptionId ? "active" : ""}" data-option="${option.id}" tabindex="0" role="button">
            ${option.badgeKey ? `<span class="option-badge">${t[option.badgeKey] || ""}</span>` : ""}
            <span class="option-icon">${icons[option.id] || "📍"}</span>
            <h3>${t[option.titleKey] || option.id}</h3>
            <p>${t[option.descriptionKey] || ""}</p>
            <span class="option-meta">${t[option.metaKey] || ""}</span>
            <div class="option-actions">
                <div class="option-primary-actions">
                    <a class="option-route-link" href="${mapsLink(option)}" target="_blank" rel="noopener">📍 ${t["veniceHotel.openRoute"] || "APRI PERCORSO"}</a>
                    ${option.infoUrl ? `<a class="option-info-link" href="${option.infoUrl}" target="_blank" rel="noopener">ⓘ INFO</a>` : ""}
                </div>
                ${option.ticketUrl ? `<a class="option-ticket-link" href="${option.ticketUrl}" target="_blank" rel="noopener">🎟 ${t["veniceHotel.buyTicket"] || "ACQUISTA BIGLIETTO"}</a>` : ""}
            </div>
        </article>
    `).join("");

    options.querySelectorAll(".transport-option").forEach(card => {
        const selectCard = () => {
            activeOptionId = card.dataset.option;
            renderArrival();
        };
        card.addEventListener("click", event => {
            if (event.target.closest("a")) return;
            selectCard();
        });
        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectCard();
            }
        });
    });

    const selected = arrival.options.find(option => option.id === activeOptionId) || arrival.options[0];
    document.getElementById("selectedRouteLabel").textContent = `${t[arrival.labelKey]} → ${t[selected.titleKey]}`;
    document.getElementById("selectedRouteMeta").textContent = t[selected.metaKey] || "";
    document.getElementById("veniceRouteMap").src = mapsEmbed(selected);
}

document.addEventListener("DOMContentLoaded", async () => {
    const root = document.body.dataset.root || ".";
    const response = await fetch(`${root}/data/hotel-venezia.json`);
    hotelVeniceData = await response.json();
    await renderArrival();

    document.querySelectorAll(".lang button").forEach(button => {
        button.addEventListener("click", () => setTimeout(renderArrival, 80));
    });
});
