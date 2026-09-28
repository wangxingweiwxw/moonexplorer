/* Deterministic lunar settlement economy. Shared by the canvas UI and simulation checks. */
(function(root){
  'use strict';
  const SIZE=40,VERSION=7,DAY_SECONDS=5,DAYS_PER_MONTH=30,DAYS_PER_YEAR=360,MISSION_DAYS=1800,TARGET_POPULATION=500,CREDIT_LIMIT=5000,War=typeof module!=='undefined'&&module.exports?require('./colony-war'):root.ColonyWar;
  const resources={credits:['资金','₡','#dfbc70'],metal:['月矿','▥','#aab7c4'],water:['水','◆','#57c6ea'],food:['食品','♧','#91be70'],oxygen:['氧气','O₂','#8cddd1'],energy:['电力','ϟ','#e5cf7b'],science:['科研','✦','#b39ad6']};
  const types={
    hq:{name:'指挥中心',category:'基础',cost:0,metal:0,time:0,power:2,capacity:24,footprint:[2,2],color:'#c7bda4',desc:'2×2大型基地网络与通信中心，不能拆除。失守将结束本次远征。'},
    road:{name:'密封通道',category:'基础',cost:30,metal:1,time:0,power:0,color:'#8b9391',desc:'连接指挥中心与建筑，输送人员、物资和电力。共边的已完工建筑也可连续共享管网；斜角不连通。可连续点击铺设。'},
    habitat:{name:'居住舱',category:'基础',cost:600,metal:18,time:5,power:2,capacity:32,color:'#adbec8',desc:'单层居住舱容纳32人，建成医疗站后可扩容一次至128人。生命保障充足时，每5天迁入至少4人或当前人口的4%。'},
    solar:{name:'太阳能阵列',category:'能源',cost:400,metal:12,time:3,power:0,color:'#5885aa',desc:'受光时发电；进入低照时段后大幅减产。可用蓄电站储存余电。'},
    battery:{name:'蓄电站',category:'能源',cost:450,metal:15,time:3,power:0,color:'#d1b65e',desc:'增加250单位电力储备，缓冲低照时段。'},
    reactor:{name:'裂变电源',category:'能源',cost:2200,metal:60,time:9,power:0,tech:'reactor',color:'#d79e67',desc:'持续输出36单位电力，不依赖日照。需要完成裂变供能研究。'},
    mine:{name:'月壤采矿站',category:'生产',cost:500,metal:15,time:4,power:3,color:'#b59470',desc:'只能建在矿物富集格。每天提取6单位月矿；研究后产量提高。'},
    water:{name:'冰矿提取站',category:'生产',cost:550,metal:18,time:4,power:3,color:'#79b6bf',desc:'只能建在蓝色含冰格。每天生产7单位水，完成月壤精炼后提高至14单位。'},
    oxygen:{name:'制氧工厂',category:'生产',cost:450,metal:15,time:4,power:3,color:'#b1d3c6',desc:'每天消耗2单位水，生产9单位氧气。'},
    farm:{name:'水培温室',category:'生产',cost:550,metal:16,time:4,power:3,color:'#87a277',desc:'每天消耗2单位水，生产8单位食品。月面农作物必须在密闭舱内生长。'},
    warehouse:{name:'资源仓库',category:'基础',cost:450,metal:15,time:3,power:1,color:'#a9a9aa',desc:'增加每种物资的储存上限400单位。'},
    lab:{name:'研究中心',category:'服务',cost:850,metal:25,time:6,power:4,color:'#a397bf',desc:'每天产生3科研点，支持循环利用、月壤加工和裂变供能研究。'},
    clinic:{name:'医疗站',category:'服务',cost:650,metal:20,time:5,power:2,color:'#be9d95',desc:'保障居民健康，改善士气。'},
    port:{name:'太空交易港',category:'服务',cost:1100,metal:32,time:7,power:3,footprint:[2,2],color:'#baa27b',desc:'2×2大型停机坪。每60天一班货船，停泊10天；只有停稳并通电后才能交易。'},
    education:{name:'教育中心',category:'服务',cost:650,metal:18,time:5,power:2,color:'#86adbd',desc:'培训科研人员，研究中心的科研产出增加50%。'},
    factory:{name:'月球车兵工厂',category:'军事',cost:1200,metal:35,time:8,power:4,footprint:[2,2],color:'#7d96a5',desc:'2×2装配机库。生产雷达、装甲和远程火箭月球车。'},
    workshop:{name:'前线维修厂',category:'军事',cost:650,metal:20,time:5,power:2,footprint:[2,1],color:'#aa9875',desc:'2×1维修车间。消耗月矿自动修理4格内己方车辆，并维护联网炮塔。'},
    turret:{name:'电能炮塔',category:'军事',cost:480,metal:18,time:5,power:3,color:'#92acb6',desc:'联网供电后以蓝白电弧脉冲自动攻击5格内帝国部队。配合维修厂，可逐步向敌营推进。'}
  };
  const technologies={recycle:{name:'闭环生命保障',science:28,cost:500,desc:'居民水、食品与氧气消耗降低25%。'},mining:{name:'月壤精炼',science:40,cost:650,desc:'采矿站月矿产量增加50%，水冰提纯效率翻倍。'},reactor:{name:'裂变供能',science:65,cost:950,desc:'解锁稳定发电的裂变电源。'},weapons:{name:'远程火控',science:55,cost:750,desc:'解锁火箭月球车，并使全部己方车辆伤害提高25%。'}};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function calendar(day){const n=Math.max(0,Math.floor(day)-1);return {year:Math.floor(n/DAYS_PER_YEAR)+1,month:Math.floor(n%DAYS_PER_YEAR/DAYS_PER_MONTH)+1,day:n%DAYS_PER_MONTH+1};}
  function formatDate(day){const d=calendar(day);return d.year+'年'+d.month+'月'+d.day+'日';}
  const housingCapacity=b=>(b.level||1)>=2?128:32;
  const housingClinicReady=s=>s.buildings.some(b=>b.type==='clinic'&&b.remaining===0&&b.health>0);
  function cityGoalReached(s){return s.mission.status==='achieved'||s.population>=TARGET_POPULATION;}
  function evaluateMission(s){
    if(!s.lost&&s.mission.status==='active'){
      if(s.day<=MISSION_DAYS&&s.population>=TARGET_POPULATION){s.won=true;s.mission={status:'achieved',completedDay:s.day,acknowledged:false};log(s,'任务目标达成！已在5年内将人口扩充至500人，点击继续可自由游玩。');}
      else if(s.day>MISSION_DAYS){s.mission={status:'expired',completedDay:null,acknowledged:false};log(s,'五年期限已到，本次未按期达到500人。仍可继续建设殖民地。');}
    }
    // Reconcile restored victories as well as this tick's population achievement.
    // A completed city stays complete even if its population later falls.
    if((!s.lost||s.mission.status==='achieved')&&cityGoalReached(s)&&!s.rewards.includes(5)){
      s.rewards.push(5);log(s,'06 · 月面新城达成。');
    }
  }
  function acknowledgeMission(s){if(s.mission.status!=='active')s.mission.acknowledged=true;}
  function hash(x,y){const v=Math.sin(x*127.1+y*311.7+87.41)*43758.54;return v-Math.floor(v);}
  function terrain(x,y){
    if(x<0||y<0||x>=SIZE||y>=SIZE)return 'void';
    if([[22,21],[23,21],[24,21],[16,18]].some(p=>p[0]===x&&p[1]===y))return 'ore';
    if([[17,21],[17,22],[18,22]].some(p=>p[0]===x&&p[1]===y))return 'ice';
    if(x>=15&&x<=28&&y>=15&&y<=26||x>=21&&x<=31&&y>=2&&y<=7)return 'plain';
    for(const [cx,cy,r] of [[9,11,4],[29,9,4],[30,29,5],[9,31,3]]){const d=Math.hypot(x-cx,y-cy);if(d<r&&d>r-1.5)return 'rock';if(d<r-1.5)return hash(x,y)>.7?'ice':'crater';}
    const h=hash(x,y);return h>.965?'rock':h>.91?'ore':h<.026?'ice':'plain';
  }
  function create(marketSeed=Math.floor(Math.random()*4294967296)){
    const s={version:VERSION,marketSeed:marketSeed>>>0,day:1,population:24,morale:80,resources:{credits:9000,metal:220,water:210,food:220,oxygen:230,energy:280,science:0},buildings:[],tech:[],logs:[],nextId:1,tradeEarned:0,aidDay:-40,aidCount:0,rewards:[],won:false,mission:{status:'active',completedDay:null,acknowledged:false}};
    for(let x=16;x<=25;x++)if(x!==19&&x!==20)s.buildings.push({id:s.nextId++,type:'road',x,y:20,remaining:0,health:100});
    for(let y=17;y<=24;y++)if(y!==19&&y!==20)s.buildings.push({id:s.nextId++,type:'road',x:20,y,remaining:0,health:100});
    for(const [type,x,y] of [['hq',19,19],['habitat',21,19],['solar',18,19],['solar',19,18],['oxygen',19,21],['farm',22,19]])s.buildings.push({id:s.nextId++,type,x,y,remaining:0,health:100});
    War.init(s);log(s,'北极狐：优先建设太空港与采矿站，第15天首班货船停泊。资金来自出口，可适度赊购。');return s;
  }
  function log(s,text){s.logs.unshift({day:s.day,text});s.logs=s.logs.slice(0,40);}
  const footprint=b=>b.footprint||types[b.type]?.footprint||[1,1];
  const cells=b=>War.cells(b,types);
  function at(s,x,y){return s.buildings.find(b=>cells(b).some(p=>p[0]===x&&p[1]===y));}
  function connected(s){
    const set=new Set(),hq=s.buildings.find(b=>b.type==='hq'&&b.health>0);if(!hq)return set;
    const occupied=new Map();for(const b of s.buildings.filter(b=>b.remaining===0&&b.health>0))for(const p of cells(b))occupied.set(p.join(','),b);
    // Completed, living structures share utility connections along every footprint edge.
    // This also lets a building relay the network to its next-door neighbour.
    const queue=[hq];set.add(hq.id);for(let i=0;i<queue.length;i++){const a=queue[i];for(const [x,y] of cells(a))for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const b=occupied.get((x+dx)+','+(y+dy));if(b&&!set.has(b.id)){set.add(b.id);queue.push(b);}}}return set;
  }
  function flight(s){
    // First docking day 15, then every 60 days: approach 2, landed 10, departure 2.
    const phase=((s.day-13)%60+60)%60;
    return {phase:phase<2?'landing':phase<12?'docked':phase<14?'departing':'away',progress:phase<2?phase/2:phase<12?0:phase<14?(phase-12)/2:0,daysLeft:phase>=2&&phase<12?12-phase:0,in:phase<2?2-phase:phase<12?0:62-phase};
  }
  const afford=(s,cost)=>s.resources.credits-cost>=-CREDIT_LIMIT;
  const light=s=>s.day%30<21?1:.24;
  function metrics(s){
    const links=connected(s),active=s.buildings.filter(b=>links.has(b.id)&&b.remaining===0&&b.health>0),count=t=>active.filter(b=>b.type===t).length;
    const generation=active.reduce((n,b)=>n+(b.type==='solar'?17*light(s):b.type==='reactor'?36:0)*b.health/100,0);
    const demand=active.reduce((n,b)=>n+types[b.type].power,0),power=clamp((generation+Math.min(s.resources.energy,Math.max(0,demand-generation)))/Math.max(1,demand),0,1);
    return {links,active,generation,demand,power,capacity:24+active.filter(b=>b.type==='habitat').reduce((sum,b)=>sum+housingCapacity(b),0),storage:400+400*count('warehouse'),battery:300+250*count('battery'),port:count('port')>0&&power>.5,tradeOpen:flight(s).phase==='docked',tradeIn:flight(s).in,flight:flight(s),creditLimit:CREDIT_LIMIT,daylight:light(s)===1};
  }
  function canBuild(s,type,x,y){
    const d=types[type],t=terrain(x,y);if(!Number.isInteger(x)||!Number.isInteger(y))return '请选择有效地块';if(s.lost)return '本次远征已经结束';if(!d||type==='hq')return '请选择可建设设施';
    if(t==='void'||t==='rock'||t==='crater')return '此处地形崎岖，请选择平坦月面';
    for(const [cx,cy] of War.cells({type,x,y},types)){if(!['plain','ice','ore'].includes(terrain(cx,cy)))return '建筑占地需要完整平坦地块';if(at(s,cx,cy)||s.enemies.some(e=>e.x===cx&&e.y===cy)||s.units.some(u=>u.x===cx&&u.y===cy))return '占地范围内有建筑或车辆';}if(d.tech&&!s.tech.includes(d.tech))return '请先完成相关研究';
    if(type==='mine'&&t!=='ore')return '采矿站需要铜色矿物格';if(type==='water'&&t!=='ice')return '提取站需要蓝色含冰格';
    if(!afford(s,d.cost)||s.resources.metal<d.metal)return '资金或月矿不足';return '';
  }
  function build(s,type,x,y){const error=canBuild(s,type,x,y);if(error)return {ok:false,error};const d=types[type];s.resources.credits-=d.cost;s.resources.metal-=d.metal;const b={id:s.nextId++,type,x,y,remaining:d.time,health:100};s.buildings.push(b);if(type!=='road')log(s,d.name+'开始建设。完工后请确保连接密封通道。');return {ok:true,building:b};}
  function demolish(s,id){if(s.lost)return false;const b=s.buildings.find(b=>b.id===id);if(!b||b.type==='hq')return false;s.resources.metal+=Math.floor(types[b.type].metal*.35);s.buildings=s.buildings.filter(a=>a.id!==id);log(s,'已拆除'+types[b.type].name+'，回收35%月矿；资金只能通过出口获得。');return true;}
  function repair(s,id){if(s.lost)return {ok:false,error:'本次远征已经结束'};const b=s.buildings.find(b=>b.id===id);if(!b||b.health>=100)return {ok:false,error:'设施无需维修'};const cost=Math.ceil((100-b.health)*3);if(!afford(s,cost))return {ok:false,error:'维修资金不足'};s.resources.credits-=cost;b.health=100;return {ok:true};}
  function expandHousing(s,id){
    const b=s.buildings.find(b=>b.id===id);if(s.lost||!b||b.type!=='habitat'||b.health<=0)return {ok:false,error:'请选择可用的居住舱'};
    const level=b.level||1;if(level>=2)return {ok:false,error:'已完成唯一一次扩容，容量上限为128人'};if(b.remaining>0)return {ok:false,error:'请等待当前施工完成'};
    if(!housingClinicReady(s))return {ok:false,error:'请先建成医疗站，再扩容居住舱'};
    const cost=1200,metal=40;if(!afford(s,cost)||s.resources.metal<metal)return {ok:false,error:'信用额度或月矿不足'};
    s.resources.credits-=cost;s.resources.metal-=metal;b.level=level+1;log(s,'居住舱扩建完成，容量提升至'+housingCapacity(b)+'人。');return {ok:true};
  }
  function research(s,id){if(s.lost)return {ok:false,error:'本次远征已经结束'};const t=technologies[id],m=metrics(s);if(!t||s.tech.includes(id))return {ok:false,error:'该技术已完成'};if(!m.active.some(b=>b.type==='lab')||m.power<.5)return {ok:false,error:'需要联网并供电的研究中心'};if(s.resources.science<t.science||!afford(s,t.cost))return {ok:false,error:'科研点或资金不足'};s.resources.science-=t.science;s.resources.credits-=t.cost;s.tech.push(id);log(s,'研究完成：'+t.name);return {ok:true};}
  // Prices are deterministic per save and voyage, so refresh/load cannot reroll a docked ship.
  const priceBands={metal:{base:47,min:38,max:56},water:{base:29,min:23,max:35},food:{base:31,min:25,max:37},oxygen:{base:16,min:13,max:19},energy:{base:18,min:14,max:22}};
  function marketQuotes(s){
    const voyage=Math.max(0,Math.floor((s.day-13)/60));let seed=(s.marketSeed^Math.imul(voyage+1,0x9e3779b9))>>>0;
    function random(){seed=(seed+0x6D2B79F5)>>>0;let v=seed;v=Math.imul(v^(v>>>15),v|1);v^=v+Math.imul(v^(v>>>7),v|61);return ((v^(v>>>14))>>>0)/4294967296;}
    const quotes={};for(const [key,band] of Object.entries(priceBands)){const sell=band.min+Math.floor(random()*(band.max-band.min+1)),buyMin=Math.ceil(sell*1.15),buyMax=Math.floor(sell*1.25),buy=buyMin+Math.floor(random()*(buyMax-buyMin+1));quotes[key]={buy,sell,base:band.base,min:band.min,max:band.max};}return {voyage:voyage+1,quotes};
  }
  function trade(s,key,quantity){
    if(s.lost)return {ok:false,error:'本次远征已经结束'};const m=metrics(s);if(!m.port)return {ok:false,error:'需要联网并供电的太空交易港'};
    if(!m.tradeOpen)return {ok:false,error:'货船未停稳，距下一次停泊还有'+m.tradeIn+'天'};
    if(!Object.hasOwn(priceBands,key)||!Number.isSafeInteger(quantity)||!quantity)return {ok:false,error:'交易数量无效'};
    const quote=marketQuotes(s).quotes[key],price=quantity>0?quote.buy:quote.sell,cost=price*quantity,capacity=key==='energy'?m.battery:m.storage;
    if(quantity>0&&!afford(s,cost))return {ok:false,error:'信用额度不足'};
    if(quantity>0&&s.resources[key]+quantity>capacity)return {ok:false,error:key==='energy'?'蓄电容量不足，请先建设蓄电站':'仓库容量不足'};
    if(quantity<0&&s.resources[key]<-quantity)return {ok:false,error:'库存不足'};
    s.resources.credits-=cost;s.resources[key]+=quantity;if(quantity<0)s.tradeEarned-=cost;
    log(s,(quantity>0?'买入':'售出')+Math.abs(quantity)+'单位'+resources[key][0]+'，单价 ₡'+price+'，合计 ₡'+Math.abs(cost));return {ok:true};
  }
  // Resource-rail trades are conservative cash-only orders; the regular market retains its credit facility.
  function safeTradeLimits(s,key){
    const m=metrics(s),market=marketQuotes(s),quote=market.quotes[key];
    if(!quote)return {buy:0,sell:0,reserve:0,open:false};
    const use=s.population*(s.tech.includes('recycle')?.75:1),daily={water:use*.026,food:use*.036,oxygen:use*.04};
    const reserve=Math.ceil(Math.max(30,s.resources[key]*.25,key==='energy'?m.demand*3:(daily[key]||0)*10));
    const open=!s.lost&&m.port&&m.tradeOpen,capacity=key==='energy'?m.battery:m.storage;
    return {open,reserve,buy:open?Math.max(0,Math.min(Math.floor(Math.max(0,s.resources.credits)/quote.buy),Math.floor(capacity-s.resources[key]))):0,
      sell:open?Math.max(0,Math.floor(s.resources[key]-reserve)):0,voyage:market.voyage,quote};
  }
  function proportionalTrade(s,key,percent){
    const limits=safeTradeLimits(s,key);
    if(!Number.isInteger(percent)||Math.abs(percent)>100)return {...limits,quantity:0,percent:0};
    const available=percent>0?limits.buy:limits.sell,quantity=Math.sign(percent)*Math.floor(available*Math.abs(percent)/100);
    return {...limits,quantity,percent,available};
  }
  function safeTrade(s,key,quantity,expected){
    const limits=safeTradeLimits(s,key);
    if(!limits.open)return {ok:false,error:'货船未停泊或太空港不可交易，请重新设定订单'};
    if(!Number.isSafeInteger(quantity)||!quantity)return {ok:false,error:'请选择有效的整数交易数量'};
    const price=quantity>0?limits.quote.buy:limits.quote.sell;
    if(!expected||expected.voyage!==limits.voyage||expected.price!==price)return {ok:false,error:'航班或报价已变化，请重新确认订单'};
    if(quantity>limits.buy||-quantity>limits.sell)return {ok:false,error:'数量超过安全限额：保留安全库存、买入不新增欠款'};
    return trade(s,key,quantity);
  }
  function aid(){return {ok:false,error:'免费补给已取消。请在货船停泊时赊购物资，欠款上限 ₡5000。'};}
  function train(s,type){if(s.lost)return {ok:false,error:'本次远征已经结束'};const d=War.units[type],m=metrics(s),base=m.active.find(b=>b.type==='factory');if(!d||!base||m.power<.5)return {ok:false,error:'需要联网供电的月球车兵工厂'};if(d.tech&&!s.tech.includes(d.tech))return {ok:false,error:'请先研究远程火控'};if(s.units.length>=12)return {ok:false,error:'最多指挥12辆月球车'};if(!afford(s,d.cost)||s.resources.metal<d.metal)return {ok:false,error:'信用额度或月矿不足'};
    const f=footprint(base),spots=[];for(let x=base.x-1;x<=base.x+f[0];x++)for(let y=base.y-1;y<=base.y+f[1];y++)if(!War.blocked(s,x,y,terrain,types)&&!s.units.some(u=>u.x===x&&u.y===y))spots.push([x,y]);if(!spots.length)return {ok:false,error:'兵工厂出口被阻挡'};const [x,y]=spots[0];s.units.push(War.make('u'+s.nextUnit++,type,x,y));s.resources.credits-=d.cost;s.resources.metal-=d.metal;log(s,d.name+'装配完成，等待指令。');return {ok:true};
  }
  function command(s,id,x,y){if(s.lost)return {ok:false,error:'本次远征已经结束'};return War.command(s,id,x,y,terrain,types);}
  function stop(s,id){const u=s.units.find(u=>u.id===id);if(u)u.order=null;return {ok:!!u,error:'未选择月球车'};}
  function goals(s,m=metrics(s)){const count=t=>m.active.some(b=>b.type===t);return [
    {title:'01 · 建立贸易航线',text:'接通太空港，累计出口收入达到1000',done:count('port')&&s.tradeEarned>=1000},
    {title:'02 · 稳定生产',text:'联网运行采矿站、冰矿站、研究中心、教育中心和医疗站',done:['mine','water','lab','education','clinic'].every(count)},
    {title:'03 · 建立防线',text:'接通2座电能炮塔与维修厂，完成闭环生命保障研究',done:m.active.filter(b=>b.type==='turret').length>=2&&count('workshop')&&s.tech.includes('recycle')},
    {title:'04 · 准备反攻',text:'研究远程火控，建成兵工厂并生产一辆火箭月球车',done:count('factory')&&s.tech.includes('weapons')&&s.units.some(u=>u.type==='rocket')},
    {title:'05 · 击败帝国',text:'摧毁东北方帝国指挥部、工厂、炮塔与残余部队',done:s.empireDefeated},
    {title:'06 · 月面新城',text:'将殖民地人口扩充至500人',done:s.rewards.includes(5)||cityGoalReached(s)}
  ];}
  function tick(s){
    if(s.lost)return {};evaluateMission(s);s.day++;for(const b of s.buildings)if(b.remaining>0){b.remaining--;if(!b.remaining)log(s,types[b.type].name+'建造完成');}
    const m=metrics(s),r=s.resources;r.energy=clamp(r.energy+m.generation-m.demand,0,m.battery);
    const delta={credits:0,metal:0,water:0,food:0,oxygen:0,science:0};
    for(const b of m.active){const efficiency=m.power*b.health/100;delta.credits-=b.type==='road'?0:.35;
      if(b.type==='mine')delta.metal+=6*efficiency*(s.tech.includes('mining')?1.5:1);
      if(b.type==='water')delta.water+=7*efficiency*(s.tech.includes('mining')?2:1);
      if((b.type==='oxygen'||b.type==='farm')&&r.water+delta.water>=2*efficiency){delta.water-=2*efficiency;delta[b.type==='oxygen'?'oxygen':'food']+=(b.type==='oxygen'?9:8)*efficiency;}
      if(b.type==='lab')delta.science+=3*efficiency*(m.active.some(a=>a.type==='education')?1.5:1);
    }
    const usage=s.population*(s.tech.includes('recycle')?.75:1);delta.water-=usage*.026;delta.food-=usage*.036;delta.oxygen-=usage*.04;
    for(const k of Object.keys(delta))r[k]=clamp(r[k]+delta[k],k==='credits'?-CREDIT_LIMIT:0,k==='credits'||k==='science'?999999:m.storage);
    const healthy=r.water>5&&r.food>5&&r.oxygen>5&&m.power>.6;
    s.morale=clamp(s.morale+(healthy?.45:-2)+(m.active.some(b=>b.type==='clinic')?.2:0),0,100);
    if(s.day%5===0&&healthy&&s.morale>45&&s.population<m.capacity)s.population=Math.min(m.capacity,s.population+Math.max(4,Math.ceil(s.population*.04)));
    if(s.day%5===0&&!healthy)s.population=Math.max(8,s.population-2);
    if((s.day-15)%60===0)log(s,'星际货船已停泊，10天后离港。请及时出口与补货。');if((s.day-25)%60===0)log(s,'星际货船离港，交易已关闭。');
    if(s.day%30===21)log(s,'进入低照阶段，太阳能减产。请查看电网与储能。');
    War.step(s,m,terrain,types,log);
    goals(s).forEach((g,i)=>{if(g.done&&!s.rewards.includes(i)){s.rewards.push(i);log(s,g.title+'达成。');}});
    evaluateMission(s);
    return delta;
  }
  function restore(raw){
    try{const s=typeof raw==='string'?JSON.parse(raw):JSON.parse(JSON.stringify(raw));
      if(!s||![1,2,3,4,5,6,VERSION].includes(s.version)||!Number.isInteger(s.day)||s.day<1||!Array.isArray(s.buildings)||s.buildings.length>SIZE*SIZE||!s.resources)return null;
      if(!Object.keys(resources).every(k=>Number.isFinite(s.resources[k])&&s.resources[k]>=(k==='credits'?-CREDIT_LIMIT:0)))return null;
      if(!['population','morale','tradeEarned','nextId'].every(k=>Number.isFinite(s[k])))return null;
      if(!Array.isArray(s.tech)||s.tech.some(k=>!technologies[k])||!Array.isArray(s.rewards))return null;
      const oldVersion=s.version;if(oldVersion===1){for(const b of s.buildings)if(types[b.type]?.footprint)b.footprint=[1,1];War.init(s);for(const u of s.units)if(War.blocked(s,u.x,u.y,terrain,types)){let found=false;for(let x=16;x<28&&!found;x++)for(let y=16;y<28&&!found;y++)if(!War.blocked(s,x,y,terrain,types)&&!s.units.some(other=>other!==u&&other.x===x&&other.y===y)){u.x=x;u.y=y;found=true;}}s.rewards=[];s.won=false;}
      // Expand old headquarters only where no non-road structures or units would be displaced.
      // Crowded legacy cities retain their compact headquarters and all existing construction.
      if(oldVersion<5){const hq=s.buildings.find(b=>b.type==='hq');if(hq){
        const expanded=War.cells({...hq,footprint:[2,2]},types),inside=(x,y)=>expanded.some(p=>p[0]===x&&p[1]===y);
        const safe=expanded.every(([x,y])=>['plain','ice','ore'].includes(terrain(x,y)))
          && !s.buildings.some(b=>b!==hq&&b.type!=='road'&&cells(b).some(([x,y])=>inside(x,y)))
          && ![...(s.units||[]),...(s.enemies||[])].some(u=>inside(u.x,u.y));
        if(safe){delete hq.footprint;s.buildings=s.buildings.filter(b=>b.type!=='road'||!inside(b.x,b.y));}
        else hq.footprint=[1,1];
      }}
      if(oldVersion<3){s.version=VERSION;s.won=false;s.mission={status:'active',completedDay:null,acknowledged:false};}
      if(oldVersion<4)s.marketSeed=Math.floor(hash(s.day,s.nextId+s.population)*4294967296)>>>0;s.version=VERSION;if(!Number.isInteger(s.marketSeed)||s.marketSeed<0||s.marketSeed>4294967295)return null;
      if(!s.mission||!['active','achieved','expired'].includes(s.mission.status)||typeof s.mission.acknowledged!=='boolean'||(s.mission.status==='achieved'&&(!Number.isInteger(s.mission.completedDay)||s.mission.completedDay<1||s.mission.completedDay>MISSION_DAYS)))return null;s.won=s.mission.status==='achieved';
      if(s.rewards.some(i=>!Number.isInteger(i)||i<0||i>5))return null;
      if(oldVersion<6&&s.population<TARGET_POPULATION&&!s.won)s.rewards=s.rewards.filter(i=>i!==5);
      const keys=new Set(),ids=new Set();for(const b of s.buildings){if(!types[b.type]||!Number.isInteger(b.id)||ids.has(b.id)||!Number.isInteger(b.x)||!Number.isInteger(b.y)||!Number.isFinite(b.remaining)||b.remaining<0||!Number.isFinite(b.health)||b.health<0||b.health>100)return null;ids.add(b.id);if(b.level!==undefined&&(b.type!=='habitat'||!Number.isInteger(b.level)||b.level<1||b.level>(oldVersion<7?3:2)))return null;if(oldVersion<7&&b.type==='habitat'&&b.level===3)b.level=2;if(b.footprint&&JSON.stringify(b.footprint)!=='[1,1]')return null;for(const [x,y] of cells(b)){const key=x+','+y;if(x<0||y<0||x>=SIZE||y>=SIZE||keys.has(key))return null;keys.add(key);}}
      if(s.buildings.filter(b=>b.type==='hq').length!==1||!Array.isArray(s.units)||!Array.isArray(s.enemies)||s.units.length>12||s.enemies.length>20)return null;
      const unitIds=new Set();for(const u of [...s.units,...s.enemies]){if(typeof u.id!=='string'||unitIds.has(u.id)||!(u.structure?War.enemyTypes[u.type]:War.units[u.type])||!Number.isInteger(u.x)||!Number.isInteger(u.y)||u.x<0||u.y<0||u.x>=SIZE||u.y>=SIZE||!Number.isFinite(u.hp)||u.hp<=0)return null;unitIds.add(u.id);u.px=u.x;u.py=u.y;if(u.order&&!(u.order.kind==='attack'&&typeof u.order.target==='string'||u.order.kind==='move'&&Number.isInteger(u.order.x)&&Number.isInteger(u.order.y)&&u.order.x>=0&&u.order.y>=0&&u.order.x<SIZE&&u.order.y<SIZE))u.order=null;}
      if(!Number.isInteger(s.nextUnit)||s.nextUnit<3||!Number.isFinite(s.kills))return null;s.nextUnit=Math.max(s.nextUnit,...s.units.map(u=>Number(u.id.slice(1))+1).filter(Number.isFinite));s.shots=[];
      s.nextId=Math.max(...s.buildings.map(b=>b.id))+1;s.logs=Array.isArray(s.logs)?s.logs.filter(l=>typeof l.text==='string'&&Number.isFinite(l.day)).slice(0,40).map(l=>({...l,text:l.text.replaceAll('建材','月矿').replaceAll('食物','食品')})):[];if(oldVersion<7&&!goals(s)[1].done)s.rewards=s.rewards.filter(i=>i!==1);evaluateMission(s);return s;
    }catch{return null;}
  }
  const api={SIZE,VERSION,DAY_SECONDS,DAYS_PER_MONTH,DAYS_PER_YEAR,MISSION_DAYS,TARGET_POPULATION,calendar,formatDate,housingCapacity,housingClinicReady,expandHousing,evaluateMission,acknowledgeMission,resources,types,technologies,terrain,hash,create,metrics,canBuild,build,demolish,repair,research,trade,aid,goals,tick,restore,at,priceBands,marketQuotes,safeTradeLimits,proportionalTrade,safeTrade,flight,train,command,stop,footprint,cells,CREDIT_LIMIT,unitTypes:War.units,enemyTypes:War.enemyTypes};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ColonySim=api;
})(typeof window==='undefined'?globalThis:window);
