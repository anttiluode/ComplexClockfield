// "What is a thing?" experiments for ComplexClockfield.
// Reusable in the browser and Node's headless test runner.
import { Field, l2Difference } from "./engine.mjs";

export const CONDITIONS = Object.freeze([
  {id:"linear", label:"Linear vacuum", vacuum:true, linear:true, clock:false, color:"#b8b9c8"},
  {id:"vacuum", label:"Nonlinear vacuum", vacuum:true, linear:false, clock:false, color:"#f0c27a"},
  {id:"uniform", label:"Defect, uniform clock", vacuum:false, linear:false, clock:false, color:"#7bcfea"},
  {id:"graded", label:"Defect, graded clock", vacuum:false, linear:false, clock:true, color:"#a69df6"}
]);

export const DEFAULT_IDENTITY = Object.freeze({
  grid:56, seed:"single", clockStrength:12, damping:.020,
  gradSoft:.15, lambda:.23, dt:.105, bend:0,
  pulse:.34, wait:70, gap:18, observe:120,
  warmup:55, readStep:8
});

export function configuration(user={},control={}) {
  const settings={...DEFAULT_IDENTITY,...user};
  return {
    dt:settings.dt,
    damping:settings.damping,
    gradSoft:control.linear?0:settings.gradSoft,
    bending:settings.bend,
    lambda:settings.lambda,
    nonlinear:!control.linear,
    clockStrength:control.clock?settings.clockStrength:0,
    clockMode:control.clock?"stamped":"uniform"
  };
}
const clockControl={clock:true,linear:false};
export function makeWorld(settings={}, control={}) {
  const cfg={...DEFAULT_IDENTITY,...settings};
  const world = new Field(cfg.grid,configuration(cfg,control));
  world.reset(control.vacuum?"vacuum":cfg.seed);
  return world;
}
function waitFrame() { return new Promise(resolve=>setTimeout(resolve,0)); }
async function progressSteps(fields,ticks, progress, frequency=20) {
  for(let k=0;k<ticks;k++){
    for(const f of fields)f.step();
    if(k%frequency===frequency-1) {
      if(progress)progress(k+1,ticks);
      await waitFrame();
    }
  }
}
function totals(world) {
  const ds=world.defects();
  return {plus:ds.filter(x=>x.q>0).reduce((s,x)=>s+x.q,0),
    minus:ds.filter(x=>x.q<0).reduce((s,x)=>s-x.q,0),
    charge:ds.reduce((s,x)=>s+x.q,0), raw:ds};
}
function closestDefect(defects,target) {
  if(!target)return null;
  let best=null, distance=Infinity;
  for(const p of defects){
    if(Math.sign(p.q)!==Math.sign(target.q))continue;
    const d=Math.hypot(p.x-target.x,p.y-target.y);
    if(d<distance){best=p;distance=d;}
  }
  return best?{...best,distance}:null;
}
function centerDefect(w,positive=true) {
  const arr=w.defects().filter(p=>positive?p.q>0:p.q<0);
  let best=null,d=Infinity;
  for(const p of arr){
    const dist=Math.hypot(p.x-w.n/2,p.y-w.n/2);
    if(dist<d){best=p;d=dist;}
  }
  return best;
}
export async function survival(settings={},update=null) {
  const opts={...DEFAULT_IDENTITY,...settings};
  const target=makeWorld(opts,clockControl);
  await progressSteps([target],opts.warmup);
  const sham=target.clone();
  const initial=totals(target);
  const anchor=centerDefect(target);
  const trace=[];
  // Pulse is outside the nominal core, common to defect and vacuum controls.
  target.pulse(target.n*.28,target.n*.50,"C",opts.pulse,3.1);
  const steps=Math.max(20,Math.round(opts.observe));
  const checkpoint=(k)=>{
    const state=totals(target), nearest=closestDefect(state.raw,anchor);
    trace.push({step:k,charge:state.charge,plus:state.plus,minus:state.minus,
      displacement:nearest?nearest.distance:null,
      dfield:l2Difference(target,sham,"all"),
      core:nearest?{x:nearest.x,y:nearest.y,q:nearest.q}:null});
  };
  checkpoint(0);
  for(let k=1;k<=steps;k++){
    target.step();sham.step();
    if(k%opts.readStep===0 || k===steps)checkpoint(k);
    if(k%22===0){if(update)update(k,steps);await waitFrame();}
  }
  const last=trace.at(-1);
  return {initial:{plus:initial.plus,minus:initial.minus,charge:initial.charge,anchor},
    final:{plus:last.plus,minus:last.minus,charge:last.charge,displacement:last.displacement},
    trace,perturbed:target,sham,
    conservedNet:last.charge===initial.charge,
    localizedSurvival:anchor?last.core!==null:null,
    note:"Fixed boundary preserves total topological charge. A surviving marker is not proof of a free stable particle."};
}
// Correct comparison: the DIFFERENCE caused by the new probe C after each
// distinct history, NOT the raw difference between the two final states.
export function differentialResponse(aProbed,aSham,bProbed,bSham,where="core",seed="single") {
  const n=aProbed.n,centers=seed==="pair"
    ?[[n*.405,n*.5],[n*.595,n*.5]]
    :[[n*.5,n*.5]];
  let changed=0,signal=0,count=0;
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
    const near=centers.some(([cx,cy])=>Math.hypot(x-cx,y-cy)<n*.18);
    const included=where==="all" || (where==="core" && near) ||
      (where==="far" && x>n*.74 && y>n*.12 && y<n*.88);
    if(!included)continue;
    const i=y*n+x;
    const ar=aProbed.u[i]-aSham.u[i],ai=aProbed.v[i]-aSham.v[i];
    const br=bProbed.u[i]-bSham.u[i],bi=bProbed.v[i]-bSham.v[i];
    changed+=(ar-br)**2+(ai-bi)**2;
    signal+=(ar*ar+ai*ai+br*br+bi*bi)*.5;count++;
  }
  return {difference:Math.sqrt(changed/Math.max(count,1)),
    probeRms:Math.sqrt(signal/Math.max(count,1)),
    // A time-integrated response is more robust than relative ratio at a single
    // near-zero-amplitude frame.
    powerDifference:changed/Math.max(count,1),powerProbe:signal/Math.max(count,1)};
}
async function historyBranch(settings,condition,order,progress) {
  const opts={...DEFAULT_IDENTITY,...settings};
  const w=makeWorld(opts,{vacuum:condition.vacuum,linear:condition.linear,clock:condition.clock});
  await progressSteps([w],opts.warmup);
  const x=w.n*.36,y=w.n*.5;
  w.pulse(x,y,order[0],opts.pulse,3);
  await progressSteps([w],opts.gap);
  w.pulse(x,y,order[1],opts.pulse,3);
  await progressSteps([w],opts.wait,progress);
  return w;
}
export async function memoryExperiment(settings={},update=null) {
  const opts={...DEFAULT_IDENTITY,...settings};
  const rows=[];
  for(let j=0;j<CONDITIONS.length;j++){
    const cond=CONDITIONS[j];
    if(update)update("Preparing "+cond.label+" ("+(j+1)+"/"+CONDITIONS.length+")",j/CONDITIONS.length);
    const ab=await historyBranch(opts,cond,"AB");
    const ba=await historyBranch(opts,cond,"BA");
    const preD=l2Difference(ab,ba);
    const aProbe=ab.clone(),aSham=ab.clone(),bProbe=ba.clone(),bSham=ba.clone();
    aProbe.pulse(opts.grid*.36,opts.grid*.5,"C",opts.pulse,3);
    bProbe.pulse(opts.grid*.36,opts.grid*.5,"C",opts.pulse,3);
    const series=[],accum={core:[0,0],far:[0,0],all:[0,0]};
    const record=(k)=>{
      const v={t:k};
      for(const region of ["core","far","all"]){
        const m=differentialResponse(aProbe,aSham,bProbe,bSham,region,cond.vacuum?"vacuum":opts.seed);
        v[region]=m.difference;
        v[region+"Rms"]=m.probeRms;
        // Integrate only once per recorded interval; same sample spacing.
        accum[region][0]+=m.powerDifference;
        accum[region][1]+=m.powerProbe;
      }
      series.push(v);
    };
    record(0);
    for(let k=1;k<=opts.observe;k++){
      for(const w of [aProbe,aSham,bProbe,bSham])w.step();
      if(k%opts.readStep===0 || k===opts.observe)record(k);
      if(k%24===0){
        if(update)update("Reading "+cond.label+": "+k+"/"+opts.observe,(j+(k/opts.observe))/CONDITIONS.length);
        await waitFrame();
      }
    }
    const relative={};
    for(const region of ["core","far","all"]){
      const [difference,probe]=accum[region];
      relative[region]=probe>1e-14?Math.sqrt(difference/probe):null;
    }
    rows.push({id:cond.id,label:cond.label,color:cond.color,preD,relative,
      peakCore:Math.max(...series.map(r=>r.core)),
      trace:series,
      finalCharge:totals(ab).charge,
      // Worlds shown are the A/B-conditioned fields before the probe.
      abSnapshot:ab,baSnapshot:ba
    });
  }
  const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
  const cutoff=0.00001;
  const vortexBetter=byId.uniform.relative.core!==null && byId.vacuum.relative.core!==null &&
    byId.uniform.relative.core>byId.vacuum.relative.core+cutoff;
  const gradedBetter=byId.graded.relative.core!==null && byId.uniform.relative.core!==null &&
    byId.graded.relative.core>byId.uniform.relative.core+cutoff;
  return {
    settings:opts,rows,
    comparison:{vortexBetter,gradedBetter,
      linearNull:byId.linear.relative.core===null || byId.linear.relative.core<1e-6},
    disclaimer:"Single deterministic protocol. A nonlinear vacuum can retain history; no measurement yet proves memory resides inside a defect."
  };
}
