"""Start tools/account-runtime-fixture.mjs --serve after building public-site."""
import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT='https://127.0.0.1:8792/'
SLOT='moonexplorer-v3'
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'])
  errors=[]
  async def context(token=None,mobile=False):
   ctx=await browser.new_context(ignore_https_errors=True,viewport={'width':390 if mobile else 1280,'height':844 if mobile else 900},is_mobile=mobile,has_touch=mobile)
   if token:await ctx.add_cookies([{'name':'__Host-moon_session','value':token*64,'url':ROOT,'secure':True,'httpOnly':True,'sameSite':'Lax'}])
   page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto(ROOT+'account.html');await page.evaluate('MoonSave.ready');return ctx,page
  async def save(page,key,data):
   await page.evaluate('async ([k,d])=>{MoonSave.setItem(k,d);await MoonSave.flush();}',[key,json.dumps(data,separators=(',',':')) if not isinstance(data,str) else data])
  guest,gp=await context();requests=[]
  gp.on('request',lambda r:requests.append(r.url) if r.method=='PUT' else None)
  await save(gp,SLOT,{'score':7});assert not requests
  assert await gp.evaluate('(k)=>localStorage.getItem(k)',SLOT)=='{"score":7}'
  alice,ap=await context('a');device,dp=await context('b',True);bob,bp=await context('c')
  assert await ap.evaluate('(k)=>MoonSave.getItem(k)',SLOT) is None
  await save(ap,SLOT,{'score':42});await dp.reload();await dp.evaluate('MoonSave.ready')
  assert json.loads(await dp.evaluate('(k)=>MoonSave.getItem(k)',SLOT))['score']==42
  assert await dp.evaluate('(k)=>localStorage.getItem(k)',SLOT) is None
  assert await bp.evaluate('(k)=>MoonSave.getItem(k)',SLOT) is None
  # Two devices edit the same base revision; stale upload cannot replace the new save.
  await save(ap,SLOT,{'score':50});await save(dp,SLOT,{'score':99})
  assert await dp.evaluate('(k)=>MoonSave.status().slots.find(s=>s.key===k).conflict',SLOT)
  assert json.loads((await ap.evaluate('async()=>{const s=MoonSave.status();return (await(await fetch("/api/moon/saves",{headers:{"X-Moon-User":s.user.id}})).json()).saves}'))[SLOT]['data'])['score']==50
  dp.once('dialog',lambda dialog:dialog.accept())
  await dp.locator('.account-slot').filter(has=dp.get_by_role('heading',name='2D / 3D 探险',exact=True)).get_by_role('button',name='恢复云端版本',exact=True).click()
  await dp.wait_for_function('(k)=>MoonSave.status().slots.find(s=>s.key===k).data?.includes("50")',arg=SLOT)
  await dp.screenshot(path='_tmp/oauth/account-real-mobile.png',full_page=True)
  assert await dp.evaluate('document.documentElement.scrollWidth<=innerWidth')
  # A real colony state loads on another device before game initialization.
  await ap.goto(ROOT+'colony.html');await ap.wait_for_function('window.__colonyDiagnostics')
  state=await ap.evaluate('__colonyDiagnostics().state');state['day']=37
  await ap.goto(ROOT+'account.html');await ap.evaluate('MoonSave.ready');await save(ap,'moonexplorer-colony-v1',state)
  await dp.goto(ROOT+'colony.html');await dp.wait_for_function('window.__colonyDiagnostics')
  assert await dp.evaluate('__colonyDiagnostics().state.day')==37
  await dp.locator('#pauseBtn').click();await dp.locator('#saveBtn').click();await dp.evaluate('MoonSave.flush()')
  assert await dp.evaluate('localStorage.getItem("moonexplorer-colony-v1")') is None
  # Sign out on the account page; guest saves remain available on their device.
  await ap.goto(ROOT+'account.html');await ap.evaluate('MoonSave.ready');ap.once('dialog',lambda dialog:dialog.accept())
  await ap.locator('#zhihuLogout').click();await ap.wait_for_function('window.MoonSave?.status().user===null')
  assert json.loads(await gp.evaluate('(k)=>MoonSave.getItem(k)',SLOT))['score']==7
  # Every game entrypoint still starts with the common save adapter as a guest.
  for file,ready in [('index.html','document.querySelector("#start")&&!document.querySelector("#start").classList.contains("hidden")'),('play3d.html','window.MoonSave&&document.querySelector("canvas")'),('pinball.html','window.MoonSave&&document.querySelector("canvas")'),('rover.html','window.RoverCodex'),('roam.html','window.RoverCodex'),('colony.html','window.__colonyDiagnostics')]:
   page=await guest.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto(ROOT+file);await page.evaluate('MoonSave.ready');await page.wait_for_function(ready);await page.wait_for_timeout(600)
   assert await page.locator('.moon-account-link').count()>=1,file
   await page.close()
  assert not errors,errors
  report={'workerdD1':True,'guestLocalOnly':True,'twoIsolatedDevices':True,'otherAccountIsolated':True,'conflictPreservesCloud':True,'restoreChoice':True,'realColonyRestored':True,'logout':True,'sixEntrypoints':True,'mobileNoOverflow':True,'errors':errors}
  Path('_tmp/oauth/e2e-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report,ensure_ascii=False));await browser.close()
asyncio.run(main())
