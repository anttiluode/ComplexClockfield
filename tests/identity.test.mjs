import {test} from "node:test";
import assert from "node:assert/strict";
import {makeWorld,survival,memoryExperiment,transplant,localityExperiment} from "../identity-lab.mjs";

test("surviving +1 defect remains measurable after a bounded disturbance",async()=>{
  const r=await survival({grid:40,warmup:35,observe:100,readStep:10,pulse:.30});
  assert.equal(r.initial.charge,1);
  assert.equal(r.final.charge,1);
  assert.equal(r.localizedSurvival,true);
  assert.ok(r.trace.at(-1).dfield>1e-5);
});
test("vacuum has no initial winding; challenge alone cannot be called particle memory",async()=>{
  const r=await survival({grid:32,seed:"vacuum",warmup:20,observe:40,readStep:8});
  assert.equal(r.initial.charge,0);
  assert.equal(r.localizedSurvival,null);
});
test("AB/BA probe has linear null and a nonlinear vacuum counterexample",async()=>{
  const r=await memoryExperiment({grid:40,warmup:35,wait:30,observe:64,readStep:8});
  const x=Object.fromEntries(r.rows.map(row=>[row.id,row]));
  assert.ok(x.linear.preD>1e-6,"the underlying linear histories really differed");
  assert.ok(x.linear.relative.core!==null && x.linear.relative.core<1e-8,
    "the sham-subtracted response of a linear vacuum is history-independent");
  assert.ok(x.vacuum.peakCore>1e-4,
    "nonlinear vacuum alone generates history-sensitive responses");
  for(const row of r.rows) {
    assert.ok(Number.isFinite(row.preD));
    assert.ok(Number.isFinite(row.peakCore));
  }
});
test("transplant to the same world is exactly identity operation",()=>{
  const x=makeWorld({grid:32,seed:"single"});
  const y=transplant(x,x,.17);
  for(const key of ["u","v","pu","pv"])
    assert.deepEqual(Array.from(x[key]),Array.from(y[key]));
});
test("local surgery keeps charge and produces finite matched comparisons",async()=>{
  const r=await localityExperiment({grid:40,warmup:35,wait:35,observe:48,readStep:8});
  assert.equal(r.results.length,2);
  for(const x of r.results){
    assert.equal(x.windingCountsPreserved,true,
      "the surgery must not change the number of topological defects in this test");
    assert.ok(x.baseline>0);
    for(const q of [x.swappedAB,x.swappedBA]){
      assert.ok(q.meaningful);
      assert.ok(Number.isFinite(q.recipientDistance));
      assert.ok(Number.isFinite(q.donorDistance));
    }
  }
});
