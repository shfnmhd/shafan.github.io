const palette={
  "Chalk":"#ede4d0","Ink":"#3e4f72","Flame":"#ff833d","Moss":"#95a676","Stone":"#c1ad92","Slate":"#657d92","Wine":"#af526b","Sand":"#cb9c71","Night":"#393746","Remote":"#4b8f91","On-site":"#b0854f","Hybrid":"#6877a4"
};
const sets={
 shoes:{label:"Colour",unit:"",items:[
 ["tempo","Tempo 01","Running",96,"A lightweight daily runner with a cushioned ride.","runner",["Flame","Chalk","Ink"]],
 ["arc","Arc Trainer","Training",84,"A stable, low-profile training shoe for gym sessions.","runner",["Ink","Chalk","Slate"]],
 ["ridge","Ridge Runner","Trail",118,"A trail silhouette with a sculpted grip sole and reinforced toe.","trail",["Moss","Stone","Flame"]],
 ["metro","Metro Canvas","Lifestyle",68,"A clean canvas low-top for unplanned afternoons.","court",["Chalk","Wine","Night"]],
 ["drift","Drift Court","Lifestyle",75,"A retro court profile finished with a contrasting heel.","court",["Slate","Chalk","Sand"]],
 ["summit","Summit Trek","Trail",132,"A mid-height trail shoe with a padded ankle and rugged sole.","trail",["Stone","Moss","Ink"]],
 ["pulse","Pulse Sprint","Running",109,"A quick-feeling trainer with a generous heel rocker.","runner",["Flame","Slate","Chalk"]],
 ["base","Base Studio","Training",88,"A flexible studio trainer with a wide stance.","court",["Wine","Night","Chalk"]]]},
 clothing:{label:"Colour",unit:"",items:[
 ["work","Workshop Jacket","Outerwear",124,"An easy-fit chore jacket with generous patch pockets.","jacket",["Wine","Moss","Stone"]],
 ["shell","Harbour Shell","Outerwear",148,"A clean shell silhouette for breezy commutes.","jacket",["Slate","Ink","Sand"]],
 ["crew","Sunday Crew","Tops",54,"A soft, relaxed crew with a slightly cropped hem.","crew",["Chalk","Wine","Moss"]],
 ["rib","Ribbed Long Sleeve","Tops",46,"A neat layering piece with a wide ribbed neck.","crew",["Stone","Slate","Night"]],
 ["pleat","Pleat Trousers","Bottoms",76,"Straight-leg trousers with a roomy front pleat.","pants",["Sand","Night","Moss"]],
 ["studio","Studio Jogger","Bottoms",63,"A softly tapered shape and an elastic waist.","pants",["Slate","Stone","Wine"]],
 ["tote","Field Tote","Accessories",28,"A structured everyday tote with wide handles.","tote",["Moss","Sand","Wine"]],
 ["carry","Market Carryall","Accessories",35,"A fuller tote profile for a weekend market run.","tote",["Stone","Night","Chalk"]]]},
 services:{label:"Format",unit:"From ",items:[
 ["review","Site Review","Web",150,"A guided review of your navigation, clarity, and key page flows.","browser",["Remote","Hybrid"]],
 ["launch","Landing Page Sprint","Web",420,"A small concept sprint for one focused landing page.","browser",["Remote","Hybrid"]],
 ["kit","Brand Starter","Design",290,"A visual direction and a compact set of brand building blocks.","design",["Remote","On-site"]],
 ["story","Storyboarding Session","Design",190,"Plan a product story as a concise sequence of visual beats.","design",["On-site","Hybrid"]],
 ["metrics","Metrics Setup","Analytics",210,"Map the questions and events your website should track.","analytics",["Remote","Hybrid"]],
 ["insights","Dashboard Planning","Analytics",360,"Outline a small dashboard around the decisions you need to make.","analytics",["Remote","On-site"]],
 ["handoff","Project Handoff","Operations",175,"Organise project notes, ownership, and next steps into one handoff.","ops",["Remote","On-site"]],
 ["flow","Workflow Mapping","Operations",240,"Map one recurring workflow and identify where handoffs slow down.","ops",["Hybrid","On-site"]]]}
};
const type=document.body.dataset.catalogue, config=sets[type];
const products=config.items.map(([id,name,group,price,desc,shape,variants])=>({id,name,group,price,desc,shape,variants}));
const get=id=>document.getElementById(id);
const q=get("query"), g=get("group"), v=get("variant"), sort=get("sort");
const result=get("results"), status=get("status"), savedBtn=get("saved"), showAll=get("show-all");
const selected=new Map(), shortlist=new Map(); let onlySaved=false;
get("variant-label").textContent=config.label;
const option=(value,label=value)=>new Option(label,value);
[...new Set(products.map(x=>x.group))].sort().forEach(x=>g.add(option(x)));
[...new Set(products.flatMap(x=>x.variants))].sort().forEach(x=>v.add(option(x)));
const money=new Intl.NumberFormat("en",{style:"currency",currency:"USD",maximumFractionDigits:0});

