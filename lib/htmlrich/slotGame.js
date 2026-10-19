const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Slot machine HTML game (Fruit Bonanza) — dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 *
 * HTML game digabung langsung di sini (bukan file terpisah) supaya gampang
 * dikembangkan tanpa harus loncat antar file untuk satu game yang sama.
 */

const SLOT_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:Arial,sans-serif}
body{padding:8px;background:radial-gradient(circle at 50% 8%,#1d6a50,#0f4938 48%,#07291f)}
.machine{position:relative;padding:10px;border:3px solid #071f18;border-radius:18px;background:linear-gradient(110deg,#061e17,#1b644b 24%,#15543f 54%,#071f18);box-shadow:inset 0 0 0 2px #b9954d,0 8px 16px #000c}
.title{padding:8px;border:2px solid #b99a54;border-radius:12px;color:#e9e3bc;background:radial-gradient(ellipse at 50% 0,#2b8a6c,#11513f);text-align:center;font:700 20px Impact,sans-serif}
.stats{display:flex;gap:6px;margin:8px 0;padding:6px;border:2px solid #537d64;border-radius:8px;background:#0b3025}
.stat{flex:1;text-align:center;color:#91b59f;font:bold 10px monospace}.stat b{display:block;color:#e3dfbb;font-size:14px}
.frame{padding:6px;border:3px solid #315c47;border-radius:12px;background:#174936}
.reelbox{height:150px;border-radius:8px;overflow:hidden;background:#071a14}
#reelCanvas{display:block;width:100%;height:100%}
.message{margin:8px 0;padding:8px;border:2px solid #537d64;border-radius:8px;color:#e3dfbb;background:#061812;text-align:center;font:bold 13px monospace}
.console{display:grid;grid-template-columns:1fr 1.7fr;gap:8px}
button{height:44px;border:0;border-radius:10px;color:#fff;font-weight:900}
.bet{background:linear-gradient(#4f9a77,#216348)}
.spin{background:radial-gradient(circle at 50% 32%,#a8d96f,#4b8d46 47%,#1e542f);font-size:16px}
.over{position:absolute;inset:0;display:grid;place-items:center;background:#080100ed;color:#ffe5a0;text-align:center}
.over.off{display:none}
.over button{padding:0 22px;background:#ffd15a;color:#271204}
</style></head><body>
<div class="machine" id="machine">
  <div class="title">FRUIT BONANZA</div>
  <div class="stats">
    <div class="stat">CREDITS<b id="credits">500</b></div>
    <div class="stat">BET<b id="betValue">10</b></div>
    <div class="stat">BEST WIN<b id="best">0</b></div>
  </div>
  <div class="frame"><div class="reelbox"><canvas id="reelCanvas"></canvas></div></div>
  <div id="message" class="message">SPIN TO PLAY</div>
  <div class="console">
    <button id="bet" class="bet">BET +</button>
    <button id="spin" class="spin">SPIN</button>
  </div>
  <div id="over" class="over off">
    <div><h2>GAME OVER</h2><p>Best Win: <b id="finalBest">0</b></p>
    <button id="restart">NEW GAME</button></div>
  </div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var labels=['cherry','lemon','bell','diamond','7','BAR'],weights=[30,25,18,12,8,7],pays=[2,3,5,8,12,20];
var credits=500,bet=10,best=0,busy=false,winCells=[],reels=[],sparks=[],winUntil=0;
var canvas=document.getElementById('reelCanvas'),ctx=canvas.getContext('2d');
var C=document.getElementById('credits'),BV=document.getElementById('betValue'),BS=document.getElementById('best');
var MSG=document.getElementById('message'),SP=document.getElementById('spin'),BT=document.getElementById('bet');
var OV=document.getElementById('over'),FB=document.getElementById('finalBest'),MCH=document.getElementById('machine');
var D=Math.min(devicePixelRatio||1,2),W,H,last=0,startTime=0;
var audioCtx=null;
function actx(){if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}
function tone(freq,dur,type,vol,delayMs){var ac=actx();if(!ac)return;var t0=ac.currentTime+(delayMs||0)/1000;var osc=ac.createOscillator(),gain=ac.createGain();osc.type=type||'sine';osc.frequency.setValueAtTime(freq,t0);gain.gain.setValueAtTime(0,t0);gain.gain.linearRampToValueAtTime(vol||0.16,t0+0.01);gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);osc.connect(gain).connect(ac.destination);osc.start(t0);osc.stop(t0+dur+0.02)}
function playBet(){SFX.clink()}
function playSpinStart(){SFX.whirr()}
function playReelStop(col){SFX.clunk(col)}
function playWin(){SFX.win()}
function playJackpot(){SFX.jackpot()}
function playLose(){SFX.lose()}
function playGameOver(){SFX.over(0)}
function pick(){var n=Math.random()*100,s=0;for(var i=0;i<weights.length;i++){s+=weights[i];if(n<s)return i}return 0}
function buildStrip(){var a=[];for(var i=0;i<80;i++)a.push(pick());return a}
function resize(){var r=canvas.getBoundingClientRect();W=r.width;H=r.height;canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);ctx.setTransform(D,0,0,D,0,0);draw()}
function ui(){C.textContent=credits;BV.textContent=bet;BS.textContent=best}
function clearWins(){winCells=[];sparks=[];winUntil=0}
for(var c=0;c<5;c++)reels.push({strip:buildStrip(),pos:Math.floor(Math.random()*60),speed:0,stop:0,stopped:true,decelStart:null,from:0,target:0});
function mod(n,m){return((n%m)+m)%m}
function icon(v,s){
  var g;
  if(v===0){
    ctx.strokeStyle='#2e7d32';ctx.lineWidth=s*0.14;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-s*0.45,s*0.3);ctx.quadraticCurveTo(-s*0.4,-s*0.6,s*0.1,-s*0.9);ctx.moveTo(s*0.5,s*0.4);ctx.quadraticCurveTo(s*0.4,-s*0.5,s*0.1,-s*0.9);ctx.stroke();
    ctx.fillStyle='#43a047';ctx.beginPath();ctx.ellipse(s*0.38,-s*0.82,s*0.34,s*0.15,-0.4,0,6.283);ctx.fill();
    [[-0.45,0.4],[0.5,0.5]].forEach(function(c){g=ctx.createRadialGradient(c[0]*s-s*0.15,c[1]*s-s*0.15,s*0.05,c[0]*s,c[1]*s,s*0.55);g.addColorStop(0,'#ff8a80');g.addColorStop(1,'#c62828');ctx.fillStyle=g;ctx.beginPath();ctx.arc(c[0]*s,c[1]*s,s*0.5,0,6.283);ctx.fill();ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(c[0]*s-s*0.17,c[1]*s-s*0.17,s*0.09,0,6.283);ctx.fill();});
  }else if(v===1){
    ctx.fillStyle='#f9c80e';ctx.beginPath();ctx.arc(-s*0.95,s*0.15,s*0.16,0,6.283);ctx.arc(s*0.95,-s*0.15,s*0.16,0,6.283);ctx.fill();
    g=ctx.createLinearGradient(0,-s*0.7,0,s*0.7);g.addColorStop(0,'#fff176');g.addColorStop(1,'#f9a825');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,s*0.97,s*0.68,-0.3,0,6.283);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.ellipse(-s*0.3,-s*0.28,s*0.3,s*0.1,-0.5,0,6.283);ctx.fill();
  }else if(v===2){
    g=ctx.createLinearGradient(-s*0.8,0,s*0.8,0);g.addColorStop(0,'#c99700');g.addColorStop(0.45,'#ffe066');g.addColorStop(1,'#b8860b');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-s*0.8,s*0.55);ctx.bezierCurveTo(-s*0.7,s*0.1,-s*0.6,-s*0.9,0,-s*0.9);ctx.bezierCurveTo(s*0.6,-s*0.9,s*0.7,s*0.1,s*0.8,s*0.55);ctx.closePath();ctx.fill();
    ctx.fillStyle='#a67c00';ctx.beginPath();ctx.ellipse(0,s*0.55,s*0.92,s*0.15,0,0,6.283);ctx.fill();
    ctx.fillStyle='#8a6508';ctx.beginPath();ctx.arc(0,s*0.82,s*0.18,0,6.283);ctx.fill();
    ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.arc(0,-s*0.95,s*0.12,0,6.283);ctx.fill();
  }else{
    g=ctx.createLinearGradient(-s,-s*0.5,s,s);g.addColorStop(0,'#b2ebf2');g.addColorStop(1,'#0097a7');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-s*0.55,-s*0.55);ctx.lineTo(s*0.55,-s*0.55);ctx.lineTo(s*0.95,-s*0.05);ctx.lineTo(0,s*0.95);ctx.lineTo(-s*0.95,-s*0.05);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-s*0.95,-s*0.05);ctx.lineTo(s*0.95,-s*0.05);ctx.moveTo(-s*0.55,-s*0.55);ctx.lineTo(-s*0.3,-s*0.05);ctx.lineTo(0,s*0.95);ctx.moveTo(s*0.55,-s*0.55);ctx.lineTo(s*0.3,-s*0.05);ctx.lineTo(0,s*0.95);ctx.moveTo(-s*0.3,-s*0.05);ctx.lineTo(0,-s*0.55);ctx.lineTo(s*0.3,-s*0.05);ctx.stroke();
  }
}
function symbol(col,row,index,x,y,w,h,curve){
  var value=reels[col].strip[mod(index,reels[col].strip.length)];
  var won=winCells.some(function(v){return v[0]===col&&v[1]===row});
  var pulse=won?1+.09*Math.sin(performance.now()/85):1;
  if(won){var glow=ctx.createRadialGradient(x+w/2,y+h/2,2,x+w/2,y+h/2,w*.72);glow.addColorStop(0,'rgba(255,247,159,.92)');glow.addColorStop(1,'rgba(44,126,75,0)');ctx.fillStyle=glow;ctx.fillRect(x,y,w,h)}
  ctx.save();ctx.translate(x+w/2,y+h/2);ctx.scale(pulse,curve*pulse);ctx.textAlign='center';ctx.textBaseline='middle';
  if(value===4){ctx.font='900 '+Math.floor(h*.72)+'px Impact';ctx.fillStyle='#f31c2b';ctx.fillText('7',0,2)}
  else if(value===5){ctx.font='900 '+Math.floor(h*.29)+'px Arial Black';ctx.fillStyle='#861019';ctx.beginPath();ctx.ellipse(0,0,w*.38,h*.25,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0b4';ctx.fillText('BAR',0,1)}
  else{icon(value,h*.3)}
  ctx.restore();
}
function draw(){if(!W||!H)return;ctx.clearRect(0,0,W,H);var rw=W/5,rh=H/3;
  for(var c=0;c<5;c++){var x=c*rw,reel=reels[c],base=Math.floor(reel.pos),frac=reel.pos-base;
    var bg=ctx.createLinearGradient(x,0,x+rw,0);bg.addColorStop(0,'#8f6a39');bg.addColorStop(.5,'#fffdf0');bg.addColorStop(1,'#79552c');
    ctx.fillStyle=bg;ctx.fillRect(x,0,rw,H);ctx.save();ctx.beginPath();ctx.rect(x,0,rw,H);ctx.clip();
    ctx.filter=reel.speed>5?'blur(1.3px)':'none';
    for(var k=-1;k<5;k++){var y=(k-frac)*rh,center=(y+rh/2)/H,curve=.78+.22*Math.cos((center-.5)*Math.PI);symbol(c,k,base+k,x,y,rw,rh,curve)}
    ctx.restore();ctx.filter='none';if(c){ctx.fillStyle='#573512';ctx.fillRect(x-1,0,2,H)}}
}
function frame(now){if(!busy)return;var dt=Math.min((now-last)/1000,.035);last=now;var stopped=0;
  for(var c=0;c<5;c++){var r=reels[c],elapsed=now-startTime;
    if(elapsed<180){r.speed=23*(elapsed/180);r.pos+=r.speed*dt}
    else if(elapsed<r.stop){r.speed=23;r.pos+=r.speed*dt}
    else{if(r.decelStart===null){r.decelStart=now;r.from=r.pos;r.target=Math.ceil(r.pos)+7}
      var p=Math.min(1,(now-r.decelStart)/720),ease=1-Math.pow(1-p,4);
      r.pos=r.from+(r.target-r.from)*ease;r.speed=(r.target-r.from)*4*Math.pow(1-p,3)/.72;
      if(p>=1){r.pos=r.target;r.speed=0;if(!r.stopped)playReelStop(c);r.stopped=true}}
    if(r.stopped)stopped++}
  draw();if(stopped===5){busy=false;setTimeout(evaluate,150)}else requestAnimationFrame(frame)}
function boardValue(col,row){var r=reels[col];return r.strip[mod(Math.round(r.pos)+row,r.strip.length)]}
function evaluate(){var patterns=[[0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2]],total=0;
  patterns.forEach(function(p){var a=boardValue(0,p[0]),count=1;for(var x=1;x<5&&boardValue(x,p[x])===a;x++)count++;
    if(count>=3){total+=Math.floor(bet*pays[a]*(count===3?1:count===4?2:5));for(var x=0;x<count;x++)winCells.push([x,p[x]])}});
  if(total){credits+=total;best=Math.max(best,total);var jackpot=total>=bet*20;MSG.textContent=jackpot?'JACKPOT +'+total:'WIN +'+total;jackpot?playJackpot():playWin()}
  else{MSG.textContent='YOU LOSE';playLose()}
  SP.disabled=false;BT.disabled=false;ui();draw();
  if(credits<10)setTimeout(function(){FB.textContent=best;OV.className='over';playGameOver()},800);
  else if(bet>credits){bet=10;ui()}}
function spin(){if(busy||credits<bet)return;busy=true;clearWins();credits-=bet;ui();SP.disabled=true;BT.disabled=true;MSG.textContent='GOOD LUCK';playSpinStart();
  startTime=performance.now();last=startTime;
  for(var c=0;c<5;c++){reels[c].speed=0;reels[c].stop=1050+c*220;reels[c].stopped=false;reels[c].decelStart=null}
  requestAnimationFrame(frame)}
BT.onclick=function(){if(busy)return;bet=bet===10?20:bet===20?50:10;if(bet>credits)bet=10;playBet();ui()};
SP.onclick=spin;
document.getElementById('restart').onclick=function(){credits=500;bet=10;best=0;busy=false;OV.className='over off';MSG.textContent='SPIN TO PLAY';SP.disabled=false;BT.disabled=false;clearWins();ui();draw()};
addEventListener('resize',resize);ui();resize();
})();</script></body></html>
`.trim();

const buildSlotMessage = () => buildHtmlMessage(SLOT_HTML);
const sendSlotGame = (sock, jid) => sendHtmlGame(sock, jid, SLOT_HTML);

module.exports = { sendSlotGame, buildSlotMessage, SLOT_HTML };