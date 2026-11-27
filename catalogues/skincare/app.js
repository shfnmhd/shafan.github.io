"use strict";
(() => {
document.documentElement.classList.add("js");
const menu=document.querySelector(".menu"),nav=document.querySelector("#nav");
const close=()=>{menu.setAttribute("aria-expanded","false");nav.classList.remove("open")};
menu.addEventListener("click",()=>{if(menu.getAttribute("aria-expanded")==="true")close();else{menu.setAttribute("aria-expanded","true");nav.classList.add("open")}});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){close();menu.focus()}});
const items=[
{label:"01 / A FRESH BEGINNING",title:"The Gentle<br>Cleanser",desc:"A milky, cushion-soft texture that lifts away the day. An uncomplicated first step to your evening ritual.",texture:"Silky milk",time:"Morning & evening",image:"cleanse",alt:"Cream-colored cleanser bottle in a warm sunlit studio"},
{label:"02 / A MOMENT OF DEW",title:"The Daily<br>Serum",desc:"A light, fresh-feeling layer inspired by the quiet clarity of morning. A little moment of moisture between cleansing and care.",texture:"Lightweight gel",time:"After cleansing",image:"serum",alt:"Amber serum dropper bottle with luminous golden sunlight"},
{label:"03 / A SOFT FINISH",title:"The Comfort<br>Cream",desc:"A rich, enveloping texture made for the final moment of your routine. Slow down, breathe, and let the ritual feel complete.",texture:"Velvety cream",time:"Morning & evening",image:"moisture",alt:"Beige cream jar in a softly lit natural studio"}
];
const tabs=[...document.querySelectorAll("[data-step]")],img=document.querySelector("#product-image"),reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
let version=0;
const activate=i=>{
const v=++version,step=items[i],source="assets/"+step.image+".webp";
tabs.forEach((t,n)=>{t.setAttribute("aria-selected",String(n===i));t.tabIndex=n===i?0:-1});
document.querySelector("#step-panel").setAttribute("aria-labelledby",tabs[i].id);
document.querySelector("#step-label").textContent=step.label;document.querySelector("#step-title").innerHTML=step.title;document.querySelector("#step-description").textContent=step.desc;document.querySelector("#step-texture").textContent=step.texture;document.querySelector("#step-time").textContent=step.time;document.querySelector("#visual-step").textContent=String(i+1).padStart(2,"0");
const next=new Image();next.onload=()=>{if(v!==version)return;const swap=()=>{if(v!==version)return;img.src=source;img.alt=step.alt;img.classList.remove("fade")};if(reduced.matches)swap();else{img.classList.add("fade");setTimeout(swap,180)}};next.onerror=()=>img.classList.remove("fade");next.src=source;
};
tabs.forEach((t,i)=>{t.addEventListener("click",()=>activate(i));t.addEventListener("keydown",e=>{let n;if(e.key==="ArrowRight")n=(i+1)%tabs.length;else if(e.key==="ArrowLeft")n=(i+tabs.length-1)%tabs.length;else if(e.key==="Home")n=0;else if(e.key==="End")n=tabs.length-1;else return;e.preventDefault();tabs[n].focus();activate(n)})});
if("IntersectionObserver"in window&&!reduced.matches){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");io.unobserve(e.target)}}),{rootMargin:"0px 0px -4% 0px",threshold:.08});document.querySelectorAll(".reveal").forEach(el=>io.observe(el))}
else document.querySelectorAll(".reveal").forEach(el=>el.classList.add("visible"));
})();
