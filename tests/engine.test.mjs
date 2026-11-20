import {test} from "node:test";
import assert from "node:assert/strict";
import {Field,l2Difference,responseDifference} from "../engine.mjs";
const close=(a,b,tol=1e-8)=>Math.abs(a-b)<=tol;

test("constant Mexican-hat vacuum exerts no force",()=>{
  const w=new Field(32,{clockMode:"uniform",bending:0});w.reset("vacuum");w.forces();
  assert.ok(w.au.every(x=>Math.abs(x)<1e-12));
  assert.ok(w.av.every(x=>Math.abs(x)<1e-12));
});
test("+1 winding is measured by plaquettes, not seeded labels",()=>{
  const w=new Field(40);w.reset("single");
  assert.equal(w.defects().reduce((s,p)=>s+p.q,0),1);
});
test("resolved double has exactly two positive unit defects",()=>{
  const w=new Field(64);w.reset("double");
  assert.equal(w.defects().reduce((s,p)=>s+p.q,0),2);
  assert.equal(w.defects().filter(p=>p.q>0).length,2);
});
test("+1 / -1 pair has zero net winding",()=>{
  const w=new Field(40);w.reset("pair");
  assert.equal(w.defects().reduce((s,p)=>s+p.q,0),0);
  assert.ok(w.defects().some(p=>p.q>0));
  assert.ok(w.defects().some(p=>p.q<0));
});
test("clock strength creates a slower core, uniform control does not",()=>{
  const a=new Field(40,{clockStrength:15,clockMode:"stamped"});
  const b=new Field(40,{clockStrength:15,clockMode:"uniform"});
  assert.ok(Math.max(...a.mass)>1.01);
  assert.ok(b.mass.every(m=>m===1));
});
test("forces are globally U(1)-equivariant",()=>{
  const w=new Field(28,{clockMode:"uniform",clockStrength:0});w.reset("pair");w.forces();
  const fr=w.au.slice(),fi=w.av.slice(),theta=.39,c=Math.cos(theta),s=Math.sin(theta);
  for(let i=0;i<w.len;i++){
    const u=w.u[i],v=w.v[i];
    w.u[i]=c*u-s*v;w.v[i]=s*u+c*v;
  }
  w.forces();
  for(let i=0;i<w.len;i++){
    assert.ok(close(w.au[i],c*fr[i]-s*fi[i],1e-9));
    assert.ok(close(w.av[i],s*fr[i]+c*fi[i],1e-9));
  }
});
test("static uniform clock + no damping: short-run energy drift is small",()=>{
  const w=new Field(40,{dt:.06,damping:0,bending:0,clockMode:"uniform",clockStrength:0,gradSoft:.3});
  w.reset("vacuum");w.pulse(20,20,"A",.18,2.3);
  const e0=w.energy().total;for(let i=0;i<65;i++)w.step();
  assert.ok(Math.abs(w.energy().total-e0)/e0<.015);
});
test("linear vacuum probe response is independent of AB/BA history",()=>{
  const cfg={nonlinear:false,bending:0,gradSoft:0,clockMode:"uniform",clockStrength:0,damping:0};
  const a=new Field(32,cfg),b=new Field(32,cfg);
  a.reset("vacuum");b.reset("vacuum");
  a.pulse(11,16,"A",.3,2);b.pulse(11,16,"B",.3,2);
  for(let k=0;k<16;k++){a.step();b.step();}
  a.pulse(11,16,"B",.3,2);b.pulse(11,16,"A",.3,2);
  for(let k=0;k<35;k++){a.step();b.step();}
  assert.ok(l2Difference(a,b)>1e-5,"the raw states do remember order");
  const ac=a.clone(),bc=b.clone();
  ac.pulse(11,16,"C",.25,2);bc.pulse(11,16,"C",.25,2);
  for(let k=0;k<40;k++){a.step();b.step();ac.step();bc.step();}
  const v=responseDifference(ac,a,bc,b,"all");
  assert.ok(v.difference<1e-9,"sham subtraction cancels linear history");
});
test("brief nonlinear evolution stays finite",()=>{
  const w=new Field(48);
  for(let k=0;k<100;k++)w.step();
  assert.ok(w.u.every(Number.isFinite));assert.ok(w.v.every(Number.isFinite));
});
