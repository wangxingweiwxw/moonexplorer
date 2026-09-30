const assert=require('node:assert/strict'),S=require('../colony-sim');
function dock(){const s=S.create(12345);S.build(s,'port',26,19);while(s.day<15)S.tick(s);return s;}
function quote(s,key,q){const l=S.safeTradeLimits(s,key);return {voyage:l.voyage,price:q>0?l.quote.buy:l.quote.sell};}
function denied(s,key,q,expected=quote(s,key,q)){const before=JSON.stringify(s);assert.equal(S.safeTrade(s,key,q,expected).ok,false);assert.equal(JSON.stringify(s),before,'rejected order has no side effects');}
for(const key of Object.keys(S.priceBands)){
 const s=dock();s.resources[key]=150;const l=S.safeTradeLimits(s,key);assert.ok(l.buy<=S.metrics(s).storage&&l.sell<=s.resources[key]);assert.ok(l.reserve>=38);denied(s,key,l.buy+1);denied(s,key,-l.sell-1);denied(s,key,0);denied(s,key,NaN);denied(s,key,1.2);denied(s,key,Number.MAX_SAFE_INTEGER);
 assert.ok(S.safeTrade(s,key,-l.sell,quote(s,key,-1)).ok);assert.ok(s.resources[key]>=l.reserve);
 s.resources.credits=50;const cap=S.safeTradeLimits(s,key).buy;denied(s,key,cap+1);if(cap){assert.ok(S.safeTrade(s,key,cap,quote(s,key,1)).ok);assert.ok(s.resources.credits>=0);}
 s.resources.credits=-5;denied(s,key,1);s.resources.credits=5000;const old=quote(s,key,1);s.day+=60;denied(s,key,1,old);s.day=25;denied(s,key,1,old);
}
const s=dock();s.resources.energy=S.metrics(s).battery;denied(s,'energy',1);s.resources.metal=30;denied(s,'metal',-1);s.population=5000;s.resources.food=400;assert.equal(S.safeTradeLimits(s,'food').sell,0);s.resources.credits=1000;s.day=15;const old=quote(s,'water',10);old.price++;denied(s,'water',10,old);
console.log('PASS safe resource-rail trading: five resources, integer/safety limits, reserve protection, cash-only purchases, storage/battery caps, stale quotes/voyages and undocked rejection with no side effects');

for(const key of Object.keys(S.priceBands)){const s=dock();s.resources[key]=300;for(const percent of [-100,-75,-50,-5,0,5,50,75,100]){const o=S.proportionalTrade(s,key,percent),limit=percent>0?o.buy:o.sell;assert.equal(o.quantity,Math.sign(percent)*Math.floor(limit*Math.abs(percent)/100));}for(const p of [NaN,Infinity,101,-101,3.5])assert.equal(S.proportionalTrade(s,key,p).quantity,0);}
const large=dock();large.resources.metal=350;large.resources.credits=90000;const full=S.proportionalTrade(large,'metal',-100);assert.ok(-full.quantity>100,'percentage is not capped at 100 resource units');assert.ok(S.safeTrade(large,'metal',full.quantity,quote(large,'metal',-1)).ok);
console.log('PASS proportional orders: percentages of safe buy/sell limits, flooring, invalid input rejection, and inventories above 100 units');
