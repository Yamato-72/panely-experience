(function(root){
 'use strict';
 const fresh=()=>({version:1,setup:false,mode:'content',selected:'p1',lists:[{id:'p1',name:'プレイリスト1',main:[],touch:[]}],library:[],schedule:[],enabled:false,paused:false,pin:'0000',idle:30,sound:true,pixel:true,installed:false});
 const current=(entries,minutes)=>{const sorted=[...entries].sort((a,b)=>a.minutes-b.minutes);return sorted.filter(x=>x.minutes<=minutes).at(-1)||sorted.at(-1)||null;};
 const scheduleError=s=>!s.schedule.length?'切替時刻を追加してください。':s.schedule.some(e=>!s.lists.find(p=>p.id===e.pid)?.main.length)?'各プレイリストの「いつもの」に素材を追加してください。':'';
 const deleteError=(s,id)=>s.lists.length===1?'最後のプレイリストは削除できません。':s.schedule.some(x=>x.pid===id)?'時間割に登録されているプレイリストは削除できません。':'';
 const api={fresh,current,scheduleError,deleteError};if(typeof module!=='undefined')module.exports=api;root.PanelyCore=api;
})(globalThis);
