const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
Pukul Tikus (Whack-a-mole) — ketuk tikus yang muncul dari 9 lubang selama 30 detik.
 * Tikus coklat +1, tikus abu +2 (lebih cepat hilang), bom -3 (jangan diketuk). Makin lama makin cepat.
 * Skor terbaik hanya tersimpan selama game dibuka.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const WHACK_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Trebuchet MS',Verdana,sans-serif}
body{padding:8px;background:#1d5c3a}
.wrap{max-width:420px;margin:0 auto}
.top{display:flex;align-items:stretch;gap:6px;margin-bottom:10px}
.logo{margin-right:auto;align-self:center;font:900 22px/1.05 'Trebuchet MS',Verdana,sans-serif;color:#ffe08a}
.box{min-width:60px;padding:5px 8px;border-radius:8px;background:#144a2d;color:#a8dfbd;font-size:10px;text-align:center}
.box b{display:block;color:#fff;font-size:17px}
.bwrap{position:relative}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;border-radius:14px;background:#144a2d}
.cell{position:relative;aspect-ratio:1/1;overflow:hidden;border-radius:12px;background:#2f8a55;cursor:pointer}
.cell:before{content:'';position:absolute;left:8%;right:8%;bottom:6%;height:34%;border-radius:50%;background:radial-gradient(ellipse at 50% 30%,#3b2414,#1f1209)}
.cr{position:absolute;left:0;right:0;bottom:16%;text-align:center;font-size:clamp(34px,13vw,56px);line-height:1;transform:translateY(90%);opacity:0;transition:transform .09s ease-out,opacity .09s}
.cr.up{transform:translateY(0);opacity:1}
.cr svg{display:block;margin:0 auto;width:clamp(40px,15vw,62px);height:auto}
.fx{position:absolute;left:0;right:0;top:12%;text-align:center;font:900 24px 'Trebuchet MS',Verdana,sans-serif;opacity:0;pointer-events:none}
.fx.show{opacity:1;animation:fl .45s ease-out}
.fx.g{color:#ffe08a}.fx.r{color:#ff6b6b}
@keyframes fl{0%{transform:translateY(8px) scale(.7)}100%{transform:translateY(-10px) scale(1.15)}}
.ov{position:absolute;inset:0;display:grid;place-items:center;text-align:center;border-radius:14px;background:rgba(14,56,34,.94);color:#fff;padding:12px}
.ov.off{display:none}
.ov h2{margin:0 0 6px;font-size:24px;color:#ffe08a}
.ov p{margin:0 0 14px;color:#bfe8cf;font-size:14px;line-height:1.55}
.ov button{padding:11px 26px;border:0;border-radius:10px;font:900 14px 'Trebuchet MS',Verdana,sans-serif;color:#144a2d;background:#ffe08a}
.tip{margin-top:10px;text-align:center;color:#8fcba8;font-size:11px;line-height:1.5}
</style></head><body>
<div class="wrap">
  <div class="top">
    <div class="logo">Pukul<br>Tikus</div>
    <div class="box">WAKTU<b id="tm">30</b></div>
    <div class="box">SKOR<b id="sc">0</b></div>
    <div class="box">TERBAIK<b id="bs">0</b></div>
  </div>
  <div class="bwrap">
    <div class="grid" id="grid"></div>
    <div class="ov" id="ov"><div><h2 id="ot">Pukul Tikus</h2><p id="os">Ketuk tikus yang muncul selama 30 detik.<br>Tikus coklat +1 &nbsp; Tikus abu +2 (cepat) &nbsp; Bom -3 (jangan diketuk)</p><button id="ob">Mulai</button></div></div>
  </div>
  <div class="tip">Makin lama, tikus makin cepat menghilang.</div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var $=function(i){return document.getElementById(i)};
var SV={m:'<svg viewBox="0 0 100 100"><circle cx="22" cy="38" r="9" fill="#6d4c41"/><circle cx="78" cy="38" r="9" fill="#6d4c41"/><ellipse cx="50" cy="62" rx="34" ry="36" fill="#8d6e63"/><ellipse cx="50" cy="72" rx="22" ry="17" fill="#bcaaa4"/><circle cx="38" cy="50" r="5" fill="#111"/><circle cx="62" cy="50" r="5" fill="#111"/><circle cx="39.5" cy="48.5" r="1.6" fill="#fff"/><circle cx="63.5" cy="48.5" r="1.6" fill="#fff"/><ellipse cx="50" cy="62" rx="8" ry="6" fill="#e57373"/><rect x="45" y="70" width="4.5" height="8" rx="1.5" fill="#fff"/><rect x="50.5" y="70" width="4.5" height="8" rx="1.5" fill="#fff"/></svg>',r:'<svg viewBox="0 0 100 100"><circle cx="24" cy="32" r="14" fill="#78909c"/><circle cx="76" cy="32" r="14" fill="#78909c"/><circle cx="24" cy="32" r="8" fill="#f8bbd0"/><circle cx="76" cy="32" r="8" fill="#f8bbd0"/><ellipse cx="50" cy="60" rx="30" ry="34" fill="#90a4ae"/><ellipse cx="50" cy="74" rx="14" ry="16" fill="#cfd8dc"/><circle cx="38" cy="50" r="4.5" fill="#111"/><circle cx="62" cy="50" r="4.5" fill="#111"/><circle cx="39" cy="49" r="1.4" fill="#fff"/><circle cx="63" cy="49" r="1.4" fill="#fff"/><circle cx="50" cy="66" r="5" fill="#f06292"/><path d="M44 72l3 8h6l3-8" fill="#fff"/><path d="M30 66l-16-4M30 70l-16 4M70 66l16-4M70 70l16 4" stroke="#455a64" stroke-width="1.6" stroke-linecap="round"/></svg>',b:'<svg viewBox="0 0 100 100"><circle cx="50" cy="60" r="32" fill="#222"/><ellipse cx="38" cy="48" rx="9" ry="5" fill="rgba(255,255,255,.3)" transform="rotate(-35 38 48)"/><rect x="42" y="22" width="16" height="9" fill="#37474f"/><path d="M50 22q10-14 22-8" stroke="#d7a86e" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="73" cy="14" r="6" fill="#ffeb3b"/><circle cx="73" cy="14" r="3" fill="#ff7043"/><path d="M36 54l28 16M64 54L36 70" stroke="#e53935" stroke-width="5" stroke-linecap="round"/></svg>'};
var TY={m:{pt:1,stay:1},r:{pt:2,stay:0.6},b:{pt:-3,stay:1}};
var TOTAL=30000,holes=[],crs=[],fxs=[],score=0,best=0,left=TOTAL,run=false,spawnIn=0,last=0,iv=null,ac=null;
var grid=$('grid'),ov=$('ov');

for(var i=0;i<9;i++){
  (function(i){
    var c=document.createElement('div');c.className='cell';
    var cr=document.createElement('div');cr.className='cr';
    var fx=document.createElement('div');fx.className='fx';
    c.appendChild(cr);c.appendChild(fx);
    c.onclick=function(){hit(i)};
    grid.appendChild(c);crs.push(cr);fxs.push(fx);holes.push(null);
  })(i);
}
function beep(f,d){
  try{
    ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    var o=ac.createOscillator(),g=ac.createGain();
    o.type='square';o.frequency.value=f;g.gain.value=0.04;
    o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d);
  }catch(e){}
}
function elapsed(){return (TOTAL-left)/1000;}
function stay(){return Math.max(520,1150-elapsed()*22);}
function gap(){return Math.max(300,760-elapsed()*16);}
function pickType(){var x=Math.random();return x<0.7?'m':x<0.85?'r':'b';}
function spawn(){
  var f=[];
  for(var i=0;i<9;i++)if(!holes[i])f.push(i);
  if(!f.length)return;
  var p=f[Math.random()*f.length|0],t=pickType();
  holes[p]={t:t,left:stay()*TY[t].stay};
}
function render(){
  for(var i=0;i<9;i++){
    var h=holes[i];
    crs[i].innerHTML=h?SV[h.t]:'';
    crs[i].className='cr'+(h?' up':'');
  }
  $('tm').textContent=Math.ceil(left/1000);
  $('sc').textContent=score;
  $('bs').textContent=best;
}
function hit(i){
  var h=holes[i];
  if(!run||!h)return;
  var pt=TY[h.t].pt;
  score=Math.max(0,score+pt);
  holes[i]=null;
  var fx=fxs[i];
  fx.textContent=(pt>0?'+':'')+pt;
  fx.className='fx show '+(pt>0?'g':'r');
  setTimeout(function(){fx.className='fx';},450);
  if(pt>0)SFX.whack();else SFX.boom();
  render();
}
function end(){
  run=false;clearInterval(iv);iv=null;
  if(score>best)best=score;
  var note=score>=25?'Raja pemukul tikus!':score>=15?'Lumayan, mantap!':'Coba lagi, pasti bisa.';
  $('ot').textContent='Waktu habis!';
  $('os').innerHTML='Skor kamu <b>'+score+'</b> (terbaik '+best+')<br>'+note;
  $('ob').textContent='Main lagi';
  ov.className='ov';
  SFX.over(0);
  render();
}
function tick(dt){
  if(!run)return;
  left-=dt;
  for(var i=0;i<9;i++){
    if(holes[i]){holes[i].left-=dt;if(holes[i].left<=0)holes[i]=null;}
  }
  spawnIn-=dt;
  if(spawnIn<=0){spawn();spawnIn=gap();}
  if(left<=0){left=0;end();return;}
  render();
}
function start(){
  for(var i=0;i<9;i++)holes[i]=null;
  score=0;left=TOTAL;spawnIn=300;run=true;
  ov.className='ov off';
  last=Date.now();
  clearInterval(iv);
  iv=setInterval(function(){var n=Date.now();tick(Math.min(100,n-last));last=n;},50);
  render();
}
$('ob').onclick=start;
render();
})();</script></body></html>
`.trim();

const buildWhackMessage = () => buildHtmlMessage(WHACK_HTML);
const sendWhackGame = (sock, jid) => sendHtmlGame(sock, jid, WHACK_HTML);

module.exports = { sendWhackGame, buildWhackMessage, WHACK_HTML };