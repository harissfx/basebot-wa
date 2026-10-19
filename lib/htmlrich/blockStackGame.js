const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Block-stacking game (Block Stack, ala Tetris) — balok jatuh dari atas, disusun
 * kiri/kanan + rotasi, garis penuh langsung hancur. Ada efek suara lewat Web Audio
 * API (di-generate langsung, gak butuh file audio eksternal).
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const BLOCKSTACK_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Courier New',monospace}
body{padding:8px;background:#0d0620}
.board{position:relative;padding:10px;border:2px solid #ff2ee6;border-radius:10px;background:#0a0518}
.title{padding:8px;border:2px solid #00f0ff;border-radius:6px;color:#fff;background:#0a0518;text-align:center;font:700 20px 'Courier New',monospace;letter-spacing:3px}
.top{display:flex;gap:8px;margin:8px 0}
.stats{flex:1;display:flex;flex-direction:column;gap:6px}
.stat{padding:6px;border:1px solid #ff2ee688;border-radius:6px;background:#0d0722;text-align:center;color:#c98bff;font:bold 10px monospace}
.stat b{display:block;color:#00f0ff;font-size:14px}
.nextbox{width:64px;padding:6px;border:1px solid #00f0ff88;border-radius:6px;background:#0d0722;text-align:center}
.nextbox span{display:block;color:#c98bff;font:bold 9px monospace;margin-bottom:4px}
#nextcv{display:block;width:100%;aspect-ratio:1;background:#160b2e;border-radius:2px}
.frame{padding:6px;border:2px solid #7a2ee688;border-radius:8px;background:#0a0518}
.boardwrap{position:relative;width:100%;aspect-ratio:8/15;background:#0d0620;border-radius:6px;overflow:hidden}
#cv{display:block;width:100%;height:100%}
.message{margin:8px 0;padding:8px;border:1px solid #00f0ff88;border-radius:6px;color:#00f0ff;background:#0d0722;text-align:center;font:bold 13px 'Courier New',monospace}
.controls{display:flex;flex-direction:column;gap:8px}
.crow{display:grid;gap:8px}
.crow.c3{grid-template-columns:1fr 1fr 1fr}
.crow.c2{grid-template-columns:1fr 1fr}
button{height:46px;border:1px solid #00f0ff;border-radius:8px;color:#00f0ff;font-weight:900;font-size:18px;background:#0d0722;touch-action:manipulation}
button:active{background:#1a0f3a}
button.rotate{border-color:#ff2ee6;color:#ff2ee6}
button.hard{border-color:#fff933;color:#fff933;font-size:13px}
.over{position:absolute;inset:0;display:grid;place-items:center;background:rgba(4,2,12,.94);color:#00f0ff;text-align:center}
.over.off{display:none}
.over button{padding:0 22px;height:44px;background:#ff2ee6;color:#0a0518;font-size:14px;border:0}
</style></head><body>
<div class="board" id="board">
  <div class="title">BLOCK STACK</div>
  <div class="top">
    <div class="stats">
      <div class="stat">SCORE<b id="score">0</b></div>
      <div class="stat">LINES<b id="lines">0</b></div>
      <div class="stat">LEVEL<b id="level">1</b></div>
    </div>
    <div class="nextbox"><span>NEXT</span><canvas id="nextcv" width="64" height="64"></canvas></div>
  </div>
  <div class="frame"><div class="boardwrap"><canvas id="cv"></canvas>
    <div id="over" class="over off"><div><h2>GAME OVER</h2><p>Score: <b id="finalScore">0</b></p><button id="restartBtn">MAIN LAGI</button></div></div>
  </div></div>
  <div id="message" class="message">SUSUN BALOK-NYA!</div>
  <div class="controls">
    <div class="crow c3">
      <button id="leftBtn">◀</button>
      <button id="rotateBtn" class="rotate">⟳</button>
      <button id="rightBtn">▶</button>
    </div>
    <div class="crow c2">
      <button id="downBtn">▼ TURUN</button>
      <button id="hardBtn" class="hard">JATUHKAN</button>
    </div>
  </div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var COLS=8,ROWS=15;
var COLORS=['#00f0ff','#fff933','#c94bff','#39ff8a','#ff3355','#3f7fff','#ff9d1f'];
var SHAPES=[
 [["....","####","....","...."],["..#.","..#.","..#.","..#."],["....","....","####","...."],[".#..",".#..",".#..",".#.."]],
 [[".##.",".##.","....","...."],[".##.",".##.","....","...."],[".##.",".##.","....","...."],[".##.",".##.","....","...."]],
 [[".#..","###.","....","...."],[".#..",".##.",".#..","...."],["....","###.",".#..","...."],[".#..","##..",".#..","...."]],
 [[".##.","##..","....","...."],[".#..",".##.","..#.","...."],[".##.","##..","....","...."],[".#..",".##.","..#.","...."]],
 [["##..",".##.","....","...."],["..#.",".##.",".#..","...."],["##..",".##.","....","...."],["..#.",".##.",".#..","...."]],
 [["#...","###.","....","...."],[".##.",".#..",".#..","...."],["....","###.","..#.","...."],[".#..",".#..","##..","...."]],
 [["..#.","###.","....","...."],[".#..",".#..",".##.","...."],["....","###.","#...","...."],["##..",".#..",".#..","...."]]
];
/* precompute: CELLS[type][rot] = [[r,c],...] (tidak alokasi array tiap frame) */
var CELLS=SHAPES.map(function(rots){return rots.map(function(g){var o=[];for(var r=0;r<4;r++)for(var c=0;c<4;c++)if(g[r][c]==='#')o.push([r,c]);return o;});});

var cv=document.getElementById('cv'),ctx=cv.getContext('2d',{alpha:false});
var ncv=document.getElementById('nextcv'),nctx=ncv.getContext('2d',{alpha:false});
var scoreEl=document.getElementById('score'),linesEl=document.getElementById('lines'),levelEl=document.getElementById('level');
var msg=document.getElementById('message'),over=document.getElementById('over'),finalScoreEl=document.getElementById('finalScore');
var restartBtn=document.getElementById('restartBtn');
var leftBtn=document.getElementById('leftBtn'),rightBtn=document.getElementById('rightBtn'),rotateBtn=document.getElementById('rotateBtn');
var downBtn=document.getElementById('downBtn'),hardBtn=document.getElementById('hardBtn');

var board,bag,cur,next,score,lines,level,gameOverFlag,speed,acc,lastTs,running=false;
var dirty=true,nextDirty=true;
var cell=0,gap=1,bgLayer=null,sprites=[],nextSprites=[];

/* ---------- sprite & layer (digambar sekali, bukan tiap frame) ---------- */
function makeSprite(color,size){
  var c=document.createElement('canvas');c.width=c.height=size;
  var x=c.getContext('2d');
  x.fillStyle=color;x.fillRect(0,0,size,size);
  x.fillStyle='rgba(255,255,255,.45)';x.fillRect(0,0,size,Math.max(1,size*0.14));
  x.fillStyle='rgba(255,255,255,.18)';x.fillRect(0,0,Math.max(1,size*0.1),size);
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,size*0.82,size,size*0.18);
  return c;
}
function buildLayers(){
  var cw=cv.clientWidth||240;
  var dpr=Math.min(window.devicePixelRatio||1,2);
  cell=Math.max(8,Math.floor(cw*dpr/COLS));
  gap=Math.max(1,Math.round(cell/16));
  cv.width=cell*COLS;cv.height=cell*ROWS;
  bgLayer=document.createElement('canvas');bgLayer.width=cv.width;bgLayer.height=cv.height;
  var b=bgLayer.getContext('2d');
  b.fillStyle='#0d0620';b.fillRect(0,0,bgLayer.width,bgLayer.height);
  b.fillStyle='#160b2e';
  for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++)b.fillRect(c*cell+gap,r*cell+gap,cell-gap,cell-gap);
  sprites=COLORS.map(function(col){return makeSprite(col,cell);});
  var ns=16;
  nextSprites=COLORS.map(function(col){return makeSprite(col,ns);});
  dirty=true;nextDirty=true;
}

/* ---------- logika ---------- */
function makeBoard(){return new Array(ROWS*COLS).fill(0);}
function collides(type,rot,row,col){
  var cs=CELLS[type][rot];
  for(var i=0;i<cs.length;i++){
    var br=row+cs[i][0],bc=col+cs[i][1];
    if(bc<0||bc>=COLS||br>=ROWS)return true;
    if(br>=0&&board[br*COLS+bc]!==0)return true;
  }
  return false;
}
function lockPiece(type,rot,row,col,colorIdx){
  var cs=CELLS[type][rot],go=false;
  for(var i=0;i<cs.length;i++){
    var br=row+cs[i][0],bc=col+cs[i][1];
    if(br<0){go=true;continue;}
    board[br*COLS+bc]=colorIdx;
  }
  return go;
}
function clearLines(){
  var cleared=0;
  for(var r=ROWS-1;r>=0;r--){
    var full=true;
    for(var c=0;c<COLS;c++)if(board[r*COLS+c]===0){full=false;break;}
    if(full){
      cleared++;
      board.splice(r*COLS,COLS);
      for(var i=0;i<COLS;i++)board.unshift(0);
      r++;
    }
  }
  return cleared;
}
function shuffle(arr){for(var i=arr.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;}return arr;}
function drawPiece(){ if(bag.length===0)bag=shuffle([0,1,2,3,4,5,6]); return bag.pop(); }

/* ---------- render (canvas, hanya saat ada perubahan) ---------- */
function put(c,r,idx){
  ctx.drawImage(sprites[idx],c*cell+gap,r*cell+gap,cell-gap,cell-gap);
}
function draw(){
  if(dirty){
    dirty=false;
    ctx.drawImage(bgLayer,0,0);
    for(var i=0;i<board.length;i++){
      var v=board[i];
      if(v)put(i%COLS,(i/COLS)|0,v-1);
    }
    if(cur&&!gameOverFlag){
      var cs=CELLS[cur.type][cur.rot];
      for(var k=0;k<cs.length;k++){
        var br=cur.row+cs[k][0],bc=cur.col+cs[k][1];
        if(br>=0)put(bc,br,cur.type);
      }
    }
  }
  if(nextDirty){
    nextDirty=false;
    nctx.fillStyle='#160b2e';nctx.fillRect(0,0,64,64);
    var ncs=CELLS[next][0];
    for(var m=0;m<ncs.length;m++){
      nctx.drawImage(nextSprites[next],ncs[m][1]*16+1,ncs[m][0]*16+1,15,15);
    }
  }
}
function updateUI(){scoreEl.textContent=score;linesEl.textContent=lines;levelEl.textContent=level;}

/* ---------- gameplay ---------- */
function spawn(){
  cur={type:next,rot:0,row:-1,col:Math.floor((COLS-4)/2)};
  next=drawPiece();nextDirty=true;dirty=true;
  if(collides(cur.type,cur.rot,cur.row,cur.col)){endGame();return;}
}
function tryMove(dr,dc){
  if(gameOverFlag)return false;
  var nr=cur.row+dr,nc=cur.col+dc;
  if(!collides(cur.type,cur.rot,nr,nc)){cur.row=nr;cur.col=nc;dirty=true;return true;}
  return false;
}
function tryRotate(){
  if(gameOverFlag)return;
  var nr=(cur.rot+1)%4;
  if(!collides(cur.type,nr,cur.row,cur.col)){cur.rot=nr;dirty=true;SFX.click();}
}
function lockAndNext(){
  var go=lockPiece(cur.type,cur.rot,cur.row,cur.col,cur.type+1);
  SFX.wood();
  if(go){dirty=true;endGame();return;}
  var cleared=clearLines();
  if(cleared>0){
    lines+=cleared;
    score+=[0,100,300,500,800][cleared]*level;
    SFX.swish();SFX.chime(cleared);
    msg.textContent=cleared>=4?'BLOCK STACK!':(cleared>1?cleared+' BARIS!':'1 BARIS!');
    var newLevel=Math.floor(lines/10)+1;
    if(newLevel!==level){level=newLevel;SFX.chime(3);speed=Math.max(120,700-(level-1)*50);}
  } else {
    msg.textContent='MENDARAT';
  }
  updateUI();
  spawn();
  dirty=true;
  acc=0;
}
function softDrop(){
  if(gameOverFlag)return;
  if(!tryMove(1,0))lockAndNext();
}
function hardDrop(){
  if(gameOverFlag)return;
  var dist=0;
  while(!collides(cur.type,cur.rot,cur.row+1,cur.col)){cur.row++;dist++;}
  score+=dist*2;
  updateUI();
  lockAndNext();
}
function endGame(){
  gameOverFlag=true;
  finalScoreEl.textContent=score;
  over.className='over';
  SFX.over(0);
}

/* ---------- loop: 1x requestAnimationFrame, gravitasi pakai akumulator waktu ---------- */
function loop(ts){
  if(lastTs===0)lastTs=ts;
  var dt=ts-lastTs;lastTs=ts;
  if(dt>100)dt=100;
  if(!gameOverFlag){
    acc+=dt;
    if(acc>=speed){acc=0;softDrop();}
  }
  draw();
  if(gameOverFlag&&!dirty&&!nextDirty){running=false;return;}
  requestAnimationFrame(loop);
}
function startLoop(){
  if(running)return;
  running=true;lastTs=0;
  requestAnimationFrame(loop);
}
function resetGame(){
  board=makeBoard();bag=[];score=0;lines=0;level=1;gameOverFlag=false;speed=700;acc=0;
  over.className='over off';msg.textContent='SUSUN BALOK-NYA!';
  next=drawPiece();spawn();updateUI();
  dirty=true;nextDirty=true;
  startLoop();
}

/* ---------- input ---------- */
function bindRepeat(btn,fn){
  var iv=null;
  function start(e){if(e.cancelable)e.preventDefault();stop();fn();iv=setInterval(fn,140);}
  function stop(){if(iv){clearInterval(iv);iv=null;}}
  btn.addEventListener('pointerdown',start);
  btn.addEventListener('pointerup',stop);
  btn.addEventListener('pointercancel',stop);
  btn.addEventListener('pointerleave',stop);
}
function bindTap(btn,fn){
  btn.addEventListener('pointerdown',function(e){if(e.cancelable)e.preventDefault();fn();});
}
bindRepeat(leftBtn,function(){if(tryMove(0,-1))SFX.tick();});
bindRepeat(rightBtn,function(){if(tryMove(0,1))SFX.tick();});
bindRepeat(downBtn,function(){softDrop();});
bindTap(rotateBtn,tryRotate);
bindTap(hardBtn,hardDrop);
bindTap(restartBtn,resetGame);

/* resize: bangun ulang layer hanya saat ukuran berubah (didebounce) */
var rsTimer=null,lastW=0;
function onResize(){
  clearTimeout(rsTimer);
  rsTimer=setTimeout(function(){
    var w=cv.clientWidth;
    if(w&&w!==lastW){lastW=w;buildLayers();startLoop();}
  },120);
}
if(window.ResizeObserver){new ResizeObserver(onResize).observe(cv);}else{window.addEventListener('resize',onResize);}

buildLayers();lastW=cv.clientWidth;
resetGame();
})();</script></body></html>
`.trim();

const buildBlockStackMessage = () => buildHtmlMessage(BLOCKSTACK_HTML);
const sendBlockStackGame = (sock, jid) => sendHtmlGame(sock, jid, BLOCKSTACK_HTML);

module.exports = { sendBlockStackGame, buildBlockStackMessage, BLOCKSTACK_HTML };