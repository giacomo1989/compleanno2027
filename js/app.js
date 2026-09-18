const tripStart = new Date("2027-02-02T15:00:00");
const tripEnd = new Date("2027-02-09T18:00:00");

function localDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function updateCountdown() {
    const element = document.querySelector(".countgrid");
    if (!element) return;

    const now = new Date();

    if (now < tripStart) {
        let remaining = tripStart - now;
        const days = Math.floor(remaining / 86400000);
        remaining %= 86400000;
        const hours = Math.floor(remaining / 3600000);
        remaining %= 3600000;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        element.innerHTML = [
            [days, "D"], [hours, "H"], [minutes, "M"], [seconds, "S"]
        ].map(value => `
            <div>
                <b>${String(value[0]).padStart(2, "0")}</b>
                <span>${value[1]}</span>
            </div>
        `).join("");
    } else if (now <= tripEnd) {
        element.innerHTML = '<div style="grid-column:1/-1"><b>LIVE</b></div>';
    } else {
        element.innerHTML = '<div style="grid-column:1/-1"><b>🥂</b></div>';
    }
}

async function renderLive() {
    const live = document.querySelector(".live");
    if (!live) return;

    const lang = localStorage.getItem("gb_lang") || "it";
    const [programResponse, translationResponse] = await Promise.all([
        fetch("data/programma.json"),
        fetch(`lang/${lang}.json`)
    ]);

    const program = await programResponse.json();
    const t = await translationResponse.json();
    const events = program.bormio?.[localDateKey()] || [];

    live.innerHTML = `
        <div class="smallcap">${t["live.today"] || "LIVE"}</div>
        ${events.length ? `
            <div class="live-events">
                ${events.map(event => `
                    <div class="live-event">
                        <b>${event.displayTime || event.time}</b>
                        <span>
                            ${event.icon || ""} ${t[event.key] || event.key}
                            ${event.place ? `<small class="live-place">${event.place}</small>` : ""}
                        </span>
                    </div>
                `).join("")}
            </div>
        ` : ""}
    `;
}

updateCountdown();
setInterval(updateCountdown, 1000);
document.addEventListener("DOMContentLoaded", renderLive);
