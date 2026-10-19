const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Match-3 game (Gem Match) — susun 3+ gem warna sama buat hancurin, ada efek suara
 * lewat Web Audio API (di-generate langsung, gak butuh file audio eksternal).
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const MATCH3_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Comic Sans MS',Arial,sans-serif}
body{padding:8px;background:radial-gradient(circle at 50% 8%,#ffe1f4,#e3c6ff 48%,#c9a9ff)}
.board{position:relative;padding:10px;border:4px solid #fff;border-radius:22px;background:linear-gradient(110deg,#fff0fa,#ffe3f3 24%,#f3e3ff 54%,#fff0fa);box-shadow:inset 0 0 0 3px #ffb8e6,0 8px 16px rgba(150,80,180,.35)}
.title{padding:8px;border:2px solid #fff;border-radius:16px;color:#7a2a6b;background:linear-gradient(90deg,#ff9fd6,#c99bff);text-align:center;font:900 20px 'Comic Sans MS',sans-serif;letter-spacing:1px;text-shadow:0 1px 0 #fff8}
.stats{display:flex;gap:6px;margin:8px 0;padding:6px;border:2px solid #f2b8e6;border-radius:12px;background:#fff5fc}
.stat{flex:1;text-align:center;color:#b06aa0;font:bold 10px monospace}.stat b{display:block;color:#8a3d78;font-size:14px}
.frame{padding:6px;border:3px solid #f0b3e0;border-radius:16px;background:#fdeafb}
.gridwrap{position:relative;width:100%;aspect-ratio:6/7;background:#fbdff5;border-radius:12px;overflow:hidden}
.grid{position:relative;width:100%;height:100%}
.tile{position:absolute;padding:2px;transition:transform .18s ease}
.gem{width:100%;height:100%;border-radius:14px;position:relative;cursor:pointer;transition:transform .2s ease,opacity .2s ease,box-shadow .15s ease;box-shadow:inset 0 -3px 4px rgba(0,0,0,.18),inset 0 2px 3px rgba(255,255,255,.6)}
.gem::after{content:'';position:absolute;top:8%;left:14%;width:34%;height:22%;background:rgba(255,255,255,.75);border-radius:50%;filter:blur(1px)}
.gem.selected{transform:scale(1.14);box-shadow:0 0 0 3px #fff,0 0 0 6px #ff9fd6,inset 0 -3px 4px rgba(0,0,0,.18)}
.gem.pop{transform:scale(.1) rotate(25deg);opacity:0}
.c0{background:radial-gradient(circle at 32% 28%,#ffb3c6,#ff4d6d 75%)}
.c1{background:radial-gradient(circle at 32% 28%,#ffd9a0,#ff9838 75%)}
.c2{background:radial-gradient(circle at 32% 28%,#fff3a0,#ffd23f 75%)}
.c3{background:radial-gradient(circle at 32% 28%,#c3f7d3,#4ecb7a 75%)}
.c4{background:radial-gradient(circle at 32% 28%,#c2d9ff,#5c8cff 75%)}
.message{margin:8px 0;padding:8px;border:2px solid #f2b8e6;border-radius:12px;color:#8a3d78;background:#fff5fc;text-align:center;font:bold 13px 'Comic Sans MS',sans-serif}
.console{display:grid;grid-template-columns:1fr 1fr;gap:8px}
button{height:44px;border:0;border-radius:14px;color:#fff;font-weight:900}
.shuffle{background:linear-gradient(#ffa8dc,#e668bc)}
.restart{background:linear-gradient(#b6f0c6,#5fce85);font-size:14px;color:#1f5c33}
.over{position:absolute;inset:0;display:grid;place-items:center;background:rgba(120,40,110,.92);color:#ffe9fb;text-align:center}
.over.off{display:none}
.over button{padding:0 22px;background:#fff;color:#c14a95;border-radius:14px}
</style></head><body>
<div class="board" id="board">
  <div class="title">GEM MATCH</div>
  <div class="stats">
    <div class="stat">SCORE<b id="score">0</b></div>
    <div class="stat">MOVES<b id="moves">20</b></div>
    <div class="stat">BEST<b id="best">0</b></div>
  </div>
  <div class="frame"><div class="gridwrap"><div class="grid" id="grid"></div></div></div>
  <div id="message" class="message">PILIH & TUKAR GEM</div>
  <div class="console">
    <button id="shuffleBtn" class="shuffle">ACAK</button>
    <button id="restartBtn" class="restart">MAIN LAGI</button>
  </div>
  <div id="over" class="over off">
    <div><h2>GAME OVER</h2><p>Score: <b id="finalScore">0</b></p>
    <button id="restartBtn2">MAIN LAGI</button></div>
  </div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var COLS=6,ROWS=7,COLORCOUNT=5,MAXMOVES=20;
var gridEl=document.getElementById('grid');
var scoreEl=document.getElementById('score'),movesEl=document.getElementById('moves'),bestEl=document.getElementById('best');
var msg=document.getElementById('message'),over=document.getElementById('over'),finalScoreEl=document.getElementById('finalScore');
var shuffleBtn=document.getElementById('shuffleBtn'),restartBtn=document.getElementById('restartBtn'),restartBtn2=document.getElementById('restartBtn2');
var gridWrap=document.querySelector('.gridwrap');
var tiles,cell,score=0,best=0,moves=MAXMOVES,busy=false,selected=null;
var audioCtx=null;

function actx(){
  if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
  if(audioCtx.state==='suspended')audioCtx.resume();
  return audioCtx;
}
function tone(freq,dur,type,vol,delayMs){
  var ac=actx();if(!ac)return;
  var t0=ac.currentTime+(delayMs||0)/1000;
  var osc=ac.createOscillator(),gain=ac.createGain();
  osc.type=type||'sine';osc.frequency.setValueAtTime(freq,t0);
  gain.gain.setValueAtTime(0,t0);
  gain.gain.linearRampToValueAtTime(vol||0.18,t0+0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);osc.stop(t0+dur+0.02);
}
function playSelect(){SFX.tap()}
function playSwap(){SFX.swish()}
function playInvalid(){SFX.bump()}
function playMatch(level){SFX.pop();SFX.chime(level)}
function playGameOver(){SFX.over(0)}

function colorAt(r,c){var t=tiles[r*COLS+c];return t?t.color:-1;}
function positionTile(t,rowOverride){
  var r=rowOverride===undefined?t.row:rowOverride;
  t.el.style.width=cell+'px';t.el.style.height=cell+'px';
  t.el.style.transform='translate('+(t.col*cell)+'px,'+(r*cell)+'px)';
}
function createTile(r,c,color){
  var el=document.createElement('div');el.className='tile';
  var gem=document.createElement('div');gem.className='gem c'+color;
  el.appendChild(gem);
  var t={color:color,row:r,col:c,el:el,gem:gem};
  gem.onclick=function(){onTileClick(t);};
  positionTile(t);
  gridEl.appendChild(el);
  return t;
}
function colorForNewCell(r,c){
  var color,tries=0;
  do{color=Math.floor(Math.random()*COLORCOUNT);tries++;}
  while(tries<30&&((c>=2&&colorAt(r,c-1)===color&&colorAt(r,c-2)===color)||(r>=2&&colorAt(r-1,c)===color&&colorAt(r-2,c)===color)));
  return color;
}
function buildBoard(){
  gridEl.innerHTML='';
  tiles=new Array(ROWS*COLS).fill(null);
  for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++)tiles[r*COLS+c]=createTile(r,c,colorForNewCell(r,c));
}
function resize(){
  cell=Math.floor(gridWrap.clientWidth/COLS)||40;
  if(tiles)tiles.forEach(function(t){if(t)positionTile(t);});
}
function updateUI(){scoreEl.textContent=score;movesEl.textContent=moves;bestEl.textContent=best;}

function findMatches(){
  var matched=new Set();
  var r,c,cur,start,k;
  for(r=0;r<ROWS;r++){var runStart=0;
    for(c=1;c<=COLS;c++){
      cur=c<COLS?colorAt(r,c):-999;start=colorAt(r,runStart);
      if(cur!==start){if(c-runStart>=3)for(k=runStart;k<c;k++)matched.add(r*COLS+k);runStart=c;}
    }
  }
  for(c=0;c<COLS;c++){var runStart2=0;
    for(r=1;r<=ROWS;r++){
      cur=r<ROWS?colorAt(r,c):-999;start=colorAt(runStart2,c);
      if(cur!==start){if(r-runStart2>=3)for(k=runStart2;k<r;k++)matched.add(k*COLS+c);runStart2=r;}
    }
  }
  return matched;
}
function swapTiles(a,b){
  var ra=a.row,ca=a.col,rb=b.row,cb=b.col;
  tiles[ra*COLS+ca]=b;tiles[rb*COLS+cb]=a;
  a.row=rb;a.col=cb;b.row=ra;b.col=ca;
  positionTile(a);positionTile(b);
}
function applyGravityColumn(c){
  var writeRow=ROWS-1,r;
  for(r=ROWS-1;r>=0;r--){
    var idx=r*COLS+c;
    if(tiles[idx]){
      if(writeRow!==r){
        var t=tiles[idx];tiles[idx]=null;t.row=writeRow;tiles[writeRow*COLS+c]=t;positionTile(t);
      }
      writeRow--;
    }
  }
  var holes=writeRow+1,i=0;
  for(r=writeRow;r>=0;r--,i++){
    var color=Math.floor(Math.random()*COLORCOUNT);
    var t2=createTile(r,c,color);
    positionTile(t2,r-(holes-i));
    tiles[r*COLS+c]=t2;
    (function(tt){requestAnimationFrame(function(){positionTile(tt);});})(t2);
  }
}
function highlight(t,on){t.gem.className='gem c'+t.color+(on?' selected':'');}

function onTileClick(t){
  if(busy)return;
  if(!selected){selected=t;highlight(t,true);playSelect();return;}
  if(selected===t){highlight(t,false);selected=null;return;}
  var dr=Math.abs(selected.row-t.row),dc=Math.abs(selected.col-t.col);
  if(dr+dc!==1){highlight(selected,false);selected=t;highlight(t,true);playSelect();return;}
  highlight(selected,false);
  var a=selected,b=t;selected=null;
  attemptSwap(a,b);
}
function attemptSwap(a,b){
  busy=true;playSwap();swapTiles(a,b);
  setTimeout(function(){
    var matched=findMatches();
    if(matched.size>0){
      moves--;updateUI();
      if(moves<=0)msg.textContent='TERAKHIR...';
      resolveMatches(matched,1);
    }else{
      swapTiles(a,b);playInvalid();msg.textContent='GAK BISA!';
      setTimeout(function(){busy=false;},180);
    }
  },180);
}
function resolveMatches(matched,level){
  score+=matched.size*10*level;best=Math.max(best,score);updateUI();playMatch(level);
  msg.textContent=level>1?('COMBO x'+level+'!'):'NICE!';
  matched.forEach(function(idx){var t=tiles[idx];if(t)t.gem.classList.add('pop');});
  setTimeout(function(){
    matched.forEach(function(idx){var t=tiles[idx];if(t){t.el.remove();tiles[idx]=null;}});
    for(var c=0;c<COLS;c++)applyGravityColumn(c);
    setTimeout(function(){
      var next=findMatches();
      if(next.size>0){resolveMatches(next,level+1);}
      else{
        busy=false;
        if(moves<=0)endGame();
      }
    },260);
  },220);
}
function endGame(){finalScoreEl.textContent=score;over.className='over';playGameOver();}
function resetGame(){score=0;moves=MAXMOVES;over.className='over off';buildBoard();updateUI();msg.textContent='PILIH & TUKAR GEM';busy=false;selected=null;}

shuffleBtn.onclick=function(){if(busy)return;playSwap();buildBoard();msg.textContent='DIACAK!';};
restartBtn.onclick=resetGame;
restartBtn2.onclick=resetGame;
addEventListener('resize',resize);
resize();buildBoard();updateUI();
})();</script></body></html>
`.trim();

const buildMatch3Message = () => buildHtmlMessage(MATCH3_HTML);
const sendMatch3Game = (sock, jid) => sendHtmlGame(sock, jid, MATCH3_HTML);

module.exports = { sendMatch3Game, buildMatch3Message, MATCH3_HTML };