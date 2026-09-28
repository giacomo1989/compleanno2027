(function(){
    const root=document.body.dataset.root||"..";
    const lang=()=>localStorage.getItem("gb_lang")||"it";
    const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
    async function render(){
        const r=await fetch(`${root}/data/numeri-utili-venezia.json`); const data=await r.json();
        const l=data.languages[lang()]||data.languages.it; const box=document.getElementById("veniceUsefulCards");
        box.innerHTML=data.cards.map(c=>{const t=l.cards[c.id];return `<article class="vu-card ${c.id==='coast'?'coast':''}"><div class="vu-card-photo" style="background-image:url('${root}/${c.image}')"></div><div class="vu-card-body"><div class="kicker">${esc(t.kicker)}</div><h2>${esc(t.title)}</h2><p>${esc(t.description)}</p><div class="vu-number">${esc(c.displayPhone)}</div><a class="vu-call" href="tel:${esc(c.phone)}">☎ ${esc(t.call)}</a></div></article>`}).join("");
    }
    document.addEventListener("DOMContentLoaded",render); document.querySelectorAll(".lang button").forEach(b=>b.addEventListener("click",()=>setTimeout(render,0)));
})();
