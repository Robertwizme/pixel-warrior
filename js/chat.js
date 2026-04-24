'use strict';

// §22 Chat system (Firebase Realtime Database REST)
let _chatPollTimer=null,_chatOpen=false,_chatInputVisible=false,_chatNick='';
function getPlayerId(){
  try{
    let id=localStorage.getItem('pw_player_id');
    if(!id){
      const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      id=Array.from({length:6},()=>ch[Math.floor(Math.random()*ch.length)]).join('');
      localStorage.setItem('pw_player_id',id);
    }
    return id;
  }catch{return'GUEST1';}
}
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
const _DEFAULT_CHAT_URL='https://xiaojiu-3777c-default-rtdb.asia-southeast1.firebasedatabase.app';
function getChatUrl(){
  try{const u=(localStorage.getItem('pw_chat_url')||'').trim().replace(/\/+$/,'');return u||_DEFAULT_CHAT_URL;}catch{return _DEFAULT_CHAT_URL;}
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
const _BAD_WORDS=['操','妈的','傻逼','草泥马','cnm','nmsl','cnmd','nmd','tmd','sb','sm','wcnm','fuck','shit','bitch','asshole','bastard','damn','cunt','dick','傻x','diao','jb','nmbd'];
function _hasBadWord(t){const l=t.toLowerCase().replace(/\s/g,'');return _BAD_WORDS.some(w=>l.includes(w));}
function parseColorMsg(raw){
  const safe=raw.replace(/</g,'&lt;');
  const m1=raw.match(/^#([RYBGP]) ?([\s\S]*)$/);
  if(m1){
    const col={R:'#f44',Y:'#fd4',B:'#5af',G:'#4fd',P:'#f8a'}[m1[1]];
    if(col)return'<span style="color:'+col+'">'+m1[2].replace(/</g,'&lt;')+'</span>';
  }
  if(raw.startsWith('#小九牛逼')){
    const cs=['#f44','#f84','#fd4','#4fd','#5af','#a4f','#f8a'];
    const txt=raw.slice(raw.startsWith('#小九牛逼 ')?6:5);
    return[...txt.replace(/</g,'&lt;')].map((c,i)=>'<span style="color:'+cs[i%cs.length]+'">'+c+'</span>').join('');
  }
  return safe;
}
async function sendChatMsg(text){
  const url=getChatUrl();if(!url||!text.trim())return false;
  if(_isMuted()){
    const hint=document.getElementById('chat-compose-hint');
    if(hint){hint.textContent='🔇 禁言中，剩余 '+_getMuteRemaining();hint.style.color='#f44';setTimeout(()=>{hint.textContent='';hint.style.color='';},3000);}
    return false;
  }
  if(_hasBadWord(text)){
    const inp=document.getElementById('chat-input');
    if(inp){inp.style.borderColor='#f44';setTimeout(()=>{inp.style.borderColor='#48f';},1500);}
    const hint=document.getElementById('chat-compose-hint');
    const muteMsg=_recordViolation();
    if(muteMsg){
      if(hint){hint.textContent='🔇 '+muteMsg;hint.style.color='#f44';setTimeout(()=>{hint.textContent='';hint.style.color='';},4000);}
    } else {
      const cnt=parseInt(localStorage.getItem('pw_vio_count')||'0',10);
      const warn='⚠️ 含不雅词（警告 '+cnt+'/2），第3次将被禁言';
      if(hint){hint.textContent=warn;hint.style.color='#f84';setTimeout(()=>{hint.textContent='';hint.style.color='';},2500);}
    }
    return false;
  }
  try{
    const r=await fetch(url+'/chat.json',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nick:getChatNick(),text:text.trim().slice(0,100),time:Date.now()})
    });
    SFX.play('send');return r.ok;
  }catch{return false;}
}
function getPlayerGender(){try{return localStorage.getItem('pw_gender')||'male';}catch{return'male';}}
function getPlayerFrame(){try{return localStorage.getItem('pw_avatar_frame')||'';}catch{return'';}}
function getGenderEmoji(g){g=g||getPlayerGender();return g==='female'?'👧':'👦';}
function getFrameStyle(f){
  if(f==='gold')return'border-color:#fd4;box-shadow:0 0 8px #fd4';
  if(f==='blue')return'border-color:#48f;box-shadow:0 0 8px #48f';
  if(f==='red')return'border-color:#f44;box-shadow:0 0 8px #f44';
  if(f==='green')return'border-color:#4fd;box-shadow:0 0 8px #4fd';
  if(f==='purple')return'border-color:#a4f;box-shadow:0 0 8px #a4f';
  return'border-color:#334;box-shadow:none';
}
function renderChatMsgs(msgs){
  const el=document.getElementById('chat-messages');if(!el)return;
  const wasAtBottom=(el.scrollHeight-el.scrollTop-el.clientHeight)<80;
  const myNick=getChatNick();
  if(!msgs||!msgs.length){
    el.innerHTML='<div style="text-align:center;color:#444;padding:20px;font-size:11px">暂无消息，快来打个招呼！</div>';
    return;
  }
  const myEmoji=getGenderEmoji();
  const myFS=getFrameStyle(getPlayerFrame());
  const bc=myFS.match(/border-color:([^;]+)/)?.[1]||'#334';
  const bsh=myFS.match(/box-shadow:([^;]+)/)?.[1]||'none';
  el.innerHTML=msgs.map(m=>{
    const d=new Date(m.time||0);
    const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    const own=m.nick===myNick;
    const colored=parseColorMsg(m.text||'');
    if(own){
      return '<div class="chat-msg own-msg">'+
        '<span class="chat-time-own">'+ts+'</span>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+myNick.replace(/</g,'&lt;')+'</span>'+
        colored+
        '</div>'+
        '<div class="chat-avatar" style="border-color:'+bc+';box-shadow:'+bsh+'">'+myEmoji+'</div>'+
        '</div>';
    } else {
      const firstCh=(m.nick||'?').charAt(0);
      const _snAttr=(m.nick||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      return '<div class="chat-msg">'+
        '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4fd;cursor:pointer" data-nick="'+_snAttr+'" onclick="viewUserProfile(this.dataset.nick)">'+firstCh+'</div>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
        colored+
        '<span class="chat-time"> '+ts+'</span>'+
        '</div></div>';
    }
  }).join('');
  if(wasAtBottom) el.scrollTop=el.scrollHeight;
}
function renderChatPreview(msgs){
  const el=document.getElementById('menu-chat-latest');if(!el)return;
  if(!getChatUrl()){el.textContent='聊天室加载中...';return;}
  if(!msgs){el.textContent='聊天室连接失败...';return;}
  if(!msgs.length){el.textContent='暂无消息，快来第一个打招呼！';return;}
  const last=msgs[msgs.length-1];
  const nick=(last.nick||'?').replace(/</g,'&lt;');
  el.innerHTML=nick+': '+parseColorMsg(last.text||'');
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
document.getElementById('btn-chat-clear').addEventListener('click',async()=>{
  if(getChatNick()!=='作者')return;
  if(!confirm('确定清空聊天内容和昵称注册记录？'))return;
  const url=getChatUrl();if(!url)return;
  let ok1=false,ok2=false;
  try{const r=await fetch(url+'/chat.json',{method:'DELETE'});ok1=r.ok;}catch{}
  try{const r=await fetch(url+'/nicks.json',{method:'DELETE'});ok2=r.ok;}catch{}
  try{await fetch(url+'/profiles.json',{method:'DELETE'});}catch{}
  try{await fetch(url+'/friends.json',{method:'DELETE'});}catch{}
  try{await fetch(url+'/dm.json',{method:'DELETE'});}catch{}
  document.getElementById('chat-messages').innerHTML=
    '<div style="text-align:center;color:#444;padding:20px;font-size:11px">'
    +(ok1?'✅ 聊天已清空':'❌ 聊天清空失败')+'&nbsp;'+(ok2?'✅ 昵称已清空':'❌ 昵称清空失败')+'</div>';
  if(ok1||ok2)SFX.play('click');
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
  const _initPidEl=document.getElementById('chat-pid-show');
  if(_initPidEl){_initPidEl.textContent='#'+getPlayerId();_initPidEl.onclick=()=>{try{navigator.clipboard.writeText(getPlayerId());}catch{}addFloatingText('ID已复制!',0,0,'#4fd',1.2);};}
  nickEl.addEventListener('click',()=>openProfile(true));
}
// chat-url-input removed (URL is now hardcoded)


// §23 玩家信息系统
let _profileFromChat=false;
let _profGender='male';
let _profFrame='';

function _autoNickPattern(n){
  return /^(勇猛|冷酷|神秘|传奇|狂野|精锐)(战士|法师|游侠|刺客|博士|医生)\d{3}$/.test(n);
}
function updateMenuAvatar(){
  const ic=document.getElementById('menu-avatar-icon');
  const nm=document.getElementById('menu-player-name');
  if(ic){
    ic.textContent=getGenderEmoji();
    const fs=getFrameStyle(getPlayerFrame());
    const bc=fs.match(/border-color:([^;]+)/)?.[1]||'#334';
    const bsh=fs.match(/box-shadow:([^;]+)/)?.[1]||'none';
    ic.style.borderColor=bc; ic.style.boxShadow=bsh;
  }
  if(nm){
    const n=getChatNick();
    nm.textContent=_autoNickPattern(n)?'':n;
  }
  updateMenuLevel();
}
function openProfile(fromChat){
  _profileFromChat=!!fromChat;
  _profGender=getPlayerGender();
  _profFrame=getPlayerFrame();
  const n=getChatNick();
  const ni=document.getElementById('profile-name-input');
  if(ni) ni.value=_autoNickPattern(n)?'':n;
  // gender buttons
  document.getElementById('btn-gender-male').style.borderColor=_profGender==='male'?'#4fd':'';
  document.getElementById('btn-gender-female').style.borderColor=_profGender==='female'?'#4fd':'';
  // frame options
  document.querySelectorAll('.frame-opt').forEach(o=>{
    o.style.outline=o.dataset.frame===_profFrame?'2px solid #eee':'none';
  });
  // avatar preview
  _refreshProfileAvatar();
  showOverlay('o-profile');
  // In-game stats section
  const _pIg = document.getElementById('profile-ingame');
  if (_pIg) {
    if (gs?.weapons?.length > 0 && gs.player) {
      const p2 = gs.player;
      _pIg.style.display='block';
      _pIg.innerHTML = '<div style="margin-top:14px;border-top:1px solid #334;padding-top:10px;font-size:10px;text-align:left">'
        +'<div style="color:#fd4;font-size:11px;font-weight:700;margin-bottom:6px">⚔ 当前局武器</div>'
        + gs.weapons.map(w=>{const d=WEAPON_DEFS[w.id];return`<div style="color:#aad;margin-bottom:3px">${d?.icon||'🔸'} ${d?.name||w.id} <span style="color:#fd4">Lv.${w.level}</span></div>`;}).join('')
        +'<div style="color:#fd4;font-size:11px;font-weight:700;margin:8px 0 6px">📊 当前属性</div>'
        +`<div style="color:#888">❤ 最大HP <span style="color:#4fd;float:right">${p2.maxHp}</span></div>`
        +`<div style="color:#888">💪 伤害倍率 <span style="color:#4fd;float:right">${(p2.dmgMult*100).toFixed(0)}%</span></div>`
        +`<div style="color:#888">⚡ CD倍率 <span style="color:#4fd;float:right">${(p2.cdMult*100).toFixed(0)}%</span></div>`
        +`<div style="color:#888">🍀 幸运 <span style="color:#4fd;float:right">${p2.luck}</span></div>`
        +(p2.baseDodge>0?`<div style="color:#888">💨 闪避 <span style="color:#4fd;float:right">${(p2.baseDodge*100).toFixed(0)}%</span></div>`:'')
        +(p2.baseDmgRed>0?`<div style="color:#888">🛡 减伤 <span style="color:#4fd;float:right">${(p2.baseDmgRed*100).toFixed(0)}%</span></div>`:'')
        +'</div>';
    } else { _pIg.style.display='none'; }
  }
}
function _refreshProfileAvatar(){
  const pa=document.getElementById('profile-avatar');
  if(!pa)return;
  pa.textContent=getGenderEmoji(_profGender);
  const fs=getFrameStyle(_profFrame);
  const bc=fs.match(/border-color:([^;]+)/)?.[1]||'#334';
  const bsh=fs.match(/box-shadow:([^;]+)/)?.[1]||'none';
  pa.style.borderColor=bc; pa.style.boxShadow=bsh;
}
document.getElementById('btn-gender-male').addEventListener('click',()=>{
  _profGender='male';
  document.getElementById('btn-gender-male').style.borderColor='#4fd';
  document.getElementById('btn-gender-female').style.borderColor='';
  _refreshProfileAvatar(); SFX.play('click');
});
document.getElementById('btn-gender-female').addEventListener('click',()=>{
  _profGender='female';
  document.getElementById('btn-gender-female').style.borderColor='#4fd';
  document.getElementById('btn-gender-male').style.borderColor='';
  _refreshProfileAvatar(); SFX.play('click');
});
document.querySelectorAll('.frame-opt').forEach(opt=>{
  opt.addEventListener('click',()=>{
    _profFrame=opt.dataset.frame;
    document.querySelectorAll('.frame-opt').forEach(o=>o.style.outline='none');
    opt.style.outline='2px solid #eee';
    _refreshProfileAvatar(); SFX.play('click');
  });
});
async function _isNickTaken(nick){
  const url=getChatUrl();if(!url)return false;
  const myOld=localStorage.getItem('pw_nick_reg')||'';
  if(nick===myOld)return false; // same as currently registered
  try{
    const r=await fetch(url+'/nicks/'+encodeURIComponent(nick)+'.json');
    if(!r.ok)return false;
    const d=await r.json();
    return d!==null;
  }catch{return false;}
}
async function _registerNick(nick){
  const url=getChatUrl();if(!url)return;
  const myOld=localStorage.getItem('pw_nick_reg')||'';
  if(myOld&&myOld!==nick){
    try{await fetch(url+'/nicks/'+encodeURIComponent(myOld)+'.json',{method:'DELETE'});}catch{}
  }
  try{
    await fetch(url+'/nicks/'+encodeURIComponent(nick)+'.json',{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ts:Date.now()})
    });
    localStorage.setItem('pw_nick_reg',nick);
    try{const _rPid=getPlayerId();await fetch(url+'/ids/'+_rPid+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick,ts:Date.now()})});}catch{}
  }catch{}
}
document.getElementById('btn-profile-save').addEventListener('click',async()=>{
  const ni=document.getElementById('profile-name-input');
  const saveBtn=document.getElementById('btn-profile-save');
  const name=(ni.value||'').trim().slice(0,10);
  if(!name){
    ni.style.borderColor='#f44';
    ni.placeholder='请输入昵称！';
    return;
  }
  // Check duplicate
  saveBtn.textContent='检查中...';saveBtn.disabled=true;
  const taken=await _isNickTaken(name);
  saveBtn.textContent='保存';saveBtn.disabled=false;
  if(taken){
    ni.style.borderColor='#f44';
    ni.value='';
    ni.placeholder='有相同名字，请换一个！';
    SFX.play('playerhit');
    return;
  }
  ni.style.borderColor='#48f';
  _chatNick=name;
  try{localStorage.setItem('pw_chat_nick',name);localStorage.setItem('pw_nick_set','1');}catch(e){}
  try{localStorage.setItem('pw_gender',_profGender);}catch(e){}
  try{localStorage.setItem('pw_avatar_frame',_profFrame);}catch(e){}
  _registerNick(name);
  updateMenuAvatar();
  SFX.play('levelup');
  if(_profileFromChat) showOverlay('o-chat');
  else showOverlay('o-menu');
});
document.getElementById('btn-profile-back').addEventListener('click',()=>{
  if(_profileFromChat) showOverlay('o-chat');
  else showOverlay('o-menu');
});
// Init
updateMenuAvatar();

// §ActivityPage - 宝石怪首次出没活动
// ── 共用：7品质等级资料（图鉴 + 活动页共用）──
// _GEM_Q_KEYS 顺序必须与 _GEM_QUALITY_TIERS 索引一一对应
const _GEM_Q_KEYS=['common','rare','uncommon','epic','legendary','mythic','ultimate'];
const _GEM_QUALITY_TIERS=[
  { name:'普通宝石怪',  img:'photo/Gem Monster/Common Gem Monster.png',
    color:'#ccc', hp:100,  spd:60, dmg:5,  wave:'第8波起偶尔出现',
    drop:'普通品质宝石（镶嵌加成 +10%）' },
  { name:'稀有宝石怪',  img:'photo/Gem Monster/Rare Gem Monster.png',
    color:'#4f8', hp:200,  spd:58, dmg:8,  wave:'第10波起偶尔出现',
    drop:'稀有品质宝石（镶嵌加成 +20%）' },
  { name:'较稀有宝石怪',img:'photo/Gem Monster/Uncommon Gem Monster.png',
    color:'#4af', hp:400,  spd:55, dmg:12, wave:'第12波起偶尔出现',
    drop:'较稀有品质宝石（镶嵌加成 +35%）' },
  { name:'史诗宝石怪',  img:'photo/Gem Monster/Epic Gem Monster.png',
    color:'#a4f', hp:800,  spd:50, dmg:18, wave:'第15波起偶尔出现',
    drop:'史诗品质宝石（镶嵌加成 +55%）' },
  { name:'传说宝石怪',  img:'photo/Gem Monster/Legendary Gem Monster.png',
    color:'#fd4', hp:1500, spd:48, dmg:25, wave:'第18波起稀少出现',
    drop:'传说品质宝石（镶嵌加成 +70%）' },
  { name:'神话宝石怪',  img:'photo/Gem Monster/Mythic Gem Monster.png',
    color:'#f84', hp:3000, spd:45, dmg:35, wave:'第22波起稀少出现',
    drop:'神话品质宝石（镶嵌加成 +85%）' },
  { name:'至臻宝石怪',  img:'photo/Gem Monster/Ultimate Gem Monster.png',
    color:'#f4f', hp:6000, spd:42, dmg:50, wave:'第26波起极少出现',
    drop:'至臻品质宝石（镶嵌加成 +85% · 额外解锁50%特效）', rainbow:true },
];
let _actGemQIdx=0;
function _actGemQNav(dir){ _actGemQIdx=(_actGemQIdx+dir+7)%7; renderActivityPage(); }

