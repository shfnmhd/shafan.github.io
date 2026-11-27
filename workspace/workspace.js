(() => {
  "use strict";
  const EDITOR_VERSION=2, KEY="shfn.visual-workspace.v2", LEGACY="shfn.private-design-workspace.v1";
  const TYPES={hero:"Hero",features:"Features",text:"Text",cta:"Call to action"};
  const TONES={deep:"Deep",surface:"Surface",accent:"Accent"};
  const ALIGNS={left:"Left",center:"Centered",right:"Right"};
  const FONTS={sans:"Inter, system-ui, sans-serif",mono:"ui-monospace, Consolas, monospace",serif:"Georgia, serif"};
  const SPACES={compact:".8",standard:"1",airy:"1.28"};
  const DEVICES={desktop:"Desktop",tablet:"Tablet",mobile:"Mobile"};
  const PALETTES={
    deep:{name:"Deep Field",accent:"#a4ebe5",page:"#0b1020",deep:"#11182e",surface:"#1b2540"},
    solar:{name:"Solar Flare",accent:"#ffd19a",page:"#190f1a",deep:"#2c1a27",surface:"#3b2530"},
    ion:{name:"Ion Bloom",accent:"#c9baff",page:"#130f27",deep:"#1f1835",surface:"#302446"},
    lunar:{name:"Lunar Slate",accent:"#a8d8ff",page:"#0c1622",deep:"#142235",surface:"#22354a"}
  };
  const ITEMS={
    hero:{eyebrow:"INTRODUCING",heading:"A clearer way to tell your story.",body:"Introduce what you do, who it helps, and what someone should do next.",button:"Explore the page",tone:"deep"},
    features:{eyebrow:"WHAT YOU GET",heading:"Make the essentials easy to see.",body:"Give each benefit a short title and an explanation.",tone:"surface",items:[
      {heading:"Clear direction",body:"Help visitors see what matters first."},
      {heading:"Flexible structure",body:"Change the sections as the story evolves."},
      {heading:"Thoughtful detail",body:"Keep the design readable on smaller screens."}
    ]},
    text:{eyebrow:"THE STORY",heading:"A little more context.",body:"Explain what makes this work valuable. A short paragraph is a good starting point.",tone:"surface"},
    cta:{eyebrow:"NEXT STEP",heading:"Ready to take the next step?",body:"Tell the reader what to do after they’ve seen the page.",button:"Back to top",tone:"accent"}
  };
  const required=["editor-canvas","editor-outline","editor-inspector","editor-status","editor-page-title","global-accent","global-font","global-spacing","editor-store","editor-load","editor-new","editor-export-html","editor-undo","editor-redo","editor-preview"];
  const optional=["editor-drafts","editor-export-json","editor-import-json","editor-device-indicator"];
  const ui=Object.fromEntries([...required,...optional].map(k=>[k,document.getElementById(k)]));
  if(required.some(k=>!ui[k]))return;
  const $=k=>ui[k];
  function known(map,key){return typeof key==="string"&&Object.prototype.hasOwnProperty.call(map,key);}
  const copy=value=>JSON.parse(JSON.stringify(value));
  const limit=(v,len,fallback="")=>typeof v==="string"?v.slice(0,len):fallback;
  const escape=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const validColor=v=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v);
  const idOK=v=>typeof v==="string"&&/^[a-z][a-z0-9-]{0,58}$/.test(v);
  let counter=0;
  const makeId=(prefix="section")=>prefix+"-"+Date.now().toString(36)+"-"+(++counter).toString(36);
  const defaults={version:EDITOR_VERSION,title:"Untitled site",accent:"#a4ebe5",font:"sans",spacing:"standard",palette:"deep"};
  function newSection(type){
    const p=ITEMS[type];
    return {id:makeId(),type,tone:p.tone,align:type==="cta"?"center":"left",eyebrow:p.eyebrow,heading:p.heading,body:p.body,button:p.button||"",items:copy(p.items||[])};
  }
  function fresh(isSample=true){
    return {...defaults,id:makeId("site"),title:isSample?"Studio concept":"Untitled site",sections:(isSample?["hero","features","cta"]:["hero"]).map(newSection)};
  }
  function normalise(raw,{renew=false}={}){
    if(!raw||raw.version!==EDITOR_VERSION||!Array.isArray(raw.sections)||raw.sections.length>30)return null;
    const ids=new Set(),sections=[];
    for(const row of raw.sections){
      if(!row||!known(TYPES,row.type))return null;
      const p=ITEMS[row.type];
      let id=idOK(row.id)&&row.id!=="top"&&!ids.has(row.id)?row.id:makeId();
      while(ids.has(id))id=makeId();
      ids.add(id);
      const items=row.type==="features"?[0,1,2].map(i=>{
        const a=Array.isArray(row.items)?row.items[i]:null;return {heading:limit(a?.heading,63,p.items[i].heading),body:limit(a?.body,180,p.items[i].body)};
      }):[];
      sections.push({id,type:row.type,tone:known(TONES,row.tone)?row.tone:p.tone,align:known(ALIGNS,row.align)?row.align:"left",
        eyebrow:limit(row.eyebrow,55),heading:limit(row.heading,110),body:limit(row.body,620),button:limit(row.button,52),items});
    }
    return {version:EDITOR_VERSION,id:!renew&&idOK(raw.id)?raw.id:makeId("site"),
      title:limit(raw.title,68,defaults.title),accent:validColor(raw.accent)?raw.accent.toLowerCase():defaults.accent,
      font:known(FONTS,raw.font)?raw.font:defaults.font,spacing:known(SPACES,raw.spacing)?raw.spacing:defaults.spacing,
      palette:known(PALETTES,raw.palette)?raw.palette:defaults.palette,sections};
  }
  function ink(hex){
    const lin=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
    const rgb=[1,3,5].map(i=>lin(parseInt(hex.slice(i,i+2),16)/255));
    const lum=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
    return 1.05/(lum+.05)>=(lum+.05)/.05?"#ffffff":"#000000";
  }
  function readShelf(){
    try{
      const value=JSON.parse(localStorage.getItem(KEY)||"{}");
      const docs=(Array.isArray(value?.docs)?value.docs:[]).slice(0,12).map(x=>normalise(x)).filter(Boolean);
      return {docs,last:idOK(value?.last)?value.last:null,blocked:false};
    }catch(err){return {docs:[],last:null,blocked:!(err instanceof SyntaxError)};}
  }
  function saveShelf(next){
    try{localStorage.setItem(KEY,JSON.stringify({docs:next,last:doc.id}));return true;}catch{return false;}
  }
  function legacy(){
    try{
      const old=JSON.parse(localStorage.getItem(LEGACY)||"null");
      if(!old||old.version!==1||typeof old.headline!=="string"||typeof old.cta!=="string")return null;
      const migrated=fresh();migrated.title="Earlier concept";
      migrated.sections[0].heading=limit(old.headline,100);
      migrated.sections[0].button=limit(old.cta,32);
      if(validColor(old.accent))migrated.accent=old.accent.toLowerCase();
      if(old.layout==="center")migrated.sections[0].align="center";
      return migrated;
    }catch{return null;}
  }
  let shelf=readShelf(),doc=shelf.docs.find(x=>x.id===shelf.last)||shelf.docs[0]||legacy()||fresh();
  doc=copy(doc);
  let selected=doc.sections[0]?.id||null,device="desktop",back=[],forward=[],priorGroup="",priorAt=0;
  function status(text,kind="info"){$("editor-status").textContent=text;$("editor-status").dataset.kind=kind;}
  function section(){return doc.sections.find(s=>s.id===selected);}
  function snapshot(){return {doc:copy(doc),selected};}
  function record(group=""){
    const now=Date.now();
    if(!group||group!==priorGroup||now-priorAt>820){back.push(snapshot());if(back.length>60)back.shift();}
    priorGroup=group;priorAt=now;forward=[];
  }
  function historyButtons(){$("editor-undo").disabled=!back.length;$("editor-redo").disabled=!forward.length;}
  function restore(entry){
    doc=copy(entry.doc);selected=entry.selected;priorGroup="";render();
  }
  function undo(){
    if(!back.length)return;
    forward.push(snapshot());restore(back.pop());status("Last edit undone.");
  }
  function redo(){
    if(!forward.length)return;
    back.push(snapshot());restore(forward.pop());status("Edit restored.");
  }
  function previewFix(){
    $("editor-preview").dataset.device=device;
    $("editor-canvas").dataset.spacing=doc.spacing;
    const indicator=$("editor-device-indicator");
    if(indicator)indicator.textContent={desktop:"Desktop · fluid",tablet:"Tablet · up to 768 px",mobile:"Mobile · up to 390 px"}[device];
    for(const el of document.querySelectorAll("button[data-device]")){
      el.setAttribute("aria-pressed",String(el.dataset.device===device));
    }
  }
  function art(){return `<div class="builder-art" aria-hidden="true"><svg viewBox="0 0 280 190" focusable="false"><rect x="39" y="24" width="202" height="143" rx="13" fill="none" stroke="currentColor" opacity=".62"/><path d="M40 54h200m-165-15h.1m12 0h.1m12 0h.1" stroke="currentColor" stroke-linecap="round" opacity=".75"/><rect x="55" y="70" width="112" height="46" rx="5" fill="currentColor" opacity=".18"/><rect x="175" y="70" width="50" height="78" rx="5" fill="currentColor" opacity=".25"/><path d="M63 80h57m-57 10h83m-83 11h31m-31 31h99M63 141h67" stroke="currentColor" stroke-linecap="round" opacity=".71"/></svg></div>`;}
  function htmlSection(s,i,all,preview=false){
    const headline=s.heading.trim()|| (preview?"Your heading":TYPES[s.type]);
    const tag=i===0&&!preview?"h1":"h2";
    const heading=`<${tag} class="builder-heading">${escape(headline)}</${tag}>`;
    const text=s.body.trim()?`<p class="builder-body">${escape(s.body)}</p>`:"";
    const eyebrow=s.eyebrow.trim()?`<p class="builder-eyebrow">${escape(s.eyebrow)}</p>`:"";
    const target=i+1<all.length?"#"+all[i+1].id:"#top";
    const btn=s.button.trim()&&(s.type==="hero"||s.type==="cta")?(preview?`<span class="builder-cta">${escape(s.button)}</span>`:`<a class="builder-cta" href="${escape(target)}">${escape(s.button)}</a>`):"";
    const features=s.type==="features"?`<div class="builder-feature-grid">${s.items.map((f,j)=>`<article class="builder-feature"><span aria-hidden="true">0${j+1}</span><h3>${escape(f.heading||"Feature")}</h3><p>${escape(f.body)}</p></article>`).join("")}</div>`:"";
    const edit=preview?` data-section-id="${escape(s.id)}" data-selected="${selected===s.id}" tabindex="0"`:` id="${escape(s.id)}"`;
    return `<section class="builder-section" data-type="${s.type}" data-tone="${s.tone}" data-align="${s.align}"${edit}><div class="builder-content">${eyebrow}${heading}${text}${btn}</div>${s.type==="hero"?art():""}${features}</section>`;
  }
  function renderCanvas(){
    const el=$("editor-canvas");
    el.style.setProperty("--builder-accent",doc.accent);
    el.style.setProperty("--builder-accent-ink",ink(doc.accent));
    el.style.setProperty("--builder-font",FONTS[doc.font]);
    el.style.setProperty("--builder-space",SPACES[doc.spacing]);
    const colors=PALETTES[doc.palette];
    el.style.setProperty("--builder-page-bg",colors.page);
    el.style.setProperty("--builder-deep",colors.deep);
    el.style.setProperty("--builder-surface",colors.surface);
    for(const chip of document.querySelectorAll("button[data-accent-preset]")){
      chip.setAttribute("aria-pressed",String(chip.dataset.accentPreset?.toLowerCase()===colors.accent&&doc.accent===colors.accent));
    }
    el.dataset.spacing=doc.spacing;
    el.innerHTML=doc.sections.map((s,i)=>htmlSection(s,i,doc.sections,true)).join("")||'<p class="builder-empty">No sections yet. Add one to start building.</p>';
    previewFix();
  }
  function outlineAction(action,visible,name,id,disabled=false){
    return `<button class="outline-action" type="button" data-action="${action}" data-section="${escape(id)}" title="${name}" aria-label="${name}"${disabled?" disabled":""}>${visible}</button>`;
  }
  function renderOutline(){
    $("editor-outline").innerHTML=doc.sections.map((s,i)=>
      `<div class="outline-row" data-selected="${selected===s.id}"><button type="button" class="outline-pick" data-action="select" data-section="${escape(s.id)}" aria-pressed="${selected===s.id}"><span>${String(i+1).padStart(2,"0")} · ${TYPES[s.type]}</span><strong>${escape(s.heading.trim()||"Untitled section")}</strong></button><div class="outline-tools">${outlineAction("up","↑","Move up",s.id,i===0)}${outlineAction("down","↓","Move down",s.id,i===doc.sections.length-1)}${outlineAction("duplicate","+","Duplicate section",s.id,doc.sections.length>=30)}${outlineAction("delete","×","Delete section",s.id)}</div></div>`
    ).join("")||'<p class="outline-empty">Add a section to get started.</p>';
    for(const el of document.querySelectorAll("button[data-add-section]"))el.disabled=doc.sections.length>=30;
  }
  function opt(map,current){
    return Object.entries(map).map(([key,label])=>`<option value="${key}"${key===current?" selected":""}>${label}</option>`).join("");
  }
  function field(label,key,value,max,textarea=false){
    const attr=`id="inspector-${key}" data-field="${key}" maxlength="${max}"`;
    return `<div class="inspector-row"><label for="inspector-${key}">${label}</label>${textarea?`<textarea rows="3" ${attr}>${escape(value)}</textarea>`:`<input type="text" ${attr} value="${escape(value)}">`}</div>`;
  }
  function renderInspector(){
    const s=section();
    if(!s){$("editor-inspector").innerHTML='<p class="inspector-empty">Select a section to edit what it says and how it looks.</p>';return;}
    $("editor-inspector").innerHTML=`<div class="inspector-fields"><p class="inspector-label">${TYPES[s.type]} section</p><div class="inspector-group"><div class="inspector-row"><label for="inspector-tone">Theme</label><select id="inspector-tone" data-field="tone">${opt(TONES,s.tone)}</select></div><div class="inspector-row"><label for="inspector-align">Alignment</label><select id="inspector-align" data-field="align">${opt(ALIGNS,s.align)}</select></div></div>${field("Eyebrow","eyebrow",s.eyebrow,55)}${field("Heading","heading",s.heading,110)}${field("Body text","body",s.body,620,true)}${s.type==="hero"||s.type==="cta"?field("Button label","button",s.button,52):""}${s.type==="features"?s.items.map((f,i)=>`<div class="inspector-group"><p class="inspector-label">Feature ${i+1}</p>${field("Title","item-"+i+"-heading",f.heading,63)}${field("Description","item-"+i+"-body",f.body,180,true)}</div>`).join(""):""}</div>`;
  }
  function renderDrafts(){
    const select=$("editor-drafts");
    if(select){
      const current=shelf.docs.find(x=>x.id===doc.id)?.id||shelf.last||"";
      select.innerHTML='<option value="">Choose a saved draft</option>'+shelf.docs.map(x=>`<option value="${escape(x.id)}">${escape(x.title.trim()||"Untitled site")}</option>`).join("");
      select.value=shelf.docs.some(x=>x.id===current)?current:"";
    }
    $("editor-load").disabled=shelf.docs.length===0;
  }
  function render(){
    $("editor-page-title").value=doc.title;$("global-accent").value=doc.accent;
    $("global-font").value=doc.font;$("global-spacing").value=doc.spacing;
    renderCanvas();renderOutline();renderInspector();renderDrafts();historyButtons();
  }
  function focusOutline(id,action="select"){
    const item=[...$("editor-outline").querySelectorAll("button[data-action]")].find(x=>x.dataset.section===id&&x.dataset.action===action&&!x.disabled)
      || [...$("editor-outline").querySelectorAll(".outline-pick")].find(x=>x.dataset.section===id)
      || $("editor-new");
    item?.focus({preventScroll:true});
  }
  function select(id,from="outline"){
    if(!doc.sections.some(s=>s.id===id))return;
    selected=id;priorGroup="";
    for(const el of $("editor-canvas").querySelectorAll(".builder-section"))el.dataset.selected=String(el.dataset.sectionId===selected);
    renderOutline();renderInspector();
    if(from==="outline")focusOutline(id);
  }
  function insert(type){
    if(!known(TYPES,type)||doc.sections.length>=30)return;
    record();const s=newSection(type),i=doc.sections.findIndex(x=>x.id===selected);
    doc.sections.splice(i===-1?doc.sections.length:i+1,0,s);selected=s.id;render();focusOutline(s.id);status(TYPES[type]+" section added.");
  }
  function action(verb,id){
    const i=doc.sections.findIndex(s=>s.id===id);
    if(i<0)return;
    if(verb==="select"){select(id);return;}
    if(verb==="up"&&i>0||verb==="down"&&i<doc.sections.length-1){
      record();const j=i+(verb==="up"?-1:1);[doc.sections[i],doc.sections[j]]=[doc.sections[j],doc.sections[i]];
      selected=id;render();focusOutline(id,verb);status("Section moved "+verb+".");
    }else if(verb==="duplicate"&&doc.sections.length<30){
      record();const duplicate={...copy(doc.sections[i]),id:makeId()};doc.sections.splice(i+1,0,duplicate);
      selected=duplicate.id;render();focusOutline(selected);status("Section duplicated.");
    }else if(verb==="delete"){
      record();doc.sections.splice(i,1);selected=doc.sections[Math.min(i,doc.sections.length-1)]?.id||null;
      render();focusOutline(selected);status("Section deleted. Undo restores it.");
    }
  }
  function editField(el){
    const s=section();
    if(!s)return;
    const k=el.dataset.field,val=el.value,marker="section:"+s.id+":"+k;
    if(k==="align"||k==="tone"){
      if(!known(k==="tone"?TONES:ALIGNS,val)||s[k]===val)return;
      record(marker);s[k]=val;
    }else if(known({eyebrow:1,heading:1,body:1,button:1},k)){
      const value=limit(val,{eyebrow:55,heading:110,body:620,button:52}[k]);
      if(s[k]===value)return;
      record(marker);s[k]=value;
    }else{
      const m=/^item-([012])-(heading|body)$/.exec(k||"");
      if(!m||!s.items[m[1]])return;
      const item=s.items[m[1]],prop=m[2],value=limit(val,prop==="heading"?63:180);
      if(item[prop]===value)return;
      record(marker);item[prop]=value;
    }
    renderCanvas();renderOutline();historyButtons();
  }
  function editGlobal(k,val){
    if(k==="title")val=limit(val,68);
    if(k==="accent"&&!validColor(val)||k==="font"&&!known(FONTS,val)||k==="spacing"&&!known(SPACES,val)||doc[k]===val)return;
    record("global:"+k);doc[k]=val;renderCanvas();historyButtons();
  }
  function choosePalette(hex){
    if(!validColor(hex))return;
    hex=hex.toLowerCase();
    const key=Object.keys(PALETTES).find(k=>PALETTES[k].accent===hex);
    if(!key||doc.palette===key&&doc.accent===hex)return;
    record();doc.palette=key;doc.accent=hex;$("global-accent").value=hex;
    renderCanvas();historyButtons();status(PALETTES[key].name+" palette applied.");
  }
  function save(){
    shelf=readShelf();
    const next=[copy(doc),...shelf.docs.filter(x=>x.id!==doc.id)];
    if(next.length>12){status("This browser already has 12 drafts. Export this page or update an existing draft.","error");return;}
    if(!saveShelf(next)){status("This browser blocked saving. Download an HTML or JSON copy instead.","error");return;}
    shelf={docs:next,last:doc.id};
    renderDrafts();status("Draft saved in this browser only.");
  }
  function load(){
    const wanted=$("editor-drafts")?.value||shelf.last||shelf.docs[0]?.id;
    shelf=readShelf();
    const file=shelf.docs.find(x=>x.id===wanted);
    if(!file){renderDrafts();status("Choose an existing local draft first.","error");return;}
    record();doc=copy(file);selected=doc.sections[0]?.id||null;render();status("Saved draft loaded. Undo returns to the previous version.");
  }
  function newPage(){
    record();doc=fresh(false);selected=doc.sections[0].id;render();$("editor-page-title").focus();status("New page started. Saved drafts were not changed.");
  }
  const exportCSS=`
    :root{color-scheme:dark}
    *{box-sizing:border-box}
    html{scroll-behavior:auto}
    body{margin:0;background:var(--builder-page-bg);color:#f6f4ff;font-family:var(--builder-font);line-height:1.55}
    .page-name{padding:1rem clamp(1rem,6vw,5rem);font-size:.88rem;font-weight:750;border-bottom:1px solid #75829d55;overflow-wrap:anywhere}
    main{max-width:1200px;margin:auto;padding:clamp(1rem,3.5vw,3rem)}
    .builder-section{--ink:#f7f5ff;--dim:#d2d5e7;--button:var(--builder-accent);--button-ink:var(--builder-accent-ink);--highlight:var(--builder-accent);
      display:grid;align-items:center;gap:clamp(1rem,3vw,2.5rem);color:var(--ink);background:var(--builder-deep);border:1px solid #8a98c04b;border-radius:18px;
      padding:calc(clamp(1rem,4.7vw,3.5rem) * var(--builder-space));margin-block-end:1rem;text-align:left;overflow-wrap:anywhere}
    .builder-section[data-type="hero"]{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);min-height:360px}
    .builder-section[data-tone="surface"]{background:var(--builder-surface)}
    .builder-section[data-tone="accent"]{background:var(--builder-accent);--ink:var(--builder-accent-ink);--dim:var(--builder-accent-ink);--highlight:var(--builder-accent-ink);--button:var(--builder-accent-ink);--button-ink:var(--builder-accent)}
    .builder-section[data-align="center"] .builder-content{text-align:center;justify-self:center}
    .builder-section[data-align="right"] .builder-content{text-align:right;justify-self:end}
    .builder-section[data-align="center"] .builder-body{margin-inline:auto}
    .builder-section[data-align="right"] .builder-body{margin-inline-start:auto}
    .builder-content{max-width:55rem;min-width:0}
    .builder-eyebrow{margin:0 0 .7rem;font-size:.73rem;font-weight:800;letter-spacing:.12em;color:var(--dim)}
    .builder-heading{font-size:clamp(1.6rem,5vw,3.7rem);line-height:1.06;letter-spacing:-.044em;margin:0 0 .7rem}
    .builder-body{color:var(--dim);margin:0;max-width:61ch;white-space:pre-wrap}
    .builder-cta{display:inline-flex;min-height:44px;align-items:center;text-decoration:none;border-radius:8px;background:var(--button);color:var(--button-ink);padding:.65rem 1rem;margin-top:1rem;font-weight:780}
    .builder-cta:focus-visible{outline:2px solid var(--ink);outline-offset:4px}
    .builder-art{border:1px solid currentColor;border-radius:13px;max-width:570px;color:var(--highlight);overflow:hidden;background:#ffffff0c}
    .builder-art svg{width:100%;height:auto;display:block}
    .builder-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}
    .builder-feature{border:1px solid #969eba76;padding:1rem;border-radius:10px;background:#11132221}
    .builder-feature span{font-size:.72rem;color:var(--dim);font-weight:800}
    .builder-feature h3{font-size:1.14rem;line-height:1.18;margin:.5rem 0 .35rem}.builder-feature p{margin:0;color:var(--dim);white-space:pre-wrap}
    @media(max-width:700px){.builder-section[data-type="hero"],.builder-feature-grid{grid-template-columns:minmax(0,1fr)}.builder-section[data-type="hero"]{min-height:0}}
    @media print{body{background:#fff;color:#171b29} .builder-section{break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  `;
  function standalone(){
    const title=escape(doc.title.trim()||"Untitled site");
    const colors=PALETTES[doc.palette];
    const style=exportCSS+`:root{--builder-accent:${doc.accent};--builder-accent-ink:${ink(doc.accent)};--builder-font:${FONTS[doc.font]};--builder-space:${SPACES[doc.spacing]};--builder-page-bg:${colors.page};--builder-deep:${colors.deep};--builder-surface:${colors.surface}}`;
    const page=doc.sections.map((s,i)=>htmlSection(s,i,doc.sections)).join("")||"<h1>Untitled page</h1>";
    return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${title}</title><style>${style}</style></head><body id="top"><header class="page-name">${title}</header><main>${page}</main></body></html>\n`;
  }
  function download(data,mime,suffix){
    const slug=(doc.title||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,54)||"untitled-site";
    try{
      const url=URL.createObjectURL(new Blob([data],{type:mime}));
      const link=document.createElement("a");link.href=url;link.download=slug+suffix;link.hidden=true;
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
      status(suffix===".html"?"HTML download started. Open the file in any browser.":"Editable project downloaded as JSON.");
    }catch{status("This browser blocked the download.","error");}
  }
  async function importFile(file){
    if(!file)return;
    if(file.size>262144){status("Choose an exported project under 256 KB.","error");return;}
    try{
      const imported=normalise(JSON.parse(await file.text()),{renew:true});
      if(!imported)throw new Error("invalid");
      record();doc=imported;selected=doc.sections[0]?.id||null;render();status("Project imported as a new draft. Save to keep it in this browser.");
    }catch{status("That file is not a valid workspace project JSON.","error");}
  }
  window.SHFNWorkspace=Object.freeze({getDocument:()=>copy(doc),getHTML:standalone});
  $("editor-canvas").addEventListener("click",e=>{const block=e.target.closest("[data-section-id]");if(block)select(block.dataset.sectionId,"canvas");});
  $("editor-canvas").addEventListener("keydown",e=>{
    const block=e.target.closest("[data-section-id]");
    if(block&&(e.key==="Enter"||e.key===" ")){e.preventDefault();select(block.dataset.sectionId,"canvas");}
  });
  $("editor-outline").addEventListener("click",e=>{const btn=e.target.closest("button[data-action]");if(btn&&!btn.disabled)action(btn.dataset.action,btn.dataset.section);});
  $("editor-inspector").addEventListener("input",e=>{if(e.target.dataset.field)editField(e.target);});
  $("editor-inspector").addEventListener("change",e=>{if(e.target.dataset.field)editField(e.target);});
  $("editor-page-title").addEventListener("input",e=>editGlobal("title",e.target.value));
  $("global-accent").addEventListener("input",e=>editGlobal("accent",e.target.value));
  $("global-font").addEventListener("change",e=>editGlobal("font",e.target.value));
  $("global-spacing").addEventListener("change",e=>editGlobal("spacing",e.target.value));
  $("editor-store").addEventListener("click",save);$("editor-load").addEventListener("click",load);
  $("editor-new").addEventListener("click",newPage);
  $("editor-undo").addEventListener("click",undo);$("editor-redo").addEventListener("click",redo);
  $("editor-export-html").addEventListener("click",()=>download(standalone(),"text/html;charset=utf-8",".html"));
  $("editor-export-json")?.addEventListener("click",()=>download(JSON.stringify(doc,null,2)+"\n","application/json",".json"));
  $("editor-import-json")?.addEventListener("change",e=>{importFile(e.target.files?.[0]);e.target.value="";});
  document.addEventListener("click",e=>{
    const add=e.target.closest("button[data-add-section]");if(add&&!add.disabled){insert(add.dataset.addSection);return;}
    const palette=e.target.closest("button[data-accent-preset]");if(palette){choosePalette(palette.dataset.accentPreset);return;}
    const next=e.target.closest("button[data-device]");if(next&&known(DEVICES,next.dataset.device)){
      device=next.dataset.device;previewFix();status(DEVICES[device]+" preview selected.");
    }
  });
  document.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&!e.altKey&&["z","y"].includes(e.key.toLowerCase())&&!e.target.closest("input,textarea,select,[contenteditable]")){
      e.preventDefault();if(e.shiftKey||e.key.toLowerCase()==="y")redo();else undo();
    }
  });
  render();
  if(shelf.blocked)status("Local storage is unavailable. You can still download the page.","error");
  else if(doc.title==="Earlier concept"&&!shelf.docs.length)status("Your earlier concept was copied into this builder. The original is unchanged.");
})();

