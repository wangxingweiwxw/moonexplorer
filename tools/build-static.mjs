// Publish only game runtime files. Server source, databases, secrets and backups never enter this directory.
import {readdir,mkdir,copyFile,rm,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkDeployConfig} from './check-deploy-config.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'public-site');
await checkDeployConfig(root);
console.log('Deployment config verified: server/worker.mjs + public-site + DB (moonexplorer-saves).');
if(path.dirname(out)!==root||path.basename(out)!=='public-site')throw Error('Unsafe output path');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const allowed=new Set(['.js','.html','.css','.png','.jpg','.svg','.wav','.json','.txt']);
async function copyDirectory(from,to){await mkdir(to,{recursive:true});for(const entry of await readdir(from,{withFileTypes:true})){if(entry.isSymbolicLink())throw Error('Symlink excluded');if(entry.isDirectory())await copyDirectory(path.join(from,entry.name),path.join(to,entry.name));else if(!entry.name.startsWith('.')&&allowed.has(path.extname(entry.name)))await copyFile(path.join(from,entry.name),path.join(to,entry.name));}}
for(const e of await readdir(root,{withFileTypes:true})){
 if(!e.isFile()||e.name.startsWith('.')||['index.js','index.audio.worklet.js'].includes(e.name))continue;
 if(['.html','.css','.js'].includes(path.extname(e.name))||['index.icon.png','index.apple-touch-icon.png'].includes(e.name))await copyFile(path.join(root,e.name),path.join(out,e.name));
}
for(const name of ['assets','vendor'])await copyDirectory(path.join(root,name),path.join(out,name));
await writeFile(path.join(out,'_headers'),'/api/moon/*\n  Cache-Control: no-store\n/zhihu-callback*\n  Cache-Control: no-store\n/account.html\n  Cache-Control: no-cache\n/moon-save.js\n  Cache-Control: no-cache\n');
console.log('Static website ready: '+out+' (server files excluded)');
