#!/usr/bin/env node
// Reproduce the identity chapter's default experiments without a browser.
import {writeFileSync} from "node:fs";
import {survival,memoryExperiment,localityExperiment} from "../identity-lab.mjs";
const small=process.argv.includes("--fast");
const settings=small?{grid:40,warmup:35,wait:35,observe:80}:{};
const s=await survival({...settings,observe:small?100:220});
const m=await memoryExperiment({...settings,observe:small?80:144});
const l=await localityExperiment({...settings,observe:small?80:120});
const result={
  purpose:"Question-led ComplexClockfield falsification, not validation of elementary particles",
  settings:{survival:{grid:settings.grid??56,observe:small?100:220},
    memory:{wait:settings.wait??70,observe:small?80:144},
    locality:{wait:settings.wait??70,observe:small?80:120,radius:.17}},
  survival:{initial:s.initial,final:s.final,conservedNet:s.conservedNet,
    localizedSurvival:s.localizedSurvival,fieldRms:s.trace.at(-1).dfield,
    trace:s.trace},
  memory:{comparison:m.comparison,rows:m.rows.map(r=>({
    id:r.id,label:r.label,preD:r.preD,relative:r.relative,
    peakCore:r.peakCore,finalCharge:r.finalCharge,trace:r.trace
  }))},
  locality:{results:l.results},
  warnings:[
    "Pinned boundary constrains net winding; not a freely stable particle proof.",
    "The nonlinear vacuum is a valid history-sensitive control.",
    "Core-state swapping is artificial and can generate transient waves.",
    "Single deterministic protocol; no statistics or general superiority claims."
  ]
};
const json=JSON.stringify(result,null,2);
if(process.argv.includes("--json"))console.log(json);
else {
  console.log("WHAT MAKES A THING? | reproducible numerical interrogation");
  console.log("Defect survives pulse:",result.survival.localizedSurvival,
    "| winding:",result.survival.initial.charge,"→",result.survival.final.charge);
  console.table(result.memory.rows.map(r=>({
    world:r.label,preState:r.preD.toFixed(5),
    coreRatio:r.relative.core?.toFixed(4)??"—",
    farRatio:r.relative.far?.toFixed(4)??"—"
  })));
  console.table(result.locality.results.map(r=>({
    world:r.label,topologyUnchanged:r.windingCountsPreserved,
    hybridAB:r.swappedAB.donorLike?"donor-like":"recipient-like",
    hybridBA:r.swappedBA.donorLike?"donor-like":"recipient-like"
  })));
  console.log("Negative controls and localized causal interventions are part of the test.");
}
const out=process.argv.find(a=>a.startsWith("--output="));
if(out){const path=out.slice("--output=".length);
  if(!path)throw new Error("Expected --output=filename.json");
  writeFileSync(path,json+"\n");console.log("Saved "+path);
}
