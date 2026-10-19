const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
2048 — geser papan (swipe) atau tekan tombol panah, gabungkan angka yang sama
 * sampai ubin 2048. Skor terbaik hanya tersimpan selama sesi game dibuka.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const G2048_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Trebuchet MS',Verdana,sans-serif}
body{padding:8px;background:#1b1230}
.wrap{max-width:420px;margin:0 auto}
.top{display:flex;align-items:stretch;gap:6px;margin-bottom:10px}
.logo{margin-right:auto;font:900 36px/1 'Trebuchet MS',Verdana,sans-serif;color:#ffd166;letter-spacing:-1px;align-self:center}
.box{min-width:62px;padding:5px 8px;border-radius:8px;background:#2b1f4a;color:#b9a8ee;font-size:10px;text-align:center}
.box b{display:block;color:#fff;font-size:17px}
.bwrap{position:relative}
.board{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:7px;aspect-ratio:1/1;padding:7px;border-radius:14px;background:#2b1f4a;touch-action:none}
.t{display:grid;place-items:center;border-radius:9px;font-weight:900;font-size:clamp(20px,8vw,34px);color:#fff;background:#34275a;overflow:hidden}
.t.s2{font-size:clamp(17px,6.5vw,28px)}
.t.s3{font-size:clamp(14px,5vw,22px)}
.t.pop{animation:pop .16s ease-out}
@keyframes pop{0%{transform:scale(.55)}100%{transform:scale(1)}}
.ov{position:absolute;inset:0;display:grid;place-items:center;text-align:center;border-radius:14px;background:rgba(27,18,48,.92);color:#fff}
.ov.off{display:none}
.ov h2{margin:0 0 4px;font-size:26px;color:#ffd166}
.ov p{margin:0 0 14px;color:#cdbff5;font-size:14px}
button{border:0;border-radius:10px;font-weight:900;color:#fff;background:#4b3a7a}
.ov button{padding:11px 24px;font-size:14px;background:#ffd166;color:#2a1b00}
.new{padding:0 12px;font-size:12px;background:#4b3a7a}
.ctl{display:grid;gap:7px;margin-top:10px}
.row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}
.row button{height:46px;font-size:18px}
.sp{visibility:hidden}
.tip{margin-top:8px;text-align:center;color:#8f7fc4;font-size:11px}
</style></head><body>
<div class="wrap">
  <div class="top">
    <div class="logo">2048</div>
    <div class="box">SKOR<b id="score">0</b></div>
    <div class="box">TERBAIK<b id="best">0</b></div>
    <button class="new" id="new">Baru</button>
  </div>
  <div class="bwrap">
    <div class="board" id="board"></div>
    <div class="ov off" id="ov"><div><h2 id="ot"></h2><p id="os"></p><button id="ob"></button></div></div>
  </div>
  <div class="ctl">
    <div class="row"><div class="sp"></div><button id="u">▲</button><div class="sp"></div></div>
    <div class="row"><button id="l">◀</button><button id="d">▼</button><button id="r">▶</button></div>
  </div>
  <div class="tip">Geser papan atau tekan panah. Gabungkan angka yang sama.</div>
</div>
<script>(function(){
var $=function(i){return document.getElementById(i)};
var g=[],score=0,best=0,keep=false,over=false;
var board=$('board'),ov=$('ov'),ob=$('ob'),cells=[];
for(var i=0;i<16;i++){var d=document.createElement('div');d.className='t';board.appendChild(d);cells.push(d);}

function color(v){
  if(!v)return '#34275a';
  if(v>=2048)return '#ffd166';
  var n=Math.round(Math.log(v)/Math.LN2);
  return 'hsl('+((290-n*21+360)%360)+',65%,'+(34+n*2)+'%)';
}
function render(pop){
  for(var i=0;i<16;i++){
    var v=g[i],c=cells[i];
    c.textContent=v||'';
    c.style.background=color(v);
    c.style.color=v>=2048?'#2a1b00':'#fff';
    c.className='t'+(v>=1000?' s3':v>=100?' s2':'')+(pop&&pop[i]?' pop':'');
  }
  $('score').textContent=score;
  $('best').textContent=best;
}
function show(t,s,b,fn){$('ot').textContent=t;$('os').textContent=s;ob.textContent=b;ob.onclick=fn;ov.className='ov';}
function hide(){ov.className='ov off';}

function spawn(){
  var e=[];
  for(var i=0;i<16;i++)if(!g[i])e.push(i);
  if(!e.length)return -1;
  var p=e[Math.random()*e.length|0];
  g[p]=Math.random()<0.9?2:4;
  return p;
}
function line(a){
  var r=a.filter(function(x){return x}),out=[],m=[],gain=0;
  for(var i=0;i<r.length;i++){
    if(r[i]===r[i+1]){out.push(r[i]*2);m.push(1);gain+=r[i]*2;i++;}
    else{out.push(r[i]);m.push(0);}
  }
  while(out.length<4){out.push(0);m.push(0);}
  return {v:out,m:m,gain:gain};
}
function can(){
  for(var i=0;i<16;i++){
    if(!g[i])return true;
    if(i%4<3&&g[i]===g[i+1])return true;
    if(i<12&&g[i]===g[i+4])return true;
  }
  return false;
}
function check(){
  if(!keep){
    for(var i=0;i<16;i++)if(g[i]>=2048){
      show('2048!','Kamu sampai ubin 2048.','Lanjutkan',function(){keep=true;hide();});
      return;
    }
  }
  if(!can()){over=true;show('Game over','Skor kamu '+score,'Main lagi',reset);}
}
/* dir: 0 atas, 1 kanan, 2 bawah, 3 kiri */
function move(dir){
  if(over||ov.className==='ov')return;
  var moved=false,gain=0,pop={};
  for(var k=0;k<4;k++){
    var idx=[],j;
    for(j=0;j<4;j++){
      idx.push(dir===3?k*4+j:dir===1?k*4+3-j:dir===0?j*4+k:(3-j)*4+k);
    }
    var r=line(idx.map(function(x){return g[x]}));
    for(j=0;j<4;j++){
      if(g[idx[j]]!==r.v[j])moved=true;
      g[idx[j]]=r.v[j];
      if(r.m[j])pop[idx[j]]=1;
    }
    gain+=r.gain;
  }
  if(!moved)return;
  score+=gain;
  if(score>best)best=score;
  var s=spawn();
  if(s>=0)pop[s]=1;
  render(pop);
  check();
}
function reset(){
  g=[];for(var i=0;i<16;i++)g.push(0);
  score=0;keep=false;over=false;
  spawn();spawn();hide();render({});
}

$('u').onclick=function(){move(0)};
$('r').onclick=function(){move(1)};
$('d').onclick=function(){move(2)};
$('l').onclick=function(){move(3)};
$('new').onclick=reset;
var map={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};
addEventListener('keydown',function(e){if(e.key in map){e.preventDefault();move(map[e.key]);}});
var sx=null,sy=null;
board.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
board.addEventListener('touchend',function(e){
  if(sx===null)return;
  var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  sx=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;
  if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:3);else move(dy>0?2:0);
},{passive:true});
reset();
})();</script></body></html>
`.trim();

const build2048Message = () => buildHtmlMessage(G2048_HTML);
const send2048Game = (sock, jid) => sendHtmlGame(sock, jid, G2048_HTML);

module.exports = { send2048Game, build2048Message, G2048_HTML };