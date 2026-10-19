const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Flappy-bird-style game (Flappy Hop) — tap buat terbang, hindarin pipa.
 * Ada efek suara lewat Web Audio API (di-generate langsung, gak butuh file
 * audio eksternal). Tema langit cerah, beda dari 3 game lain biar gak monoton.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const FLAPPY_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:Arial,sans-serif}
body{padding:8px;background:radial-gradient(circle at 50% 6%,#bdeeff,#7fd0f2 55%,#4fa9dd)}
.board{position:relative;padding:10px;border:4px solid #fff;border-radius:20px;background:linear-gradient(160deg,#eafcff,#cdeffb);box-shadow:inset 0 0 0 3px #6fc7ea,0 8px 16px rgba(30,90,120,.35)}
.title{padding:8px;border:2px solid #fff;border-radius:14px;color:#fff;background:linear-gradient(90deg,#ff9d3d,#ff6f3d);text-align:center;font:900 20px Arial,sans-serif;letter-spacing:1px;text-shadow:0 1px 2px rgba(0,0,0,.25)}
.stats{display:flex;gap:6px;margin:8px 0;padding:6px;border:2px solid #a7e0f7;border-radius:10px;background:#f2fcff}
.stat{flex:1;text-align:center;color:#4a90ad;font:bold 10px monospace}.stat b{display:block;color:#1e6a8c;font-size:14px}
.frame{padding:6px;border:3px solid #8fd4ee;border-radius:14px;background:#dff4fb}
.gamewrap{position:relative;width:100%;aspect-ratio:5/7;background:linear-gradient(180deg,#bdeeff,#e8fbe0 78%,#8bd97f);border-radius:10px;overflow:hidden}
#gameCanvas{display:block;width:100%;height:100%}
.message{margin:8px 0;padding:8px;border:2px solid #a7e0f7;border-radius:10px;color:#1e6a8c;background:#f2fcff;text-align:center;font:bold 13px monospace}
.console{display:grid;grid-template-columns:1fr;gap:8px}
button{height:48px;border:0;border-radius:14px;color:#fff;font-weight:900;font-size:16px}
.tap{background:linear-gradient(#ffcb5c,#ff9d1f);box-shadow:0 3px 0 #c9760a}
.over{position:absolute;inset:0;display:grid;place-items:center;background:rgba(20,60,80,.88);color:#fff;text-align:center}
.over.off{display:none}
.over button{padding:0 22px;height:44px;background:#fff;color:#1e6a8c;border-radius:12px}
</style></head><body>
<div class="board" id="board">
  <div class="title">FLAPPY HOP</div>
  <div class="stats">
    <div class="stat">SCORE<b id="score">0</b></div>
    <div class="stat">BEST<b id="best">0</b></div>
  </div>
  <div class="frame"><div class="gamewrap"><canvas id="gameCanvas"></canvas>
    <div id="over" class="over off"><div><h2>GAME OVER</h2><p>Score: <b id="finalScore">0</b></p><button id="restartBtn">MAIN LAGI</button></div></div>
  </div></div>
  <div id="message" class="message">TAP TOMBOL ATAU LAYAR BUAT TERBANG!</div>
  <div class="console"><button id="tapBtn" class="tap">▲ TERBANG</button></div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var wrap=document.querySelector('.gamewrap');
var scoreEl=document.getElementById('score'),bestEl=document.getElementById('best');
var msg=document.getElementById('message'),over=document.getElementById('over'),finalScoreEl=document.getElementById('finalScore');
var tapBtn=document.getElementById('tapBtn'),restartBtn=document.getElementById('restartBtn');
var D=Math.min(devicePixelRatio||1,2),W,H;
var GRAVITY=1500,FLAP=-430,PIPE_GAP=185,PIPE_W=56,PIPE_SPEED=140,PIPE_INTERVAL=1450;
var bird=null,pipes=[],score=0,best=0,running=false,started=false,lastTime=null,pipeTimer=null;
var audioCtx=null;

function actx(){if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}
function tone(freq,dur,type,vol,delayMs){var ac=actx();if(!ac)return;var t0=ac.currentTime+(delayMs||0)/1000;var osc=ac.createOscillator(),gain=ac.createGain();osc.type=type||'sine';osc.frequency.setValueAtTime(freq,t0);gain.gain.setValueAtTime(0,t0);gain.gain.linearRampToValueAtTime(vol||0.16,t0+0.01);gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);osc.connect(gain).connect(ac.destination);osc.start(t0);osc.stop(t0+dur+0.02)}
function playFlap(){SFX.flap()}
function playScore(){SFX.coin()}
function playHit(){SFX.hit()}
function playGameOver(){SFX.over(0.35)}

function resize(){var r=canvas.getBoundingClientRect();W=r.width;H=r.height;canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);ctx.setTransform(D,0,0,D,0,0);draw()}
function reset(){
  bird={x:W*0.28,y:H*0.4,vy:0,r:Math.max(10,W*0.045)};
  pipes=[];score=0;running=true;started=false;
  over.className='over off';msg.textContent='TAP TOMBOL ATAU LAYAR BUAT TERBANG!';
  updateUI();lastTime=null;
  if(pipeTimer)clearTimeout(pipeTimer);
  scheduleNextPipe(900);
  requestAnimationFrame(loop);
}
function updateUI(){scoreEl.textContent=score;bestEl.textContent=best}
function scheduleNextPipe(delay){
  pipeTimer=setTimeout(function(){
    if(!running)return;
    var margin=H*0.12,gapY=margin+Math.random()*(H-margin*2-PIPE_GAP);
    pipes.push({x:W+PIPE_W,gapY:gapY,passed:false});
    scheduleNextPipe(PIPE_INTERVAL);
  },delay);
}
function flap(){
  if(!running)return;
  started=true;
  bird.vy=FLAP;
  playFlap();
}
function circleRectHit(cx,cy,cr,rx,ry,rw,rh){
  var nx=Math.max(rx,Math.min(cx,rx+rw)),ny=Math.max(ry,Math.min(cy,ry+rh));
  var dx=cx-nx,dy=cy-ny;
  return (dx*dx+dy*dy)<(cr*cr);
}
function endGame(){
  running=false;
  best=Math.max(best,score);
  finalScoreEl.textContent=score;
  over.className='over';
  playGameOver();
  if(pipeTimer)clearTimeout(pipeTimer);
  updateUI();
}
function loop(ts){
  if(!running){draw();return;}
  if(lastTime===null)lastTime=ts;
  var dt=Math.min((ts-lastTime)/1000,0.035);
  lastTime=ts;
  if(started){
    bird.vy+=GRAVITY*dt;
    bird.y+=bird.vy*dt;
    for(var i=0;i<pipes.length;i++){
      pipes[i].x-=PIPE_SPEED*dt;
      if(!pipes[i].passed && pipes[i].x+PIPE_W<bird.x-bird.r){
        pipes[i].passed=true;score++;playScore();updateUI();
      }
    }
    while(pipes.length && pipes[0].x < -PIPE_W-5) pipes.shift();
    if(bird.y-bird.r<0 || bird.y+bird.r>H){
      playHit();endGame();
    }
    for(var j=0;j<pipes.length;j++){
      var p=pipes[j];
      var hitTop=circleRectHit(bird.x,bird.y,bird.r,p.x,0,PIPE_W,p.gapY);
      var hitBot=circleRectHit(bird.x,bird.y,bird.r,p.x,p.gapY+PIPE_GAP,PIPE_W,H-(p.gapY+PIPE_GAP));
      if(hitTop||hitBot){playHit();endGame();break;}
    }
  }
  draw();
  if(running)requestAnimationFrame(loop);
}
function draw(){
  if(!W||!H)return;
  ctx.clearRect(0,0,W,H);
  var skyGrad=ctx.createLinearGradient(0,0,0,H);
  skyGrad.addColorStop(0,'#bdeeff');skyGrad.addColorStop(0.78,'#eafbe4');skyGrad.addColorStop(1,'#8bd97f');
  ctx.fillStyle=skyGrad;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.75)';
  ctx.beginPath();ctx.ellipse(W*0.25,H*0.15,W*0.11,H*0.035,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(W*0.7,H*0.22,W*0.13,H*0.04,0,0,Math.PI*2);ctx.fill();
  for(var i=0;i<pipes.length;i++){
    var p=pipes[i];
    var pg=ctx.createLinearGradient(p.x,0,p.x+PIPE_W,0);
    pg.addColorStop(0,'#4fae4f');pg.addColorStop(0.5,'#7dd67d');pg.addColorStop(1,'#3d8f3d');
    ctx.fillStyle=pg;
    ctx.fillRect(p.x,0,PIPE_W,p.gapY);
    ctx.fillRect(p.x,p.gapY+PIPE_GAP,PIPE_W,H-(p.gapY+PIPE_GAP));
    ctx.fillStyle='#2f6e2f';
    ctx.fillRect(p.x-4,p.gapY-14,PIPE_W+8,14);
    ctx.fillRect(p.x-4,p.gapY+PIPE_GAP,PIPE_W+8,14);
  }
  ctx.fillStyle='#7a5c2e';
  ctx.fillRect(0,H-Math.max(10,H*0.03),W,Math.max(10,H*0.03));
  if(bird){
    var tilt=Math.max(-0.5,Math.min(0.9,bird.vy/700));
    var bx=bird.x,by=bird.y,br=bird.r;
    ctx.fillStyle='#ffcb3d';
    ctx.beginPath();ctx.ellipse(bx,by,br,br*0.82,tilt,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff8c1f';
    ctx.beginPath();ctx.moveTo(bx+br*0.6,by);ctx.lineTo(bx+br*1.35,by-br*0.18);ctx.lineTo(bx+br*1.35,by+br*0.18);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.ellipse(bx+br*0.18,by-br*0.22,br*0.32,br*0.28,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#222';
    ctx.beginPath();ctx.arc(bx+br*0.26,by-br*0.22,br*0.13,0,Math.PI*2);ctx.fill();
  }
}
tapBtn.addEventListener('click',flap);
wrap.addEventListener('touchstart',function(e){
  if(e.target.closest && e.target.closest('#over'))return;
  e.preventDefault();flap();
},{passive:false});
wrap.addEventListener('mousedown',function(e){
  if(e.target.closest && e.target.closest('#over'))return;
  flap();
});
restartBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();reset();});
restartBtn.addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();reset();},{passive:false});
addEventListener('resize',resize);
resize();reset();
})();</script></body></html>
`.trim();

const buildFlappyMessage = () => buildHtmlMessage(FLAPPY_HTML);
const sendFlappyGame = (sock, jid) => sendHtmlGame(sock, jid, FLAPPY_HTML);

module.exports = { sendFlappyGame, buildFlappyMessage, FLAPPY_HTML };