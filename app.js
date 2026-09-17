const tripStart=new Date("2027-02-02T15:00:00"),tripEnd=new Date("2027-02-09T18:00:00");let currentCity="bormio";
const DATA={
bormio:{title:"Bormio",dates:"02 — 05 FEBBRAIO 2027",chapter:"THE MOUNTAIN CHAPTER",bg:"images/bormio-bg.jpg",items:[["▣","Programma"],["🚗","Come arrivare & Hotel"],["⛷","Skipass & Noleggio"],["♨","Terme & Après-ski"],["🍴","Ristoranti & Bar"],["▣","Info pratiche"],["☎","Numeri utili"]]},
venezia:{title:"Venezia",dates:"05 — 09 FEBBRAIO 2027",chapter:"THE BIRTHDAY CHAPTER",bg:"images/venezia-bg.jpg",items:[["▣","Programma"],["🚆","Come arrivare & Hotel"],["🍴","Ristoranti & Bar"],["🍷","Bacaro Tour & Mappa"],["▣","Info pratiche"],["☎","Numeri utili"]]}
};
function countdown(){let now=new Date(),el=document.getElementById("countdown"),live=document.getElementById("liveText");if(now<tripStart){let x=tripStart-now,d=Math.floor(x/864e5);x%=864e5;let h=Math.floor(x/36e5);x%=36e5;let m=Math.floor(x/6e4),s=Math.floor((x%6e4)/1000);el.innerHTML=[[d,"GIORNI"],[h,"ORE"],[m,"MIN"],[s,"SEC"]].map(v=>`<div><b>${String(v[0]).padStart(2,"0")}</b><span>${v[1]}</span></div>`).join("");}else if(now<=tripEnd){el.innerHTML="<div style='grid-column:1/-1'><b>LIVE</b><span>IL VIAGGIO È IN CORSO</span></div>";live.textContent="Qui appariranno gli eventi del giorno."}else{el.innerHTML="<div style='grid-column:1/-1'><b>🥂</b><span>SEE YOU NEXT YEAR</span></div>";live.textContent="Giacomo’s Birthday · See you next year 🥂"}}countdown();setInterval(countdown,1000);
function openDestination(city){currentCity=city;let d=DATA[city];document.getElementById("home").classList.add("hidden");let sec=document.getElementById("destination");sec.classList.remove("hidden");sec.className="screen destination-screen "+(city==="venezia"?"venezia-theme":"");document.getElementById("destinationBg").style.backgroundImage=`url("${d.bg}")`;document.getElementById("destinationTitle").textContent=d.title;document.getElementById("destinationDates").textContent=d.dates;document.getElementById("destinationChapter").textContent=d.chapter;document.getElementById("menuGrid").innerHTML=d.items.map(i=>`<button class="menu-item" onclick="${city==='bormio' && i[1]==='Come arrivare & Hotel' ? 'openHotel()' : `openPlaceholder('${i[1].replaceAll("'","")}')`}"><span class="menu-icon">${i[0]}</span><b>${i[1]}</b><small>Apri →</small></button>`).join("");window.scrollTo(0,0)}
function goHome(){document.getElementById("destination").classList.add("hidden");document.getElementById("placeholder").classList.add("hidden");document.getElementById("home").classList.remove("hidden");window.scrollTo(0,0)}
function openPlaceholder(title){document.getElementById("destination").classList.add("hidden");document.getElementById("placeholder").classList.remove("hidden");document.getElementById("placeCity").textContent=DATA[currentCity].title.toUpperCase();document.getElementById("placeTitle").textContent=title;window.scrollTo(0,0)}
function backDestination(){document.getElementById("placeholder").classList.add("hidden");document.getElementById("destination").classList.remove("hidden");window.scrollTo(0,0)}
const HOTEL_DEST="Via Freita 7, Santa Caterina Valfurva SO";
function openHotel(){document.getElementById("destination").classList.add("hidden");document.getElementById("hotelPage").classList.remove("hidden");selectAirport(document.querySelector(".airport.active"));window.scrollTo(0,0)}
function closeHotel(){document.getElementById("hotelPage").classList.add("hidden");document.getElementById("destination").classList.remove("hidden");window.scrollTo(0,0)}
function selectAirport(btn){
 document.querySelectorAll(".airport").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 const origin=btn.dataset.origin,label=btn.querySelector("b").textContent;
 document.getElementById("routeOrigin").textContent=label;
 const q=encodeURIComponent(origin+" to "+HOTEL_DEST);
 document.getElementById("routeMap").src="https://www.google.com/maps?q="+q+"&output=embed";
 document.getElementById("routeLink").href="https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(origin)+"&destination="+encodeURIComponent(HOTEL_DEST)+"&travelmode=driving";
}
