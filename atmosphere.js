(() => {
  "use strict";
  const layer = document.querySelector("body > .portfolio-atmosphere");
  if (!layer || !window.matchMedia) return;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const storeKey = "shfn.motion.v1";
  let optedOut = false;
  try{optedOut=localStorage.getItem(storeKey)==="off";}catch{}
  const root = document.documentElement;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "space-motion-toggle";
  toggle.setAttribute("aria-label","Portfolio motion");
  document.body.append(toggle);

  const glints = document.createElement("i");
  glints.className = "space-glints";
  const points = [
    [13,29,3,6.6,-2.2],[24,38,4,9.3,-3.6],[34,23,2,7.8,-4.8],
    [45,35,3,7.2,-1.8],[61,24,4,8.1,-4.1],[77,27,4,7.4,-2.9],
    [87,38,3,9.1,-2.2],[17,63,4,8.4,-5.9],[27,72,3,6.1,-4.2],
    [71,66,2,7.9,-5.8],[82,71,4,9.4,-3.0],[91,57,3,6.8,-4.1]
  ];
  for (const [x,y,size,pace,phase] of points) {
    const point=document.createElement("b");
    for (const [key,value] of Object.entries({x:x+"%",y:y+"%",size:size+"px",pace:pace+"s",phase:phase+"s"})) point.style.setProperty("--star-"+key,value);
    glints.append(point);
  }
  layer.append(glints);
  // A short dolly-around: pan, bank, approach the limb, then open back out.
  // Values are poses, not per-scroll-frame increments. The path works both ways.
  const approach = [
    [0,    0,   0,   0,  1],
    [.25, -34, -49, -2,  1.034],
    [.53, -112,-131,-4,  1.109],
    [.78, -142,-176,-2,  1.144],
    [1,   -119,-196, .3, 1.126]
  ];
  // Exit the first arc, glide across the field, and make a last pass at the footer.
  // The first coordinate is relative to the remaining scroll distance.
  const passage = [
    [.19, -188,-269,-3.2,1.183],
    [.40, -61, -194, 1.7,1.113],
    [.62, -17, -256, 3.9,1.169],
    [.81, -126,-168, .7,1.094],
    [1,   -210,-230,-2.1,1.171]
  ];
  const light = document.createElement("i");
  light.className = "space-eclipse";
  const trails = document.createElement("i");
  trails.className = "space-trails";
  for (let i = 0; i < 3; i++) trails.append(document.createElement("b"));
  layer.append(light, trails);
  const keys = ["cloud-x","cloud-y","cloud-zoom","far-x","far-y","limb-x","limb-y","limb-zoom","near-x","near-y","glint-x","glint-y","bank","light-x","light-y","light-power","trail-x","trail-y","trail-power","trail-scale","trail-angle"];
  const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
  let frame=0,stage=1,range=1,active=null,strength=1,observer,path=approach;
  let previousY=window.scrollY, previousTime=0, momentum=0;
  function put(k,v,units="px"){layer.style.setProperty("--space-"+k,v.toFixed(3)+units);}
  const pulse=(x,center,radius)=>{
    const q=clamp(1-Math.abs(x-center)/radius);
    return q*q*(3-2*q);
  };
  function pose(p){
    const poses=path;
    let j=1;
    while(j<poses.length-1&&p>poses[j][0])j++;
    const a=poses[j-1],b=poses[j],u=clamp((p-a[0])/(b[0]-a[0]));
    const u2=u*u,u3=u2*u;
    const before=poses[Math.max(0,j-2)],after=poses[Math.min(poses.length-1,j+1)];
    return a.slice(1).map((v,i)=>{
      const k=i+1,len=b[0]-a[0];
      const m0=(b[k]-before[k])*len/(b[0]-before[0]);
      const m1=(after[k]-a[k])*len/(after[0]-a[0]);
      return (2*u3-3*u2+1)*v+(u3-2*u2+u)*m0+(-2*u3+3*u2)*b[k]+(u3-u2)*m1;
    });
  }
  function draw(now){
    frame=0;
    const y=window.scrollY, p=clamp(y/stage), q=clamp(y/range);
    const after=range>stage?clamp((y-stage)/(range-stage)):0;
    // Sample all knots in absolute normalized page space so the camera tangent
    // stays continuous when the introductory and later arcs meet.
    const [x,rise,bank,zoom]=pose(q);
    const dt=previousTime?clamp(now-previousTime,12,64):16;
    const speed=clamp((y-previousY)/dt/1.8,-1,1);
    momentum=momentum*Math.exp(-dt/94)+speed*(1-Math.exp(-dt/28));
    momentum=clamp(momentum,-1,1);
    if(Math.abs(momentum)<.015)momentum=0;
    previousY=y;previousTime=now;
    const tail=q*25;
    put("bank",bank*strength,"deg");
    put("cloud-x",x*.52*strength);put("cloud-y",(rise*.34-tail*.4)*strength);
    put("cloud-zoom",1+(zoom-1)*.72,"");
    put("far-x",-x*.15*strength);put("far-y",(rise*.28-tail*.6)*strength);
    put("limb-x",x*strength);put("limb-y",(rise-tail)*strength);
    put("limb-zoom",1+(zoom-1)*(.72+.28*strength),"");
    put("near-x",(x*1.24+q*28)*strength);put("near-y",(rise*1.42-tail*2)*strength);
    put("glint-x",x*.85*strength);put("glint-y",(rise*.92-tail)*strength);
    const eclipse=clamp(1-Math.abs(p-.57)/.49);
    const laterLight=pulse(after,.33,.23)*.34+pulse(after,.77,.23)*.27;
    put("light-x",(88+x*.88)*strength);put("light-y",(rise*.47+23)*strength);
    put("light-power",eclipse*eclipse*.61+laterLight,"");
    const departure=Math.sin(Math.PI*after);
    const passing=Math.sin(p*Math.PI)+departure*.72;
    put("trail-x",(39+x*.96)*strength);put("trail-y",(40+rise*.86)*strength);
    put("trail-power",Math.abs(momentum)*passing*.72*strength,"");
    put("trail-scale",.68+Math.abs(momentum)*.68,"");
    put("trail-angle",(-13+bank*2+(momentum<0?180:0)),"deg");
    if(momentum)queue();
  }
  function queue(){if(!frame&&active&&!document.hidden)frame=window.requestAnimationFrame(draw);}
  function measure(){
    range=Math.max(1,root.scrollHeight-window.innerHeight);
    stage=Math.max(1,Math.min(range,Math.max(520,window.innerHeight*1.08)));
    const edge=stage/range;
    path=approach.map(([progress,...v])=>[progress*edge,...v]);
    if(edge<1)path.push(...passage.map(([progress,...v])=>[edge+progress*(1-edge),...v]));
    strength=window.innerWidth<651?.69:1;
    queue();
  }
  function visibility(){
    layer.dataset.spaceHidden=String(document.hidden);
    if(document.hidden&&frame){window.cancelAnimationFrame(frame);frame=0;}
    previousY=window.scrollY;previousTime=0;momentum=0;
    if(!document.hidden)measure();
  }
  function configure(){
    const enabled=!media.matches&&!optedOut;
    toggle.disabled=media.matches;
    toggle.textContent=media.matches?"Reduced motion":enabled?"Motion on":"Motion off";
    toggle.setAttribute("aria-pressed",String(enabled));
    if(active===enabled)return;
    active=enabled;
    const marker=enabled?"on":"off";
    layer.dataset.spaceMotion=marker;
    root.dataset.motionPreference=marker;
    window.dispatchEvent(new CustomEvent("portfolio:motion-change",{detail:{enabled}}));
    if(active){
      window.addEventListener("scroll",queue,{passive:true});
      window.addEventListener("resize",measure,{passive:true});
      if("ResizeObserver" in window){observer ||=new ResizeObserver(measure);observer.observe(document.body);}
      visibility();
    }else{
      window.removeEventListener("scroll",queue);window.removeEventListener("resize",measure);observer?.disconnect();
      if(frame)window.cancelAnimationFrame(frame);frame=0;
      for (const key of keys)layer.style.removeProperty("--space-"+key);
    }
  }
  toggle.addEventListener("click",()=>{
    if(media.matches)return;
    optedOut=!optedOut;
    try{localStorage.setItem(storeKey,optedOut?"off":"on");}catch{}
    configure();
  });
  document.addEventListener("visibilitychange",visibility);
  if(media.addEventListener)media.addEventListener("change",configure);
  else media.addListener(configure);
  configure();
})();
