import { Field } from "./engine.mjs";
import { makeWorld, survival, memoryExperiment, localityExperiment } from "./identity-lab.mjs";

const $=id=>document.getElementById(id);
const colors={cyan:"#76d4e9",gold:"#e9bc76",pink:"#f096af",violet:"#b8aaff",muted:"#96a9bd"};
let lastSurvival=null,lastMemory=null,lastLocality=null,busy=false;
const canvases=["shamCanvas","challengeCanvas"].map(id=>$(id));
function fixed(v,n=3){return Number.isFinite(v)?v.toFixed(n):"—";}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function phaseRgb(theta,mag){
  const h=(((theta/(Math.PI*2))+1)%1)*6;
  const saturation=.82,brightness=clamp(.16+.82*(1-Math.exp(-2*mag)),0,1);
  const c=brightness*saturation,x=c*(1-Math.abs(h%2-1)),m=brightness-c;
  const z=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
  return z.map(q=>Math.round((q+m)*255));
}
function render(world,canvas){
  if(!world)return;
  const n=world.n;
  canvas.width=n;canvas.height=n;
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  const img=ctx.createImageData(n,n);
  for(let i=0;i<n*n;i++){
    const u=world.u[i],v=world.v[i];
    const rgb=phaseRgb(Math.atan2(v,u),Math.hypot(u,v));
    img.data[i*4]=rgb[0];img.data[i*4+1]=rgb[1];
    img.data[i*4+2]=rgb[2];img.data[i*4+3]=255;
  }
  ctx.putImageData(img,0,0);
  ctx.lineWidth=.8;ctx.font="bold 4px monospace";
  for(const p of world.defects()){
    ctx.strokeStyle=p.q>0?"#b5ffdd":"#ff9cbb";
    ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=ctx.strokeStyle;ctx.fillText(p.q>0?"+":"−",p.x+2,p.y-1);
  }
}
function chart(canvas,series,titleColors,options={}){
  const c=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
  c.fillStyle="#0a1520";c.fillRect(0,0,W,H);
  const left=58,right=W-18,top=19,bottom=H-34;
  const all=series.flatMap(s=>s.data.map(p=>p.y)).filter(Number.isFinite);
  const maxVal=options.yMax??Math.max(...all,0);
  const ymax=Math.max(1e-8,maxVal*1.13);
  const xall=series.flatMap(s=>s.data.map(p=>p.x));
  const xmax=Math.max(...xall,1);
  c.font="12px ui-monospace,monospace";c.lineWidth=1;
  for(let k=0;k<=4;k++){
    const y=top+(bottom-top)*k/4;
    c.beginPath();c.strokeStyle="#2a3d50";c.moveTo(left,y);c.lineTo(right,y);c.stroke();
    c.fillStyle="#93abbf";c.textAlign="right";
    c.fillText((ymax*(1-k/4)).toFixed(ymax<.01?4:ymax<.1?3:2),left-9,y+4);
  }
  for(let k=0;k<=5;k++){
    const x=left+(right-left)*k/5;
    c.fillStyle="#93abbf";c.textAlign="center";
    c.fillText(Math.round(xmax*k/5),x,bottom+17);
  }
  c.fillText("STEPS AFTER EVENT →",right-70,H-5);
  c.save();c.beginPath();c.rect(left,top,right-left,bottom-top);c.clip();
  for(const [i,ser] of series.entries()){
    c.beginPath();c.strokeStyle=ser.color||titleColors[i]||colors.cyan;c.lineWidth=2.6;c.setLineDash(ser.dash?[9,6]:[]);
    ser.data.forEach((p,k)=>{
      const x=left+(right-left)*p.x/xmax;
      const y=bottom-(bottom-top)*clamp(p.y/ymax,0,1);
      if(k===0)c.moveTo(x,y);else c.lineTo(x,y);
    });
    c.stroke();
  }
  c.restore();c.setLineDash([]);
}
function setBusy(status) {
  busy=status;
  $("surviveBtn").disabled=status;
  $("memoryBtn").disabled=status;
  $("localityBtn").disabled=status;
}
function updateConclusion(){
  const box=$("liveVerdict");
  if(!lastSurvival && !lastMemory)return;
  const paragraphs=[];
  if(lastSurvival){
    const s=lastSurvival;
    if(s.initial.anchor){
      paragraphs.push(s.localizedSurvival
        ? "The tracked same-sign vortex is still detectable after the challenge. Its phase topology survived this particular perturbation in a pinned-boundary world."
        : "The original same-sign core could not be tracked at the final readout. This challenge did not establish individual-core persistence.");
    }else paragraphs.push("The vacuum control had no initial topological defect. Changes in its colors are waves, not evidence of a persisting vortex.");
    paragraphs.push("The disturbed and untouched fields differ by "+fixed(s.trace.at(-1).dfield,4)+" RMS field units.");
  }
  if(lastMemory){
    const {comparison,rows}=lastMemory;
    const linear=rows.find(r=>r.id==="linear");
    paragraphs.push(comparison.linearNull
      ? "The linear vacuum's sham-subtracted history dependence was negligible, as required by the negative control."
      : "The linear null was not negligible. Do not trust a history-memory interpretation before debugging.");
    paragraphs.push(comparison.vortexBetter
      ? "Under this one protocol, the uniform-clock defect produced a larger normalized near-core history-sensitive probe response than the nonlinear vacuum."
      : "Under this protocol, the vortex did not exceed the nonlinear vacuum's normalized near-core history-sensitive response. Nonlinearity alone may suffice.");
    paragraphs.push(comparison.gradedBetter
      ? "The graded clock increased the integrated relative response compared with the same uniform-clock defect."
      : "The graded clock did not increase the integrated relative response compared with the same uniform-clock defect.");
    const err=linear?.relative.core;
    paragraphs.push("Linear control ratio: "+(err===null?"below response threshold":fixed(err,6))+". One trajectory per condition: no statistical claim.");
  }

  if(lastLocality){
    const vac=lastLocality.results.find(r=>r.id==="vacuum");
    const def=lastLocality.results.find(r=>r.id==="uniform");
    const d=def.swappedAB.donorLike,v=vac.swappedAB.donorLike;
    paragraphs.push(d && !v
      ?"For this specific transplant, swapping the core makes the defect world's response more like the donor history, while the vacuum control does not show the same classification. A localized causal effect is plausible, but the cut is artificial."
      :d && v
      ?"Both the vortex and nonlinear vacuum become donor-like under the same core-region swap. This is not defect-specific evidence of internal memory."
      :"Under the selected transplant and readout, the defect did not clearly make the probe respond like the donor core. The external field or intervention transients may dominate.");
  }
  box.replaceChildren();
  const label=document.createElement("span");label.textContent="YOUR WORLD'S VERDICT";
  const p=document.createElement("p");p.textContent=paragraphs.join(" ");
  box.append(label,p);
}
function renderSurvival(s){
  render(s.sham,canvases[0]);render(s.perturbed,canvases[1]);
  $("survivalCharge").textContent=s.initial.charge+" → "+s.final.charge;
  $("survivalCore").textContent=s.localizedSurvival===null?"NO CORE TO TRACK":s.localizedSurvival?"YES":"NOT TRACKED";
  $("survivalDifference").textContent=fixed(s.trace.at(-1).dfield,5);
  $("survivalMovement").textContent=s.final.displacement===null?"—":fixed(s.final.displacement,2)+" px";
  chart($("survivalGraph"),[
    {data:s.trace.map(p=>({x:p.step,y:p.dfield})),color:colors.cyan},
    {data:s.trace.filter(p=>p.displacement!==null).map(p=>({x:p.step,y:p.displacement})),color:colors.pink}
  ],[]);
  const summary=s.initial.anchor
    ?(s.localizedSurvival
       ?"The vortex is still detected, even though the perturbed field differs from the sham world."
       :"We could not match a same-sign core at the final observation.")
    :"The vacuum world had no pre-existing vortex. This test measures only its wave response.";
  $("survivalInterpretation").textContent=summary+" Net winding "+(s.conservedNet?"was conserved":"changed")+
    ". Pinned boundaries constrain global topological charge; no claim of a freely stable particle follows.";
}
function renderMemory(m){
  const regionSeries=m.rows.map(r=>({
    color:r.color,data:r.trace.map(t=>({x:t.t,y:t.core}))}));
  chart($("memoryGraph"),regionSeries,[]);
  const body=$("memoryRows");body.replaceChildren();
  for(const r of m.rows){
    const tr=document.createElement("tr");
    const values=[r.label,fixed(r.preD,5),
      r.relative.core===null?"no probe":fixed(r.relative.core,4),
      r.relative.far===null?"no probe":fixed(r.relative.far,4)];
    for(const v of values){const td=document.createElement("td");td.textContent=v;tr.appendChild(td);}
    body.appendChild(tr);
  }
  const v=m.rows.find(x=>x.id==="uniform"),q=m.rows.find(x=>x.id==="graded"),nullRow=m.rows.find(x=>x.id==="vacuum");
  const interpretations=[];
  interpretations.push(m.comparison.linearNull
    ?"The linear null behaves correctly: AB and BA can leave different states while the incremental response to the same C remains independent of order."
    :"The linear control did not vanish: the experiment's null must be investigated.");
  const compare=(a,b)=>{
    if(a===null||b===null)return "No reliable ratio is available.";
    return " Integrated near-core ratios: "+fixed(a,4)+" versus "+fixed(b,4)+".";
  };
  interpretations.push((m.comparison.vortexBetter
      ?"The defect exceeds the nonlinear vacuum in this selected normalized response measure."
      :"The defect does not exceed the nonlinear vacuum in this selected normalized response measure.")+
    compare(v.relative.core,nullRow.relative.core));
  interpretations.push((m.comparison.gradedBetter
      ?"The graded Clockfield exceeds the uniform-clock defect here."
      :"The graded Clockfield does not exceed the uniform-clock defect here.")+
    compare(q.relative.core,v.relative.core));
  interpretations.push("These are differences in the global field's responses within a nominal near-core region, not proof that memory lives inside the core.");
  $("memoryInterpretation").textContent=interpretations.join(" ");
}
$("surviveBtn").onclick=async()=>{
  if(busy)return;
  setBusy(true);
  $("surviveStatus").textContent="Preparing identical worlds...";
  try{
    const seed=$("surviveSeed").value;
    const settings={seed,pulse:Number($("survivePulse").value),
      clockStrength:Number($("surviveClock").value),observe:220,readStep:10};
    const s=await survival(settings,(step,total)=>{
      $("surviveStatus").textContent="Advancing both worlds: "+step+" / "+total+" field steps";
    });
    lastSurvival=s;
    renderSurvival(s);updateConclusion();
    $("surviveStatus").textContent="Completed: 220 matching time steps. Compare the cores and field difference.";
  }catch(e){console.error(e);$("surviveStatus").textContent="Experiment failed: "+e.message;}
  finally{setBusy(false);}
};
$("memoryBtn").onclick=async()=>{
  if(busy)return;
  setBusy(true);
  $("memoryStatus").textContent="Cloning matched histories...";
  try{
    const settings={seed:$("memorySeed").value,wait:Number($("wait").value),
      clockStrength:Number($("memoryClock").value),
      observe:144,readStep:8};
    const m=await memoryExperiment(settings,(label,fraction)=>{
      $("memoryStatus").textContent=label+" · "+Math.round(100*fraction)+"%";
    });
    lastMemory=m;
    renderMemory(m);updateConclusion();
    $("memoryStatus").textContent="Four controls completed. Integrated response ratios and full time traces shown; no winning result assumed.";
  }catch(e){console.error(e);$("memoryStatus").textContent="Experiment failed: "+e.message;}
  finally{setBusy(false);}
};

