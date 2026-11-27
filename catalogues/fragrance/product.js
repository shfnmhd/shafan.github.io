import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const root = document.querySelector('.product-stage');
const canvas = document.getElementById('product-canvas');
const fallback = document.getElementById('product-poster');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const BASE_YAW = .12, BASE_PITCH = .055;
let renderer, scene, camera, object, shadow, ground, rings, resizeObserver;
let yaw = BASE_YAW, pitch = BASE_PITCH, targetYaw = yaw, targetPitch = pitch, raf = 0;
let touch = null, visible = true, keyActive = false;
let scrollYaw=0,scrollPitch=0,userYaw=0,userPitch=0,scrollScale=1,scrollLift=0,storyProgress=0;
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));

function texture(draw,w=1024,h=1280) {
 const c=document.createElement('canvas');c.width=w;c.height=h;
 draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
const labelTex = texture((ctx,w,h)=>{
 ctx.fillStyle='#e7d6b7';ctx.fillRect(0,0,w,h);
 // subtle warm grain, deterministic and not a bitmap of the model
 let n=91;for(let i=0;i<24000;i++){n=(n*1664525+1013904223)>>>0;let x=n%w;n=(n*1664525+1013904223)>>>0;let y=n%h;ctx.fillStyle=i%2?'#ffffff0b':'#7d603009';ctx.fillRect(x,y,1,1)}
 ctx.strokeStyle='#857351';ctx.lineWidth=2;ctx.strokeRect(49,49,w-98,h-98);ctx.strokeRect(64,64,w-128,h-128);
 ctx.textAlign='center';ctx.fillStyle='#241d17';
 ctx.font='29px Georgia';ctx.fillText('A T E L I E R  D E  P A R F U M',w/2,174);
 ctx.font='116px Georgia';ctx.fillText('VELLUNE',w/2,365);
 ctx.fillStyle='#74582d';ctx.font='38px Georgia';ctx.fillText('LES ESSENCES',w/2,433);
 ctx.strokeStyle='#ab9165';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(326,512);ctx.lineTo(698,512);ctx.stroke();
 ctx.fillStyle='#30251c';ctx.font='150px Georgia';ctx.fillText('04',w/2,750);
 ctx.font='56px Georgia';ctx.fillText('AMBER VEIL',w/2,850);
 ctx.font='33px Georgia';ctx.fillText('AMBER  ·  CEDAR  ·  MUSK',w/2,923);
 ctx.font='29px Georgia';ctx.fillText('EAU DE PARFUM',w/2,1080);
 ctx.font='26px Georgia';ctx.fillText('75 ML / 2.5 FL.OZ',w/2,1132);
});
const backTex = texture((ctx,w,h)=>{ctx.fillStyle='#e4d4b9';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#857351';ctx.lineWidth=2;ctx.strokeRect(52,52,w-104,h-104);ctx.fillStyle='#2b231d';ctx.textAlign='center';ctx.font='100px Georgia';ctx.fillText('VELLUNE',w/2,240);ctx.font='31px Georgia';ctx.fillText('04 / AMBER VEIL',w/2,340);ctx.font='32px Georgia';['An impression of quiet warmth.','Amber, cedar, and the softness','of a slow evening.','', 'FICTIONAL DESIGN CONCEPT', '75 ML / EAU DE PARFUM'].forEach((t,i)=>ctx.fillText(t,w/2,500+i*77));});
const shadowTex=texture((ctx,w,h)=>{const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w*.48);g.addColorStop(0,'rgba(12,7,3,.52)');g.addColorStop(.35,'rgba(12,7,3,.28)');g.addColorStop(1,'rgba(12,7,3,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)},512,512);
function makeMesh(geom,mat,x=0,y=0,z=0,parent=object){const m=new THREE.Mesh(geom,mat);m.position.set(x,y,z);parent.add(m);return m}
function build(){
 renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 scene=new THREE.Scene();scene.background=new THREE.Color('#d5c3aa');
 const pmrem=new THREE.PMREMGenerator(renderer);const environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment,.035).texture;scene.environmentIntensity=.87;environment.dispose();pmrem.dispose();
 // Camera is fixed. Only the modeled object responds.
 camera=new THREE.PerspectiveCamera(29,1,.1,60);camera.position.set(4.2,3.7,9.1);camera.lookAt(0,1.93,0);
 object=new THREE.Group();scene.add(object);
 const light=(c,p,x,y,z)=>{let l=new THREE.DirectionalLight(c,p);l.position.set(x,y,z);scene.add(l)};scene.add(new THREE.HemisphereLight(0xfff7df,0x73543b,1.2));light(0xfff4df,3.1,-4,6,7);light(0xe7eef4,1.2,5,2,1);light(0xffcf8c,2.2,-3,4,-6);
 // Glass body, thick heel, rounded shoulder and a darker inner perfume shell.
 const glass=new THREE.MeshPhysicalMaterial({color:0x7e431b,metalness:0,roughness:.12,clearcoat:1,clearcoatRoughness:.07,transmission:.35,thickness:.78,ior:1.48,attenuationColor:0xa85c22,attenuationDistance:1.35,envMapIntensity:1.3});
 const liquid=new THREE.MeshPhysicalMaterial({color:0x5f2811,roughness:.20,metalness:.04,clearcoat:.95,clearcoatRoughness:.08,transmission:.15,thickness:.4,ior:1.42,envMapIntensity:1.0});
 const heel=new THREE.MeshPhysicalMaterial({color:0x9f6831,roughness:.12,metalness:.02,clearcoat:1,transmission:.24,thickness:.5,envMapIntensity:1.1});
 makeMesh(new RoundedBoxGeometry(2.28,2.85,1.04,7,.22),glass,0,1.46,0);
 makeMesh(new RoundedBoxGeometry(1.99,2.38,.80,7,.15),liquid,0,1.35,0);
 makeMesh(new RoundedBoxGeometry(2.20,.25,.99,5,.11),heel,0,.17,0);
 // Subtle amber side ridges and shoulder neck.
 const darkGlass=new THREE.MeshPhysicalMaterial({color:0x74451f,metalness:.08,roughness:.2,clearcoat:.8,transmission:.16,thickness:.2});
 makeMesh(new THREE.CylinderGeometry(.41,.48,.21,64),darkGlass,0,2.95,0);
 const gold=new THREE.MeshStandardMaterial({color:0xc4a169,metalness:.89,roughness:.31});
 const goldDark=new THREE.MeshStandardMaterial({color:0x7d623c,metalness:.93,roughness:.36});
 const black=new THREE.MeshStandardMaterial({color:0x27211b,metalness:.40,roughness:.35});
 makeMesh(new THREE.CylinderGeometry(.39,.42,.14,72),gold,0,3.105,0);
 makeMesh(new THREE.CylinderGeometry(.40,.40,.07,72),black,0,3.195,0);
 // Turned, fluted metal cap with a polished rim and cap disk.
 makeMesh(new THREE.CylinderGeometry(.47,.47,.63,96),goldDark,0,3.54,0);
 makeMesh(new THREE.CylinderGeometry(.49,.49,.075,96),gold,0,3.235,0);
 makeMesh(new THREE.CylinderGeometry(.49,.49,.08,96),gold,0,3.85,0);
 const ribs = new THREE.InstancedMesh(new THREE.BoxGeometry(.035,.54,.055),gold,68);
 const m=new THREE.Object3D();for(let n=0;n<68;n++){let a=n/68*2*Math.PI;m.position.set(Math.sin(a)*.465,3.54,Math.cos(a)*.465);m.rotation.set(0,a,0);m.updateMatrix();ribs.setMatrixAt(n,m.matrix)};object.add(ribs);
 makeMesh(new THREE.CylinderGeometry(.43,.43,.035,96),goldDark,0,3.902,0);
 makeMesh(new THREE.TorusGeometry(.35,.013,8,72),gold,0,3.925,0).rotation.x=-Math.PI/2;
 // Fine label stock has depth and is present on both real sides.
 const paperFront=new THREE.MeshBasicMaterial({map:labelTex,toneMapped:false});
 const paperBack=new THREE.MeshBasicMaterial({map:backTex,toneMapped:false});
 makeMesh(new RoundedBoxGeometry(1.62,1.99,.022,4,.035),new THREE.MeshStandardMaterial({color:0xa98d61,roughness:.65}),0,1.47,.524);
 makeMesh(new THREE.PlaneGeometry(1.59,1.96),paperFront,0,1.47,.539);
 makeMesh(new THREE.PlaneGeometry(1.31,1.66),paperBack,0,1.45,-.531).rotation.y=Math.PI;
 // Ground contact is authored on a real plane, not baked into the product.
 shadow=makeMesh(new THREE.PlaneGeometry(4.5,2.9),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,opacity:.78}),0,.035,0,scene);shadow.rotation.x=-Math.PI/2;
 // Matte stage floor, rendered into the same scene to keep reflection consistent.
 ground=makeMesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({color:0xd5c3aa,toneMapped:false}),0,-.03,0,scene);ground.rotation.x=-Math.PI/2;
// Scent contours, a real depth layer behind the bottle, respond to the scroll journey.
 rings=new THREE.Group();rings.position.set(-.54,1.93,-1.35);rings.rotation.y=.39;scene.add(rings);
 for(let j=0;j<3;j++){const pts=[];for(let n=0;n<128;n++){const a=n/128*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*(1.78+j*.32),Math.sin(a)*(1.60+j*.24),0))}
  const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x8e7256,transparent:true,opacity:.10+j*.028}));ring.rotation.z=(j-1)*.17;rings.add(ring)}

 resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);resize();render();fallback.hidden=true;canvas.hidden=false;root.dataset.ready='true';root.parentElement.querySelector('.hint').innerHTML='Move or swipe to explore <b aria-hidden="true">↔</b>';
}
function resize(){if(!renderer)return;const b=root.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();render()}
function render(){if(!renderer)return;object.rotation.set(pitch,yaw,0);object.scale.setScalar(scrollScale);object.position.y=scrollLift;shadow.rotation.z=-yaw*.2;if(rings){rings.rotation.z=storyProgress*.65; rings.scale.setScalar(1+storyProgress*.13);rings.children.forEach((r,i)=>{r.material.opacity=.10+i*.028+storyProgress*.09})}renderer.render(scene,camera);root.dataset.yaw=String(yaw);root.dataset.engine='three-webgl'}
function step(){raf=0;if(!renderer||!visible||document.hidden)return;const ease=reduced.matches?1:.115;yaw+=(targetYaw-yaw)*ease;pitch+=(targetPitch-pitch)*ease;render();if(Math.abs(targetYaw-yaw)>0.001||Math.abs(targetPitch-pitch)>.001)raf=requestAnimationFrame(step)}
function schedule(){if(!raf&&visible)raf=requestAnimationFrame(step)}
function compose(){targetYaw=BASE_YAW+scrollYaw+userYaw;targetPitch=BASE_PITCH+scrollPitch+userPitch;schedule()}
function reset(){userYaw=Math.round((yaw-BASE_YAW-scrollYaw)/(Math.PI*2))*Math.PI*2;userPitch=0;compose()}
function desktop(e){const r=root.getBoundingClientRect();userYaw=((e.clientX-r.left)/r.width-.5)*Math.PI*2;userPitch=clamp((e.clientY-r.top)/r.height-.5,-.5,.5)*.15;compose()}
root.addEventListener('pointermove',e=>{
 if(!renderer)return;if(e.pointerType==='mouse'&& !keyActive)desktop(e);
 else if(touch&&touch.id===e.pointerId){let dx=e.clientX-touch.x,dy=e.clientY-touch.y;if(!touch.drag&&Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)*1.15){touch.drag=true;root.setPointerCapture(e.pointerId)}if(touch.drag){userYaw=touch.yaw+dx/root.clientWidth*Math.PI*2;userPitch=0;compose()}}
});
root.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')keyActive=false});
root.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){keyActive=false;reset()}});
root.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')touch={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:userYaw,drag:false};keyActive=false;});
function end(e){if(touch&&touch.id===e.pointerId){if(root.hasPointerCapture(e.pointerId))root.releasePointerCapture(e.pointerId);touch=null}}
root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);
root.addEventListener('keydown',e=>{if(!renderer)return;let d=0;if(e.key==='ArrowRight')d=.35;else if(e.key==='ArrowLeft')d=-.35;else if(e.key==='Home'||e.key==='Escape'){e.preventDefault();reset();return}else return;e.preventDefault();keyActive=true;userYaw+=d;compose()});
root.addEventListener('blur',()=>{keyActive=false;reset()});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else if(raf){cancelAnimationFrame(raf);raf=0}},{threshold:.05}).observe(root);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else schedule()});
try{build();window.productModelReady=true}catch(err){console.warn('3D preview unavailable; static render retained.',err);root.dataset.engine='fallback';root.removeAttribute('tabindex');root.removeAttribute('role');root.setAttribute('aria-label','Vellune Amber Veil fragrance bottle');root.parentElement.querySelector('.hint').textContent='Static product view'}

