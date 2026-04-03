const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// ── 1. 版本号 & 公告 ──
h = h.replace("const GAME_VERSION = 'v0.3.3';", "const GAME_VERSION = 'v0.3.4';");
h = h.replace(
`const CHANGELOG = [
  { version:'v0.3.3', date:'2026-04-03', items:[`,
`const CHANGELOG = [
  { version:'v0.3.4', date:'2026-04-03', items:[
    '聊天室昵称唯一性验证：重名提示请换一个',
    '聊天室屏蔽不雅词语',
    '聊天不再自动滚到底部（滑轮回看历史消息时不打断）',
    '聊天彩色消息：#R红 #Y黄 #B蓝 #G绿 #P粉 #小九牛逼彩色',
  ]},
  { version:'v0.3.3', date:'2026-04-03', items:[`
);

// ── 2. sendChatMsg：加脏字过滤 ──
h = h.replace(
`async function sendChatMsg(text){
  const url=getChatUrl();if(!url||!text.trim())return false;
  try{
    const r=await fetch(url+'/chat.json',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nick:getChatNick(),text:text.trim().slice(0,100),time:Date.now()})
    });
    SFX.play('send');return r.ok;
  }catch{return false;}
}`,
`const _BAD_WORDS=['操','妈的','傻逼','草泥马','cnm','nmsl','cnmd','nmd','tmd','sb','fuck','shit','bitch','asshole','bastard','damn','cunt','dick','傻x','diao','JB','NMBD'];
function _hasBadWord(t){const l=t.toLowerCase();return _BAD_WORDS.some(w=>l.includes(w.toLowerCase()));}
function parseColorMsg(raw){
  const safe=raw.replace(/</g,'&lt;');
  if(raw.startsWith('#R '))return'<span style="color:#f44">'+safe.slice(3)+'</span>';
  if(raw.startsWith('#Y '))return'<span style="color:#fd4">'+safe.slice(3)+'</span>';
  if(raw.startsWith('#B '))return'<span style="color:#5af">'+safe.slice(3)+'</span>';
  if(raw.startsWith('#G '))return'<span style="color:#4fd">'+safe.slice(3)+'</span>';
  if(raw.startsWith('#P '))return'<span style="color:#f8a">'+safe.slice(3)+'</span>';
  if(raw.startsWith('#小九牛逼 ')){
    const cs=['#f44','#f84','#fd4','#4fd','#5af','#a4f','#f8a'];
    return[...safe.slice(6)].map((c,i)=>'<span style="color:'+cs[i%cs.length]+'">'+c+'</span>').join('');
  }
  return safe;
}
async function sendChatMsg(text){
  const url=getChatUrl();if(!url||!text.trim())return false;
  if(_hasBadWord(text)){
    const inp=document.getElementById('chat-input');
    if(inp){inp.style.borderColor='#f44';setTimeout(()=>{inp.style.borderColor='#48f';},1500);}
    const hint=document.getElementById('chat-compose-hint');
    const orig=hint?.textContent;
    if(hint){hint.textContent='⚠️ 消息含不雅词语';hint.style.color='#f44';setTimeout(()=>{hint.textContent=orig||'';hint.style.color='';},2000);}
    return false;
  }
  try{
    const r=await fetch(url+'/chat.json',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nick:getChatNick(),text:text.trim().slice(0,100),time:Date.now()})
    });
    SFX.play('send');return r.ok;
  }catch{return false;}
}`
);

// ── 3. renderChatMsgs：自动滚动修复 + 颜色解析 ──
h = h.replace(
`function renderChatMsgs(msgs){
  const el=document.getElementById('chat-messages');if(!el)return;
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
    if(own){
      // 自己：时间在左 → 气泡 → 头像在右
      return '<div class="chat-msg own-msg">'+
        '<span class="chat-time-own">'+ts+'</span>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+myNick.replace(/</g,'&lt;')+'</span>'+
        (m.text||'').replace(/</g,'&lt;')+
        '</div>'+
        '<div class="chat-avatar" style="border-color:'+bc+';box-shadow:'+bsh+'">'+myEmoji+'</div>'+
        '</div>';
    } else {
      // 他人：头像在左 → 气泡
      const firstCh=(m.nick||'?').charAt(0);
      return '<div class="chat-msg">'+
        '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4fd">'+firstCh+'</div>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
        (m.text||'').replace(/</g,'&lt;')+
        '<span class="chat-time"> '+ts+'</span>'+
        '</div></div>';
    }
  }).join('');
  el.scrollTop=el.scrollHeight;
}`,
`function renderChatMsgs(msgs){
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
      return '<div class="chat-msg">'+
        '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4fd">'+firstCh+'</div>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
        colored+
        '<span class="chat-time"> '+ts+'</span>'+
        '</div></div>';
    }
  }).join('');
  if(wasAtBottom) el.scrollTop=el.scrollHeight;
}`
);

// ── 4. 保存昵称：异步检查重名 ──
h = h.replace(
`document.getElementById('btn-profile-save').addEventListener('click',()=>{
  const ni=document.getElementById('profile-name-input');
  const name=(ni.value||'').trim().slice(0,10);
  if(!name){
    ni.style.borderColor='#f44';
    ni.placeholder='请输入昵称！';
    return;
  }
  ni.style.borderColor='#48f';
  _chatNick=name;
  try{localStorage.setItem('pw_chat_nick',name);localStorage.setItem('pw_nick_set','1');}catch(e){}
  try{localStorage.setItem('pw_gender',_profGender);}catch(e){}
  try{localStorage.setItem('pw_avatar_frame',_profFrame);}catch(e){}
  updateMenuAvatar();
  SFX.play('levelup');
  if(_profileFromChat) showOverlay('o-chat');
  else showOverlay('o-menu');
});`,
`async function _isNickTaken(nick){
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
});`
);

fs.writeFileSync('index.html', h, 'utf8');
console.log('Done. Size:', h.length);
