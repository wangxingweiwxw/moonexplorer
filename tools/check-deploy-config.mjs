import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export async function checkDeployConfig(root){
 const configPath=path.join(root,'wrangler.jsonc');let config;
 try{config=JSON.parse(await readFile(configPath,'utf8'));}
 catch{throw Error('缺少或无法读取根目录 wrangler.jsonc。请将源码包中的该文件提交到 package.json 同级目录；停止部署，避免将仓库根目录上传为静态资产。');}
 if(config.main!=='server/worker.mjs'||config.assets?.directory!=='./public-site'||config.assets.binding!=='ASSETS')throw Error('Wrangler 配置错误：main 必须为 server/worker.mjs，assets.directory 必须为 ./public-site，binding 必须为 ASSETS。请恢复源码包自带配置，不要使用自动生成的纯静态配置。');
 if(!Array.isArray(config.assets.run_worker_first)||!['/api/*','/zhihu-callback'].every(p=>config.assets.run_worker_first.includes(p)))throw Error('缺少登录及云存档 API 的 run_worker_first 路由。');
 const db=config.d1_databases?.find(d=>d.binding==='DB');
 if(!db||db.database_name!=='moonexplorer-saves'||!(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(db.database_id||'')))throw Error('请配置 DB 绑定和 moonexplorer-saves 的有效 D1 UUID。');
 if(config.vars?.ZHIHU_APP_ID!=='849'||config.vars.PUBLIC_ORIGIN!=='https://moon.chipai.cc'||config.vars.ZHIHU_REDIRECT_URI!=='https://moon.chipai.cc/zhihu-callback')throw Error('请核对 App ID 849 和 moon.chipai.cc 的登录配置。');
 for(const name of ['server/worker.mjs','server/schema.sql']){
  try{await access(path.join(root,name));}catch{throw Error('源码包上传不完整：缺少 '+name);}
 }
 return config;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');await checkDeployConfig(root);console.log('Deployment config verified: server/worker.mjs + public-site + DB (moonexplorer-saves).');}
 catch(e){console.error(e.message);process.exitCode=1;}
}
