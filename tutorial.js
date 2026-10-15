/* Guided overlay follows real simulator actions; it never advances the app itself. */
(() => {
  const intro=document.createElement('dialog');
  intro.id='tour-intro';
  intro.setAttribute('aria-labelledby','tour-intro-title');
  intro.innerHTML='<small>操作ガイド</small><h2 id="tour-intro-title">電源を入れて、映像を映してみましょう。</h2><p>これから、押す場所をひとつずつご案内します。<br>明るくなったボタンを押すと、次の案内へ進みます。</p><p class="tour-intro-route">画面上で体験：電源ON → USB接続 → 写真・動画の再生</p><button class="primary" id="tour-begin">ガイドをはじめる →</button><button class="tour-skip" id="tour-without-guide">案内なしで自由に操作する</button>';
  document.body.append(intro);
  let introduced=false;
  const overlay=document.createElement('div');
  overlay.id='tutorial';overlay.hidden=true;
  overlay.innerHTML='<div class="tour-hole"></div><section class="tour-card" aria-label="操作の案内"><small>操作ガイド</small><p aria-live="polite"></p><button class="tour-finish" hidden>自由に操作してみる →</button><button class="tour-skip">案内をスキップ</button></section>';
  document.body.append(overlay);
  const hole=overlay.querySelector('.tour-hole'),card=overlay.querySelector('.tour-card'),text=card.querySelector('p'),finish=card.querySelector('.tour-finish');
  let dismissed=false,target=null,stepKey='',frame=0;
  let editIndex=0,editDone=false;
  const nextButton=document.createElement('button');nextButton.textContent='次へ →';nextButton.hidden=true;card.insertBefore(nextButton,finish);
  const help=document.createElement('details');help.className='management-help';
  help.innerHTML='<summary>編集画面の説明を読む</summary><p>各項目の「？」から説明を確認できます。</p>'+managementHelp.map((x,i)=>'<button data-help="'+i+'">？ '+x[1]+'</button>').join('');
  $('#guide').after(help);help.hidden=true;
  help.addEventListener('click',e=>{const b=e.target.closest('[data-help]');if(!b)return;const item=managementHelp[Number(b.dataset.help)];showDialog(item[1],'<p>'+esc(item[2])+'</p>');});
  const completion=document.createElement('dialog');completion.id='tour-complete';completion.setAttribute('aria-label','次の体験');
  completion.innerHTML='<h2>基本の使い方は、これで完了です。</h2><p>次は何を試しますか？</p><div class="tour-options"><button data-explore="edit">映す内容を変更する<small>素材の追加や順番変更</small></button><button data-explore="hdmi">PC・STBの画面を映す<small>HDMI接続の体験</small></button><button data-explore="remote">リモコンで操作する<small>方向キーで選んで、OKで決定</small></button><button data-explore="schedule">時間割を知る<small>時間帯に合わせた表示の例</small></button><button data-explore="free">自由に試す</button></div>';
  document.body.append(completion);
  const sampleDialog=document.createElement('dialog');sampleDialog.id='tour-schedule';sampleDialog.innerHTML='<h2>時間割で映す内容を切り替える</h2><p>実機では、時刻とプレイリストを登録して自動で切り替えられます。ここではタイマーを設定せず、表示例を確認します。</p><div class="tour-options"><button data-period="昼">昼の表示を見る</button><button data-period="夕方">夕方の表示を見る</button></div><p id="period-example" aria-live="polite">昼：ランチメニュー ／ 夕方：ディナーメニュー</p><form method="dialog"><button>閉じる</button></form>';
  document.body.append(sampleDialog);
  sampleDialog.addEventListener('click',e=>{const p=e.target.closest('[data-period]');if(p)$('#period-example').textContent=p.dataset.period==='昼'?'12:00〜 ランチメニューを表示':'17:00〜 ディナーメニューを表示';});
  completion.addEventListener('click',e=>{const option=e.target.closest('[data-explore]');if(!option)return;completion.close();$('#free').click();end();
    if(option.dataset.explore==='edit'){go('manage');toast('素材を選ぶと順番や表示時間を変更できます。「＋ふやす」で素材を追加できます。');}
    if(option.dataset.explore==='hdmi')$('#hdmi-picker').showModal();
    if(option.dataset.explore==='schedule')sampleDialog.showModal();
    if(option.dataset.explore==='remote'){go('manage');toast('リモコンの方向キーで項目を選び、OKで決定してください。');$('.remote').scrollIntoView({block:'center'});}
  });
  nextButton.onclick=()=>{lastActivity=Date.now();editIndex++;refresh();};
  completion.addEventListener('cancel',()=>{$('#free').click();end();});
  const b=a=>'#screen [data-action="'+a+'"]';
  function step(){
    if(!introduced||intro.open||completion.open||sampleDialog.open||!guide||dismissed||!$('#entry-screen').hidden||$('#info').open||$('#hdmi-picker').open||$('.dialog-shade'))return null;
    if(page==='off')return ['#power','まずは、電源を入れてみましょう。明るくなっているボタンを押してください。'];
    if(page==='welcome')return [b('go:choice'),'PANELYが起動しました。「はじめる」を押しましょう。'];
    if(page==='choice')return [b('choose:content'),'まずはUSBで写真・動画を映してみましょう。「写真・動画」を押してください。'];
    if(page==='usb'){
      if(!usb)return ['#usb','画面の「USBを挿す」ボタンを押してください。サンプル素材を使って、USBをつなぐ操作を体験できます。実物のUSBメモリは必要ありません。'];
      if(!permission)return [b('permission'),'写真や動画を読み込むため、「アクセスを許可する」を押しましょう。'];
      return [b('import'),'「USBを再確認する」で、素材を取り込みましょう。'];
    }
    if(page==='permission')return permission?[b('permission-back'),'許可できました。「PANELYへ戻る」を押しましょう。']:[b('grant'),'PANELYのファイルアクセスを「ON」にしましょう。'];
    if(page==='pick')return picked.length?[b('add-picked'),'素材を選べました。「この内容ではじめる」を押しましょう。'] : ['#screen .grid .tile','まずは、このサンプル画像を選んでみましょう。'];
    if(page==='done')return [b('play'),'準備ができました。「再生をはじめる」を押しましょう。'];
    if(page==='play'&&!editDone){
      if(usb)return ['#usb','再生できました！素材は本体に保存されています。画面の「USBを抜く」を押して、再生が続くことを確認しましょう。'];
      return ['.remote-back','USBを抜いても再生が続きます。次に、リモコンの「戻る」を押して編集画面を開きましょう。'];
    }
    if(page==='manage'&&!editDone){
      const available=managementHelp.filter(x=>document.querySelector('#screen '+x[0]));
      if(editIndex>=available.length){editDone=true;hide();completion.showModal();return null;}
      const item=available[editIndex];return ['#screen '+item[0],(editIndex+1)+' / '+available.length+'　'+item[1]+'：'+item[2],false,'explain'];
    }
    return null;
  }
  function hide(){overlay.hidden=true;target=null;stepKey='';}
  function update(){
    frame=0;help.hidden=page!=='manage';const next=step();nextButton.hidden=next?.[3]!=='explain';if(!next){hide();return;}
    const el=document.querySelector(next[0]);if(!el){hide();return;}
    const key=next[0]+next[1];
    if(key!==stepKey){stepKey=key;text.textContent=next[1];finish.hidden=!next[2];el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});}
    target=el;overlay.hidden=false;lastActivity=Date.now();
    const r=el.getBoundingClientRect(),pad=7,w=window.innerWidth,h=window.innerHeight;
    const left=Math.max(4,r.left-pad),top=Math.max(4,r.top-pad),right=Math.min(w-4,r.right+pad),bottom=Math.min(h-4,r.bottom+pad);
    Object.assign(hole.style,{left:left+'px',top:top+'px',width:Math.max(0,right-left)+'px',height:Math.max(0,bottom-top)+'px'});
    const cw=card.offsetWidth,ch=card.offsetHeight;
    let x=Math.max(12,Math.min(w-cw-12,left+(right-left-cw)/2));
    let y=bottom+16;
    if(y+ch>h-12)y=top-ch-16;
    if(y<12){x=right+16;if(x+cw>w-12)x=left-cw-16;y=Math.max(12,Math.min(h-ch-12,top));}
    Object.assign(card.style,{left:Math.max(12,Math.min(w-cw-12,x))+'px',top:Math.max(12,y)+'px'});
  }
  function refresh(){if(!frame)frame=requestAnimationFrame(update);}
  function end(){dismissed=true;hide();}
  card.querySelector('.tour-skip').onclick=()=>{$('#free').click();end();};
  finish.onclick=()=>{$('#free').click();end();};
  // Restrict interaction to the highlighted control, with an always available exit.
  document.addEventListener('click',e=>{
    if(!overlay.hidden&&!nextButton.hidden&&target?.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();return;}
    if(!overlay.hidden&&!overlay.contains(e.target)&&!target?.contains(e.target)&&!e.target.closest('#free,#guided,#reset')){e.preventDefault();e.stopImmediatePropagation();return;}
    if(e.target.closest('#guided,#reset'))dismissed=false;
    if(e.target.closest('#reset')){editIndex=0;editDone=false;}
    if(e.target.closest('#guided')&&page==='manage'){editIndex=0;editDone=false;}
    refresh();
  },true);
  document.addEventListener('pointerdown',e=>{
    if(!overlay.hidden&&!overlay.contains(e.target)&&!target?.contains(e.target)&&!e.target.closest('#free,#guided,#reset')){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  document.addEventListener('keydown',e=>{
    if(intro.open||completion.open||sampleDialog.open){e.stopImmediatePropagation();return;}
    if(overlay.hidden)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();$('#free').click();end();return;}
    if(e.key==='Tab'){
      const choices=[...(target.matches('button')?[target]:target.querySelectorAll('button:not([disabled])')), ...card.querySelectorAll('button:not([hidden])')];
      e.preventDefault();e.stopImmediatePropagation();const i=choices.indexOf(document.activeElement);choices[(i+(e.shiftKey?-1:1)+choices.length)%choices.length]?.focus();return;
    }
    if(['Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      e.stopImmediatePropagation();if(!target.contains(e.target)&&!card.contains(e.target))e.preventDefault();
    }
  },true);
  new MutationObserver(refresh).observe($('#screen'),{childList:true,subtree:true});
  window.addEventListener('resize',refresh);window.addEventListener('scroll',refresh,true);
  function offerGuide(){hide();intro.showModal();}
  intro.querySelector('#tour-begin').onclick=()=>{introduced=true;dismissed=false;intro.close();refresh();};
  function skipIntro(){introduced=true;intro.close();$('#free').click();end();}
  intro.querySelector('#tour-without-guide').onclick=skipIntro;
  intro.addEventListener('cancel',e=>{e.preventDefault();skipIntro();});
  $('#start-experience').addEventListener('click',()=>{if(guide)offerGuide();});
  $('#guided').addEventListener('click',()=>{if(!introduced)offerGuide();});
})();
