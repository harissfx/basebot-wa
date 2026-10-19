const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Snake game (Ular Klasik) — kontrol arah pakai tombol panah, makan buah biar
 * panjang, jangan nabrak badan sendiri atau tembok. Ada efek suara lewat Web
 * Audio API (di-generate langsung, gak butuh file audio eksternal). Tema retro
 * terminal hijau-hitam, beda dari game lain biar gak monoton.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const SNAKE_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Courier New',monospace}
body{padding:8px;background:radial-gradient(circle at 50% 8%,#062b0d,#031a08 50%,#010d04)}
.board{position:relative;padding:10px;border:2px solid #3dff6b;border-radius:10px;background:linear-gradient(160deg,#041c09,#020f05);box-shadow:inset 0 0 0 2px #3dff6b33,0 0 18px #00ff5533,0 8px 16px rgba(0,0,0,.5)}
.title{padding:8px;border:2px solid #3dff6b;border-radius:6px;color:#eaffe9;background:#031a08;text-align:center;font:700 20px 'Courier New',monospace;letter-spacing:4px;text-shadow:0 0 8px #3dff6b}
.stats{display:flex;gap:6px;margin:8px 0;padding:6px;border:1px solid #3dff6b55;border-radius:6px;background:#041c09}
.stat{flex:1;text-align:center;color:#7fffa0;font:bold 10px monospace}.stat b{display:block;color:#eaffe9;font-size:14px;text-shadow:0 0 6px #3dff6b}
.frame{padding:6px;border:2px solid #3dff6b44;border-radius:8px;background:#021205}
.gamewrap{position:relative;width:100%;aspect-ratio:1/1;background:#010c03;border-radius:6px;overflow:hidden}
#gameCanvas{display:block;width:100%;height:100%}
.message{margin:8px 0;padding:8px;border:1px solid #3dff6b55;border-radius:6px;color:#eaffe9;background:#041c09;text-align:center;font:bold 12px 'Courier New',monospace;text-shadow:0 0 4px #3dff6b}
.controls{display:grid;gap:8px}
.crow{display:grid;gap:8px}
.crow.c3{grid-template-columns:1fr 1fr 1fr}
button{height:46px;border:1px solid #3dff6b;border-radius:8px;color:#3dff6b;font-weight:900;font-size:18px;background:#041c09;box-shadow:0 0 8px #3dff6b44}
.spacer{visibility:hidden}
.over{position:absolute;inset:0;display:grid;place-items:center;background:rgba(1,10,3,.94);color:#3dff6b;text-align:center}
.over.off{display:none}
.over button{padding:0 22px;height:44px;background:#3dff6b;color:#031a08;font-size:14px;border:0;box-shadow:0 0 14px #3dff6b}
</style></head><body>
<div class="board" id="board">
  <div class="title">SNAKE</div>
  <div class="stats">
    <div class="stat">SCORE<b id="score">0</b></div>
    <div class="stat">BEST<b id="best">0</b></div>
  </div>
  <div class="frame"><div class="gamewrap"><canvas id="gameCanvas"></canvas>
    <div id="over" class="over off"><div><h2>GAME OVER</h2><p>Score: <b id="finalScore">0</b></p><button id="restartBtn">MAIN LAGI</button></div></div>
  </div></div>
  <div id="message" class="message">TAP TOMBOL PANAH BUAT GERAK!</div>
  <div class="controls">
    <div class="crow c3">
      <div class="spacer"></div>
      <button id="upBtn">▲</button>
      <div class="spacer"></div>
    </div>
    <div class="crow c3">
      <button id="leftBtn">◀</button>
      <button id="downBtn">▼</button>
      <button id="rightBtn">▶</button>
    </div>
  </div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var wrap=document.querySelector('.gamewrap');
var over=document.getElementById('over');
var scoreEl=document.getElementById('score'),bestEl=document.getElementById('best');
var msg=document.getElementById('message'),finalScoreEl=document.getElementById('finalScore');
var restartBtn=document.getElementById('restartBtn');
var upBtn=document.getElementById('upBtn'),downBtn=document.getElementById('downBtn');
var leftBtn=document.getElementById('leftBtn'),rightBtn=document.getElementById('rightBtn');
var D=Math.min(devicePixelRatio||1,2),W=0,H=0;
var GRID=16,cell=0;
var snake=[],dir={x:1,y:0},nextDir={x:1,y:0},food=null,score=0,best=0,running=false,tickTimer=null,speedMs=160;
var audioCtx=null;

function actx(){if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}
function tone(freq,dur,type,vol,delayMs){var ac=actx();if(!ac)return;var t0=ac.currentTime+(delayMs||0)/1000;var osc=ac.createOscillator(),gain=ac.createGain();osc.type=type||'sine';osc.frequency.setValueAtTime(freq,t0);gain.gain.setValueAtTime(0,t0);gain.gain.linearRampToValueAtTime(vol||0.16,t0+0.01);gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);osc.connect(gain).connect(ac.destination);osc.start(t0);osc.stop(t0+dur+0.02)}
function playEat(){SFX.crunch()}
function playTurn(){SFX.tick()}
function playOver(){SFX.hit();SFX.over(0.4)}

function resize(){
  var r=canvas.getBoundingClientRect();W=r.width;H=r.height;
  canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);
  ctx.setTransform(D,0,0,D,0,0);
  cell=W/GRID;
  draw();
}
function randomFood(){
  var free=[];
  for(var x=0;x<GRID;x++)for(var y=0;y<GRID;y++){
    var occupied=snake.some(function(s){return s.x===x&&s.y===y;});
    if(!occupied)free.push({x:x,y:y});
  }
  if(free.length===0)return null;
  return free[Math.floor(Math.random()*free.length)];
}
function updateUI(){scoreEl.textContent=score;bestEl.textContent=best}
function setDir(nx,ny){
  if(dir.x===-nx&&dir.y===-ny)return;
  nextDir={x:nx,y:ny};
  playTurn();
}
function endGame(){
  running=false;
  best=Math.max(best,score);
  if(tickTimer){clearInterval(tickTimer);tickTimer=null;}
  finalScoreEl.textContent=score;
  over.className='over';
  playOver();
  updateUI();
}
function tick(){
  if(!running)return;
  dir=nextDir;
  var head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(head.x<0||head.x>=GRID||head.y<0||head.y>=GRID){endGame();return;}
  for(var i=0;i<snake.length;i++){if(snake[i].x===head.x&&snake[i].y===head.y){endGame();return;}}
  snake.unshift(head);
  if(food&&head.x===food.x&&head.y===food.y){
    score+=10;updateUI();playEat();
    food=randomFood();
    if(!food){endGame();return;}
    speedMs=Math.max(70,speedMs-3);
    restartTimer();
  } else {
    snake.pop();
  }
  draw();
}
function restartTimer(){
  if(tickTimer)clearInterval(tickTimer);
  tickTimer=setInterval(tick,speedMs);
}
function draw(){
  if(!W||!H||!cell)return;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#010c03';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(61,255,107,.08)';
  for(var g=1;g<GRID;g++){
    ctx.beginPath();ctx.moveTo(g*cell,0);ctx.lineTo(g*cell,H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,g*cell);ctx.lineTo(W,g*cell);ctx.stroke();
  }
  if(food){
    ctx.fillStyle='#ff4d4d';
    ctx.beginPath();ctx.arc(food.x*cell+cell/2,food.y*cell+cell/2,cell*0.35,0,Math.PI*2);ctx.fill();
  }
  for(var i=0;i<snake.length;i++){
    var s=snake[i];
    ctx.fillStyle=i===0?'#8bffb0':'#3dff6b';
    ctx.fillRect(s.x*cell+1,s.y*cell+1,cell-2,cell-2);
  }
}
function resetGame(){
  var mid=Math.floor(GRID/2);
  snake=[{x:mid,y:mid},{x:mid-1,y:mid},{x:mid-2,y:mid}];
  dir={x:1,y:0};nextDir={x:1,y:0};
  score=0;speedMs=160;running=true;
  food=randomFood();
  over.className='over off';
  msg.textContent='TAP TOMBOL PANAH BUAT GERAK!';
  updateUI();
  draw();
  restartTimer();
}
function isOverTarget(e){return e.target&&e.target.closest&&e.target.closest('#over')}
function bindTap(btn,fn){
  btn.addEventListener('touchstart',function(e){if(isOverTarget(e))return;e.preventDefault();fn();},{passive:false});
  btn.addEventListener('click',fn);
}
bindTap(upBtn,function(){setDir(0,-1);});
bindTap(downBtn,function(){setDir(0,1);});
bindTap(leftBtn,function(){setDir(-1,0);});
bindTap(rightBtn,function(){setDir(1,0);});
restartBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();resetGame();});
restartBtn.addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();resetGame();},{passive:false});

var touchStartX=null,touchStartY=null;
wrap.addEventListener('touchstart',function(e){
  if(isOverTarget(e))return;
  var t=e.touches[0];touchStartX=t.clientX;touchStartY=t.clientY;
},{passive:true});
wrap.addEventListener('touchend',function(e){
  if(isOverTarget(e)||touchStartX===null)return;
  var t=e.changedTouches[0];
  var dx=t.clientX-touchStartX,dy=t.clientY-touchStartY;
  if(Math.max(Math.abs(dx),Math.abs(dy))>18){
    if(Math.abs(dx)>Math.abs(dy)){setDir(dx>0?1:-1,0);}else{setDir(0,dy>0?1:-1);}
  }
  touchStartX=null;touchStartY=null;
},{passive:true});

addEventListener('resize',resize);
resize();
resetGame();
})();</script></body></html>
`.trim();

const buildSnakeMessage = () => buildHtmlMessage(SNAKE_HTML);
const sendSnakeGame = (sock, jid) => sendHtmlGame(sock, jid, SNAKE_HTML);

module.exports = { sendSnakeGame, buildSnakeMessage, SNAKE_HTML };