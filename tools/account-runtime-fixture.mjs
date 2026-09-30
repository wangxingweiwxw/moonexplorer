// Tests only: local workerd + temporary D1 and synthetic sessions. No production secrets.
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../server/worker.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const tokens={alice:'a'.repeat(64),second:'b'.repeat(64),bob:'c'.repeat(64)};
export async function fixture({serve=false,provider}={}){
 const origin=serve?'https://127.0.0.1:8792':'https://moon.chipai.cc';
 const mf=new Miniflare(convertV4MiniflareOptions({
  modules:true,scriptPath:path.join(root,'server/worker.mjs'),compatibilityDate:'2026-09-28',
  ...(serve?{host:'127.0.0.1',port:8792,https:true}:{}),
  bindings:{ZHIHU_APP_ID:'849',ZHIHU_APP_KEY:'test-key',PUBLIC_ORIGIN:origin,ZHIHU_REDIRECT_URI:origin+'/zhihu-callback'},
  d1Databases:['DB'],outboundService:provider||(()=>new Response('',{status:502})),
  serviceBindings:{ASSETS:async request=>{
   const url=new URL(request.url),base=path.join(root,'public-site'),file=path.resolve(base,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   if(!file.startsWith(base+path.sep))return new Response('',{status:404});
   try{return new Response(await readFile(file),{headers:{'Content-Type':({'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'})[path.extname(file)]||'application/octet-stream'}});}
   catch{return new Response('',{status:404});}
  }}
 }));
 const db=await mf.getD1Database('DB');
 for(const sql of (await readFile(path.join(root,'server/schema.sql'),'utf8')).split(';').filter(s=>s.trim()))await db.prepare(sql).run();
 const owners={};
 for(const [name,token] of Object.entries(tokens)){
  owners[name]=await digest('zhihu:849:'+(name==='bob'?'222':'969570047710216200'));
  await db.prepare('INSERT INTO sessions VALUES (?,?,?,?,?)').bind(await digest(token),owners[name],name==='bob'?'用户乙':'用户甲','test-csrf',Math.floor(Date.now()/1000)+3600).run();
 }
 return {mf,db,origin,owners};
}
if(process.argv.includes('--serve')){
 const {mf,origin}=await fixture({serve:true});await mf.ready;console.log('Moon test runtime ready: '+origin);
 process.on('SIGINT',async()=>{await mf.dispose();process.exit(0);});
}