const _GEM_ACT=[
  {icon:'❤', name:'生命宝石怪', wave:'第8波起',  drop:'生命宝石', dropDesc:'镶嵌后 +30 最大HP',    wk:'高DPS持续输出', wkTip:'血量极高，推荐飞剑/加特林高频输出'},
  {icon:'🟢', name:'幸运宝石怪', wave:'第10波起', drop:'幸运宝石', dropDesc:'镶嵌后 +20 幸运值',   wk:'任意武器均有效', wkTip:'无特殊行为，属性中等，击败还可能额外掉金币'},
  {icon:'🟡', name:'迅雷宝石怪', wave:'第12波起', drop:'速度宝石', dropDesc:'镶嵌后 +15 移动速度', wk:'追踪类 · 范围类', wkTip:'移速极快，推荐导弹无人机锁定或飞剑全屏覆盖'},
  {icon:'🔴', name:'火焰宝石怪', wave:'第15波起', drop:'攻击宝石', dropDesc:'镶嵌后 +10% 武器伤害', wk:'穿透类武器',    wkTip:'血量较高，穿透弹可高效连贯伤害；推荐狙击枪'},
  {icon:'🔵', name:'冰霜宝石怪', wave:'第18波起', drop:'防御宝石', dropDesc:'镶嵌后 -8% 受到伤害',  wk:'远程 · 火焰系', wkTip:'移速极慢但受击会减速，保持距离远程输出为佳'},
  {icon:'🟣', name:'秘法宝石怪', wave:'第20波起', drop:'急速宝石', dropDesc:'镶嵌后 -8% 冷却时间', wk:'远程武器',      wkTip:'靠近有减速气场，推荐狙击枪保持距离点射'},
  {icon:'⭐', name:'暴击宝石怪', wave:'第25波起', drop:'暴击宝石', dropDesc:'镶嵌后 +8% 暴击率',   wk:'穿透类武器',   wkTip:'出现波次极高且自身暴击高，优先快速消灭'},
];
let _actSel=0;
function renderActivityPage(){
  const panel=document.querySelector('#o-activity .panel');
  if(!panel)return;
  panel.style.cssText='background:#0d0d1a;border:2px solid #48f;border-radius:0;padding:14px 16px;width:100vw;height:100vh;max-width:100vw;max-height:100vh;display:flex;flex-direction:column;overflow:hidden;text-align:left;box-shadow:none';
  function _buildAct(){
    const ev=_GEM_ACT[_actSel];
    panel.innerHTML=
      '<div style="font-size:16px;color:#4fd;font-weight:700;text-align:center;letter-spacing:1px;margin-bottom:10px;flex-shrink:0">🎪 限时活动</div>'+
      '<div style="display:flex;gap:8px;flex:1;overflow:hidden;min-height:0">'+
        '<div style="width:90px;flex-shrink:0;border-right:1px solid #1a1a2e;overflow-y:auto;padding-right:6px">'+
          '<div style="font-size:9px;color:#4fd;font-weight:700;margin-bottom:6px;text-align:center">💎 宝石怪出没</div>'+
          _GEM_ACT.map((e,i)=>'<div class="ac-i" data-i="'+i+'" style="padding:7px 4px;border-radius:4px;cursor:pointer;background:'+(i===_actSel?'#0a1a12':'transparent')+';border-left:2px solid '+(i===_actSel?'#4fd':'transparent')+';text-align:center;margin-bottom:2px">'+
            '<div style="font-size:16px">'+e.icon+'</div>'+
            '<div style="font-size:8px;color:'+(i===_actSel?'#4fd':'#666')+';margin-top:2px;line-height:1.2">'+e.name+'</div>'+
          '</div>').join('')+
        '</div>'+
        '<div style="flex:1;overflow-y:auto;padding-left:4px">'+
          // ── 品质图片轮播 ──
          (function(){
            const gq=_GEM_QUALITY_TIERS[_actGemQIdx];
            const btnS='font-size:16px;background:none;border:none;color:#555;cursor:pointer;padding:1px 8px;font-family:monospace;line-height:1';
            const nameStyle=gq.rainbow
              ?'background:linear-gradient(90deg,#f44,#f84,#fd4,#4f8,#4af,#a4f,#f4f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700'
              :'color:'+gq.color+';font-weight:700';
            const dots=_GEM_QUALITY_TIERS.map((q,i)=>
              '<div style="width:6px;height:6px;border-radius:50%;background:'+(i===_actGemQIdx?q.color:'#1e1e2e')+';border:1px solid '+(i===_actGemQIdx?q.color:'#333')+'"></div>'
            ).join('');
            return (
              '<div style="background:#080814;border:1px solid #1a1a2e;border-radius:6px;padding:7px 6px 6px;margin-bottom:8px">'+
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
                  '<button style="'+btnS+'" onclick="_actGemQNav(-1)">◀</button>'+
                  '<span style="font-size:11px;'+nameStyle+'">'+gq.name+'</span>'+
                  '<button style="'+btnS+'" onclick="_actGemQNav(1)">▶</button>'+
                '</div>'+
                '<div style="text-align:center;margin:4px 0">'+
                  '<img src="'+gq.img+'" style="width:56px;height:56px;image-rendering:pixelated;object-fit:contain" onerror="this.style.display=\'none\'">'+
                '</div>'+
                '<div style="display:flex;justify-content:center;gap:4px;margin-top:4px">'+dots+'</div>'+
              '</div>'
            );
          })() +
          // ── 选中活动事件资讯 ──
          '<div style="font-size:12px;color:#eee;font-weight:700;margin-bottom:2px">'+ev.name+'</div>'+
          '<div style="font-size:9px;color:#666;margin-bottom:8px">📍 首次出没: '+ev.wave+'</div>'+
          '<div style="background:#0d0d1a;border:1px solid #1a2a1a;border-radius:6px;padding:8px 10px;margin-bottom:7px">'+
            '<div style="font-size:10px;color:#4fd;font-weight:700;margin-bottom:3px">💎 掉落奖励</div>'+
            '<div style="font-size:11px;color:#eee">'+ev.drop+'</div>'+
            '<div style="font-size:9px;color:#888;margin-top:2px">'+ev.dropDesc+'</div>'+
          '</div>'+
          '<div style="background:#0d0d1a;border:1px solid #2a1a1a;border-radius:6px;padding:8px 10px">'+
            '<div style="font-size:10px;color:#f84;font-weight:700;margin-bottom:3px">⚠ 弱点与攻略</div>'+
            '<div style="font-size:10px;color:#ccc">推荐：'+ev.wk+'</div>'+
            '<div style="font-size:9px;color:#666;margin-top:2px">'+ev.wkTip+'</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div style="text-align:center;margin-top:10px;flex-shrink:0">'+
        '<button class="btn" id="act-back-dyn">← 返回</button>'+
      '</div>';
    document.getElementById('act-back-dyn').onclick=()=>showOverlay('o-menu');
    panel.querySelectorAll('.ac-i').forEach(it=>{
      it.onclick=()=>{_actSel=parseInt(it.dataset.i);_buildAct();SFX.play('click');};
    });
  }
  _buildAct();
}

// Wrap showOverlay to track chat open state
(function(){
  const orig=window.showOverlay;
  window.showOverlay=function(id){
    if(id==='o-chat'){
      try{ if(!localStorage.getItem('pw_nick_set')){ openProfile(true); return; } }catch(e){}
    }
    _chatOpen=(id==='o-chat');
    if(_chatOpen){
      const _nick=getChatNick();
      document.getElementById('chat-nick-show').textContent=_nick;
      const _oPidEl=document.getElementById('chat-pid-show');
      if(_oPidEl)_oPidEl.textContent='#'+getPlayerId();
      document.getElementById('btn-chat-clear').style.display=_nick==='作者'?'':'none';
      startChatPoll();
      publishProfile();
    }
    if(id==='o-friends'){renderFriendsList();checkFriendBadge();}
    if(id==='o-activity'){renderActivityPage();}
    orig(id);
  };
})();

// SFX toggle listener
document.getElementById('tog-sfx').addEventListener('click',()=>{
  settings.sfx=!settings.sfx;
  document.getElementById('tog-sfx').classList.toggle('on',settings.sfx);
});
// Theme toggle
(function(){
  function applyTheme(t){
    const light=t==='light';
    document.body.classList.toggle('theme-light',light);
    const btn=document.getElementById('theme-toggle');
    if(btn)btn.textContent=light?'🌙 黑色':'☀️ 白色';
  }
  try{const t=localStorage.getItem('pw_theme');if(t)applyTheme(t);}catch(e){}
  document.getElementById('theme-toggle').addEventListener('click',()=>{
    const next=document.body.classList.contains('theme-light')?'dark':'light';
    try{localStorage.setItem('pw_theme',next);}catch(e){}
    applyTheme(next);SFX.play('click');
  });
})();

// §24 Profile publishing
async function publishProfile(){
  const url=getChatUrl();if(!url)return;
  const nick=getChatNick();
  const best=loadBest()||{};
  try{
    await fetch(url+'/profiles/'+encodeURIComponent(nick)+'.json',{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nick,gender:getPlayerGender(),frame:getPlayerFrame(),
        bestWave:best.wave||0,bestKills:best.kills||0,bestScore:best.score||0,
        bestClass:best.className||'—',level:getPlayerLevel(),lastSeen:Date.now()})
    });
  }catch{}
}

// §25 User profile view
let _viewedNick='',_uprofileBack='o-chat';
function _encNick(n){return encodeURIComponent(n);}

async function viewUserProfile(nick,fromOverlay){
  if(!nick||nick===getChatNick())return;
  _viewedNick=nick;
  _uprofileBack=fromOverlay||'o-chat';
  const pa=document.getElementById('uprofile-avatar');
  const pn=document.getElementById('uprofile-nick');
  const ps=document.getElementById('uprofile-stats');
  const acts=document.getElementById('uprofile-actions');
  if(pa){pa.textContent='👤';pa.style.borderColor='#334';pa.style.boxShadow='none';}
  if(pn)pn.textContent=nick;
  if(ps)ps.innerHTML='<span style="color:#444">加载中...</span>';
  if(acts)acts.innerHTML='';
  showOverlay('o-user-profile');
  const url=getChatUrl();
  let profile=null;
  if(url){try{const r=await fetch(url+'/profiles/'+_encNick(nick)+'.json');if(r.ok)profile=await r.json();}catch{}}
  if(profile){
    const g=profile.gender||'male';const f=profile.frame||'';
    if(pa){
      pa.textContent=getGenderEmoji(g);
      const fs=getFrameStyle(f);
      pa.style.borderColor=fs.match(/border-color:([^;]+)/)?.[1]||'#334';
      pa.style.boxShadow=fs.match(/box-shadow:([^;]+)/)?.[1]||'none';
    }
    if(ps){
      ps.innerHTML=
        '⚡ 等级: <b style="color:#fd4">Lv.'+(profile.level||1)+'</b><br>'+
        '🏆 最高波数: <b style="color:#4fd">'+(profile.bestWave||0)+'</b> / 30<br>'+
        '💀 击杀数: <b style="color:#fd4">'+(profile.bestKills||0)+'</b><br>'+
        '⭐ 最高得分: <b style="color:#4f4">'+(profile.bestScore||0)+'</b><br>'+
        '⚔ 职业: <b style="color:#f8a">'+(profile.bestClass||'—')+'</b>';
    }
  } else {
    if(pa)pa.textContent='👤';
    if(ps)ps.innerHTML='<span style="color:#444">暂无战绩，或该玩家从未进入聊天室</span>';
  }
  await _updateUProfileActions(nick);
}

async function _updateUProfileActions(nick){
  const acts=document.getElementById('uprofile-actions');if(!acts)return;
  const status=await getFriendStatus(nick);
  if(status==='accepted'){
    acts.innerHTML=
      '<button class="btn" onclick="openDM(_viewedNick)" style="flex:1;padding:8px;font-size:12px;border-color:#4ef;color:#4ef">💬 私聊</button>'+
      '<div style="flex:1;font-size:11px;color:#4fd;text-align:center;display:flex;align-items:center;justify-content:center">✅ 已是好友</div>';
  } else if(status==='pending_sent'){
    acts.innerHTML='<div style="width:100%;font-size:11px;color:#888;text-align:center;padding:8px">⏳ 好友请求已发送</div>';
  } else if(status==='pending_recv'){
    acts.innerHTML=
      '<button class="btn primary" onclick="_acceptFriend(_viewedNick)" style="flex:1;padding:8px;font-size:12px">✅ 接受好友</button>'+
      '<button class="btn" onclick="_declineFriend(_viewedNick)" style="flex:1;padding:8px;font-size:12px;border-color:#f44;color:#f44">❌ 拒绝</button>';
  } else {
    acts.innerHTML=
      '<button class="btn primary" onclick="sendFriendReq(_viewedNick)" style="width:100%;padding:8px;font-size:12px">➕ 加好友</button>';
  }
}

async function getFriendStatus(otherNick){
  const url=getChatUrl();if(!url)return'none';
  try{
    const r=await fetch(url+'/friends/'+_encNick(getChatNick())+'/'+_encNick(otherNick)+'.json');
    if(!r.ok)return'none';const d=await r.json();if(!d)return'none';
    return d.status||'none';
  }catch{return'none';}
}

async function sendFriendReq(otherNick){
  const url=getChatUrl();if(!url)return;
  const me=getChatNick();
  try{
    await Promise.all([
      fetch(url+'/friends/'+_encNick(me)+'/'+_encNick(otherNick)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:otherNick,status:'pending_sent',ts:Date.now()})}),
      fetch(url+'/friends/'+_encNick(otherNick)+'/'+_encNick(me)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:me,status:'pending_recv',ts:Date.now()})})
    ]);
    SFX.play('click');
    await _updateUProfileActions(otherNick);
  }catch{alert('发送失败，请检查网络');}
}

async function _acceptFriend(otherNick){
  const url=getChatUrl();if(!url)return;const me=getChatNick();
  try{
    await Promise.all([
      fetch(url+'/friends/'+_encNick(me)+'/'+_encNick(otherNick)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:otherNick,status:'accepted',ts:Date.now()})}),
      fetch(url+'/friends/'+_encNick(otherNick)+'/'+_encNick(me)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:me,status:'accepted',ts:Date.now()})})
    ]);
    SFX.play('levelup');
    if(_viewedNick===otherNick)await _updateUProfileActions(otherNick);
    checkFriendBadge();
    const fc=document.getElementById('friends-content');if(fc)renderFriendsContent();
  }catch{alert('操作失败');}
}

async function _declineFriend(otherNick){
  const url=getChatUrl();if(!url)return;const me=getChatNick();
  try{
    await Promise.all([
      fetch(url+'/friends/'+_encNick(me)+'/'+_encNick(otherNick)+'.json',{method:'DELETE'}),
      fetch(url+'/friends/'+_encNick(otherNick)+'/'+_encNick(me)+'.json',{method:'DELETE'})
    ]);
    SFX.play('click');
    if(_viewedNick===otherNick)await _updateUProfileActions(otherNick);
    checkFriendBadge();
    const fc=document.getElementById('friends-content');if(fc)renderFriendsContent();
  }catch{}
}

// §26 Friend list
let _friendTab='list';
function switchFriendTab(tab){
  _friendTab=tab;
  document.getElementById('ftab-list').classList.toggle('active',tab==='list');
  document.getElementById('ftab-req').classList.toggle('active',tab==='req');
  renderFriendsContent();
}
function renderFriendsContent(){renderFriendsList();}

async function renderFriendsList(){
  const el=document.getElementById('friends-content');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:30px;color:#444;font-size:11px">加载中...</div>';
  const url=getChatUrl();
  if(!url){el.innerHTML='<div style="text-align:center;padding:30px;color:#444;font-size:11px">未配置数据库</div>';return;}
  let friends={};
  try{const r=await fetch(url+'/friends/'+_encNick(getChatNick())+'.json');if(r.ok)friends=await r.json()||{};}catch{}
  const list=Object.values(friends).filter(f=>f&&f.status==='accepted');
  const reqs=Object.values(friends).filter(f=>f&&f.status==='pending_recv');
  const fbadge=document.getElementById('friend-badge');
  if(fbadge)fbadge.style.display=reqs.length?'':'none';
  const freqBadge=document.getElementById('freq-badge');
  if(freqBadge)freqBadge.textContent=reqs.length?'('+reqs.length+')':'';
  if(_friendTab==='list'){
    if(!list.length){el.innerHTML='<div style="text-align:center;padding:50px 20px;color:#444;font-size:12px">还没有好友<br><span style="font-size:10px;color:#333">去聊天室点击别人的头像来加好友！</span></div>';return;}
    el.innerHTML=list.map(f=>{
      const nAttr=f.nick.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      return '<div class="friend-item" data-nick="'+nAttr+'" onclick="openDM(this.dataset.nick)">'+
        '<div class="friend-avatar-sm" style="font-size:16px;font-weight:700;color:#4ef">'+f.nick.charAt(0)+'</div>'+
        '<div style="flex:1"><div style="font-size:12px;color:#eee">'+f.nick.replace(/</g,'&lt;')+'</div><div style="font-size:10px;color:#555">点击私聊</div></div>'+
        '<span style="font-size:18px;color:#4ef">💬</span>'+
      '</div>';
    }).join('');
  } else {
    if(!reqs.length){el.innerHTML='<div style="text-align:center;padding:50px 20px;color:#444;font-size:12px">暂无待处理的好友请求</div>';return;}
    el.innerHTML=reqs.map(f=>{
      const nAttr=f.nick.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      return '<div class="friend-item" data-nick="'+nAttr+'">'+
        '<div class="friend-avatar-sm" style="font-size:14px;font-weight:700;color:#4fd">'+f.nick.charAt(0)+'</div>'+
        '<div style="flex:1"><div style="font-size:12px;color:#eee">'+f.nick.replace(/</g,'&lt;')+'</div><div style="font-size:10px;color:#888">想加你为好友</div></div>'+
        '<button class="btn primary" onclick="_acceptFriend(this.closest(\'[data-nick]\').dataset.nick)" style="padding:5px 10px;font-size:11px;margin-right:6px">接受</button>'+
        '<button class="btn" onclick="_declineFriend(this.closest(\'[data-nick]\').dataset.nick)" style="padding:5px 8px;font-size:11px;border-color:#f44;color:#f44">拒绝</button>'+
      '</div>';
    }).join('');
  }
}

async function checkFriendBadge(){
  const url=getChatUrl();if(!url)return;
  try{
    const r=await fetch(url+'/friends/'+_encNick(getChatNick())+'.json');
    if(!r.ok)return;const data=await r.json()||{};
    const reqs=Object.values(data).filter(f=>f&&f.status==='pending_recv').length;
    const fbadge=document.getElementById('friend-badge');
    if(fbadge)fbadge.style.display=reqs?'':'none';
    const freqBadge=document.getElementById('freq-badge');
    if(freqBadge)freqBadge.textContent=reqs?'('+reqs+')':'';
  }catch{}
}
setInterval(checkFriendBadge,30000);
setTimeout(checkFriendBadge,5000);

