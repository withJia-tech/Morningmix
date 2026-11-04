export function fakeSensorEnv(permission = () => Promise.resolve('granted')) {
  let at=0,id=0; const listeners=new Set(),timers=new Map();
  const env={secure:true,Orientation:{requestPermission:permission},now:()=>at,
    add:fn=>listeners.add(fn),remove:fn=>listeners.delete(fn),setInterval:fn=>{timers.set(++id,fn);return id;},clearInterval:id=>timers.delete(id)};
  return {env,listeners,timers,setTime:t=>{at=t;},tick(t){at=t;for(const fn of [...timers.values()])fn();},
    sample(t,beta=30,gamma=0){at=t;for(const fn of [...listeners])fn({beta,gamma,alpha:null});}};
}
