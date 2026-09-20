const BORMIO_DATES = [
    { date: "2027-02-02", day: "02", labelKey: "program.day2.label" },
    { date: "2027-02-03", day: "03", labelKey: "program.skiDay" },
    { date: "2027-02-04", day: "04", labelKey: "program.skiDay" },
    { date: "2027-02-05", day: "05", labelKey: "program.day5.label" }
];

let programData = null;

function currentLanguage() {
    return localStorage.getItem("gb_lang") || "it";
}

async function getTranslations() {
    const response = await fetch(`../lang/${currentLanguage()}.json`);
    return response.json();
}

async function renderProgram() {
    if (!programData) {
        const response = await fetch("../data/programma.json");
        programData = await response.json();
    }

    const t = await getTranslations();
    const bormio = programData.bormio || {};
    const container = document.getElementById("programDays");

    container.innerHTML = BORMIO_DATES.map(dayInfo => {
        const events = bormio[dayInfo.date] || [];

        const eventHtml = events.map(event => `
            <div class="event ${event.place && event.image ? "event-with-place" : ""}">
                <time>${event.displayTime || event.time}</time>
                <div class="event-dot"></div>

                <div class="event-content">
                    <span class="event-icon">${event.icon || ""}</span>

                    <div class="event-text">
                        <strong>${t[event.key] || event.key}</strong>

                        ${event.place ? `
                            <div class="event-place-row">
                                <span class="event-place">${event.place}</span>

                                ${event.map ? `
                                    <a
                                        class="event-map-button"
                                        href="${event.map}"
                                        target="_blank"
                                        rel="noopener"
                                        aria-label="Apri ${event.place} in Google Maps"
                                    >
                                        <span aria-hidden="true">📍</span>
                                        <span>MAPS</span>
                                    </a>
                                ` : ""}
                            </div>
                        ` : ""}

                        ${event.place && event.image ? `
                            <img
                                class="event-place-image"
                                src="${event.image}"
                                alt="${event.place}"
                            >
                        ` : ""}
                    </div>
                </div>
            </div>
        `).join("");

        return `
            <section class="day-card">
                <div class="day-heading">
                    <div>
                        <span class="day-number">${dayInfo.day}</span>
                        <span class="day-month">${t["program.february"] || "FEBBRAIO"}</span>
                    </div>

                    <span class="day-label">${t[dayInfo.labelKey] || ""}</span>
                </div>

                <div class="timeline">${eventHtml}</div>
            </section>
        `;
    }).join("");
}

document.addEventListener("DOMContentLoaded", renderProgram);

const programOriginalSetLanguage = window.setLanguage;

if (typeof programOriginalSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await programOriginalSetLanguage(lang);
        await renderProgram();
    };
}
