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
    const lang = currentLanguage();
    const response = await fetch(`../lang/${lang}.json`);
    return response.json();
}

async function renderProgram() {
    if (!programData) {
        const response = await fetch("../data/programma.json");
        programData = await response.json();
    }

    const translations = await getTranslations();
    const container = document.getElementById("programDays");
    const bormio = programData.bormio || {};

    container.innerHTML = BORMIO_DATES.map(dayInfo => {
        const events = bormio[dayInfo.date] || [];

        const eventHtml = events.map(event => `
            <div class="event">
                <time>${event.displayTime || event.time}</time>
                <div class="event-dot"></div>
                <div class="event-content">
                    <span class="event-icon">${event.icon || ""}</span>
                    <strong>${translations[event.key] || event.key}</strong>
                </div>
            </div>
        `).join("");

        return `
            <section class="day-card">
                <div class="day-heading">
                    <div>
                        <span class="day-number">${dayInfo.day}</span>
                        <span class="day-month">${translations["program.february"] || "FEBBRAIO"}</span>
                    </div>
                    <span class="day-label">${translations[dayInfo.labelKey] || ""}</span>
                </div>
                <div class="timeline">${eventHtml}</div>
            </section>
        `;
    }).join("");
}

document.addEventListener("DOMContentLoaded", renderProgram);

const originalSetLanguage = window.setLanguage;
if (typeof originalSetLanguage === "function") {
    window.setLanguage = async function(lang) {
        await originalSetLanguage(lang);
        await renderProgram();
    };
}