// §27 Private chat (DM)
let _dmFriend='',_dmPollTimer=null,_dmOpen=false,_dmBack='o-friends';
function _dmRoomKey(a,b){
  const sorted=[a,b].sort();
  try{return btoa(unescape(encodeURIComponent(sorted.join('')))).replace(/[+/=]/g,c=>c==='+'?'-':c==='/'?'_':'');}
  catch{return btoa(sorted.join('|')).replace(/[+/=]/g,c=>c==='+'?'-':c==='/'?'_':'');}
}

function openDM(friendNick,fromOverlay){
  _dmFriend=friendNick;
  _dmBack=fromOverlay||'o-friends';
  const el=document.getElementById('dm-friend-name');if(el)el.textContent=friendNick;
  _dmOpen=true;
  if(_dmPollTimer){clearTimeout(_dmPollTimer);_dmPollTimer=null;}
  const msgs=document.getElementById('dm-messages');
  if(msgs)msgs.innerHTML='<div style="text-align:center;color:#444;padding:40px;font-size:11px">🔒 私聊内容只有你们俩可以看到</div>';
  _fetchDmMsgs();
  showOverlay('o-dm');
}

async function _fetchDmMsgs(){
  if(!_dmOpen||!_dmFriend)return;
  const url=getChatUrl();if(!url)return;
  const key=_dmRoomKey(getChatNick(),_dmFriend);
  try{
    const r=await fetch(url+'/dm/'+key+'.json');
    if(r.ok){
      const data=await r.json();
      const msgs=data?Object.values(data).filter(m=>m&&m.t).sort((a,b)=>a.t-b.t):[];
      renderDmMsgs(msgs);
    }
  }catch{}
  if(_dmOpen)_dmPollTimer=setTimeout(_fetchDmMsgs,4000);
}

function renderDmMsgs(msgs){
  const el=document.getElementById('dm-messages');if(!el)return;
  const myNick=getChatNick();
  const wasAtBottom=(el.scrollHeight-el.scrollTop-el.clientHeight)<80;
  if(!msgs.length){
    el.innerHTML='<div style="text-align:center;color:#444;padding:40px;font-size:11px">🔒 私聊内容只有你们俩可以看到<br>发一条消息开始对话吧！</div>';
  } else {
    const myEmoji=getGenderEmoji();
    const myFS=getFrameStyle(getPlayerFrame());
    const bc=myFS.match(/border-color:([^;]+)/)?.[1]||'#334';
    const bsh=myFS.match(/box-shadow:([^;]+)/)?.[1]||'none';
    el.innerHTML=msgs.map(m=>{
      const d=new Date(m.t||0);
      const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
      const own=m.n===myNick;
      if(own){
        return '<div class="chat-msg own-msg">'+
          '<span class="chat-time-own">'+ts+'</span>'+
          '<div class="chat-bubble" style="background:rgba(78,200,255,0.1)">'+
          '<span class="chat-nick">'+myNick.replace(/</g,'&lt;')+'</span>'+
          (m.x||'').replace(/</g,'&lt;')+
          '</div>'+
          '<div class="chat-avatar" style="border-color:'+bc+';box-shadow:'+bsh+'">'+myEmoji+'</div>'+
        '</div>';
      } else {
        return '<div class="chat-msg">'+
          '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4ef">'+_dmFriend.charAt(0)+'</div>'+
          '<div class="chat-bubble">'+
          '<span class="chat-nick">'+_dmFriend.replace(/</g,'&lt;')+'</span>'+
          (m.x||'').replace(/</g,'&lt;')+
          '<span class="chat-time"> '+ts+'</span>'+
          '</div>'+
        '</div>';
      }
    }).join('');
  }
  if(wasAtBottom)el.scrollTop=el.scrollHeight;
}

