'use strict';

// ── §0b  Background Music (Web Audio chiptune) ──
let _musicEnabled = true;
let _audioCtx = null;
let _musicLoopTimer = null;
let _musicStarted = false;

const _N = { // note frequencies
  C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196.00,A3:220.00,B3:246.94,
  C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392.00,A4:440.00,B4:493.88,
  C5:523.25,D5:587.33,E5:659.25,G5:783.99,R:0
};
// 8-bar pixel RPG melody [note, beats] (120bpm = 0.5s/beat)
const _MELODY = [
  ['E5',.5],['D5',.5],['C5',.5],['D5',.5],
  ['E5',.5],['E5',.5],['E5',1],
  ['D5',.5],['D5',.5],['D5',1],
  ['E5',.5],['G5',.5],['G5',1],
  ['E5',.5],['D5',.5],['C5',.5],['D5',.5],
  ['E5',.5],['E5',.5],['E5',.5],['E5',.5],
  ['D5',.5],['D5',.5],['E5',.5],['D5',.5],
  ['C5',2],
];
const _BASS = [
  ['C3',.5],['G3',.5],['C3',.5],['G3',.5],
  ['A3',.5],['E3',.5],['A3',.5],['E3',.5],
  ['F3',.5],['C3',.5],['F3',.5],['C3',.5],
  ['G3',.5],['D3',.5],['G3',.5],['D3',.5],
  ['C3',.5],['G3',.5],['C3',.5],['G3',.5],
  ['A3',.5],['E3',.5],['A3',.5],['E3',.5],
  ['F3',.5],['C3',.5],['G3',.5],['D3',.5],
  ['C3',2],
];
const _BEAT = 0.5; // seconds per beat at 120bpm

function _playNote(ctx, freq, start, dur, type, vol) {
  if (!freq) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.85);
  o.connect(g); g.connect(ctx.destination);
  o.start(start); o.stop(start + dur);
}

function _scheduleMusic(ctx, t0) {
  if (!_musicEnabled) return;
  _MELODY.forEach(([n,b])=>{ _playNote(ctx, _N[n]||0, t0, b*_BEAT*0.92, 'square', 0.06); t0+=b*_BEAT; });
  let tb=0; const t1=ctx.currentTime + 0.05;
  _BASS.forEach(([n,b])=>{ _playNote(ctx, _N[n]||0, t1+tb, b*_BEAT*0.92, 'triangle', 0.09); tb+=b*_BEAT; });
  const loopLen = _MELODY.reduce((s,[,b])=>s+b,0)*_BEAT;
  _musicLoopTimer = setTimeout(()=>_scheduleMusic(_audioCtx, _audioCtx.currentTime+0.05), (loopLen-0.35)*1000);
}

function startMusic() {
  if (!_musicEnabled) return;
  stopMusic();
  _audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  if (_audioCtx.state==='suspended') _audioCtx.resume();
  _scheduleMusic(_audioCtx, _audioCtx.currentTime+0.1);
}
function stopMusic() {
  if (_musicLoopTimer) { clearTimeout(_musicLoopTimer); _musicLoopTimer=null; }
  if (_audioCtx) { try{_audioCtx.close();}catch(e){} _audioCtx=null; }
}

// ═══════════════════════════════════════════════════════
// §SFX  Sound Effects
// ═══════════════════════════════════════════════════════
const SFX = {
  _ctx: null,
  _get() {
    if (!this._ctx) {
      try { this._ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e) { return null; }
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  },
  _note(ctx, freq, endFreq, t, dur, wave, vol) {
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = wave; o.frequency.setValueAtTime(freq, t);
      if (endFreq !== freq) o.frequency.exponentialRampToValueAtTime(endFreq, t+dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t+dur*0.9);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+dur+0.01);
    } catch(e) {}
  },
  play(type) {
    if (!settings.sfx) return;
    const ctx = this._get(); if (!ctx) return;
    const t = ctx.currentTime;
    const N = this._note.bind(this, ctx);
    switch (type) {
      case 'click':     N(880,880,t,.04,'square',.07); break;
      case 'hit':       N(660,330,t,.07,'square',.09); break;
      case 'death':     N(440,110,t,.13,'sawtooth',.09); break;
      case 'playerhit': N(200,100,t,.10,'sawtooth',.14); break;
      case 'chest':
        [523,659,784].forEach((f,i)=>N(f,f,t+i*.09,.18,'sine',.11)); break;
      case 'levelup':
        [262,330,392,523].forEach((f,i)=>N(f,f,t+i*.09,.12,'square',.09)); break;
      case 'wave':
        [392,494,587,784].forEach((f,i)=>N(f,f,t+i*.1,.14,'square',.09)); break;
      case 'coin':      N(784,1047,t,.09,'triangle',.09); break;
      case 'send':      N(660,880,t,.07,'sine',.08); break;
    }
  }
};
function toggleMusic(on) {
  _musicEnabled = on;
  try { localStorage.setItem('pw_music', on?'1':'0'); } catch(e){}
  on ? startMusic() : stopMusic();
}
function _tryStartMusic() {
  if (!_musicStarted && _musicEnabled) { _musicStarted=true; startMusic(); }
}
document.addEventListener('click',    _tryStartMusic, {passive:true});
document.addEventListener('keydown',  _tryStartMusic, {passive:true});
document.addEventListener('touchstart',_tryStartMusic, {passive:true});

