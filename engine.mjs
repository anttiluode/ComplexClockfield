// ComplexClockfield: finite-difference complex field engine (no dependencies).
// See THEORY.md: these are engineered dynamics, not Einstein gravity or Q-balls.
export const DEFAULTS = Object.freeze({
  dt:0.105, lambda:0.23, damping:0.012, bending:0.008,
  gradSoft:0.15, speedFloor:0.30, clockStrength:12,
  clockMode:"stamped", nonlinear:true
});
export function wrapAngle(a) {
  while(a <= -Math.PI) a += Math.PI*2;
  while(a > Math.PI) a -= Math.PI*2;
  return a;
}
export class Field {
  constructor(n=112, opts={}) {
    this.n=n; this.len=n*n;
    this.cfg={...DEFAULTS,...opts};
    this.u=new Float64Array(this.len); this.v=new Float64Array(this.len);
    this.pu=new Float64Array(this.len); this.pv=new Float64Array(this.len);
    this.mass=new Float64Array(this.len);
    this.au=new Float64Array(this.len); this.av=new Float64Array(this.len);
    this.lu=new Float64Array(this.len); this.lv=new Float64Array(this.len);
    this.bu=new Float64Array(this.len); this.bv=new Float64Array(this.len);
    this.tick=0; this.seedName="pair";
    this.reset("pair");
  }
  clone() {
    const c=new Field(this.n,this.cfg);
    for(const k of ["u","v","pu","pv","mass","bu","bv"]) c[k].set(this[k]);
    c.tick=this.tick; c.seedName=this.seedName;
    return c;
  }
  reset(kind="pair") {
    this.seedName=kind; this.tick=0;
    const n=this.n, mid=(n-1)/2, R=n*0.19, core=3.4;
    const lumps=[];
    if(kind==="pair") lumps.push([mid-R/2,mid,1],[mid+R/2,mid,-1]);
    if(kind==="single") lumps.push([mid,mid,1]);
    if(kind==="double") lumps.push([mid,mid,2]);
    if(kind==="quartet") lumps.push([mid-R,mid-R,1],[mid+R,mid-R,-1],[mid-R,mid+R,-1],[mid+R,mid+R,1]);
    for(let y=0;y<n;y++) for(let x=0;x<n;x++){
      let phase=0,rho=1;
      for(const [cx,cy,q] of lumps){
        const dx=x-cx,dy=y-cy,dist=Math.hypot(dx,dy);
        phase+=q*Math.atan2(dy,dx);
        rho*=Math.pow(Math.tanh(dist/(core*Math.sqrt(Math.abs(q)))),Math.abs(q));
      }
      const i=y*n+x;
      this.u[i]=rho*Math.cos(phase); this.v[i]=rho*Math.sin(phase);
      this.pu[i]=0; this.pv[i]=0;
    }
    this.bu.set(this.u); this.bv.set(this.v);
    this.rebuildClock();
  }
  rebuildClock() {
    const n=this.n,k=this.cfg.clockStrength,mode=this.cfg.clockMode;
    for(let y=0;y<n;y++) for(let x=0;x<n;x++){
      const i=y*n+x;
      if(mode==="uniform" || k===0){this.mass[i]=1;continue;}
      const l=y*n+Math.max(0,x-1),r=y*n+Math.min(n-1,x+1);
      const t=Math.max(0,y-1)*n+x,b=Math.min(n-1,y+1)*n+x;
      const dux=(this.u[r]-this.u[l])*.5, dvx=(this.v[r]-this.v[l])*.5;
      const duy=(this.u[b]-this.u[t])*.5, dvy=(this.v[b]-this.v[t])*.5;
      const grad2=dux*dux+dvx*dvx+duy*duy+dvy*dvy;
      this.mass[i]=Math.min(100,1+k*grad2);
    }
  }
  // Every edge acts on its two endpoints with equal/opposite forces. The
  // nonlinear spring law is derived from a pair potential (THEORY.md).
  forces(){
    const n=this.n,L=this.len;
    const u=this.u,v=this.v,au=this.au,av=this.av;
    au.fill(0);av.fill(0);
    const soft=Math.max(0,this.cfg.gradSoft),floor=this.cfg.speedFloor;
    const add=(i,j,w,dist2)=>{
      const du=u[j]-u[i],dv=v[j]-v[i];
      const q=(du*du+dv*dv)/dist2;
      const c=floor+(1-floor)/Math.sqrt(1+soft*q);
      const fu=w*c*du,fv=w*c*dv;
      au[i]+=fu;av[i]+=fv;au[j]-=fu;av[j]-=fv;
    };
    // 9-point isotropic-to-fourth-order linear limit: axial 2/3, diagonal 1/6.
    for(let y=0;y<n;y++) for(let x=0;x<n;x++){
      const i=y*n+x;
      if(x+1<n) add(i,i+1,2/3,1);
      if(y+1<n) add(i,i+n,2/3,1);
      if(y+1<n && x+1<n) add(i,i+n+1,1/6,2);
      if(y+1<n && x>0) add(i,i+n-1,1/6,2);
    }
    const lam=this.cfg.lambda;
    for(let i=0;i<L;i++){
      if(this.cfg.nonlinear){
        const q=u[i]*u[i]+v[i]*v[i]-1;
        au[i]-=lam*q*u[i];av[i]-=lam*q*v[i];
      }else {
        au[i]-=2*lam*(u[i]-1); // linearized about vacuum (u,v)=(1,0)
      }
    }
    const gam=this.cfg.bending;
    if(gam>0){
      const lap=(f,out)=>{
        for(let y=0;y<n;y++)for(let x=0;x<n;x++){
          const i=y*n+x, xm=Math.max(0,x-1),xp=Math.min(n-1,x+1);
          const ym=Math.max(0,y-1),yp=Math.min(n-1,y+1);
          out[i]=(4*(f[y*n+xm]+f[y*n+xp]+f[ym*n+x]+f[yp*n+x])+
            f[ym*n+xm]+f[ym*n+xp]+f[yp*n+xm]+f[yp*n+xp]-20*f[i])/6;
        }
      };
      lap(u,this.lu);lap(v,this.lv);
      const bu=new Float64Array(L),bv=new Float64Array(L);
      lap(this.lu,bu);lap(this.lv,bv);
      for(let i=0;i<L;i++){au[i]-=gam*bu[i];av[i]-=gam*bv[i];}
    }
    // Fixed Dirichlet edge, consistent with finite-domain vortex winding.
    for(let x=0;x<n;x++)for(const i of [x,(n-1)*n+x]){
      au[i]=0;av[i]=0;
    }
    for(let y=0;y<n;y++)for(const i of [y*n,y*n+n-1]){
      au[i]=0;av[i]=0;
    }
  }
  clampBoundary(){
    const n=this.n;
    for(let x=0;x<n;x++)for(const i of [x,(n-1)*n+x]){
      this.u[i]=this.bu[i];this.v[i]=this.bv[i];
      this.pu[i]=0;this.pv[i]=0;
    }
    for(let y=0;y<n;y++)for(const i of [y*n,y*n+n-1]){
      this.u[i]=this.bu[i];this.v[i]=this.bv[i];
      this.pu[i]=0;this.pv[i]=0;
    }
  }
  step(){
    const dt=this.cfg.dt,n=this.n,L=this.len,damp=Math.exp(-this.cfg.damping*dt);
    this.forces();
    for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
      const i=y*n+x;
      this.pu[i]+=.5*dt*this.au[i];this.pv[i]+=.5*dt*this.av[i];
      this.u[i]+=dt*this.pu[i]/this.mass[i];
      this.v[i]+=dt*this.pv[i]/this.mass[i];
    }
    this.clampBoundary();
    if(this.cfg.clockMode==="live" && this.tick%3===0)this.rebuildClock();
    this.forces();
    for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
      const i=y*n+x;
      this.pu[i]=(this.pu[i]+.5*dt*this.au[i])*damp;
      this.pv[i]=(this.pv[i]+.5*dt*this.av[i])*damp;
    }
    this.tick++;
  }
  pulse(x,y,kind="A",amp=.32,width=3.5){
    const n=this.n;
    for(let iy=1;iy<n-1;iy++)for(let ix=1;ix<n-1;ix++){
      const r2=(ix-x)**2+(iy-y)**2;
      if(r2>width*width*25)continue;
      const val=amp*Math.exp(-r2/(2*width*width));
      const i=iy*n+ix;
      if(kind==="A")this.pu[i]+=val;
      if(kind==="B")this.pv[i]+=val;
      if(kind==="C"){this.pu[i]+=.70710678*val;this.pv[i]+=.70710678*val;}
    }
  }
  defects(){
    const n=this.n,found=[];
    for(let y=1;y<n-2;y++)for(let x=1;x<n-2;x++){
      const i=y*n+x;
      const p0=Math.atan2(this.v[i],this.u[i]);
      const p1=Math.atan2(this.v[i+1],this.u[i+1]);
      const p2=Math.atan2(this.v[i+n+1],this.u[i+n+1]);
      const p3=Math.atan2(this.v[i+n],this.u[i+n]);
      const total=wrapAngle(p1-p0)+wrapAngle(p2-p1)+wrapAngle(p3-p2)+wrapAngle(p0-p3);
      const q=Math.round(total/(Math.PI*2));
      if(q!==0)found.push({x:x+.5,y:y+.5,q});
    }
    return found;
  }
  energy(){
    const n=this.n,u=this.u,v=this.v, cfg=this.cfg;
    let kinetic=0,potential=0,gradient=0,charge=0;
    const add=(i,j,w,dist2)=>{
      const d2=(u[i]-u[j])**2+(v[i]-v[j])**2,k=cfg.gradSoft;
      gradient+=w*(.5*cfg.speedFloor*d2+
        (1-cfg.speedFloor)*(k>1e-10?dist2/k*(Math.sqrt(1+k*d2/dist2)-1):.5*d2));
    };
    for(let i=0;i<this.len;i++){
      kinetic+=(this.pu[i]**2+this.pv[i]**2)/(2*this.mass[i]);
      const r2=u[i]*u[i]+v[i]*v[i];
      potential+=cfg.nonlinear?cfg.lambda*.25*(r2-1)**2:cfg.lambda*(u[i]-1)**2;
      charge+=u[i]*this.pv[i]-v[i]*this.pu[i];
    }
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=y*n+x;
      if(x+1<n)add(i,i+1,2/3,1);
      if(y+1<n)add(i,i+n,2/3,1);
      if(y+1<n && x+1<n)add(i,i+n+1,1/6,2);
      if(y+1<n && x>0)add(i,i+n-1,1/6,2);
    }
    let bending=0;
    if(cfg.bending>0){
      // for diagnostics; computed by force evaluation to update Laplacian.
      this.forces();
      for(let i=0;i<this.len;i++)
        bending+=.5*cfg.bending*(this.lu[i]**2+this.lv[i]**2);
    }
    return {total:kinetic+potential+gradient+bending,kinetic,potential,gradient,bending,charge};
  }
}
export function l2Difference(a,b,region="all") {
  const n=a.n;let s=0,count=0;
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
    if(region==="right" && !(x>n*.55 && y>n*.15 && y<n*.85))continue;
    const i=y*n+x;
    s+=(a.u[i]-b.u[i])**2+(a.v[i]-b.v[i])**2;
    count++;
  }
  return Math.sqrt(s/Math.max(1,count));
}
export function responseDifference(aWith,aWithout,bWith,bWithout,region="right"){
  const n=aWith.n;let ab=0,scale=0,count=0;
  for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
    if(region==="right" && !(x>n*.55 && y>n*.15 && y<n*.85))continue;
    const i=y*n+x;
    const ar=aWith.u[i]-aWithout.u[i], ai=aWith.v[i]-aWithout.v[i];
    const br=bWith.u[i]-bWithout.u[i],bi=bWith.v[i]-bWithout.v[i];
    ab+=(ar-br)**2+(ai-bi)**2;
    scale+=.5*(ar*ar+ai*ai+br*br+bi*bi);count++;
  }
  return {difference:Math.sqrt(ab/Math.max(1,count)),
    response:Math.sqrt(scale/Math.max(1,count)),
    fraction:Math.sqrt(ab/(scale+1e-24))};
}