function art(shape,variant,big=false){
 const c=palette[variant]||"#64a4a4", accent=type==="shoes"?"#ffb365":type==="clothing"?"#8b4960":"#1d6869";
 let motif="";
 if(type==="shoes"){
  const high=shape==="trail",flat=shape==="court";
  const upper=high?"M74 167Q84 150 125 132L161 74Q187 58 208 88L221 112Q233 126 263 136L353 153Q399 162 414 181L409 202H74Z":flat?"M70 174Q86 155 124 149L168 102Q184 84 205 105L223 132Q250 146 330 151Q398 154 415 178L407 202H71Z":"M70 178Q78 159 129 146L161 99Q180 80 207 105L226 135Q260 145 334 154Q394 157 415 177L409 202H69Z";
  motif='<ellipse cx="239" cy="218" rx="172" ry="13" fill="#0c1221" opacity=".46"/><path d="M68 183Q108 190 148 182L390 182Q424 183 419 201L408 209H84Q62 206 68 183Z" fill="#e3dfd6" stroke="#162234" stroke-width="4"/><path d="'+upper+'" fill="'+c+'" stroke="#172334" stroke-width="4"/><path d="M92 176Q132 162 162 153L221 134L270 144L221 155L179 175Z" fill="#283746" opacity=".55"/><path d="M173 128l40 12m-32-25 35 12m-24-23 24 10" stroke="#f4f1ea" stroke-width="4" stroke-linecap="round"/><path d="M81 198h329" stroke="#f6e9d5" stroke-width="3"/>'+(high?'<path d="M101 204v7m28-7v7m28-7v7m166-7v7m31-7v7m31-7v7" stroke="#43516a" stroke-width="4"/>':'');
 }else if(type==="clothing"){
  const lines='stroke="#493d3f" stroke-width="4" stroke-linejoin="round"';
  if(shape==="jacket"||shape==="crew"){
   motif='<path d="M180 58L138 72L85 150L125 175L155 133V215H325V133L355 175L395 150L342 72L300 58Q240 92 180 58Z" fill="'+c+'" '+lines+'/>';
   motif+=shape==="jacket"?'<path d="M184 60l36 35 20-20 23 20 34-35M243 77v138m-63-78h42v34h-42zm78 0h42v34h-42z" fill="none" stroke="#f6e9d7" stroke-width="3"/><path d="M252 111v2m0 17v2m0 16v2m0 18v2" stroke="#443344" stroke-width="4" stroke-linecap="round"/>':'<path d="M187 62Q239 112 292 62M156 199h169m-220-39 22 15m227 0 23-15" fill="none" stroke="#f1e1ce" stroke-width="5"/>';
  }else if(shape==="pants"){
   motif='<path d="M175 60h126l28 155h-68l-24-100-23 100h-67z" fill="'+c+'" '+lines+'/><path d="M176 76h126M237 76v38m-38-27-21 31m99-31 20 31" fill="none" stroke="#f0dac6" stroke-width="3"/>';
  }else{
   motif='<path d="M194 115V82q0-32 44-32t44 32v33" fill="none" stroke="'+c+'" stroke-width="13"/><path d="M156 105h170l-11 106H167z" fill="'+c+'" '+lines+'/><path d="M185 125h110l-5 66H190z" fill="none" stroke="#e7d0bc" stroke-dasharray="5 4" stroke-width="3"/>';
  }
  motif='<ellipse cx="240" cy="218" rx="133" ry="14" fill="#775846" opacity=".19"/>'+motif;
 }else{
  const back='<path d="M110 196l114 35 151-45-117-27z" fill="#3d6570" opacity=".16"/><rect x="141" y="56" width="225" height="143" rx="14" transform="rotate(-8 141 56)" fill="#f4fffa" stroke="#275a63" stroke-width="3"/><rect x="115" y="75" width="230" height="132" rx="13" fill="'+c+'" stroke="#275a63" stroke-width="3"/>';
  const graphic={
   browser:'<path d="M118 102h223m-184 26h76m-76 16h59m-59 16h51" stroke="#f6fffa" stroke-width="5" stroke-linecap="round"/><rect x="248" y="126" width="59" height="47" rx="6" fill="#c6eddc"/>',
   design:'<circle cx="201" cy="141" r="32" fill="#ffe2a8"/><path d="M232 168l36-57 40 57z" fill="#e4f4eb"/><rect x="152" y="108" width="40" height="40" rx="4" fill="#d8d4f4"/>',
   analytics:'<path d="M155 171h150" stroke="#dbf6eb" stroke-width="3"/><path d="M169 164v-36m35 36v-48m36 48v-24m37 24v-55" stroke="#e5f9f0" stroke-width="17"/><path d="M153 125l49-22 34 11 52-19" fill="none" stroke="#ffda8c" stroke-width="3"/>',
   ops:'<path d="M168 152h61m19 0h55" stroke="#eefcf4" stroke-width="4"/><circle cx="164" cy="152" r="17" fill="#ffdfaa"/><rect x="219" y="130" width="41" height="41" rx="8" fill="#cff0e0"/><circle cx="299" cy="152" r="17" fill="#dcd7f3"/>'
  }[shape];motif=back+graphic;
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" aria-hidden="true"><path d="M36 48h30m-30 0v23m408 153h-30m30 0v-22" fill="none" stroke="'+accent+'" stroke-width="2" opacity=".51"/><circle cx="240" cy="132" r="'+(big?113:104)+'" fill="none" stroke="'+accent+'" opacity=".19"/>'+motif+'</svg>';
}
function current(p){const value=selected.get(p.id);return v.value&&p.variants.includes(v.value)&&!onlySaved?v.value:onlySaved?shortlist.get(p.id):p.variants.includes(value)?value:p.variants[0];}
function card(p){
 const pick=current(p), checked=shortlist.has(p.id), id="variant-"+p.id;
 const allowed=v.value?[v.value]:p.variants;
 const ops=allowed.map(x=>'<option'+(x===pick?' selected':'')+'>'+x+'</option>').join('');
 return '<article class="card" data-id="'+p.id+'"><div class="picture">'+art(p.shape,pick)+'<span class="art-mark" aria-hidden="true">'+pick.toUpperCase()+'</span></div><div class="card-content"><p class="meta">'+p.group+'</p><div class="card-title"><h3>'+p.name+'</h3><span class="price">'+config.unit+money.format(p.price)+'</span></div><p class="desc">'+p.desc+'</p><div class="card-actions"><label for="'+id+'">'+config.label+'<select id="'+id+'" data-variant="'+p.id+'" aria-label="'+config.label+' for '+p.name+'">'+ops+'</select></label><button type="button" data-save="'+p.id+'" aria-pressed="'+checked+'" aria-label="'+(checked?'Remove ':'Shortlist ')+p.name+'">'+(checked?'Saved':'Save')+'</button></div></div></article>';
}
function render(){
 const needle=q.value.trim().toLowerCase();
 const found=products.filter(p=>(!onlySaved||shortlist.has(p.id))&&(!g.value||p.group===g.value)&&(!v.value||(onlySaved?shortlist.get(p.id)===v.value:p.variants.includes(v.value)))&&(!needle||[p.name,p.group,p.desc,...p.variants].join(" ").toLowerCase().includes(needle)));
 if(sort.value==="low")found.sort((a,b)=>a.price-b.price);
 if(sort.value==="high")found.sort((a,b)=>b.price-a.price);
 if(sort.value==="name")found.sort((a,b)=>a.name.localeCompare(b.name));
 get("saved-count").textContent=shortlist.size;
 savedBtn.setAttribute("aria-pressed",String(onlySaved));showAll.hidden=!onlySaved;
 status.textContent=found.length+" "+(found.length===1?"result":"results")+(onlySaved?" in shortlist":"");
 result.innerHTML=found.length?found.map(card).join(""):'<div class="empty"><strong>'+(!shortlist.size&&onlySaved?'No items saved yet.':'No matches for these filters.')+'</strong><p>'+(!shortlist.size&&onlySaved?'Return to the catalogue, then save something you like.':'Try a different search or clear the filters.')+'</p></div>';
}
get("filters").addEventListener("submit",e=>e.preventDefault());
get("filters").addEventListener("reset",()=>setTimeout(render,0));
q.addEventListener("input",render);[g,v,sort].forEach(el=>el.addEventListener("change",render));
savedBtn.addEventListener("click",()=>{onlySaved=!onlySaved;render();if(onlySaved)get("catalogue").scrollIntoView();});
showAll.addEventListener("click",()=>{onlySaved=false;render();savedBtn.focus({preventScroll:true});});
result.addEventListener("change",e=>{
 const id=e.target.dataset.variant;if(!id)return;
 const item=products.find(x=>x.id===id), value=e.target.value;
 if(!item||!item.variants.includes(value))return;
 selected.set(id,value);
 if(shortlist.has(id))shortlist.set(id,value);
 const pic=e.target.closest(".card").querySelector(".picture");
 pic.innerHTML=art(item.shape,value)+'<span class="art-mark" aria-hidden="true">'+value.toUpperCase()+'</span>';
});
result.addEventListener("click",e=>{
 const btn=e.target.closest("[data-save]");if(!btn)return;
 const id=btn.dataset.save,p=products.find(x=>x.id===id);if(!p)return;
 if(shortlist.has(id))shortlist.delete(id);else shortlist.set(id,current(p));
 render();(result.querySelector('[data-save="'+id+'"]')||savedBtn).focus({preventScroll:true});
});
get("mast-art").innerHTML=art(products[0].shape,products[0].variants[0],true);
const mast=new Image();mast.alt="";mast.decoding="async";
mast.onload=()=>get("mast-art").replaceChildren(mast);
mast.src=new URL("./mast-"+type+".svg",import.meta.url).href;
render();
