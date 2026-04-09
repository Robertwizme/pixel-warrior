const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const insertCode = `
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

// §22 Chat system (Firebase Realtime Database REST)
let _chatPollTimer=null,_chatOpen=false,_chatInputVisible=false,_chatNick='';
function getChatNick(){
  if(_chatNick)return _chatNick;
  try{
    let n=localStorage.getItem('pw_chat_nick');
    if(!n){
      const a=['勇猛','冷酷','神秘','传奇','狂野','精锐'];
      const c=['战士','法师','游侠','刺客','博士','医生'];
      n=a[Math.floor(Math.random()*a.length)]+c[Math.floor(Math.random()*c.length)]+(100+Math.floor(Math.random()*900));
      localStorage.setItem('pw_chat_nick',n);
    }
    _chatNick=n;
  }catch{_chatNick='匿名玩家';}
  return _chatNick;
}
function getChatUrl(){
  try{return(localStorage.getItem('pw_chat_url')||'').trim().replace(/\/+$/,'');}catch{return '';}
}
async function fetchChatMsgs(){
  const url=getChatUrl();if(!url)return null;
  try{
    const r=await fetch(url+'/chat.json?limitToLast=30&orderBy=%22%24key%22');
    if(!r.ok)return null;
    const d=await r.json();if(!d)return[];
    return Object.entries(d).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>({key:k,...v}));
  }catch{return null;}
}
async function sendChatMsg(text){
  const url=getChatUrl();if(!url||!text.trim())return false;
  try{
    const r=await fetch(url+'/chat.json',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nick:getChatNick(),text:text.trim().slice(0,100),time:Date.now()})
    });
    SFX.play('send');return r.ok;
  }catch{return false;}
}
function renderChatMsgs(msgs){
  const el=document.getElementById('chat-messages');if(!el)return;
  const myNick=getChatNick();
  if(!msgs||!msgs.length){
    el.innerHTML='<div style="text-align:center;color:#444;padding:20px;font-size:11px">暂无消息，快来打个招呼！</div>';
    return;
  }
  el.innerHTML=msgs.map(m=>{
    const d=new Date(m.time||0);
    const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    const own=m.nick===myNick;
    return '<div class="chat-msg'+(own?' own-msg':'')+'">'+
      '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
      '<span>'+(m.text||'').replace(/</g,'&lt;')+'</span>'+
      '<span class="chat-time">'+ts+'</span></div>';
  }).join('');
  el.scrollTop=el.scrollHeight;
}
function renderChatPreview(msgs){
  const el=document.getElementById('menu-chat-latest');if(!el)return;
  if(!getChatUrl()){el.textContent='配置Firebase后即可使用聊天 — 点击进入查看说明';return;}
  if(!msgs){el.textContent='聊天室连接失败...';return;}
  if(!msgs.length){el.textContent='暂无消息，快来第一个打招呼！';return;}
  const last=msgs[msgs.length-1];
  el.textContent=(last.nick||'?')+': '+(last.text||'');
}
async function pollChat(){
  const msgs=await fetchChatMsgs();
  renderChatPreview(msgs);
  if(_chatOpen)renderChatMsgs(msgs);
  _chatPollTimer=setTimeout(pollChat,6000);
}
function startChatPoll(){clearTimeout(_chatPollTimer);pollChat();}

document.getElementById('btn-chat-back').addEventListener('click',()=>{
  _chatOpen=false;clearTimeout(_chatPollTimer);showOverlay('o-menu');
});
document.getElementById('btn-chat-compose').addEventListener('click',()=>{
  _chatInputVisible=!_chatInputVisible;
  const area=document.getElementById('chat-input-area');
  const hint=document.getElementById('chat-compose-hint');
  if(area)area.style.display=_chatInputVisible?'flex':'none';
  if(hint)hint.style.display=_chatInputVisible?'none':'';
  document.getElementById('btn-chat-compose').textContent=_chatInputVisible?'✖':'✏️';
  if(_chatInputVisible)setTimeout(()=>document.getElementById('chat-input')?.focus(),100);
});
document.getElementById('btn-chat-send').addEventListener('click',async()=>{
  const inp=document.getElementById('chat-input');
  if(!inp||!inp.value.trim())return;
  const text=inp.value.trim();inp.value='';
  const ok=await sendChatMsg(text);
  if(ok)setTimeout(pollChat,600);
});
document.getElementById('chat-input').addEventListener('keydown',e=>{
  if(e.key==='Enter')document.getElementById('btn-chat-send').click();
});
const nickEl=document.getElementById('chat-nick-show');
if(nickEl){
  nickEl.textContent=getChatNick();
  nickEl.addEventListener('click',()=>{
    const n=prompt('修改昵称:',getChatNick());
    if(n&&n.trim()){
      _chatNick=n.trim().slice(0,20);
      try{localStorage.setItem('pw_chat_nick',_chatNick);}catch(e){}
      nickEl.textContent=_chatNick;
    }
  });
}
document.getElementById('chat-url-input').addEventListener('change',function(){
  try{localStorage.setItem('pw_chat_url',this.value.trim());}catch(e){}
  startChatPoll();
});
try{
  const su=localStorage.getItem('pw_chat_url');
  if(su)document.getElementById('chat-url-input').value=su;
}catch(e){}

// Wrap showOverlay to track chat open state
(function(){
  const orig=window.showOverlay;
  window.showOverlay=function(id){
    _chatOpen=(id==='o-chat');
    if(_chatOpen){
      document.getElementById('chat-nick-show').textContent=getChatNick();
      startChatPoll();
    }
    orig(id);
  };
})();

// SFX toggle listener
document.getElementById('tog-sfx').addEventListener('click',()=>{
  settings.sfx=!settings.sfx;
  document.getElementById('tog-sfx').classList.toggle('on',settings.sfx);
});

// Initial chat preview poll
setTimeout(startChatPoll,1500);
`;

const lastScript = h.lastIndexOf('</script>');
h = h.slice(0, lastScript) + insertCode + '\n' + h.slice(lastScript);
fs.writeFileSync('index.html', h, 'utf8');
console.log('Done. Size:', h.length);