function renderLocality(result){
  const vacuum=result.results.find(x=>x.id==="vacuum");
  const defect=result.results.find(x=>x.id==="uniform");
  chart($("localityGraph"),[
    {data:defect.trace.map(x=>({x:x.t,y:x.h1Recipient})),color:colors.cyan},
    {data:defect.trace.map(x=>({x:x.t,y:x.h1Donor})),color:colors.gold},
    {data:vacuum.trace.map(x=>({x:x.t,y:x.h1Recipient})),color:colors.cyan,dash:true},
    {data:vacuum.trace.map(x=>({x:x.t,y:x.h1Donor})),color:colors.gold,dash:true}
  ],[]);
  const tbody=$("localityRows");tbody.replaceChildren();
  for(const r of result.results){
    const tr=document.createElement("tr");
    function description(x){
      return (x.meaningful?(x.donorLike?"DONOR-LIKE":"RECIPIENT-LIKE"):"UNRESOLVED")+
        " (donor "+fixed(x.donorDistance,4)+", host "+fixed(x.recipientDistance,4)+")";
    }
    for(const value of [r.label,fixed(r.baseline,5),description(r.swappedAB),description(r.swappedBA)]){
      const td=document.createElement("td");td.textContent=value;tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  const v=vacuum.swappedAB,d=defect.swappedAB;
  const twin=d.donorLike && defect.swappedBA.donorLike;
  const same=v.donorLike && vacuum.swappedBA.donorLike;
  let story="The surgery exchanged field values AND momenta in a smooth central disk. ";
  if(twin&&!same)story+="Both vortex hybrids moved toward their core donor's response, while the vacuum control did not do so symmetrically. This suggests a possible defect-associated causal role, but not exclusive or natural internal memory.";
  else if(twin&&same)story+="Both vortex and vacuum hybrids became donor-like. Region-swapping effects therefore cannot be credited uniquely to the vortex.";
  else story+="The vortex hybrids did not both become donor-like. At this setting, the internal-region swap does not demonstrate a transferable particle history.";
  story+=" The interface is an imposed intervention, and the comparison needs radius, waiting-time and mesh sweeps.";
  $("localityInterpretation").textContent=story;
}
$("localityBtn").onclick=async()=>{
  if(busy)return;
  setBusy(true);$("localityStatus").textContent="Preparing paired trajectories and blending the regions...";
  try{
    const settings={seed:$("localitySeed").value,
      radius:Number($("localityRadius").value),
      wait:Number($("localityWait").value),
      observe:120,readStep:8};
    const result=await localityExperiment(settings,(msg,fraction)=>{
      $("localityStatus").textContent=msg+" · "+Math.round(fraction*100)+"%";
    });
    lastLocality=result;renderLocality(result);updateConclusion();
    $("localityStatus").textContent="Both vacuum and vortex core swaps completed; compare recipient-versus-donor distances.";
  }catch(err){console.error(err);$("localityStatus").textContent="Intervention failed: "+err.message;}
  finally{setBusy(false);}
};

for(const [id,output] of [["survivePulse","survivePulseVal"],["surviveClock","surviveClockVal"],["wait","waitVal"],["memoryClock","memoryClockVal"],["localityRadius","localityRadiusVal"],["localityWait","localityWaitVal"]]){
  $(id).addEventListener("input",()=>$(output).textContent=$(id).value+(id==="localityRadius"?" fraction":""));
  if(id==="localityRadius")$(id).addEventListener("input",()=>$(output).textContent=Math.round(100*Number($(id).value))+"%");
}
const initial=makeWorld({seed:"single",grid:56},{clock:true,linear:false});
render(initial,canvases[0]);render(initial,canvases[1]);
chart($("survivalGraph"),[],[]);
chart($("memoryGraph"),[],[]);
chart($("localityGraph"),[],[]);
