const dest="Via Freita 7, Santa Caterina Valfurva SO";
function selectAirport(btn){document.querySelectorAll(".airport").forEach(x=>x.classList.remove("active"));
btn.classList.add("active");
const o=btn.dataset.origin;
document.getElementById("routeOrigin").textContent=btn.querySelector("b").textContent;
document.getElementById("routeMap").src="https://www.google.com/maps?output=embed&saddr="+encodeURIComponent(o)+"&daddr="+encodeURIComponent(dest)+"&dirflg=d";
document.getElementById("routeLink").href="https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(o)+"&destination="+encodeURIComponent(dest)+"&travelmode=driving"}document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll(".airport").forEach(b=>b.onclick=()=>selectAirport(b));
selectAirport(document.querySelector(".airport.active"))});
