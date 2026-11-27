"use strict";
if(!matchMedia("(prefers-reduced-motion: reduce)").matches){document.body.classList.add("motion-ready");if("IntersectionObserver" in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add("in-view");observer.unobserve(entry.target)}},{threshold:.12});document.querySelectorAll(".landing-section .section-top,.landing-section article,.editorial,.motion-grid article,.split").forEach(item=>observer.observe(item))}}
const motionPreference=matchMedia("(prefers-reduced-motion: reduce)");
const finePointer=matchMedia("(hover: hover) and (pointer: fine)");
for(const hero of document.querySelectorAll(".shoe-hero,.energy-hero")){
 const photo=hero.querySelector(".hero-photo");
 if(!photo)continue;
 let frame=0,latest=null;
 function reset(){if(frame)cancelAnimationFrame(frame);frame=0;latest=null;photo.style.removeProperty("--motion-x");photo.style.removeProperty("--motion-y")}
 hero.addEventListener("pointermove",event=>{
  if(event.pointerType!=="mouse"||motionPreference.matches||!finePointer.matches||innerWidth<=700)return;
  latest=event;
  if(frame)return;
  frame=requestAnimationFrame(()=>{frame=0;if(!latest)return;const r=hero.getBoundingClientRect(),x=(latest.clientX-r.left)/r.width-.5,y=(latest.clientY-r.top)/r.height-.5;photo.style.setProperty("--motion-x",(x*-12).toFixed(2)+"px");photo.style.setProperty("--motion-y",(y*-7).toFixed(2)+"px")})
 });
 hero.addEventListener("pointerleave",reset);motionPreference.addEventListener("change",reset);
}
const flavourButtons=[...document.querySelectorAll("[data-flavour]")],flavourPanel=document.getElementById("flavour-note");
if(flavourPanel&&flavourButtons.length){
 const flavours={
  citrus:{name:"Citrus Current",line:"A charged lime-and-navy direction, built around citrus-inspired colour and a striking lightning motif.",accent:"#e7fc42"},
  blue:{name:"Blue Surge",line:"A vivid cobalt-and-cyan direction with cool berry-inspired tones and a crisp liquid-splash visual.",accent:"#7ad8ff"},
  orange:{name:"Solar Charge",line:"A bright orange-and-navy direction, combining a warm palette with sharp, graphic motion.",accent:"#ffb367"}
 };
 for(const button of flavourButtons)button.addEventListener("click",()=>{
  const item=flavours[button.dataset.flavour];if(!item)return;
  flavourButtons.forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
  flavourPanel.querySelector("strong").textContent=item.name;
  flavourPanel.querySelector("p").textContent=item.line;
  flavourPanel.style.setProperty("--detail-accent",item.accent);
 })
}
