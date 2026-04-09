// §28 Codex (图鉴)
const _CODEX_ENEMY_META = {
  slime:      { icon:'🟢', name:'史莱姆',    waveFirst:1,  waveDesc:'第1波起出现，全程都有',             special:'无特殊行为，直线冲向玩家，数量最多',                        desc:'成群结队的绿色软体怪，血薄速慢，适合练手阶段' },
  goblin:     { icon:'👺', name:'哥布林',    waveFirst:2,  waveDesc:'第2波起出现',                       special:'移速较快，常与史莱姆混编出现',                               desc:'狡猾的小妖精，速度较快，常与史莱姆混编出现' },
  skeleton:   { icon:'💀', name:'骷髅兵',    waveFirst:4,  waveDesc:'第4波起出现',                       special:'无特殊行为，均衡型普通怪',                                    desc:'不死亡灵，血量中等，攻击力适中，是中期的标准威胁' },
  bat:        { icon:'🦇', name:'吸血蝙蝠',  waveFirst:5,  waveDesc:'第5波起出现',                       special:'移动速度极高，难以用慢速武器击中，成群时威胁极大',              desc:'移速极快，难以追踪，成群来袭时威胁极大' },
  orc:        { icon:'👹', name:'兽人勇士',  waveFirst:6,  waveDesc:'第6波起出现',                       special:'高HP高伤害，需优先消灭，避免贴身',                              desc:'强壮的战士，高血量高伤害，但行动迟缓' },
  wolf:       { icon:'🐺', name:'野狼',      waveFirst:8,  waveDesc:'第8波起出现，中后期大量出现',       special:'极速冲锋，成群围攻，大范围AoE武器克制效果好',                  desc:'速度极快的猛兽，以群体围攻方式猎杀目标' },
  troll:      { icon:'🗿', name:'石魔',      waveFirst:12, waveDesc:'第12波起出现',                      special:'血量极高但移速最慢，适合用射程武器持续消耗',                    desc:'岩石巨型生物，血量庞大但移动极为迟缓' },
  demon:      { icon:'😈', name:'恶魔',      waveFirst:13, waveDesc:'第13波起出现，后期成为主力',        special:'均衡属性，后期数量极多，需要强力AoE才能有效应对',               desc:'来自地狱的存在，各属性均衡，综合威胁极高' },
  archer:     { icon:'🏹', name:'弓箭手',    waveFirst:6,  waveDesc:'第6波起混入编队（2～7只）',         special:'保持约180px距离持续射箭，玄武护盾可抵挡其弓箭，近战武器难以追上', desc:'远程攻击型怪物，保持安全距离向玩家射箭' },
  boss_10:    { icon:'🐉', name:'暗影龙王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'生命值极高，移速较慢，优先叠DPS，剑阵/散弹对其效果佳',          desc:'第10波Boss之一，速度较慢但生命极高' },
  boss_10_cat:{ icon:'🐱', name:'暴食猫王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'速度快、伤害高，需保持移动并配合治疗无人机续命',                desc:'第10波Boss之一，攻击频率高，行动敏捷' },
  boss_10_dog:{ icon:'🐶', name:'狂野犬王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'三个10波Boss中最危险，高速+高伤，建议配合闪避天赋',             desc:'第10波Boss之一，移速最快，伤害最高，极难躲避' },
  boss_20:    { icon:'🌋', name:'熔岩霸主',  waveFirst:20, waveDesc:'第20波固定出现',                    special:'HP 14000、伤害75，需满级武器+多重天赋方可正面硬撼',             desc:'第20波大Boss，体型巨大，需要全套强化才能应对' },
  boss_30:    { icon:'🌌', name:'虚空领主',  waveFirst:30, waveDesc:'第30波最终Boss',                    special:'HP 38000、伤害130，击败后通关游戏，推荐飞剑+天才搭配',          desc:'最终Boss，最强大的存在，击败它意味着征服全部30波' },
};

const _CODEX_CLASS_META = {
  doctor:    { icon:'💊', regen:5,  xpBonus:0,
    passive:'每次从任何来源回复100HP时，永久+5%全局伤害（可无限叠加）',
    skillName:'妙手回春', skillEffect:'立刻回复100HP', skillCd:30 },
  berserker: { icon:'⚔',  regen:2,  xpBonus:0,
    passive:'每次升级，最大HP永久+5',
    skillName:'狂暴', skillEffect:'20秒内所有伤害×2', skillCd:50 },
  blacksmith:{ icon:'⚒',  regen:1,  xpBonus:0,
    passive:'所有物理系武器（散弹/加特林/狙击）伤害永久+50%',
    skillName:'临阵磨枪', skillEffect:'10秒内所有武器冷却-40%', skillCd:50 },
  mage:      { icon:'🔮', regen:1,  xpBonus:0,
    passive:'所有魔法系武器（箭雨/剑阵）伤害永久+50%',
    skillName:'法力无天', skillEffect:'10秒内所有AoE范围+30%', skillCd:45 },
  scholar:   { icon:'🎓', regen:1,  xpBonus:50,
    passive:'无法通过升级卡获得移速加成，但经验获取速度比任何职业都快',
    skillName:'经验老道', skillEffect:'瞬间吸取全场所有飘落的经验球', skillCd:50 },
  reaper:    { icon:'🎯', regen:1,  xpBonus:0,
    passive:'枪械武器伤害+50%，且所有武器冷却时间永久×0.75（即-25%）',
    skillName:'狙神', skillEffect:'瞄准7.49秒后，秒杀当前HP最高的目标', skillCd:542 },
  kirby:     { icon:'🌀', regen:1,  xpBonus:0,
    passive:'拥有四种形态：🔥火焰（火球）/ ⚔剑士（轨道剑）/ ⚡雷电（闪电）/ ❄冰冻（冰球）',
    skillName:'模仿', skillEffect:'吞下最近的怪物，随机切换一种形态', skillCd:120 },
  santa:     { icon:'🎅', regen:1,  xpBonus:0,
    passive:'初始幸运+5；场上有0.5%概率随机生成超大礼盒（含大量道具）',
    skillName:'圣诞礼物', skillEffect:'在附近随机生成多个礼盒掉落道具', skillCd:60 },
  chosen:    { icon:'⭐', regen:1,  xpBonus:0,
    passive:'每1点幸运值 = 全局伤害+1%（初始幸运+20即开局+20%伤害，无上限）',
    skillName:'☄ 流星', skillEffect:'幸运越高流星越大，秒杀场上所有非Boss敌人', skillCd:50 },
};

const _CODEX_WEAPON_META = {
  shotgun:     { baseDmg:'10 → 38', baseCD:'1.4s → 1.1s', range:'近距扇形',
    desc:'扇形同时射出5颗子弹，近战强势，范围广，新手友好。Lv8解锁双枪模式同时射出两组。',
    recommend:'铁匠（+50%物理）· 力量强化 · 急速出手 · 时间裂隙' },
  gatling:     { baseDmg:'16 → 56', baseCD:'0.9s → 0.78s/发', range:'中远直线',
    desc:'高速8连发弹幕，连发后短暂停顿，远距持续压制，后期DPS极高。Lv8解锁双枪齐射。',
    recommend:'铁匠（+50%物理）· 急速出手 · 混沌之力 · 时间裂隙' },
  sword:       { baseDmg:'10 → 42 /把', baseCD:'持续旋转', range:'环绕 40-52px',
    desc:'生成2-5把轨道剑绕玩家旋转，自动打击周围所有敌人，无需瞄准，贴脸战斗最优。',
    recommend:'法师（+50%魔法）· 扩展攻击 · 元素共鸣 · 多重射击' },
  arrow_rain:  { baseDmg:'20 → 66', baseCD:'2.4s → 1.3s', range:'大范围落点',
    desc:'从空中密集落下箭雨，范围覆盖广，适合清理密集群怪，冷却时间较长。',
    recommend:'法师（+50%魔法）· 扩展攻击 · 混沌之力 · 元素共鸣' },
  heal_drone:  { baseDmg:'治疗 4→16 HP/s', baseCD:'光圈CD: 10→5s', range:'光圈38-50px',
    desc:'治疗无人机，定期在脚下生成治疗光圈，站在光圈内持续回血，超强续战能力。',
    recommend:'强化体魄 · 即时治愈 · 疾风步法（保持在光圈内移动）' },
  missile_drone:{ baseDmg:'50+（爆炸AOE）', baseCD:'5s / 轮', range:'爆炸半径20px',
    desc:'每5秒发射6枚导弹自动锁定最近敌人，落点爆炸AOE，可选原地/开路/狂轰三种模式。',
    recommend:'扩展攻击 · 混沌之力 · 多重射击 · 元素共鸣' },
  sniper:      { baseDmg:'120（基础）', baseCD:'3.5s → 2.5s', range:'全屏穿透',
    desc:'超高单体伤害，每发穿透1次，可升级为连射/重狙/成长型/合金弹等多条流派。',
    recommend:'西蒙·海耶（+50%枪械）· 急速出手 · 混沌之力 · 幸运星' },
  flying_sword:{ baseDmg:'50 /把（×4把）', baseCD:'2.0s → 1.0s(Lv8)', range:'全屏锁定',
    desc:'抽奖限定，每2秒发射4把飞剑锁定最近敌，40%暴击×3倍，可叠加元素，8级万剑归宗。',
    recommend:'混沌之力 · 急速出手 · 天选者（幸运提升暴击收益）' },
  kirby_copy:  { baseDmg:'随形态变化', baseCD:'形态专属', range:'形态专属',
    desc:'模仿者职业专属，四种形态各有特色：火球喷射/轨道剑/闪电链/冰球，切换时机决定输出效率。',
    recommend:'（仅模仿者可用）扩展攻击 · 元素共鸣 · 混沌之力' },
  black_tortoise:{ baseDmg:'18 → 80（水球）', baseCD:'水球3s / 护盾60s', range:'自主移动',
    desc:'召唤玄武自主战斗，每3s射3颗水球，每60s为玩家提供护盾，8级含多条升级路线。',
    recommend:'强化体魄 · 硬化皮肤（减伤）· 混沌之力 · 扩展攻击' },
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
  _codexTab='monster'; _codexSubtab='normal'; _codexSel=0;
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

function _codexMonsterDetail(k){
  const e=ENEMY_TYPES[k]; const m=_CODEX_ENEMY_META[k];
  if(!e||!m) return _cdxDetail('<div style="color:#555;padding:40px 0;text-align:center">暂无数据</div>');
  const nameColor=e.isBoss?'#f84':'#eee';
  const waveTag=e.isBoss?'<span style="font-size:9px;color:#f44;font-weight:400;margin-left:6px">BOSS</span>':'';
  return _cdxDetail(
    '<div class="cdx-big-icon">'+m.icon+'</div>'+
    '<div class="cdx-item-name" style="color:'+nameColor+'">'+m.name+waveTag+'</div>'+
    '<div class="cdx-item-sub">'+m.waveDesc+'</div>'+
    _cdxStat('❤ HP', e.hp)+
    _cdxStat('⚡ 速度', e.spd)+
    _cdxStat('⚔ 攻击', e.dmg)+
    _cdxStat('✨ 经验', e.xp+' xp')+
    _cdxSection('描述')+_cdxDesc(m.desc)+
    _cdxSection('特殊行为')+_cdxDesc(m.special)
  );
}

function _codexClassDetail(c){
  const m=_CODEX_CLASS_META[c.id]||{icon:'⚔',regen:1,xpBonus:0,passive:'—',skillName:'—',skillEffect:'—',skillCd:0};
  return _cdxDetail(
    '<div class="cdx-big-icon">'+m.icon+'</div>'+
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
      :['slime','goblin','skeleton','bat','orc','wolf','troll','demon','archer'];
    items=keys.map(k=>({k}));
    iconFn=it=>(_CODEX_ENEMY_META[it.k]||{icon:'?'}).icon;
    nameFn=it=>(_CODEX_ENEMY_META[it.k]||{name:'?'}).name;
    detailFn=it=>_codexMonsterDetail(it.k);
  } else if(_codexTab==='char'){
    items=CLASSES;
    iconFn=c=>(_CODEX_CLASS_META[c.id]||{icon:'⚔'}).icon;
    nameFn=c=>c.name;
    detailFn=c=>_codexClassDetail(c);
  } else if(_codexTab==='weapon'){
    const keys=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','kirby_copy','flying_sword','black_tortoise'];
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
