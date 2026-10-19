const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Brick-breaker game (Brick Breaker, ala Breakout) — geser paddle buat mantulin
 * bola, hancurin semua bata biar naik level. Ada efek suara lewat Web Audio API
 * (di-generate langsung, gak butuh file audio eksternal). Tema neon merah-oranye
 * arcade, beda dari game lain biar gak monoton.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const BRICKBREAKER_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Courier New',monospace}
body{padding:8px;background:radial-gradient(circle at 50% 6%,#2b0a0a,#1a0505 55%,#0d0202)}
.board{position:relative;padding:10px;border:2px solid #ff5c2e;border-radius:14px;background:linear-gradient(160deg,#1f0808,#150505);box-shadow:inset 0 0 0 3px #ff8a3d55,0 8px 18px rgba(0,0,0,.5)}
.title{padding:8px;border:2px solid #ffb23d;border-radius:10px;color:#fff;background:linear-gradient(90deg,#ff2e2e,#ff8a1f);text-align:center;font:900 20px 'Courier New',monospace;letter-spacing:2px;text-shadow:0 0 8px #ff8a3d}
.stats{display:flex;gap:6px;margin:8px 0;padding:6px;border:2px solid #ff5c2e55;border-radius:10px;background:#1a0808}
.stat{flex:1;text-align:center;color:#ff9d6b;font:bold 10px monospace}.stat b{display:block;color:#ffdca8;font-size:14px;text-shadow:0 0 6px #ff8a3d}
.frame{padding:6px;border:3px solid #ff5c2e55;border-radius:14px;background:#150606}
.gamewrap{position:relative;width:100%;aspect-ratio:5/7;background:#0d0303;border-radius:10px;overflow:hidden;touch-action:none}
#gameCanvas{display:block;width:100%;height:100%}
.message{margin:8px 0;padding:8px;border:2px solid #ff5c2e55;border-radius:10px;color:#ffdca8;background:#1a0808;text-align:center;font:bold 13px monospace}
.console{display:grid;grid-template-columns:1fr;gap:8px}
button{height:48px;border:0;border-radius:14px;color:#fff;font-weight:900;font-size:16px}
.tap{background:linear-gradient(#ff8a3d,#ff4d1f);box-shadow:0 3px 0 #b8340f}
.over{position:absolute;inset:0;display:grid;place-items:center;background:rgba(20,4,4,.92);color:#fff;text-align:center}
.over.off{display:none}
.over button{padding:0 22px;height:44px;background:#fff;color:#c8340f;border-radius:12px}
</style></head><body>
<div class="board" id="board">
  <div class="title">BRICK BREAKER</div>
  <div class="stats">
    <div class="stat">SCORE<b id="score">0</b></div>
    <div class="stat">LIVES<b id="lives">3</b></div>
    <div class="stat">LEVEL<b id="level">1</b></div>
  </div>
  <div class="frame"><div class="gamewrap"><canvas id="gameCanvas"></canvas>
    <div id="over" class="over off"><div><h2>GAME OVER</h2><p>Score: <b id="finalScore">0</b></p><button id="restartBtn">MAIN LAGI</button></div></div>
  </div></div>
  <div id="message" class="message">GESER LAYAR BUAT GERAKIN PADDLE, TAP BUAT LUNCURKAN BOLA!</div>
  <div class="console"><button id="tapBtn" class="tap">▲ LUNCURKAN BOLA</button></div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var wrap=document.querySelector('.gamewrap');
var over=document.getElementById('over');
var scoreEl=document.getElementById('score'),livesEl=document.getElementById('lives'),levelEl=document.getElementById('level');
var msg=document.getElementById('message'),finalScoreEl=document.getElementById('finalScore');
var tapBtn=document.getElementById('tapBtn'),restartBtn=document.getElementById('restartBtn');
var D=Math.min(devicePixelRatio||1,2),W=0,H=0;
var ROWS=5,COLS=7,BRICK_PAD=4,BRICK_TOP=40;
var BALL_SPEED_BASE=320;
var paddle={x:0,y:0,w:0,h:14};
var ball={x:0,y:0,vx:0,vy:0,r:7};
var bricks=[],score=0,lives=3,level=1,started=false,running=true;
var audioCtx=null;

function actx(){if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}
function tone(freq,dur,type,vol,delayMs){var ac=actx();if(!ac)return;var t0=ac.currentTime+(delayMs||0)/1000;var osc=ac.createOscillator(),gain=ac.createGain();osc.type=type||'sine';osc.frequency.setValueAtTime(freq,t0);gain.gain.setValueAtTime(0,t0);gain.gain.linearRampToValueAtTime(vol||0.16,t0+0.01);gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);osc.connect(gain).connect(ac.destination);osc.start(t0);osc.stop(t0+dur+0.02)}
function playPaddle(){SFX.thock(1)}
function playWall(){SFX.thock(1.5)}
function playBrick(row){SFX.glass(ROWS-1-row)}
function playLife(){SFX.hit()}
function playLevel(){SFX.chime(4)}
function playOver(){SFX.over(0)}

function resize(){
  var r=canvas.getBoundingClientRect();W=r.width;H=r.height;
  canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);
  ctx.setTransform(D,0,0,D,0,0);
  paddle.w=Math.max(46,W*0.26);paddle.h=Math.max(10,H*0.022);paddle.y=H-paddle.h-10;
  if(paddle.x===0)paddle.x=(W-paddle.w)/2;
  paddle.x=Math.max(0,Math.min(W-paddle.w,paddle.x));
  draw();
}
function buildBricks(){
  bricks=[];
  var rows=Math.min(ROWS+Math.floor((level-1)/2),8);
  var bw=(W-BRICK_PAD*(COLS+1))/COLS;
  var bh=Math.max(16,H*0.045);
  for(var r=0;r<rows;r++){
    for(var c=0;c<COLS;c++){
      bricks.push({
        x:BRICK_PAD+c*(bw+BRICK_PAD),
        y:BRICK_TOP+r*(bh+BRICK_PAD),
        w:bw,h:bh,row:r,alive:true
      });
    }
  }
}
function placeBallOnPaddle(){
  ball.x=paddle.x+paddle.w/2;
  ball.y=paddle.y-ball.r-1;
  ball.vx=0;ball.vy=0;
  started=false;
}
function updateUI(){scoreEl.textContent=score;livesEl.textContent=lives;levelEl.textContent=level}
function launch(){
  if(started||!running)return;
  started=true;
  var speed=BALL_SPEED_BASE+(level-1)*24;
  var ang=-Math.PI/2+(Math.random()*0.6-0.3);
  ball.vx=Math.cos(ang)*speed;ball.vy=Math.sin(ang)*speed;
}
function movePaddleTo(px){
  paddle.x=Math.max(0,Math.min(W-paddle.w,px-paddle.w/2));
  if(!started)placeBallOnPaddle();
}
function pointerX(e){
  var rect=wrap.getBoundingClientRect();
  var cx=(e.touches&&e.touches.length)?e.touches[0].clientX:e.clientX;
  return cx-rect.left;
}
function isOverTarget(e){return e.target&&e.target.closest&&e.target.closest('#over')}

function circleRectHit(cx,cy,cr,rx,ry,rw,rh){
  var nx=Math.max(rx,Math.min(cx,rx+rw)),ny=Math.max(ry,Math.min(cy,ry+rh));
  var dx=cx-nx,dy=cy-ny;
  return (dx*dx+dy*dy)<(cr*cr);
}
function loseLife(){
  lives--;updateUI();
  if(lives<=0){endGame();return;}
  playLife();
  msg.textContent='SIAP-SIAP! TAP BUAT LUNCURKAN LAGI';
  placeBallOnPaddle();
}
function nextLevel(){
  level++;score+=200;
  playLevel();updateUI();
  msg.textContent='LEVEL '+level+'!';
  buildBricks();
  placeBallOnPaddle();
}
function endGame(){
  running=false;started=false;
  finalScoreEl.textContent=score;
  over.className='over';
  playOver();
}
function resetGame(){
  score=0;lives=3;level=1;running=true;started=false;
  over.className='over off';
  msg.textContent='GESER LAYAR BUAT GERAKIN PADDLE, TAP BUAT LUNCURKAN BOLA!';
  updateUI();
  buildBricks();
  placeBallOnPaddle();
  lastTime=null;
  requestAnimationFrame(loop);
}
var lastTime=null;
function loop(ts){
  if(!running){draw();return;}
  if(lastTime===null)lastTime=ts;
  var dt=Math.min((ts-lastTime)/1000,0.035);
  lastTime=ts;
  if(started){
    ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
    if(ball.x-ball.r<0){ball.x=ball.r;ball.vx=Math.abs(ball.vx);playWall();}
    if(ball.x+ball.r>W){ball.x=W-ball.r;ball.vx=-Math.abs(ball.vx);playWall();}
    if(ball.y-ball.r<0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);playWall();}
    if(ball.y-ball.r>H){loseLife();}
    if(ball.vy>0 && circleRectHit(ball.x,ball.y,ball.r,paddle.x,paddle.y,paddle.w,paddle.h)){
      var hit=(ball.x-(paddle.x+paddle.w/2))/(paddle.w/2);
      var speed=Math.hypot(ball.vx,ball.vy);
      var ang=-Math.PI/2+hit*(Math.PI/3);
      ball.vx=Math.cos(ang)*speed;ball.vy=Math.sin(ang)*speed;
      ball.y=paddle.y-ball.r-1;
      playPaddle();
    }
    for(var i=0;i<bricks.length;i++){
      var b=bricks[i];
      if(!b.alive)continue;
      if(circleRectHit(ball.x,ball.y,ball.r,b.x,b.y,b.w,b.h)){
        b.alive=false;
        score+=(ROWS-b.row)*10;
        playBrick(b.row);
        var cx=b.x+b.w/2,cy=b.y+b.h/2;
        var overlapX=Math.min(ball.x+ball.r-b.x,b.x+b.w-(ball.x-ball.r));
        var overlapY=Math.min(ball.y+ball.r-b.y,b.y+b.h-(ball.y-ball.r));
        if(overlapX<overlapY)ball.vx=-ball.vx;else ball.vy=-ball.vy;
        updateUI();
        break;
      }
    }
    if(bricks.every(function(b){return !b.alive;})){nextLevel();}
  } else {
    ball.x=paddle.x+paddle.w/2;
    ball.y=paddle.y-ball.r-1;
  }
  draw();
  if(running)requestAnimationFrame(loop);
}
function draw(){
  if(!W||!H)return;
  ctx.clearRect(0,0,W,H);
  var bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#2b0a0a');bg.addColorStop(1,'#0d0202');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  var rowColors=['#ff2e2e','#ff6a2e','#ff9d1f','#ffce1f','#c8ff4d','#4dffb0','#4db0ff','#b04dff'];
  for(var i=0;i<bricks.length;i++){
    var b=bricks[i];
    if(!b.alive)continue;
    ctx.fillStyle=rowColors[b.row%rowColors.length];
    ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle='rgba(0,0,0,.25)';
    ctx.fillRect(b.x,b.y+b.h-3,b.w,3);
  }
  ctx.fillStyle='#ff8a3d';
  ctx.beginPath();ctx.roundRect?ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,6):ctx.rect(paddle.x,paddle.y,paddle.w,paddle.h);ctx.fill();
  ctx.fillStyle='#fff3e0';
  ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();
}
tapBtn.addEventListener('click',launch);
wrap.addEventListener('touchstart',function(e){
  if(isOverTarget(e))return;
  e.preventDefault();
  movePaddleTo(pointerX(e));launch();
},{passive:false});
wrap.addEventListener('touchmove',function(e){
  if(isOverTarget(e))return;
  e.preventDefault();
  movePaddleTo(pointerX(e));
},{passive:false});
wrap.addEventListener('mousedown',function(e){
  if(isOverTarget(e))return;
  movePaddleTo(pointerX(e));launch();
});
wrap.addEventListener('mousemove',function(e){
  if(e.buttons!==1)return;
  if(isOverTarget(e))return;
  movePaddleTo(pointerX(e));
});
restartBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();resetGame();});
restartBtn.addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();resetGame();},{passive:false});
addEventListener('resize',resize);
resize();
buildBricks();
placeBallOnPaddle();
updateUI();
requestAnimationFrame(loop);
})();</script></body></html>
`.trim();

const buildBrickBreakerMessage = () => buildHtmlMessage(BRICKBREAKER_HTML);
const sendBrickBreakerGame = (sock, jid) => sendHtmlGame(sock, jid, BRICKBREAKER_HTML);

module.exports = { sendBrickBreakerGame, buildBrickBreakerMessage, BRICKBREAKER_HTML };