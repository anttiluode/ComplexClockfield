import {Field,DEFAULTS,l2Difference,responseDifference} from "./engine.mjs";
const $=id=>document.getElementById(id);
const view=$("field"),ctx=view.getContext("2d",{alpha:false});
const trace=$("trace"),tctx=trace.getContext("2d");
let sim=new Field(112),playing=true,busy=false,frame=0,lastDraw=0,history=[],benchData=[];
const labels={pair:"Vortex + antivortex",single:"Pinned +1 vortex",double:"Double winding (+2)",quartet:"Four interacting defects",vacuum:"Symmetry-broken vacuum"};
const img=ctx.createImageData(view.width,view.height);
function clamp(x,a=0,b=1){return Math.max(a,Math.min(b,x));}
function rgb(h,s,v){
  const c=v*s,hh=((h%1+1)%1)*6,x=c*(1-Math.abs(hh%2-1)),m=v-c;
  const p=hh<1?[c,x,0]:hh<2?[x,c,0]:hh<3?[0,c,x]:hh<4?[0,x,c]:hh<5?[x,0,c]:[c,0,x];
  return [(p[0]+m)*255,(p[1]+m)*255,(p[2]+m)*255];
}
function phaseColor(a,mag){
  const hue=(a/(Math.PI*2)+1)%1, intensity=clamp(.12+.84*(1-Math.exp(-1.6*mag)));
  return rgb(hue,.75,intensity);
}
function paint(){
  const n=sim.n,mode=$("view").value;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=y*n+x,j=i*4,u=sim.u[i],v=sim.v[i],mag=Math.hypot(u,v);
    let color;
    if(mode==="phase")color=phaseColor(Math.atan2(v,u),mag);
    else if(mode==="density"){const z=clamp(mag/1.4);color=rgb(.53-.43*z,.88,.08+.9*z);}
    else if(mode==="clock"){const z=1/Math.sqrt(sim.mass[i]);color=rgb(.02+.57*z,.85,.2+.77*z);}
    else{
      const xm=Math.max(x-1,0),xp=Math.min(x+1,n-1),ym=Math.max(0,y-1),yp=Math.min(n-1,y+1);
      const dx=.5*(sim.u[y*n+xp]-sim.u[y*n+xm]),dy=.5*(sim.u[yp*n+x]-sim.u[ym*n+x]);
      const ex=.5*(sim.v[y*n+xp]-sim.v[y*n+xm]),ey=.5*(sim.v[yp*n+x]-sim.v[ym*n+x]);
      const z=clamp(Math.sqrt(dx*dx+dy*dy+ex*ex+ey*ey)*2);
      color=rgb(.65-.61*z,.85,.13+.85*z);
    }
    img.data[j]=color[0];img.data[j+1]=color[1];img.data[j+2]=color[2];img.data[j+3]=255;
  }
  ctx.putImageData(img,0,0);
  if($("showCores").checked){
    const cores=sim.defects();
    ctx.save();
    for(const p of cores){
      ctx.strokeStyle=p.q>0?"#8dffc8":"#ff89be";ctx.lineWidth=.9;
      ctx.beginPath();ctx.arc(p.x,p.y,2.1,0,2*Math.PI);ctx.stroke();
      ctx.fillStyle=ctx.strokeStyle;ctx.font="5px sans-serif";ctx.fillText(p.q>0?"+":"−",p.x+2.3,p.y-1.5);
    }
    ctx.restore();
  }
}
function sample(){
  const n=sim.n,c=Math.floor(n/2);
  let low=Infinity,minSpeed=1;
  const pad=Math.floor(n*.15);
  for(let y=pad;y<n-pad;y++)for(let x=pad;x<n-pad;x++){
    const i=y*n+x,abs=Math.hypot(sim.u[i],sim.v[i]);
    low=Math.min(low,abs);minSpeed=Math.min(minSpeed,1/Math.sqrt(sim.mass[i]));
  }
  history.push({low:clamp(low,0,1.5),clock:minSpeed});
  if(history.length>320)history.shift();
  $("timeValue").textContent=(sim.tick*sim.cfg.dt).toFixed(1)+" / "+sim.tick;
  const cs=sim.defects(),p=cs.filter(q=>q.q>0),m=cs.filter(q=>q.q<0);
  $("windingValue").textContent=p.length+" / "+m.length;
  $("clockValue").textContent=minSpeed.toFixed(3)+"×";
  $("energyValue").textContent=sim.energy().total.toFixed(2);
  $("chargeValue").textContent=sim.energy().charge.toFixed(3);
}
function drawTrace(){
  const w=trace.width,h=trace.height;
  tctx.fillStyle="#0b121e";tctx.fillRect(0,0,w,h);
  tctx.strokeStyle="#24394e";tctx.lineWidth=1;
  for(let y=0;y<=4;y++){tctx.beginPath();tctx.moveTo(0,y*h/4);tctx.lineTo(w,y*h/4);tctx.stroke();}
  for(const [key,color,transform] of [
    ["low","#7edfed",v=>clamp(v/1.4)],
    ["clock","#e2b56e",v=>clamp(v)]
  ]){
    tctx.beginPath();tctx.strokeStyle=color;tctx.lineWidth=2;
    history.forEach((p,i)=>{
      const x=w*i/319,y=h*(1-transform(p[key]));
      if(i===0)tctx.moveTo(x,y);else tctx.lineTo(x,y);
    });
    tctx.stroke();
  }
}
function updateStatus(s){$("stageStatus").textContent=s;}
function refresh(){paint();sample();drawTrace();}
function animate(ms){
  requestAnimationFrame(animate);
  if(ms-lastDraw<35 || busy)return;
  lastDraw=ms;frame++;
  if(playing){sim.step();sim.step();}
  paint();
  if(frame%8===0){sample();drawTrace();}
}
function setPlaying(v){
  playing=v;$("toggle").textContent=v?"⏸ Pause":"▶ Resume";
  $("runningBadge").textContent=v?"● RUNNING":"● PAUSED";
  $("runningBadge").style.color=v?"#8cf4aa":"#e2b56e";
}
function seed(kind){
  if(busy)return;sim.reset(kind);history=[];
  document.querySelectorAll("[data-seed]").forEach(b=>b.classList.toggle("selected",b.dataset.seed===kind));
  $("topologyLabel").textContent=labels[kind];updateStatus("Seeded "+labels[kind]+". The winding markers are measured, not labels.");
  refresh();
}
document.querySelectorAll("[data-seed]").forEach(b=>b.addEventListener("click",()=>seed(b.dataset.seed)));
$("toggle").onclick=()=>{if(!busy)setPlaying(!playing);};
$("step").onclick=()=>{if(busy)return;setPlaying(false);sim.step();refresh();};
$("reset").onclick=()=>seed(sim.seedName);
function kick(kind,x=sim.n*.30,y=sim.n*.50){
  if(busy)return;sim.pulse(x,y,kind,Number($("pulse").value));
  updateStatus("Injected "+kind+" momentum pulse at ("+x.toFixed(0)+","+y.toFixed(0)+").");
  paint();
}
$("kickA").onclick=()=>kick("A");$("kickB").onclick=()=>kick("B");$("kickC").onclick=()=>kick("C");
view.addEventListener("pointerdown",e=>{
  if(busy)return;
  const r=view.getBoundingClientRect();
  kick(e.shiftKey?"B":"A",(e.clientX-r.left)/r.width*sim.n,(e.clientY-r.top)/r.height*sim.n);
});
document.addEventListener("keydown",e=>{
  if(e.target.matches("input, select, button, textarea"))return;
  if(e.code==="Space"){e.preventDefault();kick("C");}
  if(e.key.toLowerCase()==="r")seed(sim.seedName);
});
for(const name of ["clockStrength","lambda","bending","damping","gradSoft"]){
  const el=$(name),out=$(name+"Val");
  el.addEventListener("input",()=>{
    out.textContent=el.value;
    sim.cfg[name]=Number(el.value);
    if(name==="clockStrength")sim.rebuildClock();
  });
}
$("clockMode").addEventListener("change",()=>{
  sim.cfg.clockMode=$("clockMode").value;sim.rebuildClock();
  updateStatus("Clock mode switched to "+sim.cfg.clockMode+". Stamped clock was regenerated from current geometry.");
});
$("savePng").onclick=()=>{
  const out=document.createElement("canvas");out.width=1120;out.height=1240;
  const c=out.getContext("2d");c.fillStyle="#09111d";c.fillRect(0,0,1120,1240);
  c.fillStyle="#eaf4ff";c.font="bold 34px system-ui";c.fillText("COMPLEX CLOCKFIELD",32,52);
  c.font="16px monospace";c.fillStyle="#9ab4ca";c.fillText(labels[sim.seedName]+" · t="+(sim.tick*sim.cfg.dt).toFixed(2)+" · "+sim.cfg.clockMode,32,88);
  c.imageSmoothingEnabled=false;c.drawImage(view,40,108,1040,1040);
  c.fillStyle="#7edfed";c.fillText("No pre-labeled particles · phase winding measured from Ψ",40,1185);
  const a=document.createElement("a");a.download="complexclockfield-"+sim.tick+".png";a.href=out.toDataURL("image/png");a.click();
};
$("copyConfig").onclick=async()=>{
  const d={...sim.cfg,seed:sim.seedName,step:sim.tick,version:"2026-11-20"};
  const s=JSON.stringify(d,null,2);
  try{await navigator.clipboard.writeText(s);updateStatus("Copied experiment settings.");}
  catch{updateStatus(s);}
};
const yieldUi=()=>new Promise(r=>setTimeout(r,0));
async function evolve(world,steps){
  for(let j=0;j<steps;j++){world.step();if(j%24===23)await yieldUi();}
}
async function trial(seedType,isClock,linear,order){
  const n=64;
  const opts={...sim.cfg,dt:.11,damping:.028,bending:0,
    nonlinear:!linear,gradSoft:linear?0:sim.cfg.gradSoft,
    clockMode:isClock?"stamped":"uniform",
    clockStrength:isClock?Math.max(8,Number($("clockStrength").value)):0};
  const w=new Field(n,opts);w.reset(seedType);
  await evolve(w,72);
  const cx=n*.39,cy=n*.5,amp=.23;
  w.pulse(cx,cy,order[0],amp,3);
  await evolve(w,19);
  w.pulse(cx,cy,order[1],amp,3);
  await evolve(w,82);
  const pre=w.clone(),withC=w.clone(),sham=w.clone();
  withC.pulse(cx,cy,"C",.34,3);
  // The sham branch is essential: subtract its future from the probed future.
  for(let j=0;j<115;j++){
    withC.step();sham.step();
    if(j%24===23)await yieldUi();
  }
  return {pre,withC,sham};
}
const cases=[
  {name:"Linear vacuum",seed:"vacuum",clock:false,linear:true},
  {name:"Nonlinear vacuum",seed:"vacuum",clock:false,linear:false},
  {name:"Vortex dipole",seed:"pair",clock:false,linear:false},
  {name:"Vortex dipole",seed:"pair",clock:true,linear:false},
  {name:"Four defects",seed:"quartet",clock:true,linear:false}
];
$("runBench").onclick=async()=>{
  if(busy)return;
  busy=true;const wasPlaying=playing;setPlaying(false);
  $("runBench").disabled=true;$("csvBench").disabled=true;benchData=[];
  $("benchRows").innerHTML="";
  try{
    for(let i=0;i<cases.length;i++){
      const t=cases[i];
      $("benchProgress").textContent="Running "+(i+1)+"/"+cases.length+": "+t.name+", "+(t.clock?"graded":"uniform")+" clock ...";
      const ab=await trial(t.seed,t.clock,t.linear,"AB");
      const ba=await trial(t.seed,t.clock,t.linear,"BA");
      const pre=l2Difference(ab.pre,ba.pre);
      const resp=responseDifference(ab.withC,ab.sham,ba.withC,ba.sham,"right");
      const r={world:t.name,clock:t.clock?"graded":"uniform",
        dState:pre,dProbe:resp.difference,probeScale:resp.response,
        relative:resp.response>1e-10?resp.fraction:null};
      benchData.push(r);
      const tr=document.createElement("tr");
      for(const s of [r.world,r.clock,r.dState.toExponential(2),
        r.dProbe.toExponential(2),r.relative===null?"—":r.relative.toFixed(3)]){
        const td=document.createElement("td");td.textContent=s;tr.appendChild(td);
      }
      $("benchRows").appendChild(tr);
      await yieldUi();
    }
    $("benchProgress").textContent="Completed "+benchData.length+" deterministic comparisons. Export the CSV; investigate scale, repeatability, and parameter sweeps before claiming memory.";
    $("csvBench").disabled=false;
  }catch(err){$("benchProgress").textContent="Benchmark error: "+String(err);console.error(err);}
  finally{busy=false;$("runBench").disabled=false;setPlaying(wasPlaying);}
};
$("csvBench").onclick=()=>{
  if(!benchData.length)return;
  const rows=[["world","clock","D_state","D_probe","probe_scale","relative_probe_difference"],
    ...benchData.map(r=>[r.world,r.clock,r.dState,r.dProbe,r.probeScale,r.relative])];
  const csv=rows.map(r=>r.map(v=>JSON.stringify(v===null?"":v)).join(",")).join("\n");
  const a=document.createElement("a");a.download="complexclockfield-ABBA.csv";
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
};
$("runTests").onclick=()=>{
  const results=[];
  function check(title,pass,details){results.push((pass?"PASS ":"FAIL ")+title+": "+details);}
  const uni=new Field(32,{clockMode:"uniform",clockStrength:0,bending:0});uni.reset("vacuum");uni.forces();
  let mx=0;for(let i=0;i<uni.len;i++)mx=Math.max(mx,Math.hypot(uni.au[i],uni.av[i]));
  check("Vacuum force",mx<1e-12,"max="+mx.toExponential(2));
  const vortex=new Field(40,{clockMode:"stamped",clockStrength:20});
  vortex.reset("single");const count=vortex.defects().reduce((a,p)=>a+p.q,0);
  check("Winding +1",count===1,"total="+count);
  check("Structure slows clock",Math.max(...vortex.mass)>1.01,
    "max m="+Math.max(...vortex.mass).toFixed(3));
  const cov=new Field(28,{clockMode:"uniform",clockStrength:0});
  cov.reset("pair");cov.forces();
  const au=cov.au.slice(),av=cov.av.slice(),angle=.39,c=Math.cos(angle),s=Math.sin(angle);
  for(let i=0;i<cov.len;i++){
    const u=cov.u[i],v=cov.v[i];cov.u[i]=c*u-s*v;cov.v[i]=s*u+c*v;
  }
  cov.forces();let err=0;
  for(let i=1;i<cov.len;i++)err=Math.max(err,
    Math.abs(cov.au[i]-(c*au[i]-s*av[i])),
    Math.abs(cov.av[i]-(s*au[i]+c*av[i])));
  check("Global U(1) symmetry",err<1e-9,"max residual="+err.toExponential(2));
  const con=new Field(40,{dt:.06,damping:0,bending:0,clockMode:"uniform",
    clockStrength:0,gradSoft:0.3});
  con.reset("vacuum");con.pulse(20,20,"A",.18,2.3);
  const e0=con.energy().total;
  for(let i=0;i<65;i++)con.step();
  const e1=con.energy().total,drift=Math.abs(e1-e0)/Math.max(1e-12,e0);
  check("Static-clock energy (short run)",drift<.015,
    "relative drift="+drift.toExponential(2));
  const linOpts={nonlinear:false,bending:0,gradSoft:0,clockMode:"uniform",clockStrength:0,damping:0};
  const la=new Field(32,linOpts),lb=new Field(32,linOpts);
  la.reset("vacuum");lb.reset("vacuum");
  la.pulse(11,16,"A",.3,2);lb.pulse(11,16,"B",.3,2);
  for(let i=0;i<16;i++){la.step();lb.step();}
  la.pulse(11,16,"B",.3,2);lb.pulse(11,16,"A",.3,2);
  for(let i=0;i<35;i++){la.step();lb.step();}
  const laC=la.clone(),lbC=lb.clone();
  laC.pulse(11,16,"C",.25,2);lbC.pulse(11,16,"C",.25,2);
  for(let i=0;i<40;i++){la.step();lb.step();laC.step();lbC.step();}
  const linearProbe=responseDifference(laC,la,lbC,lb,"all");
  check("Linear null probe independence",linearProbe.difference<1e-9,
    "D_probe="+linearProbe.difference.toExponential(2));
  $("testsOutput").textContent=results.join("\n")+"\n\n"+results.filter(r=>r.startsWith("PASS")).length+"/"+results.length+" checks passed.";
};
$("clockMode").value=sim.cfg.clockMode;
paint();sample();drawTrace();requestAnimationFrame(animate);
