"""Build a dated Cloudflare source ZIP; exclude runtime secrets and local databases."""
from pathlib import Path
from datetime import datetime
import zipfile,hashlib,json

root=Path(__file__).resolve().parent.parent
files=[]
for p in root.iterdir():
 if p.is_file() and (p.suffix in {'.html','.js','.css','.md'} or p.name in {'.gitignore','.node-version','package.json','package-lock.json','wrangler.jsonc','index.icon.png','index.apple-touch-icon.png'}):
  if p.name not in {'index.js','index.audio.worklet.js'}:files.append(p)
for folder in ['assets','vendor','server','tools']:
 for p in (root/folder).rglob('*'):
  relative=p.relative_to(root)
  if not p.is_file() or '__pycache__' in p.parts or any(part.startswith('.') for part in relative.parts) or p.suffix in {'.zip','.db','.sqlite','.sqlite3','.pyc'}:continue
  files.append(p)
example=root/'server/.dev.vars.example'
if example.exists():files.append(example)
now=datetime.now();out=root/'artifacts';out.mkdir(exist_ok=True)
target=out/('moonexplorer-cloudflare-source-'+now.strftime('%Y%m%d-%H%M%S')+'.zip')
release={'generatedAt':now.isoformat(timespec='seconds'),'appId':'849','callback':'https://moon.chipai.cc/zhihu-callback','databaseId':json.loads((root/'wrangler.jsonc').read_text('utf8'))['d1_databases'][0]['database_id'],'requires':['Execute server/schema.sql in the configured D1 if not initialized','Set Worker runtime Secret ZHIHU_APP_KEY for App 849','Deploy source via GitHub Workers Builds'],'sha256':{p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}}
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(files):z.write(p,p.relative_to(root).as_posix())
 z.writestr('ACCOUNT-RELEASE.json',json.dumps(release,ensure_ascii=False,indent=2))
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for p in files:assert z.read(p.relative_to(root).as_posix())==p.read_bytes()
 assert not any(n.startswith(('node_modules/','_tmp/','public-site/','artifacts/')) or n in {'.dev.vars','.env','server/.dev.vars','server/.env'} for n in z.namelist())
print(json.dumps({'file':str(target),'bytes':target.stat().st_size,'files':len(files)+1,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'verified':True},ensure_ascii=False))
