/* Early Apollo walking expeditions; reusable lunar module and terrain factories. */
window.ApolloEarlyRegions=(()=>{
 const titles={11:['鹰号','EAGLE','静海','TRANQUILITY BASE / 1969'],12:['无畏号','INTREPID','风暴洋','OCEANUS PROCELLARUM / 1969'],14:['心宿二号','ANTARES','弗拉·毛罗高地','FRA MAURO / 1971']};
 const regions=[11,12,14].map(n=>({
   mission:{id:n,name:'阿波罗 '+n,sub:titles[n][3],spawn:{x:-12,z:-15,yaw:.56},
     spots:[{x:23,z:22,title:titles[n][2]+' · 撞击坑观察',card:'crater'},{x:31,z:32,title:n===14?'高地角砾岩 · 步行采样':'月海玄武岩 · 步行采样',card:n===14?'highlands':'samples'}]},
   context:LunaRegions.context(n===14?20:n),lander:()=>ApolloHeritage.lander(n)
 }));
 return {regions,titles};
})();
