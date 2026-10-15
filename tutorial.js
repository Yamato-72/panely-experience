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
  const b=a=>'#screen [data-action="'+a+'"]';
  function step(){
    if(!introduced||intro.open||!guide||dismissed||!$('#entry-screen').hidden||$('#info').open||$('#hdmi-picker').open||$('.dialog-shade'))return null;
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
    if(page==='play')return ['.remote-dpad','再生できました！付属リモコンの方向キーとOKもクリックして操作できます。設定画面などで、項目の選択・決定に使います。',true];
    return null;
  }
  function hide(){overlay.hidden=true;target=null;stepKey='';}
  function update(){
    frame=0;const next=step();if(!next){hide();return;}
    const el=document.querySelector(next[0]);if(!el){hide();return;}
    const key=next[0]+next[1];
    if(key!==stepKey){stepKey=key;text.textContent=next[1];finish.hidden=!next[2];el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});}
    target=el;overlay.hidden=false;
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
    if(!overlay.hidden&&!overlay.contains(e.target)&&!target?.contains(e.target)&&!e.target.closest('#free,#guided,#reset')){e.preventDefault();e.stopImmediatePropagation();return;}
    if(e.target.closest('#guided,#reset'))dismissed=false;
    refresh();
  },true);
  document.addEventListener('pointerdown',e=>{
    if(!overlay.hidden&&!overlay.contains(e.target)&&!target?.contains(e.target)&&!e.target.closest('#free,#guided,#reset')){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  document.addEventListener('keydown',e=>{
    if(intro.open){e.stopImmediatePropagation();return;}
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
