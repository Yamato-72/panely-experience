const assert=require('node:assert/strict'),C=require('../core.js');
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
const entries=[{id:'morning',minutes:420,pid:'a'},{id:'lunch',minutes:660,pid:'b'},{id:'night',minutes:1020,pid:'c'}];
test('日付をまたぐ時間帯は前日の最後の設定を選ぶ',()=>assert.equal(C.current(entries,60).id,'night'));
test('切替時刻ちょうどに次の設定を選ぶ',()=>{assert.equal(C.current(entries,420).id,'morning');assert.equal(C.current(entries,660).id,'lunch');assert.equal(C.current(entries,1020).id,'night');});
test('1日1440分の選択を検証',()=>{for(let m=0;m<1440;m++)assert.equal(C.current(entries,m).id,m<420||m>=1020?'night':m<660?'morning':'lunch');});
test('空の時間割を開始できない',()=>assert.ok(C.scheduleError(C.fresh())));
test('時間割の空のプレイリストを拒否',()=>{const s=C.fresh();s.schedule=[{minutes:0,pid:'p1'}];assert.ok(C.scheduleError(s));s.lists[0].main.push({id:'image'});assert.equal(C.scheduleError(s),'');});
test('最後のリストと時間割で使用中のリストを削除できない',()=>{const s=C.fresh();assert.ok(C.deleteError(s,'p1'));s.lists.push({id:'p2',main:[]});s.schedule=[{pid:'p1'}];assert.ok(C.deleteError(s,'p1'));assert.equal(C.deleteError(s,'p2'),'');});
test('初期値は1リスト・時間割OFF・PIN0000',()=>{const s=C.fresh();assert.equal(s.lists.length,1);assert.equal(s.enabled,false);assert.equal(s.pin,'0000');assert.equal(s.idle,30);});
console.log(`${checks} tests passed`);
