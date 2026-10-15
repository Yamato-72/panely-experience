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
  let dismissed=false,target=null,stepKey='',frame=0,revealTimer=null,revealReady=false;
  let editDone=false,editPhase="add";
  let playbackSeen=false;
  const observation=document.createElement('section');
  observation.className='tour-observation';observation.hidden=true;
  observation.setAttribute('aria-label','再生の確認');
  observation.innerHTML='<div class="observation-copy"><small>操作ガイドは続きます</small><strong></strong><p></p></div><div class="observation-actions"><button class="primary">次へ →</button><button class="tour-skip">ここで案内を終える</button></div>';
  $('.display-wrap').after(observation);
  observation.querySelector('.primary').onclick=()=>{if(editDone){observation.hidden=true;completion.showModal();}else playbackSeen=true;refresh();};
  observation.querySelector('.tour-skip').onclick=()=>{$('#free').click();end();};

  const featureDialog=document.createElement('dialog');featureDialog.id='feature-help';featureDialog.setAttribute('aria-labelledby','feature-title');
  featureDialog.innerHTML='<h2 id="feature-title"></h2><p></p><form method="dialog"><button>閉じる</button></form>';
  document.body.append(featureDialog);
  function installHelp(){
    if(page!=='manage')return;
    managementHelp.forEach((item,i)=>{
      const anchor=document.querySelector('#screen '+item[0]);
      if(!anchor||document.querySelector('#screen [data-feature-help="'+i+'"]'))return;
      const question=document.createElement('button');question.className='feature-question';question.dataset.featureHelp=String(i);question.textContent='？';question.setAttribute('aria-label',item[1]+'の説明');question.title=item[1]+'の説明';
      anchor.after(question);
    });
  }
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

  completion.addEventListener('cancel',()=>{$('#free').click();end();});
  const b=a=>'#screen [data-action="'+a+'"]';
  function step(){
    if(!introduced||intro.open||completion.open||sampleDialog.open||featureDialog.open||!guide||dismissed||!$('#entry-screen').hidden||$('#info').open||$('#hdmi-picker').open||$('.dialog-shade'))return null;
    if(page==='off')return ['#power','まずは、電源を入れてみましょう。明るくなっているボタンを押してください。'];
    if(page==='welcome')return [b('go:choice'),'PANELYが起動しました。「はじめる」を押しましょう。'];
    if(page==='choice')return [b('choose:content'),'まずはUSBで写真・動画を映してみましょう。「写真・動画」を押してください。'];
    if(page==='usb'){
      if(!usb)return ['#usb','画面の「USBを挿す」ボタンを押してください。サンプル素材を使って、USBをつなぐ操作を体験できます。実物のUSBメモリは必要ありません。'];
      if(!permission)return [b('permission'),'写真や動画を読み込むため、「アクセスを許可する」を押しましょう。'];
      return [b('import'),'「USBを再確認する」で、素材を取り込みましょう。'];
    }
    if(page==='permission')return permission?[b('permission-back'),'許可できました。「PANELYへ戻る」を押しましょう。']:[b('grant'),'PANELYのファイルアクセスを「ON」にしましょう。'];
    if(page==='pick')return picked.length?[b('add-picked'),'素材を選べました。「この内容ではじめる」を押しましょう。'] : ['#screen .grid .tile','取り込みが完了しました。素材は本体に保存されたので、USBメモリは抜いてかまいません。まずは、このサンプル画像を選んでみましょう。'];
    if(page==='done')return [b('play'),'準備ができました。「再生をはじめる」を押しましょう。'];
    if(page==='play'&&!editDone){
      if(!playbackSeen)return null;
      return ['.remote-back','映す内容を変更してみましょう。リモコンの「戻る」を押して編集画面を開きましょう。'];
    }
    if(page==='manage'&&!editDone){
      if(tab!=='main')return [b('tab:main'),'「いつもの」を選び、普段流す内容を編集しましょう。'];
      if(editPhase==='add')return [b('add'),'ここで映す内容を変更できます。「＋ふやす」で、もうひとつ素材を追加しましょう。各項目の？から機能の説明も読めます。'];
      if(editPhase==='select')return [b('edit:'+(list().main.length-1)),'追加した素材を選んで、表示する順番を変えてみましょう。'];
      if(editPhase==='move')return [b('move:-1'),'「前へ」で、選んだ素材の再生順をひとつ前に移します。'];
      if(editPhase==='replay')return [b('play'),'順番を変更できました。「再生する」で変更した表示を確認しましょう。'];
    }
    if(page==='add'&&!editDone){
      if(picked.length)return [b('add-picked'),'「選んで追加」で、プレイリストに追加します。'];
      const candidate=s.library.find(x=>!list().main.some(y=>y.id===x.id))||s.library[0];
      if(candidate)return [b('pick:'+candidate.id),'追加したい素材を選びましょう。ここでは、このサンプルを選んでみてください。'];
    }
    return null;
  }
  function hide(){clearTimeout(revealTimer);revealTimer=null;revealReady=false;overlay.hidden=true;target=null;stepKey='';}
  function update(){
    frame=0;installHelp();
    const observing=introduced&&guide&&!dismissed&&page==='play'&&!intro.open&&!completion.open&&!sampleDialog.open&&!$('#info').open&&!$('#hdmi-picker').open&&!$('.dialog-shade')&&!featureDialog.open&&(editDone||!playbackSeen);
    const wasObserving=!observation.hidden;
    observation.hidden=!observing;
    if(observing){
      observation.querySelector('strong').textContent=editDone?'変更した内容が再生できました。':'再生できました。次は映す内容を変更してみましょう。';
      observation.querySelector('p').textContent=editDone?'追加した素材と、変更した順番を確認してください。これで基本の操作は完了です。':'映った内容を確認したら、下のボタンで編集画面への戻り方に進めます。';
      observation.querySelector('.primary').textContent=editDone?'確認できた：次の体験を選ぶ →':'次へ：編集画面に戻る →';
      if(!wasObserving)observation.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    }
    const next=step();if(!next){hide();return;}
    const el=document.querySelector(next[0]);if(!el){hide();return;}
    const key=next[0]+next[1];
    if(key!==stepKey){
      // Let users see the result and its surroundings before directing attention.
      clearTimeout(revealTimer);stepKey=key;revealReady=false;overlay.hidden=true;target=null;
      text.textContent=next[1];finish.hidden=!next[2];
      el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
      revealTimer=setTimeout(()=>{revealReady=true;revealTimer=null;refresh();},1800);
    }
    if(!revealReady)return;
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
    const question=e.target.closest('[data-feature-help]');
    if(question){e.preventDefault();e.stopImmediatePropagation();const item=managementHelp[Number(question.dataset.featureHelp)];featureDialog.querySelector('h2').textContent=item[1];featureDialog.querySelector('p').textContent=item[2];hide();featureDialog.showModal();return;}

    if(!overlay.hidden&&!overlay.contains(e.target)&&!target?.contains(e.target)&&!e.target.closest('#free,#guided,#reset,[data-feature-help]')){e.preventDefault();e.stopImmediatePropagation();return;}
    if(e.target.closest('#guided,#reset'))dismissed=false;
    if(e.target.closest('#reset')){editDone=false;editPhase="add";playbackSeen=false;}
    if(e.target.closest('#guided')&&page==='manage'){editDone=false;editPhase='add';}
    const actionName=e.target.closest('[data-action]')?.dataset.action;
    if(guide&&!dismissed&&!editDone){
      if(page==='add'&&actionName==='add-picked'&&picked.length)editPhase='select';
      if(page==='manage'&&editPhase==='select'&&actionName?.startsWith('edit:'))editPhase='move';
      if(page==='manage'&&editPhase==='move'&&actionName==='move:-1')editPhase='replay';
      if(page==='manage'&&editPhase==='replay'&&actionName==='play')editDone=true;
    }
    refresh();
  },true);
  document.addEventListener('pointerdown',e=>{
    if(!overlay.hidden&&!overlay.contains(e.target)&&!target?.contains(e.target)&&!e.target.closest('#free,#guided,#reset')){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  document.addEventListener('keydown',e=>{
    if(intro.open||completion.open||sampleDialog.open||featureDialog.open){e.stopImmediatePropagation();return;}
    if(!observation.hidden&&observation.contains(e.target)){e.stopImmediatePropagation();return;}
    if(e.target.closest('[data-feature-help]')){e.stopImmediatePropagation();return;}
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
  featureDialog.addEventListener('close',refresh);
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
