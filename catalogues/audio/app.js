"use strict";
(()=>{
document.documentElement.classList.add("js");
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)"),menu=document.querySelector(".menu"),nav=document.querySelector("#links");
const closeMenu=()=>{menu.setAttribute("aria-expanded","false");nav.classList.remove("open")};
menu.addEventListener("click",()=>{const open=menu.getAttribute("aria-expanded")==="false";menu.setAttribute("aria-expanded",String(open));nav.classList.toggle("open",open)});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){closeMenu();menu.focus()}});
const modes=[{name:"FOCUS",meta:"01 / CLARITY",title:"A moment of focus.",desc:"A narrow, balanced visual field inspired by the detail of a single instrument in a quiet room.",word:"Narrow",level:43,amp:.49,spread:.62,color:[126,222,196],freq:2.3},{name:"IMMERSIVE",meta:"02 / PRESENCE",title:"Space all around.",desc:"A broad and expansive visual field, inspired by music filling the room from every direction.",word:"Expansive",level:91,amp:1.02,spread:1.2,color:[126,202,247],freq:1.6},{name:"NIGHT",meta:"03 / CALM",title:"A softer atmosphere.",desc:"A slow, understated field inspired by evening listening, where the quiet between notes becomes part of the experience.",word:"Soft",level:26,amp:.29,spread:.84,color:[240,174,132],freq:2.7}];
const hero=document.querySelector("#hero-wave"),field=document.querySelector("#mode-wave"),hctx=hero.getContext("2d"),ctx=field.getContext("2d"),world=document.querySelector("#sonic-world"),wctx=world.getContext("2d"),tabs=[...document.querySelectorAll("[data-mode]")],pauseBtn=document.querySelector("#motion-switch");
let current=0,mode={...modes[0],color:[...modes[0].color]},paused=false,heroVisible=true,fieldVisible=false,worldVisible=false,raf=0,phase=0,last=0,mouse={x:.5,target:.5};
function resize(canvas,c){const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.65),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;c.setTransform(dpr,0,0,dpr,0,0)}return[r.width,r.height]}
function heroDraw(){let [w,h]=resize(hero,hctx);hctx.clearRect(0,0,w,h);const depth=Number(document.querySelector(".hero").dataset.scrollProgress||0),offset=(mouse.x-.5)*30;for(let j=0;j<8;j++){const k=(j-3.5)/7;hctx.beginPath();for(let x=0;x<=w+5;x+=5){const p=x/w,y=h*(.76+.022*j)+Math.sin(p*6.1+phase*.62+j*.4+depth*4.5)*(17+55*p+depth*25)*Math.sin(p*Math.PI)*.65+Math.sin(p*12+phase*.4)*8+offset*p; x?hctx.lineTo(x,y):hctx.moveTo(x,y)}hctx.strokeStyle="rgba(100,213,181,"+(0.05+Math.max(0,k)*.035+depth*.05)+")";hctx.lineWidth=1;hctx.stroke()}}
function modeDraw(){const [w,h]=resize(field,ctx);ctx.clearRect(0,0,w,h);const cx=w*.5,cy=h*.51,R=Math.min(w*.37,h*.34)*mode.spread,color=mode.color.map(Math.round).join(",");
ctx.lineWidth=1;ctx.strokeStyle="rgba(157,210,197,.11)";
for(let i=0;i<=10;i++){let x=w*(.08+i*.084);ctx.beginPath();ctx.moveTo(x,h*.15);ctx.lineTo(x,h*.85);ctx.stroke()}
for(let i=0;i<=7;i++){let y=h*(.15+i*.1);ctx.beginPath();ctx.moveTo(w*.08,y);ctx.lineTo(w*.92,y);ctx.stroke()}
for(let j=1;j<=11;j++){const r=R*(.16+j*.077),a=.065+j*.013;ctx.beginPath();for(let i=0;i<=180;i++){const t=i/180*Math.PI*2,rad=r*(1+.105*Math.sin(t*mode.freq+phase-j*.23)*mode.amp+.045*Math.sin(t*7-phase*.5+j*.17));const x=cx+Math.cos(t)*rad*1.23,y=cy+Math.sin(t)*rad*.67; i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.lineWidth=j%3===0?1.5:1;ctx.strokeStyle="rgba("+color+","+a+")";ctx.stroke()}
for(let j=0;j<5;j++){ctx.beginPath();for(let i=0;i<=200;i++){const t=i/200,p=(t-.5)*2,e=Math.exp(-p*p*3.5);const y=cy+Math.sin(p*9+phase*1.15+j*.26)*e*mode.amp*h*.135+(j-2)*h*.021;const x=w*(.07+t*.86);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.lineWidth=j===2?2.1:1;ctx.strokeStyle="rgba("+color+","+(j===2?.8:.19)+")";ctx.stroke()}
ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fillStyle="rgba("+color+",.75)";ctx.fill();ctx.beginPath();ctx.arc(cx,cy,8,0,Math.PI*2);ctx.strokeStyle="rgba("+color+",.35)";ctx.stroke();
}

// Original perspective sound world. The camera position is a function of the scroll chapter, not a timer.
const story=document.querySelector(".sonic-story"),chapterNames=["01 — PULSE","02 — RESONANCE","03 — SPACE"];
let sonicProgress=0,sonicSmooth=0;
function worldDraw(){
 const [w,h]=resize(world,wctx);wctx.clearRect(0,0,w,h);
 const p=reduce.matches?0.56:sonicSmooth, mobile=w<700, sx=mobile?w*.5:w*(.69+.045*Math.sin(p*Math.PI*2)), sy=mobile?h*.31:h*.48, v=Math.min(w,h),cam=p*14,scale=v*.66,turn=.45+p*1.1;
 const tint=[Math.round(116+p*70),Math.round(218-p*21),Math.round(190-p*53)];
 const color=tint.join(","),bg=wctx.createRadialGradient(sx,sy,0,sx,sy,v*.85);bg.addColorStop(0,"rgba("+color+",.13)");bg.addColorStop(.48,"rgba(37,91,82,.075)");bg.addColorStop(1,"rgba(0,0,0,0)");wctx.fillStyle=bg;wctx.fillRect(0,0,w,h);
 function projection(d,angle,radius){const z=1.8+d*18,worldZ=cam+d*11,relative=(worldZ-cam);const curveX= Math.sin(worldZ*.48)*.73-Math.sin(cam*.48)*.11;const curveY=Math.cos(worldZ*.37)*.48;const f=3.8/z,rad=radius*(.52+p*.72)*(1+.10*Math.sin(worldZ*1.4+phase*.2));let x=(curveX+Math.cos(angle+relative*.12+turn)*rad)*scale*f;let y=(curveY+Math.sin(angle+relative*.12+turn)*rad*.78)*scale*f;return [sx+x,sy+y]}
 // Longitudinal luminous filaments converge toward a changing vanishing point.
 const strands=Math.round(11+p*13);
 for(let j=0;j<strands;j++){let angle=j/strands*Math.PI*2;wctx.beginPath();for(let i=0;i<=108;i++){const d=i/108,pt=projection(d,angle,1.21+.03*Math.sin(j*1.9));if(i)wctx.lineTo(...pt);else wctx.moveTo(...pt)}
 wctx.strokeStyle="rgba("+color+","+(j%4===0?.61:.20+p*.09)+")";wctx.lineWidth=j%4===0?1.65:.95;wctx.stroke()}
 // Plane cross-sections pass toward camera as scroll advances; rings progressively spread.
 const offset=(p*8)%1;
 for(let j=18;j>=0;j--){const d=(j+offset)/19;if(d>1)continue;wctx.beginPath();for(let i=0;i<=110;i++){let a=i/110*Math.PI*2,pt=projection(d,a,1.23);if(i)wctx.lineTo(...pt);else wctx.moveTo(...pt)}wctx.closePath();const alpha=(1-d)*(.25+p*.15)+.035;wctx.strokeStyle="rgba("+color+","+alpha+")";wctx.lineWidth=(1-d)*1.6+.5;wctx.stroke()}
 // A traveling pulse marks the camera's arrival through the sound field.
 const pulse=.13+.62*(1-p),point=projection(pulse,turn*1.9,1.22),pr= Math.max(14,50*(1-pulse));const gl=wctx.createRadialGradient(point[0],point[1],0,point[0],point[1],pr);gl.addColorStop(0,"rgba("+color+",.85)");gl.addColorStop(.16,"rgba("+color+",.28)");gl.addColorStop(1,"rgba("+color+",0)");wctx.fillStyle=gl;wctx.beginPath();wctx.arc(point[0],point[1],pr,0,Math.PI*2);wctx.fill();wctx.fillStyle="#e0fff3";wctx.beginPath();wctx.arc(point[0],point[1],2.1,0,Math.PI*2);wctx.fill();
 // Depth layers and dust use deterministic positions rather than randomized flicker.
 for(let i=0;i<67;i++){const d=((i*0.6180339+p*.6)%1),a=i*2.39996,pt=projection(d,a,1.47+((i%7)*.13));wctx.fillStyle="rgba("+color+","+(.09+(1-d)*.25)+")";wctx.beginPath();wctx.arc(pt[0],pt[1],.5+(1-d)*1.45,0,Math.PI*2);wctx.fill()}
 world.dataset.progress=p.toFixed(4);
}

function update(dt){const target=modes[current],ease=reduce.matches||paused?1:Math.min(1,dt*3.8);["amp","spread","freq"].forEach(k=>mode[k]+=(target[k]-mode[k])*ease);mode.color=mode.color.map((n,k)=>n+(target.color[k]-n)*ease);mouse.x+=(mouse.target-mouse.x)*Math.min(1,dt*5);sonicSmooth+=(sonicProgress-sonicSmooth)*(reduce.matches||paused?1:Math.min(1,dt*7))}
function render(time){raf=0;const dt=Math.min(.04,(time-last)/1000||.016);last=time;update(dt);if(!reduce.matches&&!paused)phase+=dt*.85;if(heroVisible)heroDraw();if(fieldVisible)modeDraw();if(worldVisible)worldDraw();if(!reduce.matches&&!paused&&!document.hidden&&(heroVisible||fieldVisible||worldVisible))raf=requestAnimationFrame(render)}
function stop(){if(raf){cancelAnimationFrame(raf);raf=0}}
function start(){stop();last=performance.now();update(1);if(heroVisible)heroDraw();if(fieldVisible)modeDraw();if(worldVisible)worldDraw();if(!reduce.matches&&!paused&&!document.hidden&&(heroVisible||fieldVisible||worldVisible))raf=requestAnimationFrame(render)}
function select(i){current=i;const m=modes[i];tabs.forEach((t,n)=>{t.tabIndex=n===i?0:-1;t.setAttribute("aria-selected",String(n===i))});document.querySelector("#mode-panel").setAttribute("aria-labelledby",tabs[i].id);document.querySelector("#visual-status").textContent=m.name;document.querySelector("#mode-meta").textContent=m.meta;document.querySelector("#mode-title").textContent=m.title;document.querySelector("#mode-description").textContent=m.desc;document.querySelector("#meter-word").textContent=m.word;document.querySelector("#meter-bar").style.width=m.level+"%";if(reduce.matches||paused){update(1);modeDraw()}else if(!raf)start()}
tabs.forEach((t,i)=>{t.addEventListener("click",()=>select(i));t.addEventListener("keydown",e=>{let n;if(e.key==="ArrowRight")n=(i+1)%3;else if(e.key==="ArrowLeft")n=(i+2)%3;else if(e.key==="Home")n=0;else if(e.key==="End")n=2;else return;e.preventDefault();tabs[n].focus();select(n)})});
function pauseUI(){pauseBtn.disabled=reduce.matches;pauseBtn.textContent=reduce.matches?"Reduced motion":paused?"Resume motion":"Pause motion";pauseBtn.setAttribute("aria-pressed",String(paused||reduce.matches))}
pauseBtn.addEventListener("click",()=>{paused=!paused;pauseUI();start()});
reduce.addEventListener("change",()=>{pauseUI();start()});
document.querySelector(".hero").addEventListener("pointermove",e=>{const r=e.currentTarget.getBoundingClientRect();mouse.target=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))},{passive:true});
document.querySelector(".hero").addEventListener("pointerleave",()=>{mouse.target=.5});
if("IntersectionObserver"in window){const vis=new IntersectionObserver(es=>{for(const e of es){if(e.target===hero)heroVisible=e.isIntersecting;else if(e.target===field)fieldVisible=e.isIntersecting;else worldVisible=e.isIntersecting}start()},{threshold:.03});vis.observe(hero);vis.observe(field);vis.observe(world);const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");reveal.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll(".reveal").forEach(x=>reveal.observe(x))}else{heroVisible=fieldVisible=worldVisible=true;document.querySelectorAll(".reveal").forEach(x=>x.classList.add("visible"))}
if("ResizeObserver"in window){const ro=new ResizeObserver(()=>start());ro.observe(hero);ro.observe(field);ro.observe(world)}else window.addEventListener("resize",start,{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else start()});

// Scroll depth is driven by the reader's actual position, never a timed slide or scroll lock.
const heroScene=document.querySelector(".hero"),heroPhoto=document.querySelector(".hero-photo"),acts=[...document.querySelectorAll(".act")],statement=document.querySelector(".statement");
let scrollRAF=0;const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function sceneDepth(){
 scrollRAF=0;
 if(reduce.matches)return;
 const storyRect=story.getBoundingClientRect(),stage=document.querySelector(".sonic-stage"),head=document.querySelector(".header").getBoundingClientRect().height;sonicProgress=clamp((head-storyRect.top)/Math.max(1,storyRect.height-stage.getBoundingClientRect().height),0,1);const chapter=Math.min(2,Math.floor(sonicProgress*3)),local=sonicProgress*3-chapter;document.querySelectorAll(".sonic-chapter").forEach((el,i)=>{el.dataset.active=String(i===chapter);const intro=i===0?1:clamp(local/.13,0,1),outro=i===2?1:clamp((1-local)/.13,0,1),opacity=Math.min(intro,outro);el.style.setProperty("--chapter-opacity",String(opacity));el.style.setProperty("--chapter-shift",((1-opacity)*(local<.5?20:-20)).toFixed(1)+"px")});document.querySelector("#sonic-chapter").textContent=chapterNames[chapter];document.querySelector("#sonic-counter").textContent=String(Math.round(sonicProgress*100)).padStart(2,"0")+"%";document.querySelector("#sonic-progress-fill").style.width=(sonicProgress*100)+"%";story.dataset.scrollProgress=sonicProgress.toFixed(4);if(paused&&worldVisible){sonicSmooth=sonicProgress;worldDraw();}
 const height=window.innerHeight,width=window.innerWidth,mobile=width<=700,bar=document.querySelector(".header").getBoundingClientRect().height;
 const heroRect=heroScene.getBoundingClientRect(),photoRect=heroPhoto.getBoundingClientRect();
 const hprogress=clamp((bar-photoRect.top)/Math.max(1,photoRect.height),0,1);
 heroScene.style.setProperty("--hero-depth",(hprogress*(mobile?17:64)).toFixed(2)+"px");
 heroScene.style.setProperty("--hero-zoom",(1.035+hprogress*(mobile?.035:.09)).toFixed(4));
 heroScene.style.setProperty("--hero-copy-depth",(-hprogress*55).toFixed(2)+"px");
 heroScene.style.setProperty("--hero-copy-opacity",String(clamp(1-hprogress*.75,.25,1)));
 heroScene.style.setProperty("--hero-foot-opacity",String(clamp(1-hprogress*2,0,1)));
 heroScene.dataset.scrollProgress=hprogress.toFixed(3);
 for(const act of acts){const art=act.querySelector(".act-image"),r=art.getBoundingClientRect();const p=clamp((height-r.top)/(height+r.height),0,1),offset=(p-.5)*Math.min(mobile?36:56,r.height*.105);art.style.setProperty("--image-depth",offset.toFixed(2)+"px");art.style.setProperty("--image-zoom",String(mobile?1.09:1.12));act.style.setProperty("--title-depth",((p-.5)*(mobile?8:22)).toFixed(2)+"px");act.dataset.scrollProgress=p.toFixed(3)}
 const q=statement.getBoundingClientRect(),p=clamp((height-q.top)/(height+q.height),0,1);statement.style.setProperty("--statement-depth",((p-.5)*(mobile?14:38)).toFixed(2)+"px");statement.style.setProperty("--statement-light",((p-.5)*(mobile?65:210)).toFixed(2)+"px");statement.dataset.scrollProgress=p.toFixed(3);
}
function queueDepth(){if(!scrollRAF&&!reduce.matches)scrollRAF=requestAnimationFrame(sceneDepth)}
window.addEventListener("scroll",queueDepth,{passive:true});window.addEventListener("resize",queueDepth,{passive:true});reduce.addEventListener("change",()=>{if(reduce.matches){cancelAnimationFrame(scrollRAF);scrollRAF=0;[heroScene,...acts,statement].forEach(el=>delete el.dataset.scrollProgress)}else queueDepth()});queueDepth();

pauseUI();heroDraw();modeDraw();worldDraw();start();
})();
