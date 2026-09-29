const VENICE_DATES = [
    { date: "2027-02-05", day: "05", weekday: { it: "Venerdì", es: "Viernes" } },
    { date: "2027-02-06", day: "06", weekday: { it: "Sabato", es: "Sábado" } },
    { date: "2027-02-07", day: "07", weekday: { it: "Domenica", es: "Domingo" } }
];

let veniceProgramData = null;

function veniceLanguage() {
    return localStorage.getItem("gb_lang") || "it";
}

function localized(value, lang) {
    if (typeof value === "string") return value;
    return value?.[lang] || value?.it || "";
}

async function renderVeniceProgram() {
    if (!veniceProgramData) {
        const response = await fetch("../data/programma-venezia.json");
        veniceProgramData = await response.json();
    }

    const lang = veniceLanguage();
    const month = lang === "es" ? "FEBRERO" : "FEBBRAIO";
    const program = veniceProgramData.venezia || {};
    const container = document.getElementById("veniceProgramDays");

    document.getElementById("veniceProgramTitle").textContent = lang === "es" ? "Programa" : "Programma";
    document.getElementById("veniceProgramNote").textContent = lang === "es"
        ? "TRES DÍAS · VENECIA · CARNAVAL"
        : "TRE GIORNI · VENEZIA · CARNEVALE";

    container.innerHTML = VENICE_DATES.map(dayInfo => {
        const events = program[dayInfo.date] || [];

        const eventHtml = events.map(event => {
            const title = localized(event.title, lang);
            const description = localized(event.description, lang);
            const displayTime = localized(event.displayTime, lang) || event.time;
            const href = event.internalLink || event.map || "";
            const action = localized(event.action, lang) || "MAPS";
            const target = event.internalLink ? "" : 'target="_blank" rel="noopener"';

            return `
                <div class="venice-event ${event.image ? "venice-event-with-image" : ""}">
                    <time>${displayTime}</time>
                    <div class="venice-event-dot"></div>
                    <div class="venice-event-content">
                        <span class="venice-event-icon">${event.icon || ""}</span>
                        <div class="venice-event-text">
                            <strong>${title}</strong>
                            ${description ? `<p>${description}</p>` : ""}
                            ${event.place ? `
                                <div class="venice-event-place-row">
                                    <span class="venice-event-place">${event.place}</span>
                                    ${href ? `
                                        <a class="venice-event-map-button" href="${href}" ${target}>
                                            <span aria-hidden="true">${event.internalLink ? "→" : "📍"}</span>
                                            <span>${action}</span>
                                        </a>
                                    ` : ""}
                                </div>
                            ` : ""}
                            ${event.image ? `<img class="venice-event-image" src="${event.image}" alt="${event.place || title}">` : ""}
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        return `
            <section class="venice-day-card">
                <div class="venice-day-heading">
                    <div class="venice-day-date">
                        <span class="venice-day-number">${dayInfo.day}</span>
                        <span class="venice-day-month">${month}</span>
                    </div>
                    <span class="venice-day-label">${localized(dayInfo.weekday, lang)} ${dayInfo.day} ${month.toLowerCase()}</span>
                </div>
                <div class="venice-timeline">${eventHtml}</div>
            </section>
        `;
    }).join("");
}

document.addEventListener("DOMContentLoaded", renderVeniceProgram);

const originalVeniceSetLanguage = window.setLanguage;
if (typeof originalVeniceSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await originalVeniceSetLanguage(lang);
        await renderVeniceProgram();
    };
}
