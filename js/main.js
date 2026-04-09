'use strict';

// ── §0a  Loading screen ──
(function(){
  const scr = document.getElementById('loading-screen');
  const bar = document.getElementById('load-bar');
  const txt = document.getElementById('load-text');
  const steps = ['初始化引擎...','加载地图...','生成怪物...','准备武器...','加载完成！'];
  let pct = 0, si = 0;
  const iv = setInterval(()=>{
    pct = Math.min(100, pct + Math.random()*28 + 8);
    bar.style.width = pct + '%';
    txt.textContent = steps[Math.min(si++, steps.length-1)];
    if (pct >= 100) {
      clearInterval(iv);
      setTimeout(()=>{ scr.style.opacity='0'; setTimeout(()=>{ scr.style.display='none'; },600); }, 350);
    }
  }, 200);
})();


// ═══════════════════════════════════════════════════════
// §23  Boot
// ═══════════════════════════════════════════════════════
renderBestRun();
renderMenuCoins();
updateMenuLevel();
requestAnimationFrame(function bootstrap(ts) {
  lastTs = ts;
  requestAnimationFrame(gameLoop);
});

// §21 Language system
const UI_STRINGS = {
  zh:{settings:'⚙ 设置',sfx:'🔊 音效',lang:'🌐 语言 / Language',back:'← 返回',
    start:'⚔ 开始游戏',achieve:'🏆 成就',shop:'🏪 商城',announce:'📢 公告',
    mailbox:'📬 邮箱',activity:'🎪 活动',chatCompose:'点击 ✏️ 写消息',
    chatSend:'发',chatPlaceholder:'输入消息（最多100字）...'},
  en:{settings:'⚙ Settings',sfx:'🔊 Sound FX',lang:'🌐 Language',back:'← Back',
    start:'⚔ Start Game',achieve:'🏆 Achievements',shop:'🏪 Shop',announce:'📢 Updates',
    mailbox:'📬 Mailbox',activity:'🎪 Events',chatCompose:'Click ✏️ to compose',
    chatSend:'Send',chatPlaceholder:'Type message (max 100)...'}
};
function T(k){const s=UI_STRINGS[settings.lang||'zh'];return(s&&s[k])||UI_STRINGS.zh[k]||k;}
function applyLang(){
  const g=id=>document.getElementById(id);
  const sv=(id,k)=>{const e=g(id);if(e)e.textContent=T(k);};
  sv('settings-title','settings');sv('lbl-sfx','sfx');sv('lbl-lang','lang');
  sv('btn-settings-back','back');sv('btn-class-back','back');
  sv('btn-achieve-back','back');sv('btn-announce-back','back');
  sv('btn-mailbox-back','back');sv('btn-activity-back','back');sv('btn-chat-back','back');
  sv('chat-compose-hint','chatCompose');
  const bs=g('btn-start');if(bs)bs.textContent=T('start');
  const ci=g('chat-input');if(ci)ci.placeholder=T('chatPlaceholder');
  const cs=g('btn-chat-send');if(cs)cs.textContent=T('chatSend');
  const lb=g('lang-toggle');if(lb)lb.textContent=(settings.lang==='zh')?'English':'中文';
}
document.getElementById('lang-toggle').addEventListener('click',()=>{
  settings.lang=(settings.lang==='zh')?'en':'zh';
  try{localStorage.setItem('pw_lang',settings.lang);}catch(e){}
  applyLang();SFX.play('click');
});
try{const sl=localStorage.getItem('pw_lang');if(sl){settings.lang=sl;applyLang();}}catch(e){}

