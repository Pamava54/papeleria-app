/* Papelería · service worker v3: busca primero la versión nueva (con internet) y usa la guardada si no hay señal */
const V='pap-v3';
const ARCH=['./','index.html','manifest.json','icon-192.png','icon-512.png','zxing.min.js'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c=>Promise.all(ARCH.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(V);
    try{
      const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),4000);
      const n=await fetch(r,{cache:'no-store',signal:ctl.signal});clearTimeout(t);
      if(n&&n.ok)c.put(r,n.clone());
      return n;
    }catch(err){
      const h=await c.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await c.match('index.html'):null);
      return h||new Response('Sin conexión',{status:503,statusText:'Sin conexión'});
    }
  })());
});
