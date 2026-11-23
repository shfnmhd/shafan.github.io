(() => {
  "use strict";
  const root = document.getElementById("hero-scene");
  if (!root) return;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const controls = document.createElement("div");
  controls.className = "hs-controls";
  const rotate = document.createElement("button");
  rotate.type = "button";
  rotate.textContent = "Rotate";
  const motion = document.createElement("button");
  motion.type = "button";
  motion.setAttribute("aria-label", "Auto rotation");
  controls.append(rotate, motion);
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Interactive orbital developer workspace with browser, code editor, and terminal above a rotating station ring. Drag horizontally or use the arrow keys to rotate. Press Home to reset.");
  root.append(canvas, controls);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const motionAllowed=()=>!reduce.matches&&document.documentElement.dataset.motionPreference!=="off";
  let autoRequested=true;
  let spinning=motionAllowed(), w = 0, h = 0, ratio = 1, on = true;
  const homeYaw=-.28, homePitch=.49;
  let autoBase=homeYaw, autoStart=0;
  let yaw = homeYaw, pitch = homePitch, ty = yaw, tp = pitch, raf = 0, last = 0, wave = 0, drag = null;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const cyan = "#89e7ed", amber = "#ffc489";
  const decks = [
    {x:-1.43,y:.72,z:-.08,w:2.37,h:1.62,kind:"editor",edge:"#496779"},
    {x:1.36,y:.72,z:-.08,w:2.62,h:1.62,kind:"browser",edge:"#76adbc"},
    {x:0,y:-.68,z:.17,w:2.03,h:.76,kind:"terminal",edge:"#557c8b"},
  ];

  const TAU=Math.PI*2,N=70;
  const sample=f=>Array.from({length:N+1},(_,i)=>f(i*TAU/N));
  const circle=(r,y,q)=>[Math.cos(q)*r,y,Math.sin(q)*r];
  const tilted=q=>[2.31*Math.cos(q),-.11+.40*Math.sin(q)+.22*Math.cos(q),2.03*Math.sin(q)];
  const orbital=sample(tilted);
  const fitPoints=[...orbital,...sample(q=>circle(2.49,-1.21,q)),...sample(q=>circle(2.30,-1.335,q)),
    ...decks.flatMap(a=>[-1,1].flatMap(i=>[-1,1].flatMap(j=>[a.z,a.z-.095].map(z=>[a.x+i*a.w/2,a.y+j*a.h/2,z]))))];

  function draw(){
    if(!w||!h) return;
    ctx.clearRect(0,0,w,h);
    const sy=Math.sin(yaw),cy=Math.cos(yaw),sx=Math.sin(pitch),cx=Math.cos(pitch);
    const view=([x,y,z])=>{
      const rx=cy*x+sy*z, rz=cy*z-sy*x, ry=cx*y-sx*rz, depth=sx*y+cx*rz, k=8.4/(8.4-depth);
      return [rx*k,-ry*k,depth];
    };
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const v of fitPoints){
      const [x,y]=view(v);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
    const unit=Math.min(w*.184,h*.224,(w-24)/(maxX-minX),(h-24)/(maxY-minY));
    const ox=w/2-(minX+maxX)*unit/2, oy=h/2-(minY+maxY)*unit/2;
    const project=v=>{const [x,y,d]=view(v);return [ox+x*unit,oy+y*unit,d];};
    function shape(points,fill,stroke,width=.85){
      const xy=points.map(project);ctx.beginPath();ctx.moveTo(xy[0][0],xy[0][1]);
      xy.slice(1).forEach(([x,y])=>ctx.lineTo(x,y));ctx.closePath();
      ctx.fillStyle=fill;ctx.fill();
      if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
    }
    const haze=ctx.createRadialGradient(w*.51,h*.48,3,w*.51,h*.48,Math.min(w*.46,h*.54));
    haze.addColorStop(0,"#56498798");haze.addColorStop(.61,"#23264e66");haze.addColorStop(1,"#14182c00");
    ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
    const dust = [[.11,.26,.8],[.16,.18,.6],[.24,.38,.7],[.32,.13,1.3],[.41,.17,.7],[.48,.055,.64],[.56,.105,.8],[.65,.135,1.23],[.72,.235,.67],[.86,.17,.9],[.90,.32,.68],[.91,.57,1],[.83,.63,.7],[.72,.83,.8],[.55,.89,.8],[.19,.81,.9],[.09,.59,.74],[.224,.66,1.2]];
    function strand(points,color,width=1){
      const xy=points.map(project);
      ctx.beginPath();ctx.moveTo(xy[0][0],xy[0][1]);
      for(let i=1;i<xy.length;i++)ctx.lineTo(xy[i][0],xy[i][1]);
      ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
    }
    dust.forEach(([x,y,s],i)=>{
      const px=w*x,py=h*y,c=i%5===0?"#f6c38d9c":"#83c7e791";
      ctx.fillStyle=c;ctx.fillRect(px-s*.5,py-s*.5,s,s);
      if(s>=1.2){ctx.fillStyle=c.slice(0,7)+"49";ctx.fillRect(px-3,py-.35,6,.7);ctx.fillRect(px-.35,py-3,.7,6);}
    });
    const zOf=p=>project(p)[2];
    const segmentFront=(a,b)=>(zOf(a)+zOf(b))*.5>.23;
    const ribbon=(outer,inner,y,q0,q1,color,edge)=>shape([circle(outer,y,q0),circle(outer,y,q1),circle(inner,y,q1),circle(inner,y,q0)],color,edge);
    function station(){
      const floor=-1.19,outer=2.30,inner=1.72;
      shape(sample(q=>circle(1.54,floor+.007,q)),"#0d2339a0","#27516d7b",1);
      shape(sample(q=>circle(1.34,floor+.013,q)),"#11283e6b","#5893bd66",.8);
      strand(sample(q=>circle(2.49,floor-.02,q)),"#9d77dd72",1.2);
      // Front-facing wall facets carry physical depth; no flat image hacking.
      for(let i=0;i<N;i++){
        const a=i*TAU/N,b=(i+1)*TAU/N,c=(a+b)*.5;
        const p=circle(outer,floor,c),towards=cy*p[2]-sy*p[0];
        if(towards>0)shape([circle(outer,floor,a),circle(outer,floor,b),circle(outer,floor-.145,b),circle(outer,floor-.145,a)],i%5<2?"#32465f":"#1a2c46");
      }
      for(let i=0;i<N;i++){
        const a=i*TAU/N,b=(i+1)*TAU/N;
        ribbon(outer,inner,floor+.008,a,b,i%7<2?"#3c5270":i%7<4?"#293f58":"#22344b");
      }
      strand(sample(q=>circle(outer,floor+.012,q)),"#9bb2d6",1.1);
      strand(sample(q=>circle(inner,floor+.013,q)),"#61c9eea4",.95);
      strand(sample(q=>circle(2.18,floor+.015,q)),"#829ddba3",.6);
      for(let i=0;i<16;i++){
        const a=i*TAU/16+.024,b=a+.109;
        ribbon(2.09,1.99,floor+.021,a,b,i%4===1?"#ffbb7acb":i%4===3?"#a485e5ba":"#74d9edb1");
      }
    }
    function orbitLayer(front){
      for(let i=1;i<orbital.length;i++){
        if(segmentFront(orbital[i-1],orbital[i])!==front)continue;
        strand([orbital[i-1],orbital[i]],front?"#9d92eac0":"#8c87c05c",front?1.25:.8);
      }
      const marker=tilted(spinning?wave*.53+5.5:5.5);
      if((zOf(marker)>.23)===front){
        const [x,y]=project(marker);
        ctx.fillStyle="#d5b6ff1e";ctx.fillRect(x-6,y-6,12,12);
        ctx.fillStyle="#f6dbff";ctx.fillRect(x-2,y-2,4,4);
        ctx.fillStyle="#e5bafcc4";ctx.fillRect(x-5,y-.4,10,.8);ctx.fillRect(x-.4,y-5,.8,10);
      }
    }
    station();
    orbitLayer(false);
    orbitLayer(true);
    let deckOrder=[...decks].sort((a,b)=>project([a.x,a.y,a.z])[2]-project([b.x,b.y,b.z])[2]);
    for(const a of deckOrder){
      const D=.095, front=(u,v,z=a.z)=>[a.x+(u-.5)*a.w,a.y+(.5-v)*a.h,z];
      const ss=[front(0,0),front(1,0),front(1,1),front(0,1)];
      const bb=ss.map(([x,y,z])=>[x,y,z-D]);
      const back=cy<0;
      const shells=[{p:back?ss:bb,f:"#132632"}];
      for(let i=0;i<4;i++) shells.push({p:[ss[i],ss[(i+1)%4],bb[(i+1)%4],bb[i]],f:i%2?"#27334e":"#536881"});
      shells.sort((i,j)=>i.p.reduce((s,p)=>s+project(p)[2],0)/4-j.p.reduce((s,p)=>s+project(p)[2],0)/4);
      shells.forEach(({p,f})=>shape(p,f,"#4a6473",.72));
      const z=a.z-(back?D:0);
      const uv=(u,v)=>front(back?1-u:u,v,z);
      function rect(x,y,width,height,fill,stroke){
        shape([uv(x,y),uv(x+width,y),uv(x+width,y+height),uv(x,y+height)],fill,stroke,.65);
      }
      function dot(x,y,r,c){
        const points=Array.from({length:9},(_,i)=>{const q=i/9*Math.PI*2;return uv(x+Math.cos(q)*r,y+Math.sin(q)*r*a.w/a.h);});
        shape(points,c);
      }
      function label(text,u,v,fs,c){
        const P=project(uv(u,v)), X=project(uv(u+.02,v)), Y=project(uv(u,v+.02));
        if(Math.abs(X[0]-P[0])+Math.abs(X[1]-P[1])<.52)return;
        const s=.02*a.w;
        ctx.save();ctx.transform((X[0]-P[0])/s,(X[1]-P[1])/s,(Y[0]-P[0])/(.02*a.h),(Y[1]-P[1])/(.02*a.h),P[0],P[1]);
        ctx.font=fs+"px ui-monospace, SFMono-Regular, Consolas, monospace";ctx.textBaseline="middle";ctx.fillStyle=c;ctx.fillText(text,0,0);ctx.restore();
      }
      rect(0,0,1,1,back?"#142a38":"#101f2e",a.edge);
      if(back){
        rect(.04,.08,.92,.84,"#172f3e","#365767");
        rect(.34,.46,.32,.08,"#284c5a");
        rect(.46,.49,.08,.018,cyan+"8c");
        continue;
      }
      rect(0,0,1,.15,"#294a60",a.edge);
      rect(0,.151,1,.005,"#7fb9d7a0");
      rect(.011,.169,.008,.794,"#9ccdf229");
      rect(.02,.973,.96,.009,"#95bce054");
      [amber,"#7294a5",cyan].forEach((c,i)=>dot(.052+i*.031,.075,.010,c));
      if(a.kind==="editor"){
        rect(.16,.032,.35,.085,"#1b3647");label("src / app.tsx",.19,.079,.086,"#c3dfea");
        rect(.035,.20,.17,.745,"#162b3b");label("FILES",.058,.257,.068,"#8eacbf");
        for(let i=0;i<5;i++)rect(.057,.338+i*.087,.086+(i%2)*.022,.013,i===1?cyan+"a0":"#446879");
        const rows=[[0,[[.16,cyan],[.17,"#5b8290"]]],[0,[[.09,amber],[.20,"#7894a7"]]],[1,[[.21,"#819fb3"],[.08,cyan]]],[1,[[.10,"#638396"],[.17,amber]]],[2,[[.18,cyan],[.13,"#6a879a"]]],[1,[[.14,"#7290a3"]]],[0,[[.08,amber],[.19,"#5b7a91"]]]];
        rows.forEach(([indent,tokens],i)=>{let x=.29+indent*.046;label(String(i+1),.225,.292+i*.089,.066,"#597688");for(const [len,c] of tokens){rect(x,.279+i*.089,len,.013,c);x+=len+.022;}});
      }else if(a.kind==="browser"){
        rect(.17,.036,.67,.077,"#172d3b");label("localhost / preview",.20,.078,.077,"#b3d3df");
        rect(.045,.205,.91,.735,"#163040","#365968");
        rect(.045,.205,.91,.10,"#223e4e");
        rect(.078,.246,.11,.017,cyan);rect(.764,.248,.046,.012,"#718f9d");rect(.837,.248,.076,.012,"#718f9d");
        rect(.081,.382,.299,.036,"#c4e2e8");rect(.081,.442,.238,.027,"#80a8b6");
        rect(.081,.525,.254,.013,"#507a8b");rect(.081,.560,.192,.013,"#507a8b");
        rect(.081,.635,.126,.076,"#377581","#6ec9ce");
        rect(.48,.359,.413,.366,"#101f30","#426172");
        rect(.54,.438,.212,.025,"#6ab4bf");rect(.54,.493,.292,.018,"#416476");
        rect(.54,.55,.124,.021,"#b78261");rect(.54,.605,.253,.018,"#547e91");
        for(let i=0;i<3;i++){rect(.082+i*.275,.783,.242,.107,"#203f4f","#426272");rect(.104+i*.275,.824,.103,.010,i===1?amber:"#7299a8");}
      }else{
        label("terminal",.185,.08,.081,"#b7d5df");
        label("› npm run dev",.075,.31,.097,cyan);
        label("ready   :3000",.075,.53,.089,"#a9c9d1");
        dot(.082,.747,.013,amber);
        label("watching changes",.113,.748,.079,"#819eab");
        if(!spinning||Math.sin(wave*2.2)>.02)rect(.80,.703,.034,.078,cyan+"bb");
      }
    }
    root.setAttribute("data-ready","");
  }
  function frame(t){
    raf=0;if(!on||document.hidden){last=0;return;}
    const dt=last?Math.min(.040,(t-last)/1000):0;last=t;
    if(spinning&&!drag){wave+=dt;ty=autoBase+Math.sin((wave-autoStart)*.29)*.25;}
    const easing=motionAllowed()?.17:1;
    yaw=lerp(yaw,ty,easing);pitch=lerp(pitch,tp,easing);
    draw();
    if(spinning||Math.abs(yaw-ty)+Math.abs(pitch-tp)>.001) wake();
    else last=0;
  }
  function wake(){ if(!raf&&on&&!document.hidden)raf=requestAnimationFrame(frame); }
  function status(){
    const enabled=motionAllowed();
    spinning=enabled&&autoRequested;
    motion.disabled=!enabled;
    motion.setAttribute("aria-pressed",String(spinning));
    motion.textContent=!enabled?"Auto paused":spinning?"Auto on":"Auto off";
  }
  function stop(){
    if(motionAllowed())autoRequested=false;
    status();
  }
  function motionChanged(){
    status();last=0;
    if(!motionAllowed()){ty=yaw;tp=pitch;}
    wake();
  }
  function resize(){
    const r=canvas.getBoundingClientRect();
    w=Math.max(0,Math.round(r.width));h=Math.max(0,Math.round(r.height));ratio=Math.min(devicePixelRatio||1,1.75);
    canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);wake();
  }
  rotate.addEventListener("click",()=>{stop();ty+=Math.PI/4;wake();});
  motion.addEventListener("click",()=>{if(!motionAllowed())return;autoRequested=!autoRequested;if(autoRequested){autoBase=ty;autoStart=wave;}status();wake();});
  canvas.addEventListener("keydown", e=>{
    if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Home"].includes(e.key))return;
    e.preventDefault();stop();
    if(e.key==="Home"){ty=homeYaw;tp=homePitch;}
    else if(e.key==="ArrowLeft")ty-=.23;
    else if(e.key==="ArrowRight")ty+=.23;
    else tp=clamp(tp+(e.key==="ArrowUp"?.12:-.12),.25,1.08);
    wake();
  });
  canvas.addEventListener("pointerdown",e=>{
    if(!e.isPrimary||e.button!==0) return;
    stop();drag={id:e.pointerId,x:e.clientX,y:e.clientY,type:e.pointerType};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove",e=>{
    if(!drag||drag.id!==e.pointerId)return;
    ty+=(e.clientX-drag.x)*.011;
    if(drag.type!=="touch")tp=clamp(tp+(e.clientY-drag.y)*.006,.25,1.08);
    drag.x=e.clientX;drag.y=e.clientY;wake();
  });
  const end=e=>{if(drag?.id===e.pointerId)drag=null;};
  for(const type of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(type,end);
  reduce.addEventListener("change",motionChanged);
  window.addEventListener("portfolio:motion-change",motionChanged);
  document.addEventListener("visibilitychange",()=>{last=0;if(!document.hidden)wake();});
  if("ResizeObserver" in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener("resize",resize);
  if("IntersectionObserver" in window)new IntersectionObserver(([entry])=>{on=entry.isIntersecting;last=0;if(on)wake();}).observe(root);
  status();resize();
})();
