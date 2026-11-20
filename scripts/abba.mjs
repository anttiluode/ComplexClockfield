#!/usr/bin/env node
// Deterministic first-pass AB/BA response-interaction sweep.
// Run: node scripts/abba.mjs [--json] [--output=filename.csv]
import {writeFileSync} from "node:fs";
import {Field,l2Difference,responseDifference} from "../engine.mjs";
const controls=[
  ["Linear vacuum","vacuum",false,true],
  ["Nonlinear vacuum","vacuum",false,false],
  ["Vortex pair","pair",false,false],
  ["Vortex + clock","pair",true,false],
  ["Four + clock","quartet",true,false]
];
const input={grid:64,dt:.11,damping:.028,bending:0,lambda:.23,gradSoft:.15,
  clockStrength:12,firstTime:72,gapSteps:19,waitSteps:82,probeSteps:115,
  pulseAmplitude:.23,probeAmplitude:.34,region:"right",seed:"deterministic"};
function trial(seed,clock,linear,order){
  const n=input.grid;
  const opts={dt:input.dt,damping:input.damping,bending:input.bending,lambda:input.lambda,
    nonlinear:!linear,gradSoft:linear?0:input.gradSoft,clockMode:clock?"stamped":"uniform",
    clockStrength:clock?input.clockStrength:0};
  const world=new Field(n,opts);world.reset(seed);
  for(let i=0;i<input.firstTime;i++)world.step();
  const x=n*.39,y=n*.50;
  world.pulse(x,y,order[0],input.pulseAmplitude,3);
  for(let i=0;i<input.gapSteps;i++)world.step();
  world.pulse(x,y,order[1],input.pulseAmplitude,3);
  for(let i=0;i<input.waitSteps;i++)world.step();
  const before=world.clone(),c=world.clone(),sham=world.clone();
  c.pulse(x,y,"C",input.probeAmplitude,3);
  for(let i=0;i<input.probeSteps;i++){c.step();sham.step();}
  return {before,c,sham};
}
const rows=[];
for(const [name,seed,clock,linear] of controls){
  const ab=trial(seed,clock,linear,"AB"),ba=trial(seed,clock,linear,"BA");
  const resp=responseDifference(ab.c,ab.sham,ba.c,ba.sham,input.region);
  rows.push({world:name,clock:clock?"graded":"uniform",
    D_state:l2Difference(ab.before,ba.before),
    D_probe:resp.difference,probe_scale:resp.response,
    relative:resp.response>1e-10?resp.fraction:null});
}
if(process.argv.includes("--json"))console.log(JSON.stringify({input,rows},null,2));
else {
  console.log("ComplexClockfield · AB/BA + sham-probe first-pass controls");
  console.log("Parameters: "+JSON.stringify(input));
  console.table(rows.map(r=>({
    world:r.world,clock:r.clock,D_state:r.D_state.toExponential(4),
    D_probe:r.D_probe.toExponential(4),relative:r.relative===null?"—":r.relative.toFixed(4)
  })));
  console.log("No repeated seeds or held-out protocols. These are descriptive, not discovery claims.");
}
const out=process.argv.find(a=>a.startsWith("--output="));
if(out){
  const path=out.slice("--output=".length);
  if(!path)throw Error("Missing path after --output=");
  const cols=["world","clock","D_state","D_probe","probe_scale","relative"];
  const csv=[cols.join(","),...rows.map(r=>cols.map(k=>JSON.stringify(r[k]??"")).join(","))].join("\n")+"\n";
  writeFileSync(path,csv);console.log("Wrote "+path);
}
