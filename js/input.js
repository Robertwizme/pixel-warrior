'use strict';

// ── iOS button touch fix ──
// iOS Safari sometimes doesn't fire click on buttons inside overlays.
// Use touchend delegation to guarantee button response on all mobile browsers.
if ('ontouchstart' in window) {
  let _tapX = 0, _tapY = 0;
  document.addEventListener('touchstart', function(e){
    _tapX = e.touches[0].clientX; _tapY = e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    const touch = e.changedTouches[0];
    if (!touch) return;
    if (Math.abs(touch.clientX - _tapX) > 10 || Math.abs(touch.clientY - _tapY) > 10) return;
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    const overlay = btn.closest('.overlay.active, #menu-topbar');
    if (!overlay) return;
    e.preventDefault();
    btn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}));
  }, {passive:false});
}

// ── 横屏全屏（用户手势触发时尝试）──
function _requestFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
    req.call(el).catch(()=>{});
  }
}
document.addEventListener('touchstart', _requestFullscreen, {passive:true, once:true});
// 旋转提示由纯 CSS media query 控制，无需 JS 干预

// ═══════════════════════════════════════════════════════
// §1  Canvas + resize + input
// ═══════════════════════════════════════════════════════
const canvas = document.getElementById('gc');
const ctx    = canvas.getContext('2d');
const GW = 480, GH = 270;
canvas.width = GW; canvas.height = GH;

function resizeCanvas() {
  const s = Math.min(window.innerWidth/GW, window.innerHeight/GH);
  canvas.style.width  = (GW*s)+'px';
  canvas.style.height = (GH*s)+'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Mobile touch controls ──
const _joyZone  = document.getElementById('joy-zone');
const _joyStick = document.getElementById('joy-stick');
const _joyBg    = document.getElementById('joy-bg');
const _skillBtn = document.getElementById('skill-btn');
let _joyTouchId = null;
const JOY_R = 36;

function _setMobileVisible(v) {
  _joyZone.style.display  = v ? 'block' : 'none';
  _skillBtn.style.display = v ? 'flex'  : 'none';
}

function _updateJoy(touch) {
  const r = _joyBg.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  let dx = touch.clientX - cx, dy = touch.clientY - cy;
  const d = Math.sqrt(dx*dx+dy*dy);
  if (d > JOY_R) { dx = dx/d*JOY_R; dy = dy/d*JOY_R; }
  _joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  const t = JOY_R * 0.28;
  keys['KeyW'] = keys['ArrowUp']    = dy < -t;
  keys['KeyS'] = keys['ArrowDown']  = dy >  t;
  keys['KeyA'] = keys['ArrowLeft']  = dx < -t;
  keys['KeyD'] = keys['ArrowRight'] = dx >  t;
}

function _clearJoy() {
  _joyTouchId = null;
  _joyStick.style.transform = 'translate(-50%,-50%)';
  keys['KeyW']=keys['KeyS']=keys['KeyA']=keys['KeyD']=false;
  keys['ArrowUp']=keys['ArrowDown']=keys['ArrowLeft']=keys['ArrowRight']=false;
}

_joyZone.addEventListener('touchstart', e => {
  e.preventDefault();
  if (_joyTouchId == null) { _joyTouchId = e.changedTouches[0].identifier; _updateJoy(e.changedTouches[0]); }
}, { passive:false });
_joyZone.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === _joyTouchId) { _updateJoy(t); break; }
}, { passive:false });
_joyZone.addEventListener('touchend',   e => { e.preventDefault(); _clearJoy(); }, { passive:false });
_joyZone.addEventListener('touchcancel',e => { e.preventDefault(); _clearJoy(); }, { passive:false });

_skillBtn.addEventListener('touchstart', e => { e.preventDefault(); keys['Space']=true;  _skillBtn.classList.add('pressing'); },    { passive:false });
_skillBtn.addEventListener('touchend',   e => { e.preventDefault(); keys['Space']=false; _skillBtn.classList.remove('pressing'); }, { passive:false });
_skillBtn.addEventListener('touchcancel',e => { e.preventDefault(); keys['Space']=false; _skillBtn.classList.remove('pressing'); }, { passive:false });

// Only show joystick on touch-primary devices (phones/tablets), NOT on desktop with mouse
const _isTouchDevice = window.matchMedia('(pointer:coarse)').matches;
// _setMobileVisible called during gameplay only

