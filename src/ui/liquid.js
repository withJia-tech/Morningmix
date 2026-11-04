// Bounded 2D dye advection for a visual effect. This is not a CFD solver.
export class LiquidField {
  constructor(size=96) {
    this.size=size;this.dye=new Float32Array(size*size);this.next=new Float32Array(size*size);
    this.spin=0;this.time=0;this.energy=0;
  }
  inject(x=.12,y=-.28,strength=.85) {
    const n=this.size;
    for(let j=1;j<n-1;j++)for(let i=1;i<n-1;i++){
      const xx=i/(n-1)*2-1,yy=j/(n-1)*2-1;
      if(xx*xx+yy*yy>=.96)continue;
      const d=((xx-x)**2/.020+(yy-y)**2/.012);
      if(d<12)this.dye[j*n+i]=Math.min(1,this.dye[j*n+i]+Math.exp(-d)*strength);
    }
    this.energy=1;
  }
  step(dt,drive=0) {
    dt=Math.min(.05,Math.max(0,dt));this.time+=dt;
    this.spin+=(drive-this.spin)*(1-Math.exp(-dt*(drive?3:.8)));
    const n=this.size,a=this.dye,b=this.next,decay=Math.exp(-dt*.65);let energy=0;
    for(let j=1;j<n-1;j++)for(let i=1;i<n-1;i++){
      const x=i/(n-1)*2-1,y=j/(n-1)*2-1,r2=x*x+y*y,k=j*n+i;
      if(r2>=.98){b[k]=0;continue;}
      const omega=this.spin*(2.2-1.8*r2),eddy=.13*Math.sin(x*7+y*4+this.time*1.4);
      const vx=-y*omega+eddy*(1-r2),vy=x*omega+.11*Math.cos(x*5-y*6-this.time)*(1-r2);
      const sx=Math.max(1,Math.min(n-2,i-vx*dt*n*.5)),sy=Math.max(1,Math.min(n-2,j-vy*dt*n*.5));
      const x0=Math.floor(sx),y0=Math.floor(sy),tx=sx-x0,ty=sy-y0;
      const sample=(a[y0*n+x0]*(1-tx)+a[y0*n+x0+1]*tx)*(1-ty)+(a[(y0+1)*n+x0]*(1-tx)+a[(y0+1)*n+x0+1]*tx)*ty;
      const diffuse=(a[k-1]+a[k+1]+a[k-n]+a[k+n])*.25;
      b[k]=Math.max(0,Math.min(1,(sample*.93+diffuse*.07)*decay));energy=Math.max(energy,b[k]);
    }
    this.dye=b;this.next=a;this.energy=energy;return energy;
  }
  paint(pixels,base,ink) {
    const n=this.size;
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const k=j*n+i,x=i/(n-1)*2-1,y=j/(n-1)*2-1,alpha=Math.min(1,this.dye[k]*1.35);
      const p=k*4;
      for(let c=0;c<3;c++)pixels[p+c]=Math.round(base[c]+(ink[c]-base[c])*alpha);
      pixels[p+3]=x*x+y*y<=1?255:0;
    }
  }
}