async function sendDmMsg(){
  const url=getChatUrl();if(!url||!_dmFriend)return;
  const inp=document.getElementById('dm-input');
  const text=(inp?.value||'').trim();
  if(!text)return;
  if(_hasBadWord(text)){inp.style.borderColor='#f44';setTimeout(()=>{inp.style.borderColor='#4ef';},1500);return;}
  const key=_dmRoomKey(getChatNick(),_dmFriend);
  try{
    await fetch(url+'/dm/'+key+'.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({n:getChatNick(),x:text.slice(0,200),t:Date.now()})});
    inp.value='';SFX.play('send');
    await _fetchDmMsgs();
  }catch{}
}

// §28 Codex (图鉴)
const _CODEX_ENEMY_META = {
  slime:      { icon:'🟢', img:'photo/Slime.png',    name:'史莱姆',    waveFirst:1,  waveDesc:'第1波起出现，全程都有',             special:'无特殊行为，直线冲向玩家，数量最多',                        desc:'成群结队的绿色软体怪，血薄速慢，适合练手阶段',
    weakness:{tags:['穿透','散射'], tip:'成群聚集，穿透类武器可一次贯穿多只；推荐：散弹枪（多发散射）、狙击枪（开启穿透后）'} },
  goblin:     { icon:'👺', img:'photo/goblin.png',   name:'哥布林',    waveFirst:2,  waveDesc:'第2波起出现',                       special:'移速较快，常与史莱姆混编出现',                               desc:'狡猾的小妖精，速度较快，常与史莱姆混编出现',
    weakness:{tags:['范围'], tip:'移速快但分布密集，大范围AoE武器覆盖效果佳；推荐：箭雨、剑阵、飞剑'} },
  skeleton:   { icon:'💀', img:'photo/Skeleton.png', name:'骷髅兵',    waveFirst:4,  waveDesc:'第4波起出现',                       special:'无特殊行为，均衡型普通怪',                                    desc:'不死亡灵，血量中等，攻击力适中，是中期的标准威胁',
    weakness:{tags:['法术'], tip:'无特殊抗性，法术系武器效率最高；推荐：箭雨、模仿者（闪电/火球形态）'} },
  bat:        { icon:'🦇', img:'photo/bat.png', name:'吸血蝙蝠',  waveFirst:5,  waveDesc:'第5波起出现',                       special:'移动速度极高，难以用慢速武器击中，成群时威胁极大',              desc:'移速极快，难以追踪，成群来袭时威胁极大',
    weakness:{tags:['追踪'], tip:'移速极快难以用直线武器命中，追踪类武器可精准锁定；推荐：导弹无人机'} },
  orc:        { icon:'👹', img:'photo/orc.png', name:'兽人勇士',  waveFirst:6,  waveDesc:'第6波起出现',                       special:'高HP高伤害，需优先消灭，避免贴身',                              desc:'强壮的战士，高血量高伤害，但行动迟缓',
    weakness:{tags:['持续','穿透'], tip:'血量高需要持续输出，移速慢易被狙击单点；推荐：狙击枪、加特林持续压制'} },
  wolf:       { icon:'🐺', name:'野狼',      waveFirst:8,  waveDesc:'第8波起出现，中后期大量出现',       special:'极速冲锋，成群围攻，大范围AoE武器克制效果好',                  desc:'速度极快的猛兽，以群体围攻方式猎杀目标',
    weakness:{tags:['范围','爆炸'], tip:'群体冲锋覆盖范围大，爆炸/AoE武器可一次清群；推荐：导弹无人机、箭雨、飞剑'} },
  troll:      { icon:'🗿', name:'石魔',      waveFirst:12, waveDesc:'第12波起出现',                      special:'血量极高但移速最慢，适合用射程武器持续消耗',                    desc:'岩石巨型生物，血量庞大但移动极为迟缓',
    weakness:{tags:['任意'], tip:'移速极慢，任何武器都有充足时间持续输出；保持距离慢慢磨，推荐：狙击枪远程点射'} },
  demon:      { icon:'😈', name:'恶魔',      waveFirst:13, waveDesc:'第13波起出现，后期成为主力',        special:'均衡属性，后期数量极多，需要强力AoE才能有效应对',               desc:'来自地狱的存在，各属性均衡，综合威胁极高',
    weakness:{tags:['范围'], tip:'后期数量极多，需要强力AoE才能有效清场；推荐：飞剑、剑阵、箭雨大范围覆盖'} },
  archer:     { icon:'🏹', name:'弓箭手',    waveFirst:6,  waveDesc:'第6波起混入编队（2～7只）',         special:'保持约180px距离持续射箭，玄武护盾可抵挡其弓箭，近战武器难以追上', desc:'远程攻击型怪物，保持安全距离向玩家射箭',
    weakness:{tags:['近身'], tip:'近距离时无法维持射箭，快速靠近可打断其攻击节奏；推荐：提高移速快速接近，玄武护盾可格挡弓箭'} },
  boss_10:    { icon:'🐉', name:'暗影龙王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'生命值极高，移速较慢，优先叠DPS，剑阵/散弹对其效果佳',          desc:'第10波Boss之一，速度较慢但生命极高',
    weakness:{tags:['持续','高DPS'], tip:'速度较慢是最大弱点，保持距离持续输出即可；推荐：狙击枪+剑阵持续叠伤'} },
  boss_10_cat:{ icon:'🐱', name:'暴食猫王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'速度快、伤害高，需保持移动并配合治疗无人机续命',                desc:'第10波Boss之一，攻击频率高，行动敏捷',
    weakness:{tags:['范围','追踪'], tip:'速度快需要广覆盖武器；推荐：导弹无人机锁定+大范围AoE持续压制'} },
  boss_10_dog:{ icon:'🐶', name:'狂野犬王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'三个10波Boss中最危险，高速+高伤，建议配合闪避天赋',             desc:'第10波Boss之一，移速最快，伤害最高，极难躲避',
    weakness:{tags:['追踪'], tip:'移速最快的Boss，追踪类武器是核心克制手段；推荐：导弹无人机，配合闪避天赋求生'} },
  boss_20:    { icon:'🌋', name:'熔岩霸主',  waveFirst:20, waveDesc:'第20波固定出现',                    special:'HP 14000、伤害75，需满级武器+多重天赋方可正面硬撼',             desc:'第20波大Boss，体型巨大，需要全套强化才能应对',
    weakness:{tags:['全输出'], tip:'HP 14000需要满级武器全力输出；推荐：全套武器升满+多重天赋叠加，狂战士/狙神职业效果佳'} },
  boss_30:    { icon:'🌌', name:'虚空领主',  waveFirst:30, waveDesc:'第30波最终Boss',                    special:'HP 38000、伤害130，击败后通关游戏，推荐飞剑+天才搭配',          desc:'最终Boss，最强大的存在，击败它意味着征服全部30波',
    weakness:{tags:['全输出'], tip:'HP 38000终局Boss；推荐：飞剑+天才职业搭配，开局备好主动技能，全力爆发'} },
  // ── 宝石怪 (Gem Monsters) ──
  gem_life:   {icon:'❤', name:'生命宝石怪', waveFirst:8,  waveDesc:'第8波起偶尔出现（普通怪组内随机混入）',
    special:'血量极高，击败后有概率掉落生命宝石，可在强化工坊镶嵌使用',
    desc:'充满生命力的红色宝石形态怪物，血量远高于同波普通怪，是最早出现的宝石怪',
    weakness:{tags:['持续','高DPS'],tip:'血量极高，需持续高输出；推荐：飞剑+加特林，或满级狙击枪单点'},
    _stats:{hp:600,spd:50,dmg:10,xp:25}},
  gem_luck:   {icon:'🟢', name:'幸运宝石怪', waveFirst:10, waveDesc:'第10波起偶尔出现',
    special:'击败时有50%概率额外掉落金币，且必定掉落幸运宝石碎片',
    desc:'闪烁着绿色幸运光芒的宝石怪，属性中等，是最容易击败的宝石怪',
    weakness:{tags:['任意'],tip:'无特殊行为，均衡属性，任何满足DPS要求的武器均有效'},
    _stats:{hp:400,spd:55,dmg:8,xp:20}},
  gem_thunder:{icon:'🟡', name:'迅雷宝石怪', waveFirst:12, waveDesc:'第12波起偶尔出现',
    special:'移动速度是同波最快的怪物，难以用直线武器命中',
    desc:'充满雷电能量的黄色宝石怪，极速移动，击败后掉落速度宝石',
    weakness:{tags:['追踪','范围'],tip:'移速极快，推荐导弹无人机追踪锁定，或飞剑全屏自动覆盖'},
    _stats:{hp:350,spd:120,dmg:9,xp:22}},
  gem_fire:   {icon:'🔴', name:'火焰宝石怪', waveFirst:15, waveDesc:'第15波起偶尔出现',
    special:'受击时散射短距离火焰微粒，对近距离玩家造成额外伤害',
    desc:'燃烧着火焰的红色宝石怪，血量较高，击败后掉落攻击宝石',
    weakness:{tags:['穿透','高DPS'],tip:'血量较高，穿透弹可一次连贯伤害；推荐：狙击枪穿透弹头或飞剑'},
    _stats:{hp:700,spd:60,dmg:15,xp:30}},
  gem_frost:  {icon:'🔵', name:'冰霜宝石怪', waveFirst:18, waveDesc:'第18波起偶尔出现',
    special:'移速极慢，但受击时对周围玩家附加冰霜减速效果（0.5秒）',
    desc:'凝结冰霜的蓝色宝石怪，行动迟缓，但靠近击杀有减速风险',
    weakness:{tags:['远程','火焰'],tip:'移速极慢，保持距离用远程武器；火焰系武器有额外克制效果'},
    _stats:{hp:650,spd:30,dmg:18,xp:28}},
  gem_arcane: {icon:'🟣', name:'秘法宝石怪', waveFirst:20, waveDesc:'第20波起偶尔出现',
    special:'在玩家80px范围内持续释放减速气场，使玩家移动速度降低25%',
    desc:'散发紫色魔力的宝石怪，靠近会有减速惩罚，击败后掉落急速宝石',
    weakness:{tags:['远程'],tip:'靠近有减速陷阱，强烈推荐保持距离；狙击枪远程点射最佳'},
    _stats:{hp:550,spd:45,dmg:20,xp:32}},
  gem_crit:   {icon:'⭐', name:'暴击宝石怪', waveFirst:25, waveDesc:'第25波起偶尔出现（后期精英）',
    special:'攻击玩家时有25%概率暴击，造成2倍伤害，是伤害最高的宝石怪',
    desc:'闪耀金色光芒的宝石怪，出现波次极高，击败后掉落暴击宝石',
    weakness:{tags:['穿透','高DPS'],tip:'高伤且稀少，优先击杀，推荐狙击枪或满级飞剑快速解决'},
    _stats:{hp:800,spd:65,dmg:28,xp:40}},
  // ── 宝石怪图鉴组 (虚拟条目，代表全部7种) ──
  gem_monsters: { icon:'💎', name:'宝石怪 ×7', waveFirst:8, waveDesc:'第8波起随机混入普通怪组', _isGemGroup:true },
};

const _CODEX_CLASS_META = {
  doctor:    { icon:'💊', img:'photo/doctor.png',      regen:5,  xpBonus:0,
    passive:'每次从任何来源回复100HP时，永久+5%全局伤害（可无限叠加）',
    skillName:'妙手回春', skillEffect:'立刻回复100HP', skillCd:30 },
  berserker: { icon:'⚔',  img:'photo/Berserker.png',  regen:2,  xpBonus:0,
    passive:'每次升级，最大HP永久+5',
    skillName:'狂暴', skillEffect:'20秒内所有伤害×2', skillCd:50 },
  blacksmith:{ icon:'⚒',  img:'photo/blacksmith.png', regen:1,  xpBonus:0,
    passive:'所有物理系武器（散弹/加特林/狙击）伤害永久+50%',
    skillName:'临阵磨枪', skillEffect:'10秒内所有武器冷却-40%', skillCd:50 },
  mage:      { icon:'🔮', img:'photo/mage.png',        regen:1,  xpBonus:0,
    passive:'所有魔法系武器（箭雨/剑阵）伤害永久+50%',
    skillName:'法力无天', skillEffect:'10秒内所有AoE范围+30%', skillCd:45 },
  scholar:   { icon:'🎓', img:'photo/Doctorate.png',  regen:1,  xpBonus:50,
    passive:'无法通过升级卡获得移速加成，但经验获取速度比任何职业都快',
    skillName:'经验老道', skillEffect:'瞬间吸取全场所有飘落的经验球', skillCd:50 },
  reaper:    { icon:'🎯', img:'photo/simo.png', regen:1,  xpBonus:0,
    passive:'枪械武器伤害+50%，且所有武器冷却时间永久×0.75（即-25%）',
    skillName:'狙神', skillEffect:'瞄准7.49秒后，秒杀当前HP最高的目标', skillCd:542 },
  kirby:     { icon:'🌀', regen:1,  xpBonus:0,
    passive:'拥有四种形态：🔥火焰（火球）/ ⚔剑士（轨道剑）/ ⚡雷电（闪电）/ ❄冰冻（冰球）',
    skillName:'模仿', skillEffect:'吞下最近的怪物，随机切换一种形态', skillCd:120 },
  santa:     { icon:'🎅', img:'photo/santa.png', regen:1,  xpBonus:0,
    passive:'初始幸运+5；场上有0.5%概率随机生成超大礼盒（含大量道具）',
    skillName:'圣诞礼物', skillEffect:'在附近随机生成多个礼盒掉落道具', skillCd:60 },
  chosen:    { icon:'⭐', regen:1,  xpBonus:0,
    passive:'每1点幸运值 = 全局伤害+1%（初始幸运+20即开局+20%伤害，无上限）',
    skillName:'☄ 流星', skillEffect:'幸运越高流星越大，秒杀场上所有非Boss敌人', skillCd:50 },
};

const _CODEX_WEAPON_META = {
  shotgun: {
    baseDmg:'10（Lv1）→ 38（Lv7+）',
    baseCD:'1.4s（Lv1）→ 1.1s（Lv7）',
    range:'近距扇形 · 约80px',
    desc:'枪械·物理武器。扇形同时射出多颗子弹，对近距离群怪覆盖极广，新手友好，零操作压力。弹数随等级增加，Lv8解锁双枪模式，单次输出翻倍。适合贴脸高速清场。\n\n【等级效果】\nLv1 ×5弹 · 伤害10 · CD1.4s\nLv2 ×5弹 · 伤害13 · CD1.35s\nLv3 ×5弹 · 伤害16 · CD1.3s\nLv4 ×6弹 · 伤害20 · CD1.25s（弹数+1 · 解锁随机强化：弹跳/穿透/分裂/元素）\nLv5 ×6弹 · 伤害25 · CD1.2s\nLv6 ×7弹 · 伤害31 · CD1.15s（弹数再+1）\nLv7 ×7弹 · 伤害38 · CD1.1s（满级）\nLv8 双枪模式 · 同时射出两组弹幕 · 等效输出×2',
    recommend:'铁匠（物理+50%·基础最高收益）· 急速出手（CD降低·频率提升明显）· 扩展攻击（扇形覆盖更广）· 时间裂隙（CD-20%·强力选择）· 穿透天赋（子弹穿墙·纵深杀伤）',
  },
  gatling: {
    baseDmg:'16/发（Lv1）→ 56/发（Lv7+）· 8连发',
    baseCD:'0.9s（Lv1）→ 0.78s（Lv7）',
    range:'中远直线 · 约160px',
    desc:'枪械·物理武器。每轮高速射出8颗子弹，连发结束后短暂冷却，持续中远距离压制。单轮总伤害极高，后期配合伤害加成DPS登顶。Lv8解锁双枪齐射，两把加特林同时扫射，火力压制无可比拟。\n\n【等级效果】\nLv1 8连发 · 单发伤害16 · CD0.9s\nLv2 8连发 · 单发伤害20 · CD0.88s\nLv3 8连发 · 单发伤害25 · CD0.86s\nLv4 8连发 · 单发伤害31 · CD0.84s（解锁强化选项）\nLv5 8连发 · 单发伤害38 · CD0.82s\nLv6 8连发 · 单发伤害47 · CD0.8s\nLv7 8连发 · 单发伤害56 · CD0.78s（满级）\nLv8 双枪齐射 · 两把同时开火 · 等效输出×2',
    recommend:'铁匠（物理+50%·叠加8发总伤极高）· 急速出手（CD降低·每秒轮次增加）· 混沌之力（全局乘算·高基础收益更大）· 时间裂隙（CD-20%·冷却缩减最明显）· 穿透天赋（直线穿透·连续贯穿多敌）',
  },
  sword: {
    baseDmg:'10/把（Lv1）→ 42/把（Lv7）',
    baseCD:'持续旋转 · 不可打断',
    range:'环绕玩家 半径40-52px',
    desc:'法术·物理武器。在玩家周围生成轨道剑持续高速旋转，自动打击触碰到的所有敌人，零操作完全自动。不受冷却减速天赋影响（持续旋转武器），越多怪贴身越强，贴脸混战首选。\n\n【等级效果】\nLv1 2把轨道剑 · 伤害10/把 · 半径40px · 转速2.2\nLv2 2把轨道剑 · 伤害14/把 · 半径42px · 转速2.4\nLv3 3把轨道剑 · 伤害17/把 · 半径44px（+1把）\nLv4 3把轨道剑 · 伤害22/把 · 半径46px · 剑色变亮转速加快\nLv5 4把轨道剑 · 伤害27/把 · 半径48px（+1把）\nLv6 4把轨道剑 · 伤害34/把 · 半径50px · 剑色纯白·全面强化\nLv7 5把轨道剑 · 伤害42/把 · 半径52px（满级·5把全覆盖）',
    recommend:'法师（魔法+50%·所有把数同倍加成）· 扩展攻击（旋转半径扩大·近身覆盖更远）· 元素共鸣（旋转频率高·触发元素概率极高）· 多重射击（+1把剑·额外输出）· 吸血鬼（命中即回血·贴脸永续战斗）',
  },
  arrow_rain: {
    baseDmg:'20（Lv1）→ 66（Lv7）',
    baseCD:'2.4s（Lv1）→ 1.3s（Lv7）',
    range:'大范围落点 · 半径50-75px',
    desc:'法术·物理武器。从天而降的箭雨覆盖敌人周围区域，无需瞄准全自动，对密集群怪清理效率最高。冷却随等级显著缩短，箭数倍增，后期箭雨绵密近乎无间断。满级12箭+半径75px，正面全覆盖。\n\n【等级效果】\nLv1 ×7箭 · 伤害20 · 半径50px · CD2.4s\nLv2 ×5箭 · 伤害25 · 半径54px · CD2.2s（箭少但伤高）\nLv3 ×6箭 · 伤害30 · 半径58px · CD2.0s\nLv4 ×7箭 · 伤害36 · 半径62px · CD1.8s（恢复初始箭数）\nLv5 ×8箭 · 伤害44 · 半径66px · CD1.6s（箭数开始超越Lv1）\nLv6 ×10箭 · 伤害54 · 半径70px · CD1.45s\nLv7 ×12箭 · 伤害66 · 半径75px · CD1.3s（满级·12箭全覆盖）',
    recommend:'法师（魔法+50%·每箭独立计算）· 扩展攻击（落点半径扩大·覆盖更广）· 急速出手（CD缩短·覆盖频率极高）· 元素共鸣（多箭同时命中·元素触发率极高）· 混沌之力（全局乘算·每箭受益）',
  },
  heal_drone: {
    baseDmg:'回血 4 HP/s（Lv1）→ 16 HP/s（Lv8）',
    baseCD:'光圈生成CD: 10s（Lv1）→ 5s（Lv8）',
    range:'治疗光圈 半径38-50px · 持续5.5-6s',
    desc:'支援·魔法武器。不造成伤害，定期在玩家脚下生成治疗光圈，站立其中持续回血。是游戏最佳续战武器，搭配高DPS主武器可抵消大量持续受伤，高HP上限时容错极高。光圈随等级扩大且CD缩短，满级几乎无间断覆盖。\n\n【等级效果】\nLv1 回血4 HP/s · 光圈半径38px · CD10s · 持续5.5s\nLv2 回血5 HP/s · 半径38px · CD9s\nLv3 回血6 HP/s · 半径38px · CD8s\nLv4 回血7 HP/s · 半径42px · CD8s（范围扩大·第一次扩圈）\nLv5 回血9 HP/s · 半径42px · CD7s\nLv6 回血11 HP/s · 半径42px · CD6s\nLv7 回血13 HP/s · 半径46px · CD6s（第二次扩圈）\nLv8 回血16 HP/s · 半径50px · CD5s · 持续6s（满级·光圈最大最频繁）',
    recommend:'强化体魄（HP上限高·站桩容错极大）· 即时治愈（光圈触发时额外爆发回血）· 扩展攻击（光圈半径+10%·更容易保持在圈内）· 疾风步法（移速快·追光圈更轻松）',
  },
  missile_drone: {
    baseDmg:'50+/枚 · 爆炸AOE半径20px',
    baseCD:'5s/轮 · 每轮×6枚',
    range:'全屏自动锁定 · 爆炸AOE',
    desc:'枪械·物理武器。每轮自动发射6枚导弹锁定最近敌人，落点爆炸产生AOE范围伤害，穿透性强适合密集群怪。升级时从弹头类型和射击模式两个维度选择，打造专属流派。\n\n【等级效果】\nLv1 ×6导弹 · 单发伤害50+ · AOE半径20px · CD5s\nLv2 三选一弹头：震荡弹（命中1s眩晕）/ 燃烧弹（着火持续伤害）/ 双发弹（×12枚导弹）\nLv3 导弹伤害与AOE继续提升\nLv4 三选一模式：原地压制（对最近敌密集轰炸）/ 开路（朝移动方向发射）/ 狂轰（分散锁定6个目标）\nLv5-6 强化已选弹头与模式 · 冷却持续缩短\nLv7 弹药系统强化 · AOE半径大幅提升 · 单发伤害飞跃\nLv8 终极导弹 · 弹头+模式双重叠加 · 爆炸覆盖全场',
    recommend:'扩展攻击（AOE半径+10%·爆炸范围更广）· 混沌之力（乘算加成·每发导弹受益明显）· 急速出手（5s→更短·轮次频率提升）· 多重射击（导弹数+1～2枚·总伤大增）',
  },
  sniper: {
    baseDmg:'120（基础） · 可成长至数百甚至破千',
    baseCD:'3.5s（Lv1-3）→ 3.2s（Lv4-6）→ 3.0s（Lv7）→ 2.5s（Lv8）',
    range:'全屏穿透 · 优先最近/最远敌人',
    desc:'枪械·精准武器。超高单体伤害，每发穿透1次，最擅长点杀精英怪与Boss。升级时可选差异化流派，形成完全不同的后期战斗风格，是游戏中路线分叉最多的武器。\n\n【等级效果】\nLv1 伤害120 · 穿透1次 · CD3.5s\nLv2-3 基础成长 · 可选强化：弹跳（反弹命中更多）/ 穿透+（贯穿更多层）/ 元素弹\nLv4 三选一路线：连射（+1～2发子弹同时射出）/ 重型狙击（伤害×3·CD稍增）/ 成长型（每击败敌人永久+伤害）\nLv5-6 强化已选路线 · CD3.2s\nLv7 三选一终极：龙魄弹（喷射龙息·范围）/ 烟雾战术（减速范围）/ 合金弹头（无限穿透·贯穿全场）\nLv8 CD2.5s · 三选一收尾：致命特训（0.5%概率即死）/ 暴击强化（暴击率·倍率双提升）/ 双弹/分裂',
    recommend:'铁匠（枪械+50%·基础120伤提升极高）· 急速出手（CD缩减·穿透频率提升）· 混沌之力（乘算加成·对高倍率武器效果翻倍）· 幸运星（运气提暴击·配合成长型收益滚雪球）· 穿透天赋（叠加穿透·合金弹头流最强）',
  },
  flying_sword: {
    baseDmg:'50/把 · ×4把 · 暴击率40% · 暴击倍率×3',
    baseCD:'2.0s（Lv1-7）→ 1.0s（Lv8·万剑归宗）',
    range:'全屏自动锁定最近敌人',
    desc:'抽奖限定·物理武器。每2秒向最近敌发射4把飞剑，基础40%暴击率+3倍暴击伤害，期望DPS极高。可叠加元素效果，Lv8万剑归宗CD减半且飞出后自动返回，是游戏后期最强武器之一。\n\n【等级效果】\nLv1 ×4把飞剑 · 伤害50/把 · 暴击40%×3倍 · CD2.0s\nLv2-3 三选一成长：致命强化（暴击率+20%）/ 均衡成长（伤害+10%·暴击+10%）/ 锋利（伤害+30%）\nLv4 三选一元素：🔥火焰飞剑（+1把·命中引燃）/ ❄冰冻飞剑（+1把·命中冰冻2层）/ ☠淬毒飞剑（+1把·命中中毒2层）\nLv5-6 已选元素强化 · 剑数/伤害继续提升\nLv7 三选一收割：汲取（每10次击杀+1最大HP）/ 魔力灌注（命中0.45s后+100%额外伤害）/ 魔力吸取（命中回血1HP）\nLv8 万剑归宗：+2把飞剑 · CD1.0s · 穿透 · 攻速×2 · 扇形锁定 · 飞出自动返回',
    recommend:'混沌之力（暴击乘算·高暴击率下收益最大）· 天选者（幸运提暴击率·与40%基础叠加）· 急速出手（CD缩减·满级后体感明显）· 吸血鬼（全屏锁定·命中即回血无需靠近）',
  },
  kirby_copy: {
    baseDmg:'随形态：火焰8→45 / 轨道10→55 / 雷电6→33',
    baseCD:'形态专属（主动技能触发后自动切换）',
    range:'形态专属（近距喷射 / 环绕旋转 / 链式弹跳 / 落点爆炸）',
    desc:'模仿者职业专属·变形武器。拥有四种轮流切换的战斗形态，使用主动技能后自动切换至下一形态，灵活应对不同战况。每级提升所有形态基础伤害，Lv8四形态均达峰值。\n\n【四种形态说明】\n🔥 火焰喷射·近距弧形连续喷火·适合贴脸清场\n⚔  轨道剑士·生成轨道剑绕身旋转（类剑阵·持续）\n⚡ 雷电链锁·发射闪电在多个敌人间弹跳·范围输出\n❄  冰球落地·发射冰球落点爆炸·附加冰冻减速\n\n【等级效果（四形态同步提升）】\nLv1 火焰伤害8 / 轨道伤害10 / 雷电伤害6 · 轨道半径36px\nLv3 火焰14 / 轨道18 / 雷电10 · 半径38px\nLv5 火焰23 / 轨道29 / 雷电17 · 半径40px\nLv7 火焰36 / 轨道45 / 雷电27 · 半径42px\nLv8 火焰45 / 轨道55 / 雷电33 · 半径43px（满级）',
    recommend:'（仅模仿者职业可用）扩展攻击（所有形态范围+10%）· 元素共鸣（雷电/冰球触发元素加成）· 混沌之力（覆盖所有形态）· 急速出手（主动技能CD降低·切换形态更频繁）',
  },
  black_tortoise: {
    baseDmg:'水球×3 伤害18（Lv1）→ 80（Lv8）',
    baseCD:'水球每3s · 护盾每60s',
    range:'玄武自主移动·全图跟随玩家',
    desc:'召唤奖池·魔法武器。召唤玄武自主战斗，每3秒射出3颗水球，每60秒为玩家提供护盾。玄武有独立体型和HP，可吸引敌人攻击。升级可选输出型/坦克型/毒型等多条路线。\n\n【等级效果】\nLv1 水球×3 · 伤害18 · CD3s · 护盾CD60s\nLv2 水球伤害23 · 基础成长\nLv3 水球伤害29\nLv4 三选一路线：小玄武（召唤2只25%伤害·无护盾）/ 守护（护盾变3层·减伤10%）/ 毒蛇（水球附3层毒+毒液池）\nLv5 水球伤害44\nLv6 水球伤害54\nLv7 三选一进阶：神兽威压（80px内敌人持续减速）/ 神兽真身（体型+50%·每8s冲锋3倍伤害）/ 不灭功（致命→3s无敌+伤害×2+回血25%·CD150s）\nLv8 真·玄武：水球伤害80 · 每10s从天而降AOE+击退 · 护盾CD缩短',
    recommend:'强化体魄（玄武HP=玩家50%·越耐打越稳定）· 硬化皮肤（减伤·配合护盾近乎无敌）· 混沌之力（水球全局乘算）· 扩展攻击（水球范围+·配合毒液池覆盖更大）',
  },
  turret: {
    baseDmg:'35基础（子弹/激光/炸弹/火箭）',
    baseCD:'1.2s（可速射强化）',
    range:'固定位置 · 180px范围',
    desc:'物理·机械武器。在地图固定位置召唤炮台自动攻击敌人，每波刷新位置。炮台有独立血量（玩家50%HP），死亡后5秒自动在玩家附近重新补充。\n\n【等级效果】\nLv1 召唤1座炮台\nLv2 +1座 · 射速+30%\nLv3 +1座 · 子弹穿透\nLv4 三选一特殊炮台：治疗炮台（命中回血5%HP）/ 自爆机器人（靠近自爆·大范围）/ 机枪炮台（极快射速）\nLv5-6 随机强化：速射提升 / 多重建造+1座 / 弹药升级（子弹→激光→炸弹→火箭）\nLv7 三选一：更多炮台（+3台+3特殊）/ 防御炮台（敌人优先打炮台·免死护盾）/ 元素炮台（随机火焰/冰霜/毒素）\nLv8 地雷炮台（炮台死亡原地埋雷 · 大范围爆炸 · 再+5座上限）',
    recommend:'范围补给（炸弹/火箭爆炸范围更大）· 穿透天赋（子弹穿透命中更多目标）· 急速出手（射速提升）· 强化体魄（炮台HP=玩家50%·越高越耐打）',
  },
};

const _CODEX_SUPPLY_META = {
  maxhp:        { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  speed:        { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  dmg:          { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  area:         { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  cd:           { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  heal:         { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  pickup:       { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  luck:         { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  dodge:        { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  dmgred:       { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  blood_pact:   { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  time_rift:    { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  chaos_force:  { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  iron_fortress:{ howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  death_wish:   { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  ghost_walk:   { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  forge_master: { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  alchemy:      { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  elemental:    { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  berserker:    { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  vampire:      { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  multishot:    { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  chain_surge:  { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  lucky_star:   { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  second_wind:  { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
};

let _codexTab='monster', _codexSubtab='normal', _codexSel=0;

function openCodex(){
  _codexTab='monster'; _codexSubtab='normal'; _codexSel=0; _gemGroupIdx=0;
  _renderCodexTabs(); renderCodexContent(); showOverlay('o-codex');
}

function _setCodexSubtab(sub){
  _codexSubtab=sub; _codexSel=0;
  document.querySelectorAll('#codex-subtabs .codex-subtab').forEach(x=>x.classList.toggle('active',x.dataset.sub===sub));
  renderCodexContent();
}

function _renderCodexTabs(){
  document.querySelectorAll('#codex-tabs .codex-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===_codexTab));
  const sub=document.getElementById('codex-subtabs'); if(!sub) return;
  if(_codexTab==='monster'){
    sub.innerHTML=
      '<button class="codex-subtab'+(_codexSubtab==='normal'?' active':'')+'" data-sub="normal">普通怪</button>'+
      '<button class="codex-subtab'+(_codexSubtab==='elite'?' active':'')+'" data-sub="elite">精英怪</button>'+
      '<button class="codex-subtab'+(_codexSubtab==='boss'?' active':'')+'" data-sub="boss">Boss</button>';
  } else if(_codexTab==='supply'){
    sub.innerHTML=
      '<button class="codex-subtab'+(_codexSubtab==='normal'?' active':'')+'" data-sub="normal">普通补给</button>'+
      '<button class="codex-subtab'+(_codexSubtab==='talent'?' active':'')+'" data-sub="talent">专武天赋</button>';
  } else {
    sub.innerHTML='';
  }
  sub.querySelectorAll('.codex-subtab').forEach(b=>{
    b.addEventListener('click',()=>{ _setCodexSubtab(b.dataset.sub); SFX.play('click'); });
  });
}

// ── Detail panel helpers ──
function _cdxDetail(html){ return '<div class="cdx-detail-inner">'+html+'</div>'; }
function _cdxStat(label,val){ return '<div class="cdx-stat-row"><span class="cdx-stat-label">'+label+'</span><b class="cdx-stat-val">'+val+'</b></div>'; }
function _cdxSection(title){ return '<div class="cdx-section-title">'+title+'</div>'; }
function _cdxDesc(text){ return '<div class="cdx-desc-block">'+text+'</div>'; }
function _cdxWeakness(w){
  const _colors={'穿透':'#f84','散射':'#fd4','范围':'#a4f','法术':'#4ef','追踪':'#4f8','持续':'#f55','爆炸':'#f64','近身':'#bbb','任意':'#888','高DPS':'#f84','全输出':'#fda'};
  const tags=w.tags.map(t=>{const c=_colors[t]||'#888';return '<span class="cdx-wtag" style="color:'+c+';border-color:'+c+'40;background:'+c+'18">'+t+'</span>';}).join('');
  return '<div class="cdx-wtags">'+tags+'</div>'+_cdxDesc(w.tip);
}

// ── 宝石怪品质轮播状态 ──
let _gemGroupIdx = 0;
function _gemGroupNav(dir){
  _gemGroupIdx = (_gemGroupIdx + dir + 7) % 7;
  const dp = document.getElementById('cdx-detail');
  if(dp) dp.innerHTML = _renderGemGroupDetail();
}

function _renderGemGroupDetail(){
  const g=_GEM_QUALITY_TIERS[_gemGroupIdx];
  const unlocked=isEnemyEncountered('gem_q_'+_GEM_Q_KEYS[_gemGroupIdx]);
  const btnS='font-size:18px;background:none;border:none;color:#555;cursor:pointer;padding:2px 10px;font-family:monospace;line-height:1';
  const nameHtml=unlocked
    ?(g.rainbow
      ?'<span style="background:linear-gradient(90deg,#f44,#f84,#fd4,#4f8,#4af,#a4f,#f4f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700">'+g.name+'</span>'
      :'<span style="color:'+g.color+';font-weight:700">'+g.name+'</span>')
    :'<span style="color:#555;font-weight:700">???</span>';
  const dots=_GEM_QUALITY_TIERS.map((q,i)=>{
    const isCur=i===_gemGroupIdx;
    const dotUnlocked=isEnemyEncountered('gem_q_'+_GEM_Q_KEYS[i]);
    const bg=dotUnlocked?q.color:'#1e1e2e';
    const border=isCur?(dotUnlocked?q.color:'#666'):'#333';
    return '<div style="width:7px;height:7px;border-radius:50%;background:'+bg+';border:1px solid '+border+(isCur?';box-shadow:0 0 3px '+bg:'')+'" ></div>';
  }).join('');
  // ── 锁定状态 ──
  if(!unlocked){
    return _cdxDetail(
      '<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid #1a1a2e;margin-bottom:8px">'+
        '<button style="'+btnS+'" onclick="_gemGroupNav(-1)">◀</button>'+
        '<div style="text-align:center;font-size:12px">'+nameHtml+'</div>'+
        '<button style="'+btnS+'" onclick="_gemGroupNav(1)">▶</button>'+
      '</div>'+
      '<div class="cdx-big-icon" style="margin:4px 0 6px">'+
        '<div style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;font-size:36px;background:#0d0d1a;border-radius:8px;border:1px solid #1e1e2e">🔒</div>'+
      '</div>'+
      '<div class="cdx-item-name" style="color:#555">???</div>'+
      '<div style="color:#444;font-size:11px;text-align:center;padding:12px 0 4px">尚未遇到此品质的宝石怪</div>'+
      '<div style="color:#333;font-size:10px;text-align:center;padding-bottom:8px">在游戏中遭遇后自动解锁</div>'+
      '<div style="display:flex;justify-content:center;align-items:center;gap:5px;margin-top:12px">'+dots+'</div>'
    );
  }
  // ── 已解锁状态 ──
  return _cdxDetail(
    // ── 顶部导航列 ──
    '<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid #1a1a2e;margin-bottom:8px">'+
      '<button style="'+btnS+'" onclick="_gemGroupNav(-1)">◀</button>'+
      '<div style="text-align:center;font-size:12px">'+nameHtml+'</div>'+
      '<button style="'+btnS+'" onclick="_gemGroupNav(1)">▶</button>'+
    '</div>'+
    // ── 图片 ──
    '<div class="cdx-big-icon" style="margin:4px 0 6px">'+
      '<img src="'+g.img+'" style="width:72px;height:72px;image-rendering:pixelated;object-fit:contain" onerror="this.style.display=\'none\'">'+
    '</div>'+
    // ── 名称 & 波次 ──
    '<div class="cdx-item-name" style="'+(g.rainbow?'background:linear-gradient(90deg,#f44,#f84,#fd4,#4f8,#4af,#a4f,#f4f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text':'color:'+g.color)+'">'+g.name+'</div>'+
    '<div class="cdx-item-sub">'+g.wave+'</div>'+
    // ── 属性 ──
    _cdxStat('❤ 血量', g.hp)+
    _cdxStat('⚡ 速度', g.spd)+
    _cdxStat('⚔ 攻击', g.dmg)+
    // ── 掉落 ──
    _cdxSection('掉落宝石')+
    _cdxDesc('💎 必定掉落 '+g.drop)+
    // ── 弱点 ──
    _cdxSection('⚠ 弱点')+
    _cdxWeakness({tags:['任意'], tip:'任意武器均可击杀，血量较低易速决。优先击杀可获得对应品质宝石，可在强化工坊镶嵌武器。品质越高血量越高，出现越罕见。'})+
    // ── 品质进度点 ──
    '<div style="display:flex;justify-content:center;align-items:center;gap:5px;margin-top:12px">'+dots+'</div>'
  );
}

function _codexMonsterDetail(k){
  const e=ENEMY_TYPES[k]; const m=_CODEX_ENEMY_META[k];
  if(!m) return _cdxDetail('<div style="color:#555;padding:40px 0;text-align:center">暂无数据</div>');
  if(m._isGemGroup) return _renderGemGroupDetail();
  // Gem monsters use _stats fallback when not in ENEMY_TYPES
  const s=e||(m._stats||null);
  if(!s) return _cdxDetail('<div style="color:#555;padding:40px 0;text-align:center">暂无数据</div>');
  const isGem=!e&&!!m._stats;
  const nameColor=isGem?'#fe8':(e&&e.isBoss?'#f84':'#eee');
  const waveTag=(e&&e.isBoss)?'<span style="font-size:9px;color:#f44;font-weight:400;margin-left:6px">BOSS</span>'
    :(isGem?'<span style="font-size:9px;color:#fe8;font-weight:400;margin-left:6px">💎 宝石怪</span>':'');
  const _bigIcon=m.img?'<div class="cdx-big-icon"><img src="'+m.img+'" class="cdx-enemy-img-lg"></div>':'<div class="cdx-big-icon">'+m.icon+'</div>';
  return _cdxDetail(
    _bigIcon+
    '<div class="cdx-item-name" style="color:'+nameColor+'">'+m.name+waveTag+'</div>'+
    '<div class="cdx-item-sub">'+m.waveDesc+'</div>'+
    _cdxStat('❤ HP', s.hp)+
    _cdxStat('⚡ 速度', s.spd)+
    _cdxStat('⚔ 攻击', s.dmg)+
    _cdxStat('✨ 经验', s.xp+' xp')+
    _cdxSection('描述')+_cdxDesc(m.desc)+
    _cdxSection('特殊行为')+_cdxDesc(m.special)+
    (m.weakness?_cdxSection('⚠ 弱点')+_cdxWeakness(m.weakness):'')
  );
}

function _codexClassDetail(c){
  const m=_CODEX_CLASS_META[c.id]||{icon:'⚔',regen:1,xpBonus:0,passive:'—',skillName:'—',skillEffect:'—',skillCd:0};
  const _clsBigIcon=m.img?'<div class="cdx-big-icon"><img src="'+m.img+'" class="cdx-enemy-img-lg"></div>':'<div class="cdx-big-icon">'+m.icon+'</div>';
  return _cdxDetail(
    _clsBigIcon+
    '<div class="cdx-item-name" style="color:#fd4">'+c.name+'</div>'+
    _cdxStat('❤ HP', c.hp)+
    _cdxStat('⚡ 速度', c.spd)+
    _cdxStat('💖 回血', m.regen+' /s')+
    _cdxStat('✨ 经验加成', (m.xpBonus?'+'+m.xpBonus+'%':'无'))+
    _cdxSection('被动技能')+_cdxDesc(m.passive)+
    _cdxSection('主动技能')+
    '<div class="cdx-skill-box">'+
      '<div class="cdx-skill-name">'+m.skillName+'</div>'+
      '<div class="cdx-skill-effect">'+m.skillEffect+'</div>'+
      '<div class="cdx-skill-cd">⏱ 冷却 '+m.skillCd+' 秒</div>'+
    '</div>'
  );
}

function _codexWeaponDetail(k){
  const w=WEAPON_DEFS[k]; if(!w) return '';
  const m=_CODEX_WEAPON_META[k]||{baseDmg:'—',baseCD:'—',range:'—',desc:'',recommend:''};
  const maxLv=w.levels?w.levels.length:(w.maxLv||8);
  let badge='';
  if(k==='kirby_copy')   badge='<span class="cdx-badge cdx-badge-purple">模仿者专属</span>';
  else if(k==='flying_sword')   badge='<span class="cdx-badge cdx-badge-gold">抽奖限定</span>';
  else if(k==='black_tortoise') badge='<span class="cdx-badge cdx-badge-blue">召唤奖池</span>';
  else if(k==='turret')         badge='<span class="cdx-badge" style="background:#001f0a;border:1px solid #4fd;color:#4fd">物理</span>';
  return _cdxDetail(
    '<div class="cdx-big-icon">'+w.icon+'</div>'+
    '<div class="cdx-item-name" style="color:#4ef">'+w.name+'</div>'+
    (badge?'<div style="margin-bottom:10px">'+badge+'</div>':'')+
    _cdxStat('⚔ 基础伤害', m.baseDmg)+
    _cdxStat('⏱ 攻击速度', m.baseCD)+
    _cdxStat('📏 攻击范围', m.range)+
    _cdxStat('⬆ 最高等级', 'Lv.'+maxLv)+
    _cdxSection('效果说明')+_cdxDesc(m.desc)+
    _cdxSection('推荐搭配天赋')+_cdxDesc(m.recommend)
  );
}

function _codexSupplyDetail(s, isTalent){
  const m=_CODEX_SUPPLY_META[s.id]||{howToGet:'随机出现'};
  const nameColor=isTalent?'#f84':'#fd4';
  const badge=isTalent?'<span class="cdx-badge cdx-badge-red">专武天赋</span>':'<span class="cdx-badge cdx-badge-gold">属性补给</span>';
  return _cdxDetail(
    '<div class="cdx-big-icon">'+s.icon+'</div>'+
    '<div class="cdx-item-name" style="color:'+nameColor+'">'+s.name+'</div>'+
    '<div style="margin-bottom:10px">'+badge+'</div>'+
    _cdxSection('效果')+_cdxDesc(s.desc)+
    _cdxSection('获得方式')+_cdxDesc(m.howToGet)
  );
}

function _codexBuildLayout(items, iconFn, nameFn, detailFn){
  if(!items||!items.length) return '<div class="codex-body"><div class="codex-grid-panel"></div><div class="codex-detail-panel"></div></div>';
  const grid=items.map((it,i)=>
    '<div class="cdx-grid-item'+(i===_codexSel?' sel':'')+'" data-idx="'+i+'">' +
    '<div class="cgi-icon">'+iconFn(it)+'</div>' +
    '<div class="cgi-name">'+nameFn(it)+'</div>' +
    '</div>'
  ).join('');
  const detail=detailFn(items[_codexSel])||'';
  return '<div class="codex-body">' +
    '<div class="codex-grid-panel"><div class="cdx-grid">'+grid+'</div></div>' +
    '<div class="codex-detail-panel" id="cdx-detail">'+detail+'</div>' +
    '</div>';
}

function renderCodexContent(){
  const el=document.getElementById('codex-content'); if(!el) return;
  let items=[], iconFn, nameFn, detailFn;

  if(_codexTab==='monster'){
    if(_codexSubtab==='elite'){
      el.innerHTML='<div class="codex-body"><div class="codex-grid-panel" style="align-items:center;justify-content:center;display:flex;flex-direction:column;color:#444;padding:40px 16px;text-align:center"><div style="font-size:36px">🔒</div><div style="margin-top:8px;font-size:11px">精英怪即将上线</div></div><div class="codex-detail-panel"></div></div>';
      return;
    }
    const keys=_codexSubtab==='boss'
      ?['boss_10','boss_10_cat','boss_10_dog','boss_20','boss_30']
      :['slime','goblin','skeleton','bat','orc','wolf','troll','demon','archer','gem_monsters'];
    items=keys.map(k=>({k}));
    iconFn=it=>{
      // 宝石怪组：任意品质遭遇过即显示图标
      if(it.k==='gem_monsters'){
        const any=_GEM_Q_KEYS.some(q=>isEnemyEncountered('gem_q_'+q));
        if(!any) return '❓';
        return '💎';
      }
      if(!isEnemyEncountered(it.k)) return '❓';
      const m=_CODEX_ENEMY_META[it.k]||{icon:'?'};
      return m.img?'<img src="'+m.img+'" class="cdx-enemy-img-sm">':m.icon;
    };
    nameFn=it=>{
      if(it.k==='gem_monsters'){
        const any=_GEM_Q_KEYS.some(q=>isEnemyEncountered('gem_q_'+q));
        return any?(_CODEX_ENEMY_META[it.k]||{name:'?'}).name:'???';
      }
      if(!isEnemyEncountered(it.k)) return '???';
      return (_CODEX_ENEMY_META[it.k]||{name:'?'}).name;
    };
    detailFn=it=>{
      if(it.k==='gem_monsters'){
        const any=_GEM_Q_KEYS.some(q=>isEnemyEncountered('gem_q_'+q));
        if(!any) return _cdxDetail('<div style="color:#555;padding:40px 0;text-align:center;font-size:14px">❓<br><br>尚未遇到宝石怪<br><span style="font-size:10px;color:#444;margin-top:6px;display:block">击败宝石怪后此处自动解锁</span></div>');
        return _codexMonsterDetail(it.k);
      }
      if(!isEnemyEncountered(it.k)) return _cdxDetail('<div style="color:#555;padding:40px 0;text-align:center;font-size:14px">❓<br><br>尚未遇到此怪物<br><span style="font-size:10px;color:#444;margin-top:6px;display:block">遭遇后此处自动解锁</span></div>');
      return _codexMonsterDetail(it.k);
    };
  } else if(_codexTab==='char'){
    items=CLASSES;
    iconFn=c=>{ const m=_CODEX_CLASS_META[c.id]||{icon:'⚔'}; return m.img?'<img src="'+m.img+'" class="cdx-enemy-img-sm">':m.icon; };
    nameFn=c=>c.name;
    detailFn=c=>_codexClassDetail(c);
  } else if(_codexTab==='weapon'){
    const keys=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','kirby_copy','flying_sword','black_tortoise','turret'];
    items=keys.map(k=>({k}));
    iconFn=it=>(WEAPON_DEFS[it.k]||{icon:'?'}).icon;
    nameFn=it=>(WEAPON_DEFS[it.k]||{name:'?'}).name;
    detailFn=it=>_codexWeaponDetail(it.k);
  } else if(_codexTab==='supply'){
    items=(_codexSubtab==='talent')?SUPPLY_TALENTS:STAT_UPGRADES;
    iconFn=s=>s.icon;
    nameFn=s=>s.name;
    detailFn=s=>_codexSupplyDetail(s, _codexSubtab==='talent');
  }

  el.innerHTML=_codexBuildLayout(items, iconFn, nameFn, detailFn);

  // Attach click events
  el.querySelectorAll('.cdx-grid-item').forEach(btn=>{
    btn.addEventListener('click',()=>{
      _codexSel=parseInt(btn.dataset.idx);
      el.querySelectorAll('.cdx-grid-item').forEach(b=>b.classList.toggle('sel',b===btn));
      const dp=document.getElementById('cdx-detail');
      if(dp){ dp.innerHTML=detailFn(items[_codexSel]); }
      SFX.play('click');
    });
  });
}

document.querySelectorAll('#codex-tabs .codex-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    _codexTab=tab.dataset.tab; _codexSubtab='normal'; _codexSel=0;
    _renderCodexTabs(); renderCodexContent(); SFX.play('click');
  });
});

document.getElementById('btn-codex-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-gacha-back').addEventListener('click',()=>showOverlay('o-menu'));

document.getElementById('btn-forge').addEventListener('click',()=>{ renderForge(); showOverlay('o-forge'); });
document.getElementById('btn-forge-back').addEventListener('click',()=>showOverlay('o-menu'));

document.getElementById('btn-uprofile-back').addEventListener('click',()=>showOverlay(_uprofileBack));
document.getElementById('btn-friends-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-dm-back').addEventListener('click',()=>{
  _dmOpen=false;if(_dmPollTimer){clearTimeout(_dmPollTimer);_dmPollTimer=null;}
  showOverlay(_dmBack);
  if(_dmBack==='o-chat')switchChatSection('dms');
});
document.getElementById('btn-codex').addEventListener('click',()=>openCodex());
document.getElementById('btn-gacha').addEventListener('click',()=>{
  updateGachaPityUI();
  renderGachaPoolList();
  switchGachaTab('sword');
  showOverlay('o-gacha');
});



// ── Gacha system ──
function getGachaTickets(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_tickets')||'0',10)); }catch{ return 0; } }
function spendGachaTicket(){ try{ const t=getGachaTickets(); if(t<=0)return false; localStorage.setItem('pw_gacha_tickets',String(t-1)); return true; }catch{ return false; } }

// ── Weapon Fragment & Enhancement system ──
function getWeaponFrags(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_wfrags')||'0')||0); }catch{ return 0; } }
function addWeaponFrags(n){ try{ localStorage.setItem('pw_wfrags',String(getWeaponFrags()+n)); renderForgeFragCount(); }catch{} }
function spendWeaponFrags(n){ try{ const c=getWeaponFrags(); if(c<n) return false; localStorage.setItem('pw_wfrags',String(c-n)); renderForgeFragCount(); return true; }catch{ return false; } }
const _WENH_IDS=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','flying_sword'];
const _WENH_COSTS=[10,25,50,80,120];
const _WENH_MAX=5;
function getWeaponEnhLevel(id){ try{ return Math.max(0,Math.min(_WENH_MAX,parseInt(localStorage.getItem('pw_wenh_'+id)||'0')||0)); }catch{ return 0; } }
function setWeaponEnhLevel(id,lv){ try{ localStorage.setItem('pw_wenh_'+id,String(lv)); }catch{} }
function getTotalWeaponEnhBonus(){ return _WENH_IDS.reduce((s,id)=>s+getWeaponEnhLevel(id),0)*0.08; }
function renderForgeFragCount(){ const el=document.getElementById('forge-frags'); if(el) el.textContent=getWeaponFrags(); }

// ── §Gem system ──
const _GEM_TYPES={
  atk: {icon:'🔴',name:'攻击宝石',desc:'武器伤害 +10%', color:'#f66'},
  def: {icon:'🔵',name:'防御宝石',desc:'受到伤害 -8%',  color:'#4af'},
  spd: {icon:'🟡',name:'速度宝石',desc:'移动速度 +15',  color:'#fd4'},
  luck:{icon:'🟢',name:'幸运宝石',desc:'幸运值 +20',    color:'#4fd'},
  cd:  {icon:'🟣',name:'急速宝石',desc:'冷却时间 -8%',  color:'#a4f'},
  hp:  {icon:'❤', name:'生命宝石',desc:'最大HP +30',    color:'#f84'},
  crit:{icon:'⭐',name:'暴击宝石',desc:'暴击率 +8%',    color:'#fe8'},
};
function getDust(){try{return Math.max(0,parseInt(localStorage.getItem('pw_dust')||'0',10));}catch{return 0;}}
function addDust(n){try{localStorage.setItem('pw_dust',String(getDust()+n));}catch{}}
function spendDust(n){try{const c=getDust();if(c<n)return false;localStorage.setItem('pw_dust',String(c-n));return true;}catch{return false;}}
function getWepSpirit(id){try{return Math.max(0,parseInt(localStorage.getItem('pw_spirit_'+id)||'0',10));}catch{return 0;}}
function addWepSpirit(id,n){try{localStorage.setItem('pw_spirit_'+id,String(getWepSpirit(id)+n));}catch{}}
function spendWepSpirit(id,n){try{const c=getWepSpirit(id);if(c<n)return false;localStorage.setItem('pw_spirit_'+id,String(c-n));return true;}catch{return false;}}
function getWepGem(id){try{return localStorage.getItem('pw_wgem_'+id)||'';}catch{return '';}}
function setWepGem(id,gem){try{localStorage.setItem('pw_wgem_'+id,gem);}catch{}}
function getCharGem(cid,slot){try{return localStorage.getItem('pw_cgem_'+cid+'_'+slot)||'';}catch{return '';}}
function setCharGem(cid,slot,gem){try{localStorage.setItem('pw_cgem_'+cid+'_'+slot,gem);}catch{}}
function getWepUpgLv(id){try{return Math.max(0,parseInt(localStorage.getItem('pw_wup_'+id)||'0',10));}catch{return 0;}}
function setWepUpgLv(id,lv){try{localStorage.setItem('pw_wup_'+id,String(lv));}catch{}}

// ── 宝石类型背包（localStorage持久化，跨对局） ──
// 键: pw_gemtype_atk / def / spd / luck / cd / hp / crit
function getGemTypeCount(type){
  try{return Math.max(0,parseInt(localStorage.getItem('pw_gemtype_'+type)||'0',10));}catch{return 0;}
}
function addGemType(type,n){
  if(!_GEM_TYPES[type])return;
  try{localStorage.setItem('pw_gemtype_'+type,String(getGemTypeCount(type)+(n||1)));}catch{}
}
function useGemType(type){
  const c=getGemTypeCount(type);
  if(c<=0)return false;
  try{localStorage.setItem('pw_gemtype_'+type,String(c-1));return true;}catch{return false;}
}
function returnGemType(type){addGemType(type,1);}

// ── 单个宝石类型的属性增量（全部加法，便于撤销） ──
function _gemStatDelta(type){
  switch(type){
    case 'atk':  return {dmgMult:0.10};
    case 'def':  return {baseDmgRed:0.08};
    case 'spd':  return {spd:15};
    case 'luck': return {luck:20};
    case 'cd':   return {cdMult:-0.08};
    case 'hp':   return {maxHp:30};
    case 'crit': return {critRate:0.08};
    default: return {};
  }
}

// ── 将增量应用到/从 player 身上 ──
function _applyGemStat(p,stat,val){
  switch(stat){
    case 'dmgMult':    p.dmgMult    = Math.max(0.01,+((p.dmgMult||1)    +val).toFixed(4)); break;
    case 'baseDmgRed': p.baseDmgRed = Math.min(0.6, Math.max(0,(p.baseDmgRed||0)+val));   break;
    case 'spd':        p.spd        = Math.max(50,  (p.spd||100)+val);                    break;
    case 'luck':       p.luck       = Math.max(0,   (p.luck||0)+val);                     break;
    case 'cdMult':     p.cdMult     = Math.min(1,   Math.max(0.2,(p.cdMult||1)+val));      break;
    case 'maxHp':      p.maxHp      = Math.max(10,  (p.maxHp||50)+val);
                       if(val>0) p.hp=Math.min((p.hp||0)+val,p.maxHp);
                       else      p.hp=Math.min(p.hp||0,p.maxHp);                          break;
    case 'critRate':   p.critRate   = Math.min(0.8, Math.max(0,(p.critRate||0)+val));      break;
  }
}

// ── 游戏开始时一次性应用所有镶嵌宝石（由 game.js initGame 调用）──
function applyStartCharGems(p){
  if(!p||typeof CLASSES==='undefined')return;
  const classId=CLASSES[p.classIdx]?.id;
  if(!classId)return;
  p.charGemBonuses={};
  for(let sl=0;sl<6;sl++){
    const gk=getCharGem(classId,sl);
    if(!gk||!_GEM_TYPES[gk])continue;
    for(const[k,v]of Object.entries(_gemStatDelta(gk))){
      p.charGemBonuses[k]=(p.charGemBonuses[k]||0)+v;
    }
  }
  for(const[k,v]of Object.entries(p.charGemBonuses)) _applyGemStat(p,k,v);
  if(typeof updateDerivedStats==='function') updateDerivedStats(p);
}

// ── 对局中实时重算宝石加成（装备/卸下时调用）──
function _reapplyCharGems(classId){
  if(!gs?.player)return;
  const p=gs.player;
  // 撤销旧加成
  if(p.charGemBonuses){
    for(const[k,v]of Object.entries(p.charGemBonuses)) _applyGemStat(p,k,-v);
  }
  // 重算
  p.charGemBonuses={};
  for(let sl=0;sl<6;sl++){
    const gk=getCharGem(classId,sl);
    if(!gk||!_GEM_TYPES[gk])continue;
    for(const[k,v]of Object.entries(_gemStatDelta(gk))){
      p.charGemBonuses[k]=(p.charGemBonuses[k]||0)+v;
    }
  }
  for(const[k,v]of Object.entries(p.charGemBonuses)) _applyGemStat(p,k,v);
  if(typeof updateDerivedStats==='function') updateDerivedStats(p);
}

// ── 当前职业宝石加成汇总（显示在角色Tab底部）──
function _fCharGemSummary(classId){
  const bonuses={};
  for(let sl=0;sl<6;sl++){
    const gk=getCharGem(classId,sl);
    if(!gk||!_GEM_TYPES[gk])continue;
    for(const[k,v]of Object.entries(_gemStatDelta(gk))){
      bonuses[k]=(bonuses[k]||0)+v;
    }
  }
  const parts=[];
  if(bonuses.dmgMult)    parts.push('⚔ +'+Math.round(bonuses.dmgMult*100)+'%');
  if(bonuses.baseDmgRed) parts.push('🛡 +'+Math.round(bonuses.baseDmgRed*100)+'%');
  if(bonuses.spd)        parts.push('⚡ +'+bonuses.spd);
  if(bonuses.luck)       parts.push('🍀 +'+bonuses.luck);
  if(bonuses.cdMult)     parts.push('⏱ '+Math.round(bonuses.cdMult*100)+'%');
  if(bonuses.maxHp)      parts.push('❤ +'+bonuses.maxHp);
  if(bonuses.critRate)   parts.push('⭐ +'+Math.round(bonuses.critRate*100)+'%');
  if(!parts.length)
    return '<div style="font-size:9px;color:#333;text-align:center;padding:4px 0">（无宝石加成）</div>';
  return '<div style="background:#0a0a18;border-radius:5px;padding:5px 8px;margin-bottom:6px">'+
    '<div style="font-size:9px;color:#555;margin-bottom:3px">宝石加成合计：</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:4px">'+
    parts.map(t=>'<span style="font-size:9px;color:#4f8;background:#0d1a0d;border-radius:3px;padding:2px 5px">'+t+'</span>').join('')+
    '</div></div>';
}

// ── §Forge redesign (3 tabs) ──
// 武器列表从 WEAPON_DEFS 动态读取，新增武器后自动出现在强化工坊
function _getForgeWeapList(){
  if(typeof WEAPON_DEFS==='undefined') return [];
  return Object.keys(WEAPON_DEFS)
    .filter(id => id !== 'kirby_copy') // 职业专属武器不进强化
    .map(id => ({id, icon:WEAPON_DEFS[id].icon, name:WEAPON_DEFS[id].name}));
}
let _forgeTab='weapon', _forgeSel=0;

function renderForge(){
  const panel=document.querySelector('#o-forge .panel');
  if(!panel)return;
  panel.style.cssText='background:#0d0d1a;border:2px solid #48f;border-radius:0;padding:14px 16px;width:100vw;height:100vh;max-width:100vw;max-height:100vh;display:flex;flex-direction:column;overflow:hidden;text-align:left;box-shadow:none';
  panel.innerHTML=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-shrink:0">'+
      '<div style="font-size:15px;color:#fd4;font-weight:700;letter-spacing:1px">⚒ 强化工坊</div>'+
      '<button class="btn" id="btn-forge-back-r" style="padding:4px 10px;font-size:11px">← 返回</button>'+
    '</div>'+
    '<div style="display:flex;gap:14px;font-size:10px;margin-bottom:10px;flex-shrink:0">'+
      '<span style="color:#888">🔩 碎片 <b id="forge-frags" style="color:#aaa">'+getWeaponFrags()+'</b></span>'+
      '<span style="color:#888">🌫 粉尘 <b id="forge-dust-v" style="color:#ccc">'+getDust()+'</b></span>'+
    '</div>'+
    '<div style="display:flex;gap:4px;margin-bottom:10px;flex-shrink:0">'+
      _fTabBtn('weapon','⚔ 武器')+_fTabBtn('char','🧙 角色')+_fTabBtn('skin','👗 皮肤')+
    '</div>'+
    '<div id="forge-body" style="flex:1;display:flex;gap:8px;overflow:hidden;min-height:0"></div>';
  document.getElementById('btn-forge-back-r').onclick=()=>showOverlay('o-menu');
  panel.querySelectorAll('.ftab').forEach(b=>b.addEventListener('click',()=>{
    _forgeTab=b.dataset.t; _forgeSel=0;
    panel.querySelectorAll('.ftab').forEach(x=>{const on=x.dataset.t===_forgeTab;x.style.background=on?'#1a1a2e':'transparent';x.style.borderColor=on?'#fd4':'#333';x.style.color=on?'#fd4':'#666';});
    _renderForgeBody();
  }));
  _renderForgeBody();
}
function _fTabBtn(t,label){
  const on=t===_forgeTab;
  return '<button class="ftab btn" data-t="'+t+'" style="flex:1;padding:6px 2px;font-size:10px;background:'+(on?'#1a1a2e':'transparent')+';border-color:'+(on?'#fd4':'#333')+';color:'+(on?'#fd4':'#666')+'">'+label+'</button>';
}
function _renderForgeBody(){
  const body=document.getElementById('forge-body');if(!body)return;
  if(_forgeTab==='weapon')_fWeaponTab(body);
  else if(_forgeTab==='char')_fCharTab(body);
  else body.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#444"><div style="font-size:40px">👗</div><div style="font-size:12px;margin-top:10px">皮肤系统</div><div style="font-size:10px;color:#333;margin-top:4px">✨ 敬请期待</div></div>';
}
function _fWeaponTab(body){
  body.innerHTML=
    '<div id="fw-list" style="width:70px;flex-shrink:0;border-right:1px solid #1a1a2e;overflow-y:auto;display:flex;flex-direction:column;gap:2px;padding-right:4px">'+
    _getForgeWeapList().map((w,i)=>'<div class="fwi" data-i="'+i+'" style="padding:7px 3px;cursor:pointer;border-radius:4px;text-align:center;background:'+(i===_forgeSel?'#1a1a2e':'transparent')+';border-left:2px solid '+(i===_forgeSel?'#fd4':'transparent')+'"><div style="font-size:18px">'+w.icon+'</div><div style="font-size:8px;color:'+(i===_forgeSel?'#fd4':'#666')+';margin-top:2px;line-height:1.2">'+w.name+'</div></div>').join('')+
    '</div>'+
    '<div id="fw-detail" style="flex:1;overflow-y:auto;padding-left:8px;padding-right:4px"></div>';
  body.querySelectorAll('.fwi').forEach(el=>el.addEventListener('click',()=>{_forgeSel=parseInt(el.dataset.i);_fWeaponTab(body);}));
  _fWepDetail(document.getElementById('fw-detail'),_getForgeWeapList()[_forgeSel]);
}
function _fWepDetail(el,wep){
  if(!el||!wep)return;
  const id=wep.id;
  const stars=getWeaponEnhLevel(id),upgLv=getWepUpgLv(id),spirit=getWepSpirit(id),dust=getDust(),gem=getWepGem(id);
  const g=_GEM_TYPES[gem]||null;
  const _SC=[10,25,50,80,120],_UMax=10;
  const sCost=stars<5?_SC[stars]:0,uCost=upgLv<_UMax?(upgLv+1)*5:0;
  const okS=stars<5&&spirit>=sCost,okU=upgLv<_UMax&&dust>=uCost;
  const starStr='<span style="color:#fd4">'+'★'.repeat(stars)+'</span><span style="color:#333">'+'★'.repeat(5-stars)+'</span>';
  el.innerHTML=
    '<div style="text-align:center;margin-bottom:10px">'+
      '<div style="font-size:28px">'+wep.icon+'</div>'+
      '<div style="font-size:13px;color:#eee;font-weight:700;margin-top:2px">'+wep.name+'</div>'+
      '<div style="font-size:14px;margin-top:2px">'+starStr+'</div>'+
      '<div style="font-size:9px;color:#666;margin-top:2px">总加成 <b style="color:#4fd">+'+(stars*8+upgLv*3)+'%</b> 武器伤害</div>'+
    '</div>'+
    '<div style="background:#0d0d1a;border:1px solid #1e2030;border-radius:6px;padding:8px 10px;margin-bottom:7px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center">'+
        '<div><div style="font-size:10px;color:#ccc;font-weight:700">⬆ 武器升级 Lv.'+upgLv+'/'+_UMax+'</div>'+
        '<div style="font-size:9px;color:#666;margin-top:1px">每级 +3% · 消耗🌫粉尘</div></div>'+
        (upgLv<_UMax
          ?'<div style="text-align:right"><div style="font-size:9px;color:#888;margin-bottom:3px">🌫'+uCost+' (拥有'+dust+')</div>'+
            '<button id="f-upg-btn" style="padding:4px 10px;font-size:10px;font-family:monospace;background:#1a1400;border:1.5px solid '+(okU?'#fd4':'#333')+';border-radius:4px;color:'+(okU?'#fd4':'#555')+';cursor:'+(okU?'pointer':'default')+'">升级</button></div>'
          :'<span style="font-size:10px;color:#4fd">✓ 满级</span>')+
      '</div></div>'+
    '<div style="background:#0d0d1a;border:1px solid #1e2030;border-radius:6px;padding:8px 10px;margin-bottom:7px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center">'+
        '<div><div style="font-size:10px;color:#f8a;font-weight:700">✨ 升星 '+starStr+'</div>'+
        '<div style="font-size:9px;color:#666;margin-top:1px">每星 +8% · 消耗器灵</div></div>'+
        (stars<5
          ?'<div style="text-align:right"><div style="font-size:9px;color:#888;margin-bottom:3px">✨'+sCost+' (拥有'+spirit+')</div>'+
            '<button id="f-star-btn" style="padding:4px 10px;font-size:10px;font-family:monospace;background:#1a0a00;border:1.5px solid '+(okS?'#f8a':'#333')+';border-radius:4px;color:'+(okS?'#f8a':'#555')+';cursor:'+(okS?'pointer':'default')+'">升星</button></div>'
          :'<span style="font-size:10px;color:#4fd">✓ 五星</span>')+
      '</div></div>'+
    '<div style="background:#0d0d1a;border:1px solid #1e2030;border-radius:6px;padding:8px 10px">'+
      '<div style="font-size:10px;color:#aaa;margin-bottom:6px">💎 专属宝石槽</div>'+
      '<div style="display:flex;align-items:center;gap:8px">'+
        '<div id="f-gem-slot" style="width:36px;height:36px;border-radius:6px;border:2px dashed '+(g?g.color:'#333')+';background:'+(g?g.color+'18':'#111')+';display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;flex-shrink:0">'+(g?g.icon:'➕')+'</div>'+
        '<div style="font-size:9px;color:#777">'+(g?'<b style="color:'+g.color+'">'+g.name+'</b><br>'+g.desc:'空槽 · 点击选择宝石')+'</div>'+
      '</div>'+
    '</div>';
  const upgBtn=el.querySelector('#f-upg-btn');
  if(upgBtn&&okU)upgBtn.onclick=()=>{if(spendDust(uCost)){setWepUpgLv(id,upgLv+1);const dv=document.getElementById('forge-dust-v');if(dv)dv.textContent=getDust();_fWepDetail(el,wep);SFX.play('levelup');}};
  const starBtn=el.querySelector('#f-star-btn');
  if(starBtn&&okS)starBtn.onclick=()=>{if(spendWepSpirit(id,sCost)){setWeaponEnhLevel(id,stars+1);_fWepDetail(el,wep);SFX.play('levelup');}};
  const gemSlot=el.querySelector('#f-gem-slot');
  if(gemSlot)gemSlot.onclick=()=>_openGemPicker(gk=>{setWepGem(id,gk);_fWepDetail(el,wep);});
}
function _fCharTab(body){
  const classes=typeof CLASSES!=='undefined'?CLASSES:[];
  body.innerHTML=
    '<div style="width:70px;flex-shrink:0;border-right:1px solid #1a1a2e;overflow-y:auto;display:flex;flex-direction:column;gap:2px;padding-right:4px">'+
    classes.map((c,i)=>{const m=_CODEX_CLASS_META[c.id]||{icon:'⚔'};return'<div class="fci" data-i="'+i+'" style="padding:7px 3px;cursor:pointer;border-radius:4px;text-align:center;background:'+(i===_forgeSel?'#1a1a2e':'transparent')+';border-left:2px solid '+(i===_forgeSel?'#4fd':'transparent')+'"><div style="font-size:18px">'+(m.img?'<img src="'+m.img+'" style="width:22px;height:22px;object-fit:cover;border-radius:3px">':m.icon)+'</div><div style="font-size:8px;color:'+(i===_forgeSel?'#4fd':'#666')+';margin-top:2px;line-height:1.2">'+c.name+'</div></div>';}).join('')+
    '</div>'+
    '<div id="fc-detail" style="flex:1;overflow-y:auto;padding-left:8px;padding-right:4px"></div>';
  body.querySelectorAll('.fci').forEach(el=>el.addEventListener('click',()=>{_forgeSel=parseInt(el.dataset.i);_fCharTab(body);}));
  _fCharDetail(document.getElementById('fc-detail'),classes[_forgeSel]);
}
function _fCharDetail(el,cls){
  if(!el||!cls)return;
  const m=_CODEX_CLASS_META[cls.id]||{icon:'⚔'};
  const inGame=!!(gs?.player);
  // 总背包剩余数
  const totalInBag=Object.keys(_GEM_TYPES).reduce((s,k)=>s+getGemTypeCount(k),0);

  el.innerHTML=
    '<div style="text-align:center;margin-bottom:10px">'+
      (m.img?'<img src="'+m.img+'" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:2px solid #334">':'<div style="font-size:36px">'+m.icon+'</div>')+
      '<div style="font-size:13px;color:#fd4;font-weight:700;margin-top:4px">'+cls.name+'</div>'+
      '<div style="font-size:9px;color:#555;margin-top:2px">HP '+cls.hp+' · 速度 '+cls.spd+'</div>'+
    '</div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
      '<span style="font-size:10px;color:#4fd;font-weight:700">💎 宝石镶嵌 <span style="color:#444;font-weight:400">（6槽）</span></span>'+
      '<span style="font-size:9px;color:#556">背包: <b style="color:'+(totalInBag>0?'#4fd':'#444')+'">'+totalInBag+'</b></span>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:8px">'+
    [0,1,2,3,4,5].map(slot=>{
      const gk=getCharGem(cls.id,slot);
      const g=_GEM_TYPES[gk]||null;
      if(g){
        // ── 已装备：显示宝石，右上角小×标记，点击卸下 ──
        return '<div class="fcg-slot fcg-equipped" data-slot="'+slot+'" data-gk="'+gk+'"'+
          ' style="border-radius:6px;border:2px solid '+g.color+';background:'+g.color+'1a;'+
          'padding:8px 4px 6px;cursor:pointer;text-align:center;position:relative;'+
          'transition:border-color .15s,background .15s">'+
          '<div style="position:absolute;top:3px;right:4px;font-size:9px;color:#888;line-height:1;'+
          'background:#0a0a14;border-radius:2px;padding:0 3px">✕</div>'+
          '<div style="font-size:20px;line-height:1;margin-bottom:3px">'+g.icon+'</div>'+
          '<div style="font-size:8px;color:'+g.color+';line-height:1.2">'+g.name+'</div>'+
          '<div style="font-size:7px;color:#555;margin-top:2px">点击卸下</div>'+
        '</div>';
      } else {
        // ── 空槽：显示背包内可用数量提示 ──
        return '<div class="fcg-slot fcg-empty" data-slot="'+slot+'" data-gk=""'+
          ' style="border-radius:6px;border:2px dashed '+(totalInBag>0?'#334':'#222')+';background:#0d0d18;'+
          'padding:10px 4px 8px;cursor:'+(totalInBag>0?'pointer':'default')+';text-align:center;'+
          'transition:border-color .15s">'+
          '<div style="font-size:20px;line-height:1;margin-bottom:3px;color:'+(totalInBag>0?'#446':'#222')+'">➕</div>'+
          '<div style="font-size:8px;color:#333;line-height:1.2">空槽</div>'+
        '</div>';
      }
    }).join('')+
    '</div>'+
    _fCharGemSummary(cls.id)+
    (inGame
      ? '<div style="font-size:9px;color:#4fd;text-align:center;margin-top:4px">✅ 效果已实时生效于当前对局</div>'
      : '<div style="font-size:9px;color:#446;text-align:center;margin-top:4px">效果将在下次游戏开始时生效</div>');

  // ── 事件：已装备槽 → 点击卸下 ──
  el.querySelectorAll('.fcg-equipped').forEach(s=>{
    s.addEventListener('mouseenter',()=>{s.style.background=(_GEM_TYPES[s.dataset.gk]?.color||'#fff')+'08';s.style.borderColor='#f55';});
    s.addEventListener('mouseleave',()=>{const g=_GEM_TYPES[s.dataset.gk];s.style.background=g?g.color+'1a':'';s.style.borderColor=g?g.color:'';});
    s.addEventListener('click',()=>{
      const gk=s.dataset.gk;
      returnGemType(gk);
      setCharGem(cls.id,parseInt(s.dataset.slot),'');
      _reapplyCharGems(cls.id);
      SFX.play('click');
      _fCharDetail(el,cls);
    });
  });

  // ── 事件：空槽 → 打开背包选择器 ──
  el.querySelectorAll('.fcg-empty').forEach(s=>{
    if(totalInBag<=0)return;
    s.addEventListener('mouseenter',()=>{s.style.borderColor='#4fd';s.style.background='#0d1a14';});
    s.addEventListener('mouseleave',()=>{s.style.borderColor='#334';s.style.background='#0d0d18';});
    s.addEventListener('click',()=>{
      _openCharGemPicker(gk=>{
        if(!useGemType(gk))return;
        setCharGem(cls.id,parseInt(s.dataset.slot),gk);
        _reapplyCharGems(cls.id);
        _fCharDetail(el,cls);
      });
    });
  });
}

// ── 武器专属宝石槽选择器（不需要背包，自由选择）──
function _openGemPicker(callback){
  const old=document.getElementById('gem-picker-modal');if(old)old.remove();
  const ov=document.createElement('div');
  ov.id='gem-picker-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center';
  const box=document.createElement('div');
  box.style.cssText='background:#0d0d1a;border:2px solid #334;border-radius:12px;padding:18px 16px;max-width:320px;width:90%;text-align:center;font-family:\'Courier New\',monospace';
  box.innerHTML='<div style="font-size:13px;color:#eee;font-weight:700;margin-bottom:12px">💎 选择宝石</div>'+
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">'+
    Object.entries(_GEM_TYPES).map(([k,g])=>
      '<div class="gp-opt" data-k="'+k+'" style="padding:10px 4px;border-radius:8px;border:2px solid '+g.color+'44;background:'+g.color+'12;cursor:pointer">'+
      '<div style="font-size:22px">'+g.icon+'</div>'+
      '<div style="font-size:8px;color:'+g.color+';margin-top:3px">'+g.name+'</div>'+
      '</div>'
    ).join('')+
    '</div>'+
    '<button id="gp-cancel-btn" class="btn" style="width:100%;padding:7px;font-size:11px">取消</button>';
  ov.appendChild(box);
  box.querySelectorAll('.gp-opt').forEach(opt=>{
    opt.addEventListener('click',()=>{callback(opt.dataset.k);ov.remove();SFX.play('click');});
  });
  document.getElementById('gp-cancel-btn').addEventListener('click',()=>ov.remove());
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
}

// ── 角色宝石槽选择器（从背包选，显示库存数量）──
function _openCharGemPicker(callback){
  const old=document.getElementById('gem-picker-modal');if(old)old.remove();
  const ov=document.createElement('div');
  ov.id='gem-picker-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;display:flex;align-items:center;justify-content:center';
  const box=document.createElement('div');
  box.style.cssText='background:#0d0d1a;border:2px solid #334;border-radius:12px;padding:16px;max-width:300px;width:90%;font-family:\'Courier New\',monospace';
  const hasAny=Object.keys(_GEM_TYPES).some(k=>getGemTypeCount(k)>0);
  box.innerHTML=
    '<div style="font-size:13px;color:#4fd;font-weight:700;margin-bottom:3px;text-align:center">💎 选择宝石</div>'+
    '<div style="font-size:9px;color:#445;margin-bottom:12px;text-align:center">从背包中选择一颗镶嵌</div>'+
    (hasAny
      ? '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:14px">'+
        Object.entries(_GEM_TYPES).map(([k,g])=>{
          const cnt=getGemTypeCount(k);
          const ok=cnt>0;
          return '<div class="gp-opt" data-k="'+k+'" data-ok="'+(ok?'1':'0')+'"'+
            ' style="padding:8px 4px;border-radius:8px;position:relative;text-align:center;'+
            'border:2px solid '+(ok?g.color+'88':g.color+'18')+';'+
            'background:'+(ok?g.color+'12':'#080810')+';'+
            'cursor:'+(ok?'pointer':'default')+';'+
            'opacity:'+(ok?1:0.3)+'">'+
            '<div style="font-size:20px">'+g.icon+'</div>'+
            '<div style="font-size:7.5px;color:'+(ok?g.color:'#333')+';margin-top:2px;line-height:1.2">'+g.name+'</div>'+
            (ok?'<div style="position:absolute;top:3px;right:3px;font-size:9px;font-weight:700;'+
            'color:#0a0a10;background:'+g.color+';border-radius:50%;width:14px;height:14px;'+
            'line-height:14px;text-align:center">'+cnt+'</div>':'')+
          '</div>';
        }).join('')+
        '</div>'
      : '<div style="text-align:center;padding:18px 0;color:#335;font-size:11px">'+
        '背包中暂无宝石<br>'+
        '<span style="font-size:9px;color:#224;display:block;margin-top:6px">击败宝石怪可获得宝石</span></div>'+
        '<div style="height:8px"></div>'
    )+
    '<button id="gp-cancel-btn" class="btn" style="width:100%;padding:7px;font-size:11px">取消</button>';
  ov.appendChild(box);
  box.querySelectorAll('.gp-opt[data-ok="1"]').forEach(opt=>{
    opt.addEventListener('click',()=>{callback(opt.dataset.k);ov.remove();SFX.play('click');});
  });
  document.getElementById('gp-cancel-btn').addEventListener('click',()=>ov.remove());
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
}
function forgeUpgrade(weapId){ /* legacy stub – handled by new forge UI */ }

function getGachaPity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_pity')||'0',10)); }catch{ return 0; } }
function setGachaPity(n){ try{ localStorage.setItem('pw_gacha_pity',String(n)); }catch{} }
function hasGachaFlyingSword(){ try{ return localStorage.getItem('pw_gacha_fs')==='1'; }catch{ return false; } }
function setGachaFlyingSword(){ try{ localStorage.setItem('pw_gacha_fs','1'); }catch{} }

function updateGachaPityUI(){
  const p=getGachaPity();
  const hasSword=hasGachaFlyingSword();
  const pct=Math.min(100,p)*100/100;
  const fill=document.getElementById('gacha-pity-fill');
  const txt=document.getElementById('gacha-pity-txt');
  if(fill) fill.style.width=pct+'%';
  if(txt) txt.textContent = hasSword ? '保底进度: 已解锁飞剑 ✓' : '保底进度: '+p+'/100';
  document.getElementById('gacha-coins').textContent=getCoins();
  const tkEl=document.getElementById('gacha-tickets-txt');
  if(tkEl) tkEl.textContent='🎟 抽奖券: '+getGachaTickets()+'张';
  // Refresh sidebar and tortoise panel if visible
  renderGachaPoolList();
  if(document.getElementById('gacha-panel-tortoise')?.style.display !== 'none') updateGachaTortoisePanel();
}

const GACHA_POOL = [
  { w:12, icon:'🪙', name:'金币 ×120',  apply:()=>{ addCoins(120);  return {rarity:'normal'}; } },
  { w:8,  icon:'🪙', name:'金币 ×300',  apply:()=>{ addCoins(300);  return {rarity:'normal'}; } },
  { w:18, icon:'❤',  name:'最大HP +20', apply:()=>{ if(gs?.player){ gs.player.maxHp+=20; healPlayer(20); } return {rarity:'rare'}; } },
  { w:17, icon:'💪', name:'伤害 +15%',  apply:()=>{ if(gs?.player){ gs.player.dmgMult=+((gs.player.dmgMult||1)*1.15).toFixed(4); } return {rarity:'rare'}; } },
  { w:13, icon:'⏱',  name:'CD -10%',    apply:()=>{ if(gs?.player){ gs.player.cdMult=Math.max(0.2,+((gs.player.cdMult||1)*0.90).toFixed(4)); } return {rarity:'rare'}; } },
  { w:12, icon:'🍀',  name:'幸运 +30',  apply:()=>{ if(gs?.player){ gs.player.luck=(gs.player.luck||0)+30; updateDerivedStats(gs.player); } return {rarity:'epic'}; } },
  { w:15, icon:'🔩', name:'武器碎片 ×3', apply:()=>{ addWeaponFrags(3); return {rarity:'rare'}; } },
  { w:5,  icon:'⚙',  name:'武器碎片 ×10',apply:()=>{ addWeaponFrags(10); return {rarity:'epic'}; } },
];

function gachaDraw(){
  let pity=getGachaPity();
  const hasSword=hasGachaFlyingSword();
  pity++;
  const isSwordPull = !hasSword && (pity>=100 || Math.random()<0.02);
  setGachaPity(isSwordPull ? 0 : pity);

  if(isSwordPull){
    setGachaFlyingSword();
    if(gs?.phase==='playing'||gs?.phase==='paused'){
      addWeapon('flying_sword');
    }
    return { icon:'🗡', name:'飞剑', rarity:'legendary', msg:'飞剑已解锁！下局游戏可在抽奖前选择携带。' };
  }

  // Weighted random
  let total=GACHA_POOL.reduce((s,x)=>s+x.w,0);
  let r=Math.random()*total;
  for(const item of GACHA_POOL){
    r-=item.w;
    if(r<=0){ const res=item.apply(); return { icon:item.icon, name:item.name, rarity:res.rarity||'normal' }; }
  }
  const fb=GACHA_POOL[0]; fb.apply(); return { icon:fb.icon, name:fb.name, rarity:'normal' };
}

function doGacha(times, useTickets){
  if(useTickets){
    const tix=getGachaTickets();
    if(tix<times){ showGachaModal([{icon:'❌',name:'抽奖券不足！需要'+times+'张，当前'+tix+'张',rarity:'normal'}]); return; }
    for(let i=0;i<times;i++) spendGachaTicket();
  } else {
    if(!spendCoins(times*100)){ showGachaModal([{icon:'❌',name:'金币不足！需要 '+(times*100)+' 金币',rarity:'normal'}]); return; }
  }
  const results=[];
  for(let i=0;i<times;i++) results.push(gachaDraw());
  updateGachaPityUI();
  showGachaModal(results);
}

function showGachaModal(results){
  // Remove existing modal
  const old=document.getElementById('gacha-modal');
  if(old) old.remove();

  const rarityCol={normal:'#888',rare:'#4af',epic:'#c8f',legendary:'#fd4'};
  const rarityBg ={normal:'rgba(0,0,0,.5)',rare:'rgba(0,20,60,.7)',epic:'rgba(30,0,60,.7)',legendary:'rgba(60,40,0,.8)'};
  const rarityLabel={normal:'',rare:'★ 稀有',epic:'★★ 史诗',legendary:'★★★ 传说'};

  const overlay=document.createElement('div');
  overlay.id='gacha-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease';

  const box=document.createElement('div');
  box.style.cssText='background:#0d0d1a;border:2px solid #f8a;border-radius:12px;padding:24px 20px;max-width:480px;width:90%;text-align:center';

  const title=document.createElement('div');
  title.style.cssText='font-size:16px;color:#f8a;font-weight:900;letter-spacing:2px;margin-bottom:16px;font-family:"Courier New",monospace';
  title.textContent = results.length===1 ? '🎰 单抽结果' : '🎰 十连结果';
  box.appendChild(title);

  const grid=document.createElement('div');
  grid.style.cssText='display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:18px';
  results.forEach(r=>{
    const item=document.createElement('div');
    const col=rarityCol[r.rarity]||'#888';
    const bg=rarityBg[r.rarity]||'rgba(0,0,0,.5)';
    item.style.cssText='width:80px;padding:10px 6px;border:2px solid '+col+';border-radius:8px;background:'+bg+
      ';animation:cardIn .3s ease both;text-align:center';
    item.innerHTML='<div style="font-size:28px;margin-bottom:5px">'+r.icon+'</div>'+
      '<div style="font-size:10px;color:'+col+';font-weight:700;line-height:1.3">'+r.name+'</div>'+
      (rarityLabel[r.rarity]?'<div style="font-size:8px;color:'+col+';opacity:.8;margin-top:3px">'+rarityLabel[r.rarity]+'</div>':'');
    grid.appendChild(item);
  });
  box.appendChild(grid);

  const closeBtn=document.createElement('button');
  closeBtn.className='btn primary';
  closeBtn.style.cssText='width:100%;padding:9px;font-size:12px';
  closeBtn.textContent='确认';
  closeBtn.addEventListener('click',()=>overlay.remove());
  box.appendChild(closeBtn);

  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ── Black Tortoise pool helpers ──
function hasGachaBlackTortoise(){ try{ return localStorage.getItem('pw_gacha_bt')==='1'; }catch{ return false; } }
function setGachaBlackTortoise(){ try{ localStorage.setItem('pw_gacha_bt','1'); }catch{} }
function getTortoisePity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_bt_pity')||'0',10)); }catch{ return 0; } }
function setTortoisePity(n){ try{ localStorage.setItem('pw_gacha_bt_pity',String(n)); }catch{} }
function isTortoisePoolUnlocked(){ try{ const b=loadBest(); return b&&(b.wave||0)>=8; }catch{ return false; } }

function updateGachaTortoisePanel(){
  const content = document.getElementById('tortoise-pool-content');
  const drawBtns = document.getElementById('tortoise-draw-btns');
  if (!content) return;
  const unlocked = isTortoisePoolUnlocked();
  const hasBT = hasGachaBlackTortoise();
  const pity = getTortoisePity();

  if (!unlocked) {
    content.innerHTML =
      '<div style="font-size:28px;margin-bottom:6px;filter:grayscale(1);opacity:.5">🔒🐢</div>'+
      '<div style="font-size:12px;color:#555;font-weight:bold;margin-bottom:4px">召唤术·玄武奖池</div>'+
      '<div style="font-size:10px;color:#444;border:1px solid #333;border-radius:6px;padding:6px 10px;display:inline-block">通关第8波后解锁</div>';
    if (drawBtns) drawBtns.style.display = 'none';
  } else {
    const pct = Math.min(100, pity);
    content.innerHTML =
      '<div style="font-size:30px;margin-bottom:5px">🐢</div>'+
      '<div style="font-size:13px;color:#4fd;margin-bottom:4px;font-weight:bold">玄武奖池</div>'+
      '<div style="font-size:9px;color:#888;margin-bottom:8px">单抽必出金币/补给 · 50抽保底玄武</div>'+
      (hasBT
        ? '<div style="font-size:10px;color:#4fd;margin-bottom:6px">✓ 召唤术·玄武 已解锁</div>'
        : '')+
      '<div style="background:#1a1a2a;border-radius:4px;height:5px;margin-bottom:3px;overflow:hidden">'+
        '<div style="height:100%;background:linear-gradient(90deg,#4fd,#4ef);border-radius:4px;width:'+pct+'%;transition:width .4s"></div>'+
      '</div>'+
      '<div style="font-size:9px;color:#666">'+(hasBT?'保底进度: 已解锁玄武 ✓':'保底进度: '+pity+'/50')+'</div>';
    if (drawBtns) drawBtns.style.display = 'flex';
  }
}

function tortoiseDraw(){
  let pity = getTortoisePity();
  const hasBT = hasGachaBlackTortoise();
  pity++;
  const isBTPull = !hasBT && (pity >= 50 || Math.random() < 0.03);
  setTortoisePity(isBTPull ? 0 : pity);

  if (isBTPull) {
    setGachaBlackTortoise();
    return { icon:'🐢', name:'召唤术·玄武', rarity:'legendary', msg:'玄武已解锁！下局第5波通关后可选择。' };
  }
  // Consolation: same pool as sword gacha
  let total = GACHA_POOL.reduce((s,x)=>s+x.w,0);
  let r = Math.random()*total;
  for (const item of GACHA_POOL) {
    r -= item.w;
    if (r <= 0) { const res=item.apply(); return { icon:item.icon, name:item.name, rarity:res.rarity||'normal' }; }
  }
  const fb=GACHA_POOL[0]; fb.apply(); return { icon:fb.icon, name:fb.name, rarity:'normal' };
}

function doTortoiseGacha(times, useTickets){
  if (!isTortoisePoolUnlocked()){
    showGachaModal([{icon:'🔒',name:'通关第8波后解锁',rarity:'normal'}]);
    return;
  }
  if (useTickets) {
    const tix = getGachaTickets();
    if (tix < times){ showGachaModal([{icon:'❌',name:'抽奖券不足！需要'+times+'张，当前'+tix+'张',rarity:'normal'}]); return; }
    for (let i=0;i<times;i++) spendGachaTicket();
  } else {
    if (!spendCoins(times*100)){ showGachaModal([{icon:'❌',name:'金币不足！需要'+(times*100)+' 金币',rarity:'normal'}]); return; }
  }
  const results = [];
  for (let i=0;i<times;i++) results.push(tortoiseDraw());
  updateGachaPityUI();
  showGachaModal(results);
}

// ── Gacha two-column pool system ──
const _GACHA_POOLS = [
  { id:'sword',    icon:'🗡', name:'飞剑池',  unlocked:()=>true },
  { id:'tortoise', icon:'🐢', name:'玄武池',  unlocked:()=>isTortoisePoolUnlocked() },
  { id:'spirit',   icon:'✨', name:'器灵池',  unlocked:()=>true },
  { id:'odds',     icon:'📊', name:'概率',    unlocked:()=>true },
];

// ── Spirit (器灵) gacha pool ──
const _SPIRIT_POOL=[
  {id:'shotgun',      icon:'🔫',name:'散弹枪器灵'},
  {id:'gatling',      icon:'⚡', name:'加特林器灵'},
  {id:'sword',        icon:'⚔', name:'剑阵器灵'},
  {id:'arrow_rain',   icon:'🏹',name:'箭雨器灵'},
  {id:'heal_drone',   icon:'💊',name:'治疗无人机器灵'},
  {id:'missile_drone',icon:'🚀',name:'导弹无人机器灵'},
  {id:'sniper',       icon:'🔭',name:'狙击枪器灵'},
  {id:'flying_sword', icon:'🗡',name:'飞剑器灵'},
];
function spiritDraw(){
  const w=_SPIRIT_POOL[Math.floor(Math.random()*_SPIRIT_POOL.length)];
  const amt=1+Math.floor(Math.random()*3); // 1–3
  addWepSpirit(w.id,amt);
  return {icon:w.icon,name:w.name+' ×'+amt,rarity:amt>=3?'epic':amt>=2?'rare':'normal'};
}
function doSpiritGacha(times,useTickets){
  if(useTickets){
    const tix=getGachaTickets();
    if(tix<times){showGachaModal([{icon:'❌',name:'抽奖券不足！需要'+times+'张，当前'+tix+'张',rarity:'normal'}]);return;}
    for(let i=0;i<times;i++)spendGachaTicket();
  } else {
    if(!spendCoins(times*150)){showGachaModal([{icon:'❌',name:'金币不足！需要'+(times*150)+' 金币',rarity:'normal'}]);return;}
  }
  const results=[];
  for(let i=0;i<times;i++)results.push(spiritDraw());
  updateGachaPityUI();
  showGachaModal(results);
}
function _ensureSpiritPanel(){
  if(document.getElementById('gacha-panel-spirit'))return;
  const detail=document.querySelector('.gacha-detail');
  if(!detail)return;
  const p=document.createElement('div');
  p.id='gacha-panel-spirit';
  p.className='gacha-pool-panel';
  p.style.display='none';
  p.innerHTML=
    '<div style="font-size:28px;margin-bottom:5px">✨</div>'+
    '<div style="font-size:13px;color:#f8a;margin-bottom:4px;font-weight:bold">器灵奖池</div>'+
    '<div style="font-size:9px;color:#888;margin-bottom:12px">单抽必出武器专属器灵 · 用于强化工坊升星</div>'+
    '<div class="spirit-list" style="background:#1a0a1e;border:1px solid #3a1a3e;border-radius:6px;padding:8px 10px;margin-bottom:12px;text-align:left;font-size:9px;color:#888">'+
    _SPIRIT_POOL.map(w=>'<div style="padding:2px 0">'+w.icon+' '+w.name+' · 当前 <b style="color:#f8a" id="spirit-cnt-'+w.id+'">'+getWepSpirit(w.id)+'</b></div>').join('')+
    '</div>'+
    '<div class="gacha-draw-row">'+
    '<button class="btn" id="btn-spirit-x1" style="flex:1;min-width:72px;padding:7px 4px;font-size:10px;border-color:#f8a;color:#f8a">金币×1<br><span style="font-size:8px;color:#888">150金币</span></button>'+
    '<button class="btn" id="btn-spirit-x10" style="flex:1;min-width:72px;padding:7px 4px;font-size:10px;border-color:#fd4;color:#fd4">金币×10<br><span style="font-size:8px;color:#888">1500金币</span></button>'+
    '<button class="btn" id="btn-spirit-t1" style="flex:1;min-width:72px;padding:7px 4px;font-size:10px;border-color:#4ef;color:#4ef">券×1<br><span style="font-size:8px;color:#888">1张券</span></button>'+
    '<button class="btn" id="btn-spirit-t10" style="flex:1;min-width:72px;padding:7px 4px;font-size:10px;border-color:#4fd;color:#4fd">券×10<br><span style="font-size:8px;color:#888">10张券</span></button>'+
    '</div>';
  detail.appendChild(p);
  document.getElementById('btn-spirit-x1').onclick=()=>doSpiritGacha(1);
  document.getElementById('btn-spirit-x10').onclick=()=>doSpiritGacha(10);
  document.getElementById('btn-spirit-t1').onclick=()=>doSpiritGacha(1,true);
  document.getElementById('btn-spirit-t10').onclick=()=>doSpiritGacha(10,true);
}
function updateSpiritPanel(){
  _SPIRIT_POOL.forEach(w=>{
    const el=document.getElementById('spirit-cnt-'+w.id);
    if(el)el.textContent=getWepSpirit(w.id);
  });
}

function renderGachaPoolList(){
  const list = document.getElementById('gacha-pool-list');
  if (!list) return;
  // Split into unlocked/locked then render unlocked first, locked at bottom
  const unlocked = _GACHA_POOLS.filter(p => p.unlocked());
  const locked   = _GACHA_POOLS.filter(p => !p.unlocked());
  const current  = list.dataset.active || 'sword';
  list.innerHTML = '';
  const makeItem = (p, isLocked) => {
    const el = document.createElement('div');
    el.className = 'gacha-pool-item' + (p.id === current ? ' active' : '') + (isLocked ? ' gpi-locked' : '');
    el.dataset.pool = p.id;
    el.innerHTML = '<span class="gpi-icon">'+p.icon+'</span><span>'+p.name+'</span>';
    if (!isLocked) el.addEventListener('click', ()=>switchGachaTab(p.id));
    list.appendChild(el);
  };
  unlocked.forEach(p => makeItem(p, false));
  locked.forEach(p => makeItem(p, true));
}

function switchGachaTab(tab){
  _ensureSpiritPanel();
  ['sword','tortoise','spirit','odds'].forEach(id => {
    const el = document.getElementById('gacha-panel-'+id);
    if (el) el.style.display = id === tab ? '' : 'none';
  });
  const list = document.getElementById('gacha-pool-list');
  if (list) {
    list.dataset.active = tab;
    list.querySelectorAll('.gacha-pool-item').forEach(el => {
      el.classList.toggle('active', el.dataset.pool === tab);
    });
  }
  if (tab === 'tortoise') updateGachaTortoisePanel();
  if (tab === 'spirit') updateSpiritPanel();
}



document.getElementById('btn-gacha-x1').addEventListener('click',()=>{ doGacha(1); });
document.getElementById('btn-gacha-x10').addEventListener('click',()=>{ doGacha(10); });
document.getElementById('btn-gacha-ticket1').addEventListener('click',()=>{ doGacha(1,true); });
document.getElementById('btn-gacha-ticket10').addEventListener('click',()=>{ doGacha(10,true); });
document.getElementById('btn-tortoise-x1').addEventListener('click',()=>{ doTortoiseGacha(1); });
document.getElementById('btn-tortoise-x10').addEventListener('click',()=>{ doTortoiseGacha(10); });
document.getElementById('btn-tortoise-ticket1').addEventListener('click',()=>{ doTortoiseGacha(1,true); });
document.getElementById('btn-friends').addEventListener('click',()=>{
  _friendTab='list';showOverlay('o-friends');
});
document.getElementById('ftab-list').addEventListener('click',()=>switchFriendTab('list'));
document.getElementById('ftab-req').addEventListener('click',()=>switchFriendTab('req'));
document.getElementById('btn-dm-send').addEventListener('click',()=>sendDmMsg());
document.getElementById('dm-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey)sendDmMsg();});

// §29 Player level system
function getPlayerLevel(){try{return Math.max(1,Math.min(100,parseInt(localStorage.getItem('pw_plv')||'1',10)));}catch{return 1;}}
function getPlayerXP(){try{return Math.max(0,parseInt(localStorage.getItem('pw_pxp')||'0',10));}catch{return 0;}}
function xpNeeded(lv){return lv*50;} // XP required to go from lv to lv+1

function addPlayerXP(amount){
  if(!amount||amount<=0)return{lv:getPlayerLevel(),xp:getPlayerXP(),leveled:false};
  let lv=getPlayerLevel(),xp=getPlayerXP()+amount,leveled=false;
  while(lv<100&&xp>=xpNeeded(lv)){xp-=xpNeeded(lv);lv++;leveled=true;}
  if(lv>=100)xp=0;
  try{localStorage.setItem('pw_plv',String(lv));localStorage.setItem('pw_pxp',String(xp));}catch{}
  updateMenuLevel();
  if(leveled)showLevelUpToast(lv);
  return{lv,xp,leveled};
}

function updateMenuLevel(){
  const lv=getPlayerLevel(),xp=getPlayerXP(),needed=xpNeeded(lv);
  const badge=document.getElementById('menu-level-badge');
  if(badge)badge.textContent='Lv.'+lv;
  const fill=document.getElementById('menu-xp-bar-fill');
  if(fill)fill.style.width=(lv>=100?100:Math.min(100,xp/needed*100)).toFixed(1)+'%';
}

function showLevelUpToast(lv){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;top:22%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.92);border:2px solid #fd4;color:#fd4;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;z-index:9999;text-align:center;pointer-events:none';
  t.innerHTML='⬆️ 升级！<br><span style="font-size:26px;color:#fff">Lv.'+lv+'</span>';
  document.body.appendChild(t);
  setTimeout(()=>{t.style.cssText+=';opacity:0;transition:opacity .6s';},1600);
  setTimeout(()=>t.remove(),2300);
}

// §30 Mute / violation system
function _isMuted(){try{return Date.now()<(parseInt(localStorage.getItem('pw_mute_until')||'0',10));}catch{return false;}}
function _getMuteRemaining(){
  try{
    const ms=(parseInt(localStorage.getItem('pw_mute_until')||'0',10))-Date.now();
    if(ms<=0)return'';
    if(ms<60000)return Math.ceil(ms/1000)+'秒';
    if(ms<3600000)return Math.ceil(ms/60000)+'分钟';
    return Math.ceil(ms/3600000)+'小时';
  }catch{return'';}
}
function _recordViolation(){
  try{
    const today=new Date().toDateString();
    let cnt=0;
    if(localStorage.getItem('pw_vio_day')===today){
      cnt=parseInt(localStorage.getItem('pw_vio_count')||'0',10);
    }
    cnt++;
    localStorage.setItem('pw_vio_count',String(cnt));
    localStorage.setItem('pw_vio_day',today);
    let dur=0;
    if(cnt===3)dur=60000;           // 1 min
    else if(cnt===4)dur=3600000;    // 1 hour
    else if(cnt===5)dur=6*3600000;  // 6 hours
    else if(cnt>=6)dur=24*3600000;  // 24 hours
    if(dur>0){
      localStorage.setItem('pw_mute_until',String(Date.now()+dur));
      return '已被禁言 '+_getMuteRemaining()+'（脏字累计第'+cnt+'次）';
    }
    return null;
  }catch{return null;}
}

// §31 Chat sidebar switching
let _chatSection='room';
function switchChatSection(section){
  _chatSection=section;
  const isRoom=section==='room';
  document.getElementById('chat-tab-room').classList.toggle('chat-tab-active',isRoom);
  document.getElementById('chat-tab-dm').classList.toggle('chat-tab-active',!isRoom);
  document.getElementById('chat-messages').style.display=isRoom?'flex':'none';
  document.getElementById('chat-dm-list-panel').style.display=isRoom?'none':'flex';
  const ib=document.getElementById('chat-input-bar');if(ib)ib.style.display=isRoom?'flex':'none';
  const ep=document.getElementById('emoji-picker');if(ep)ep.style.display='none';
  const pt=document.getElementById('chat-panel-title');if(pt)pt.textContent=isRoom?'💬 聊天室':'💌 私聊';
  if(!isRoom)renderInlineDmList();
}

async function renderInlineDmList(){
  const el=document.getElementById('chat-dm-list-panel');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:#444;font-size:11px">加载中...</div>';
  const url=getChatUrl();
  if(!url){el.innerHTML='<div style="text-align:center;padding:20px;color:#444;font-size:11px">未配置数据库</div>';return;}
  let friends={};
  try{const r=await fetch(url+'/friends/'+_encNick(getChatNick())+'.json');if(r.ok)friends=await r.json()||{};}catch{}
  const list=Object.values(friends).filter(f=>f&&f.status==='accepted');
  if(!list.length){
    el.innerHTML='<div style="text-align:center;padding:50px 20px;color:#444;font-size:12px">还没有好友<br><span style="font-size:10px;color:#333">返回聊天室点别人头像来加好友！</span></div>';
    return;
  }
  el.innerHTML=list.map(f=>{
    const nAttr=f.nick.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return '<div class="friend-item" data-nick="'+nAttr+'" data-from="o-chat" onclick="openDM(this.dataset.nick,this.dataset.from)">'+
      '<div class="friend-avatar-sm" style="font-size:16px;font-weight:700;color:#4ef">'+f.nick.charAt(0)+'</div>'+
      '<div style="flex:1"><div style="font-size:12px;color:#eee">'+f.nick.replace(/</g,'&lt;')+'</div>'+
      '<div style="font-size:10px;color:#555">点击私聊</div></div>'+
      '<span style="font-size:18px;color:#4ef">💬</span></div>';
  }).join('');
}

// §32 Emoji picker
const _CHAT_EMOJIS=['😊','😂','🥲','😍','😎','😭','🤔','😤','😴','🤩',
  '👍','👎','❤','🔥','💯','🎉','💪','🙏','👀','😈',
  '⚔','🛡','💊','🎮','🏆','💰','⭐','🎯','💀','🌟',
  '😱','🤯','🥳','😇','🤡','👻','🐉','🌈','⚡','🍀'];

function toggleEmojiPicker(){
  const ep=document.getElementById('emoji-picker');if(!ep)return;
  if(ep.style.display==='none'||!ep.style.display){
    if(!ep.children.length){
      ep.innerHTML=_CHAT_EMOJIS.map(e=>
        '<button data-em="'+e+'" class="emoji-btn" style="font-size:22px;background:none;border:none;cursor:pointer;padding:3px;border-radius:4px;line-height:1">'+e+'</button>'
      ).join('');
      ep.querySelectorAll('.emoji-btn').forEach(b=>b.addEventListener('click',()=>insertChatEmoji(b.dataset.em)));
    }
    ep.style.display='flex';
  } else {
    ep.style.display='none';
  }
}

function insertChatEmoji(e){
  const inp=document.getElementById('chat-input');if(!inp)return;
  // Open input area if hidden
  if(!_chatInputVisible){
    _chatInputVisible=true;
    const area=document.getElementById('chat-input-area');
    const hint=document.getElementById('chat-compose-hint');
    if(area)area.style.display='flex';
    if(hint)hint.style.display='none';
    const btn=document.getElementById('btn-chat-compose');
    if(btn)btn.textContent='✖';
  }
  const pos=inp.selectionStart!=null?inp.selectionStart:inp.value.length;
  inp.value=inp.value.slice(0,pos)+e+inp.value.slice(inp.selectionEnd!=null?inp.selectionEnd:pos);
  inp.focus();
  const newPos=pos+e.length;
  inp.setSelectionRange(newPos,newPos);
}

// Emoji button listener
document.getElementById('btn-chat-emoji').addEventListener('click',()=>{
  if(_chatSection==='room')toggleEmojiPicker();
});

// Initial chat preview poll
setTimeout(startChatPoll,1500);

