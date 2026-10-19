const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
Memory Card (Cari Pasangan) — buka dua kartu, cocokkan 8 pasang emoji.
 * Ada hitungan langkah, waktu, dan bintang 1–3 di akhir permainan.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const MEMORY_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Trebuchet MS',Verdana,sans-serif}
body{padding:8px;background:#0f1d3d}
.wrap{max-width:420px;margin:0 auto}
.top{display:flex;flex-wrap:wrap;align-items:center;gap:8px 6px;margin-bottom:10px}
.logo{flex:1;font:900 22px/1.05 'Trebuchet MS',Verdana,sans-serif;color:#ffcf3f}
.stats{display:flex;gap:6px;width:100%}
.box{flex:1;min-width:0;padding:5px 7px;border-radius:8px;background:#1a2b5c;color:#9db2f0;font-size:10px;text-align:center}
.box b{display:block;color:#fff;font-size:16px}
.new{padding:8px 14px;border:0;border-radius:10px;font:900 12px 'Trebuchet MS',Verdana,sans-serif;color:#0f1d3d;background:#ffcf3f}
.bwrap{position:relative}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.card{aspect-ratio:3/4;perspective:600px;cursor:pointer}
.in{position:relative;width:100%;height:100%;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .35s}
.card.on .in{transform:rotateY(180deg)}
.f{position:absolute;inset:0;display:grid;place-items:center;border-radius:10px;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.b{background:repeating-linear-gradient(45deg,#1a2b5c 0 7px,#ffcf3f 7px 9px);border:2px solid #ffcf3f}
.a svg{width:72%;height:72%}
.a{transform:rotateY(180deg);background:#fff6dc;font-size:clamp(26px,10vw,42px);border:2px solid #fff6dc}
.card.ok .a{background:#b8f2c9;border-color:#3fb68b}
.ov{position:absolute;inset:0;display:grid;place-items:center;text-align:center;border-radius:12px;background:rgba(15,29,61,.93);color:#fff}
.ov.off{display:none}
.ov h2{margin:0 0 6px;font-size:24px;color:#ffcf3f}
.ov p{margin:0 0 14px;color:#b9c8f5;font-size:14px;line-height:1.5}
.ov button{padding:11px 24px;border:0;border-radius:10px;font:900 14px 'Trebuchet MS',Verdana,sans-serif;color:#0f1d3d;background:#ffcf3f}
.tip{margin-top:10px;text-align:center;color:#7388c4;font-size:11px}
</style></head><body>
<div class="wrap">
  <div class="top">
    <div class="logo">Cari Pasangan</div>
    <button class="new" id="new">Ulang</button>
    <div class="stats">
      <div class="box">LANGKAH<b id="mv">0</b></div>
      <div class="box">WAKTU<b id="tm">0:00</b></div>
      <div class="box">COCOK<b id="fd">0/8</b></div>
    </div>
  </div>
  <div class="bwrap">
    <div class="grid" id="grid"></div>
    <div class="ov off" id="ov"><div><h2 id="ot"></h2><p id="os"></p><button id="ob">Main lagi</button></div></div>
  </div>
  <div class="tip">Buka dua kartu. Kalau gambarnya sama, kartu tetap terbuka.</div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var $=function(i){return document.getElementById(i)};
var EMO=['<svg viewBox="0 0 64 64"><path d="M14 34c0-12 8-22 18-22s18 10 18 22c0 4-2 6-4 8l2 10c1 3-3 4-4 1l-3-8-3 9c-1 3-5 2-4-1l1-8-3 8c-1 3-5 2-4-1l1-9-3 9c-1 3-5 2-4-1l2-10c-2-2-4-4-4-8z" fill="#ab47bc"/><circle cx="25" cy="30" r="5" fill="#fff"/><circle cx="39" cy="30" r="5" fill="#fff"/><circle cx="26" cy="31" r="2.5" fill="#222"/><circle cx="38" cy="31" r="2.5" fill="#222"/><path d="M27 40q5 4 10 0" stroke="#6a1b9a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>','<svg viewBox="0 0 64 64"><path d="M8 10l16 10h16l16-10 2 26c0 12-10 20-26 20S6 48 6 36z" fill="#ef6c00"/><path d="M14 38c4 8 11 12 18 12s14-4 18-12c-6 2-11 6-18 6s-12-4-18-6z" fill="#fff"/><circle cx="23" cy="32" r="3" fill="#222"/><circle cx="41" cy="32" r="3" fill="#222"/><circle cx="32" cy="46" r="3.5" fill="#222"/></svg>','<svg viewBox="0 0 64 64"><path d="M4 22h56a28 28 0 0 1-56 0z" fill="#2e7d32"/><path d="M8 22h48a24 24 0 0 1-48 0z" fill="#e8f5e9"/><path d="M11 22h42a21 21 0 0 1-42 0z" fill="#ff4d6d"/><ellipse cx="22" cy="31" rx="1.8" ry="3" fill="#2b1b1b"/><ellipse cx="32" cy="36" rx="1.8" ry="3" fill="#2b1b1b"/><ellipse cx="42" cy="31" rx="1.8" ry="3" fill="#2b1b1b"/><ellipse cx="27" cy="42" rx="1.8" ry="3" fill="#2b1b1b"/><ellipse cx="38" cy="43" rx="1.8" ry="3" fill="#2b1b1b"/></svg>','<svg viewBox="0 0 64 64"><path d="M32 4c9 8 11 22 9 36H23c-2-14 0-28 9-36z" fill="#eceff1"/><path d="M32 4c4 4 6 8 7 12H25c1-4 3-8 7-12z" fill="#e53935"/><circle cx="32" cy="26" r="5" fill="#4dd0e1" stroke="#455a64" stroke-width="2"/><path d="M23 38l-9 12 10-3zM41 38l9 12-10-3z" fill="#e53935"/><path d="M27 42h10l-5 16z" fill="#ffb300"/></svg>','<svg viewBox="0 0 64 64"><g transform="rotate(40 32 34)"><rect x="29" y="2" width="6" height="32" fill="#5d4037"/><rect x="27" y="0" width="10" height="8" rx="2" fill="#3e2723"/><ellipse cx="32" cy="46" rx="14" ry="16" fill="#d2813a"/><circle cx="32" cy="46" r="5" fill="#3e2723"/><rect x="26" y="56" width="12" height="3" fill="#3e2723"/></g></svg>','<svg viewBox="0 0 64 64"><rect x="26" y="10" width="12" height="44" rx="6" fill="#43a047"/><path d="M26 36h-8a4 4 0 0 1-4-4V24a4 4 0 0 1 8 0v4h4z" fill="#43a047"/><path d="M38 30h8a4 4 0 0 0 4-4v-6a4 4 0 0 0-8 0v2h-4z" fill="#43a047"/><rect x="18" y="52" width="28" height="7" rx="3" fill="#8d6e63"/><circle cx="32" cy="10" r="3.5" fill="#f06292"/></svg>','<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#e0a060"/><circle cx="32" cy="32" r="20" fill="#f48fb1"/><circle cx="32" cy="32" r="7" fill="#fff6dc"/><rect x="18" y="22" width="6" height="2.5" rx="1" fill="#fff" transform="rotate(30 21 23)"/><rect x="38" y="16" width="6" height="2.5" rx="1" fill="#ffee58" transform="rotate(-40 41 17)"/><rect x="44" y="34" width="6" height="2.5" rx="1" fill="#4dd0e1" transform="rotate(60 47 35)"/><rect x="22" y="42" width="6" height="2.5" rx="1" fill="#fff" transform="rotate(-20 25 43)"/></svg>','<svg viewBox="0 0 64 64"><rect x="14" y="44" width="8" height="10" rx="3" fill="#9ccc65"/><rect x="38" y="44" width="8" height="10" rx="3" fill="#9ccc65"/><circle cx="54" cy="32" r="7" fill="#9ccc65"/><circle cx="56" cy="30" r="1.8" fill="#222"/><path d="M6 34l-3 3 5 1z" fill="#9ccc65"/><ellipse cx="30" cy="36" rx="23" ry="15" fill="#2e7d32"/><path d="M22 30l8-6 8 6v8l-8 6-8-6z" fill="#66bb6a"/><path d="M12 36l10-6M38 30l12 6M30 24v-4" stroke="#1b5e20" stroke-width="2"/></svg>'];
var grid=$('grid'),ov=$('ov');
var deck=[],open=[],lock=false,moves=0,found=0,t0=0,timer=null;

function shuffle(a){
  for(var i=a.length-1;i>0;i--){var j=Math.random()*(i+1)|0,t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
function fmt(s){return (s/60|0)+':'+('0'+(s%60)).slice(-2);}
function secs(){return t0?((Date.now()-t0)/1000|0):0;}
function stat(){
  $('mv').textContent=moves;
  $('fd').textContent=found+'/8';
  $('tm').textContent=fmt(secs());
}
function reset(){
  clearInterval(timer);timer=null;t0=0;
  moves=0;found=0;open=[];lock=false;
  deck=shuffle(EMO.concat(EMO));
  grid.innerHTML='';
  deck.forEach(function(e,i){
    var c=document.createElement('div');
    c.className='card';
    c.innerHTML='<div class="in"><div class="f b"></div><div class="f a">'+e+'</div></div>';
    c.onclick=function(){flip(i,c)};
    grid.appendChild(c);
  });
  ov.className='ov off';
  stat();
}
function win(){
  clearInterval(timer);SFX.win();SFX.musicStop();
  var s=moves<=10?3:moves<=14?2:1,st='';
  for(var i=0;i<3;i++)st+=i<s?'★':'☆';
  st='<span style="color:#ffcf3f;font-size:24px">'+st+'</span>';
  $('ot').textContent='Semua cocok!';
  $('os').innerHTML=st+'<br>'+moves+' langkah, '+fmt(secs());
  ov.className='ov';
}
function flip(i,c){
  if(lock||c.className.indexOf('on')>-1)return;
  if(!timer){t0=Date.now();timer=setInterval(stat,500);}
  c.className='card on';SFX.click();
  open.push({i:i,c:c});
  if(open.length<2)return;
  moves++;
  var a=open[0],b=open[1];
  open=[];
  if(deck[a.i]===deck[b.i]){
    a.c.className='card on ok';b.c.className='card on ok';
    found++;stat();SFX.chime(2);
    if(found===8)setTimeout(win,500);
  }else{
    lock=true;stat();
    setTimeout(function(){a.c.className='card';b.c.className='card';lock=false;SFX.bump();},750);
  }
}
$('new').onclick=reset;
$('ob').onclick=reset;
reset();
})();</script></body></html>
`.trim();

const buildMemoryMessage = () => buildHtmlMessage(MEMORY_HTML);
const sendMemoryGame = (sock, jid) => sendHtmlGame(sock, jid, MEMORY_HTML);

module.exports = { sendMemoryGame, buildMemoryMessage, MEMORY_HTML };