// Scroll position drives the object and editorial composition independently of hover/touch.
// Geometry and document flow remain fixed; all movement uses transform or background layers.
const journey=document.querySelector('.journey'),hero=document.querySelector('.hero'),intro=document.querySelector('.sect-intro'),atelier=document.querySelector('.atelier');
const accords=[...document.querySelectorAll('.accord-grid article')];
let scrollFrame=0;const chapters=[...document.querySelectorAll('.chapter')],labels=['01 / AMBER VEIL','02 / THE COMPOSITION','03 / THE OBJECT'];const storyColors=[new THREE.Color('#d5c3aa'),new THREE.Color('#b58d67'),new THREE.Color('#2e2622')];const stageColor=new THREE.Color();let chapterActive=0;
function progress(el,from=.91,to=.42){const top=el.getBoundingClientRect().top;return clamp((innerHeight*from-top)/(innerHeight*(from-to)),0,1)}
function updateScroll(){
 scrollFrame=0;const off=reduced.matches;const rootY=root.getBoundingClientRect().top+scrollY;
 const has3d=root.dataset.engine==='three-webgl';const mobile=innerWidth<=700,sticky=!off&&has3d&&innerHeight>=620;
 document.documentElement.classList.toggle('motion-ready',!off);journey.classList.toggle('story-enabled',sticky);
 const jrect=journey.getBoundingClientRect(),start=jrect.top+scrollY,travel=Math.max(1,journey.offsetHeight-hero.offsetHeight);
 const fallbackStart=mobile?Math.max(0,rootY-innerHeight*.68):0;
 const p=off||!has3d?0:sticky?clamp((scrollY-start)/travel,0,1):clamp((scrollY-fallbackStart)/Math.max(360,root.clientHeight*.93),0,1);
 storyProgress=p;const split=Math.min(1,Math.floor(p*2)),local=p*2-split,t=local*local*(3-2*local);
 const poses=[{yaw:0,pitch:0,scale:1,lift:0},{yaw:1.22,pitch:-.055,scale:1.08,lift:-.025},{yaw:-.86,pitch:.07,scale:.94,lift:.045}];
 const a0=poses[split],a1=poses[split+1],mix=(a,b)=>a+(b-a)*t;
 scrollYaw=mix(a0.yaw,a1.yaw);scrollPitch=mix(a0.pitch,a1.pitch);scrollScale=mix(a0.scale,a1.scale);scrollLift=mix(a0.lift,a1.lift);
 stageColor.copy(storyColors[split]).lerp(storyColors[split+1],t);
 if(scene&&ground){scene.background.copy(stageColor);ground.material.color.copy(stageColor);rings?.children.forEach(r=>r.material.color.set(p>.64?0xd1a574:0x81664b));}
 const hex='#'+stageColor.getHexString();hero.style.setProperty('--stage-color',hex);const copyTone=new THREE.Color('#171714').lerp(new THREE.Color('#251b16'),Math.sin(p*Math.PI));hero.style.setProperty('--copy-tone','#'+copyTone.getHexString());const luminance=.2126*stageColor.r+.7152*stageColor.g+.0722*stageColor.b;hero.style.setProperty('--stage-ink',luminance<.19?'#f5e7ce':'#1d1813');
 hero.style.setProperty('--journey-progress',p.toFixed(4));hero.style.setProperty('--hero-shift',sticky?'0px':(-28*p).toFixed(2)+'px');hero.style.setProperty('--stage-shift',sticky?'0px':(12*p).toFixed(2)+'px');
 let ch=off?0:Math.min(2,Math.floor(p*3));const sectionP=p*3;chapters.forEach((el,i)=>{const distance=sectionP-(i+.5);const alpha=off?(i===0?1:0):i===ch?clamp((.5-Math.abs(distance))/.10,0,1):0;const edge=(i===0&&p<.16)||(i===2&&p>.84);el.style.setProperty('--chapter-alpha',edge?1:alpha);el.style.setProperty('--chapter-lift',(edge?0:clamp(distance,-.53,.53)*-30).toFixed(2)+'px');const active=i===ch;el.classList.toggle('active',active);el.setAttribute('aria-hidden',String(!active));el.querySelector('a').tabIndex=active?0:-1;});
 chapterActive=ch;document.getElementById('chapter-label').textContent=labels[ch];root.dataset.scrollProgress=p.toFixed(3);root.dataset.chapter=String(ch);root.dataset.baseYaw=(BASE_YAW+scrollYaw).toFixed(4);root.dataset.scrollScale=scrollScale.toFixed(3);root.dataset.background=hex;compose();
 const n=off?1:progress(intro,.94,.48);intro.dataset.progress=n.toFixed(3);intro.style.setProperty('--intro-shift',(20*(1-n)).toFixed(2)+'px');intro.style.setProperty('--intro-opacity',(.60+.4*n).toFixed(3));
 accords.forEach((card,index)=>{
  const r=card.getBoundingClientRect();const shift=off?0:clamp((innerHeight*.65-r.top)/(innerHeight+r.height),-.5,.75);
  const stagger=!mobile?index*.045:0;
  const reveal=off?1:clamp(progress(card,.98,.40)-stagger,0,1);
  const revealFull=clamp(reveal/(1-stagger),0,1);
  card.dataset.progress=revealFull.toFixed(3);card.style.setProperty('--image-shift',(shift*-34).toFixed(2)+'px');
  card.style.setProperty('--image-scale',(1.075+.045*(1-revealFull)).toFixed(3));
  card.style.setProperty('--image-mask',((1-revealFull)*22).toFixed(2)+'%');
  card.style.setProperty('--card-shift',((1-revealFull)*24).toFixed(2)+'px');card.style.setProperty('--card-opacity',(.65+.35*revealFull).toFixed(3));
 });
 const a=off?1:progress(atelier,.98,.38);atelier.dataset.progress=a.toFixed(3);atelier.style.setProperty('--atelier-progress',a.toFixed(3));atelier.style.setProperty('--atelier-shift',((1-a)*26).toFixed(2)+'px');
 document.documentElement.classList.toggle('motion-ready',!off);
}
function queueScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll)}
addEventListener('scroll',queueScroll,{passive:true});addEventListener('resize',queueScroll,{passive:true});reduced.addEventListener('change',queueScroll);updateScroll();
