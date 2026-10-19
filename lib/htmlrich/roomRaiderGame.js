const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Raycasting FPS shooter (Room Raider 3D) — first-person, ada 3 room yang
 * terhubung lewat lorong, tembak musuh yang muncul, tiap wave makin banyak &
 * makin cepat. Rendering pakai teknik raycasting klasik (Wolfenstein-style) di
 * atas canvas 2D biasa — gak butuh WebGL / library 3D eksternal apapun, jadi
 * tetap ringan & self-contained. Ada efek suara lewat Web Audio API
 * (di-generate langsung, gak butuh file audio eksternal). Tema tactical HUD
 * biru-abu gelap dengan aksen oranye, beda dari game lain biar gak monoton.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const ROOMRAIDER_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Courier New',monospace;touch-action:none;overscroll-behavior:none}
body{padding:6px;background:#080a0d}
.board{position:relative;padding:8px;border:2px solid #ff9d3d;border-radius:10px;background:#0a0d12;box-shadow:0 8px 18px rgba(0,0,0,.55)}
.top{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:6px}
.hudTitle{color:#ff9d3d;font:900 13px 'Courier New',monospace;letter-spacing:2px;text-shadow:0 0 6px #ff9d3d}
.hudStats{display:flex;gap:10px;color:#8fb4e0;font:bold 10px monospace;white-space:nowrap}
.hudStats b{color:#ffcf9d;font-size:12px}
.gamewrap{position:relative;width:100%;aspect-ratio:4/3;background:#0a0d12;border-radius:8px;border:1px solid #2a3340;overflow:hidden;touch-action:none}
#gameCanvas{display:block;width:100%;height:100%;touch-action:none}
.hudMsg{margin:6px 0 0;padding:6px;border:1px solid #2a3340;border-radius:6px;background:rgba(20,26,34,.85);color:#cfe0f5;text-align:center;font:bold 10px monospace}
.ctl{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:8px;margin-top:8px}
.ctrlbtn{height:50px;border:0;border-radius:10px;color:#fff;font:900 12px 'Courier New',monospace;letter-spacing:.4px;touch-action:none}
.ctrlbtn.fwd{background:linear-gradient(160deg,#4cc46a,#217a3a);box-shadow:0 3px 0 #135022}
.ctrlbtn.back{background:linear-gradient(160deg,#5c8dff,#1c4fb8);box-shadow:0 3px 0 #12306e}
.ctrlbtn.shoot{background:linear-gradient(160deg,#ffb35c,#ff5c1f);box-shadow:0 3px 0 #b8380f;font-size:14px}
.ctrlbtn.on{outline:3px solid #fff;filter:brightness(1.25)}
.ctrlbtn:active{transform:translateY(2px);box-shadow:none}
.over{position:absolute;inset:0;display:grid;place-items:center;background:rgba(6,8,11,.92);color:#fff;text-align:center}
.over.off{display:none}
.over button{padding:0 22px;height:40px;background:#ff9d3d;color:#111;border-radius:8px;border:0;font-weight:900}
</style></head><body>
<div class="board" id="board">
  <div class="top">
    <div class="hudTitle">ROOM RAIDER 3D</div>
    <div class="hudStats">SCORE <b id="score">0</b> LIVES <b id="lives">3</b> WAVE <b id="wave">1</b></div>
  </div>
  <div class="gamewrap"><canvas id="gameCanvas"></canvas>
    <div id="over" class="over off"><div><h2>GAME OVER</h2><p>Score: <b id="finalScore">0</b></p><button id="restartBtn">MAIN LAGI</button></div></div>
  </div>
  <div id="message" class="hudMsg">MAJU / MUNDUR = ON/OFF. GESER LAYAR BUAT BELOK. HABISIN MUSUH!</div>
  <div class="ctl">
    <button id="fwdBtn" class="ctrlbtn fwd">MAJU</button>
    <button id="backBtn" class="ctrlbtn back">MUNDUR</button>
    <button id="shootBtn" class="ctrlbtn shoot">TEMBAK</button>
  </div>
</div>
<script>${SFX_JS}</script>
<script>(function(){
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var over=document.getElementById('over');
var scoreEl=document.getElementById('score'),livesEl=document.getElementById('lives'),waveEl=document.getElementById('wave');
var msg=document.getElementById('message'),finalScoreEl=document.getElementById('finalScore');
var restartBtn=document.getElementById('restartBtn');
var shootBtn=document.getElementById('shootBtn'),backBtn=document.getElementById('backBtn'),fwdBtn=document.getElementById('fwdBtn');
var audioOn=false;
function startAudio(){if(audioOn)return;audioOn=true;try{SFX.music('*');SFX.musicStart();}catch(e){}}
var MSG0='MAJU / MUNDUR = ON/OFF. GESER LAYAR BUAT BELOK. HABISIN MUSUH!';
var D=Math.min(devicePixelRatio||1,2),W=0,H=0,distProj=0;
var FOV=66*Math.PI/180;
var NUM_RAYS=120;
var MOVE_SPEED=1.5,moveDir=0,CHASE_PATH=18,flow=null,DX4=[1,-1,0,0],DY4=[0,0,1,-1];
var MAPW=25,MAPH=17,map=[];
var player={x:3.5,y:3.5,angle:0};
var score=0,lives=3,wave=1,running=true,enemies=[];
var wallDist=new Array(NUM_RAYS).fill(999);
var lastShotTime=0,flashAlpha=0,hurtFlash=0,lastHurtTime=-9999;
var audioCtx=null;
var SPAWN_MIN_DIST=7,SPAWN_FADE=1.0,SPAWN_GRACE=1.0;
function vibrate(pattern){if(navigator.vibrate){try{navigator.vibrate(pattern);}catch(e){}}}

function actx(){if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}
function tone(freq,dur,type,vol,delayMs){var ac=actx();if(!ac)return;var t0=ac.currentTime+(delayMs||0)/1000;var osc=ac.createOscillator(),gain=ac.createGain();osc.type=type||'sine';osc.frequency.setValueAtTime(freq,t0);gain.gain.setValueAtTime(0,t0);gain.gain.linearRampToValueAtTime(vol||0.16,t0+0.01);gain.gain.exponentialRampToValueAtTime(0.0001,t0+dur);osc.connect(gain).connect(ac.destination);osc.start(t0);osc.stop(t0+dur+0.02)}
function playShoot(){SFX.shot()}
function playHitEnemy(){SFX.hitEnemy()}
function playMiss(){SFX.ricochet()}
function playHurt(){SFX.hit()}
function playWave(){SFX.chime(4)}
function playOver(){SFX.over(0)}
function playSpawn(){SFX.creak()}

function buildMap(){
  map=[];
  for(var y=0;y<MAPH;y++){var row=[];for(var x=0;x<MAPW;x++)row.push(1);map.push(row);}
  function carve(x0,y0,x1,y1){
    for(var y=y0;y<=y1;y++)for(var x=x0;x<=x1;x++){
      if(x>0&&x<MAPW-1&&y>0&&y<MAPH-1)map[y][x]=0;
    }
  }
  carve(1,1,6,5);carve(9,1,15,5);carve(18,1,23,5);
  carve(1,7,23,9);
  carve(1,11,7,15);carve(10,11,14,15);carve(17,11,23,15);
  carve(7,3,8,4);carve(16,3,17,4);
  carve(3,6,4,6);carve(11,6,12,6);carve(20,6,21,6);
  carve(3,10,4,10);carve(11,10,12,10);carve(19,10,20,10);
  map[8][6]=1;map[8][12]=1;map[8][18]=1;
}
function isWall(x,y){
  var mx=Math.floor(x),my=Math.floor(y);
  if(mx<0||mx>=MAPW||my<0||my>=MAPH)return true;
  return map[my][mx]===1;
}
function randomOpenCell(minDist,avoidFOV){
  var list=[],x,y,cx,cy,d,a;
  for(y=1;y<MAPH-1;y++)for(x=1;x<MAPW-1;x++){
    if(map[y][x]!==0)continue;
    cx=x+0.5;cy=y+0.5;
    d=Math.hypot(cx-player.x,cy-player.y);
    if(d<=minDist)continue;
    if(avoidFOV){
      a=Math.atan2(cy-player.y,cx-player.x)-player.angle;
      while(a>Math.PI)a-=Math.PI*2;
      while(a<-Math.PI)a+=Math.PI*2;
      if(Math.abs(a)<FOV/2+0.25)continue;
    }
    list.push({x:cx,y:cy});
  }
  if(list.length)return list[Math.floor(Math.random()*list.length)];
  if(avoidFOV)return randomOpenCell(minDist,false);
  if(minDist>3)return randomOpenCell(3,false);
  return {x:MAPW/2,y:MAPH/2};
}
function buildFlow(){
  var f=[],q=[],x,y,h,c,d,nx,ny;
  for(y=0;y<MAPH;y++){var r=[];for(x=0;x<MAPW;x++)r.push(-1);f.push(r);}
  var sx=Math.floor(player.x),sy=Math.floor(player.y);
  if(sx<0||sy<0||sx>=MAPW||sy>=MAPH||map[sy][sx]!==0)return;
  f[sy][sx]=0;q.push([sx,sy]);
  for(h=0;h<q.length;h++){
    c=q[h];
    for(d=0;d<4;d++){
      nx=c[0]+DX4[d];ny=c[1]+DY4[d];
      if(nx<0||ny<0||nx>=MAPW||ny>=MAPH||map[ny][nx]!==0||f[ny][nx]>=0)continue;
      f[ny][nx]=f[c[1]][c[0]]+1;q.push([nx,ny]);
    }
  }
  flow=f;
}
function spawnWave(){
  var count=Math.min(3+wave,12),now=performance.now(),i,c;
  enemies=[];
  for(i=0;i<count;i++){
    c=randomOpenCell(SPAWN_MIN_DIST,true);
    enemies.push({x:c.x,y:c.y,alive:true,spawnTime:now});
  }
  buildFlow();
  playSpawn();
}
function updateUI(){scoreEl.textContent=score;livesEl.textContent=lives;waveEl.textContent=wave}

function resize(){
  var r=canvas.getBoundingClientRect();W=r.width;H=r.height;
  canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);
  ctx.setTransform(D,0,0,D,0,0);
  distProj=(W/2)/Math.tan(FOV/2);
  draw();
}
function castRay(px,py,angle){
  var dirX=Math.cos(angle),dirY=Math.sin(angle);
  var mapX=Math.floor(px),mapY=Math.floor(py);
  var deltaDistX=Math.abs(1/dirX),deltaDistY=Math.abs(1/dirY);
  var stepX,stepY,sideDistX,sideDistY;
  if(dirX<0){stepX=-1;sideDistX=(px-mapX)*deltaDistX;}else{stepX=1;sideDistX=(mapX+1-px)*deltaDistX;}
  if(dirY<0){stepY=-1;sideDistY=(py-mapY)*deltaDistY;}else{stepY=1;sideDistY=(mapY+1-py)*deltaDistY;}
  var side=0,steps=0;
  while(steps<64){
    steps++;
    if(sideDistX<sideDistY){sideDistX+=deltaDistX;mapX+=stepX;side=0;}
    else{sideDistY+=deltaDistY;mapY+=stepY;side=1;}
    if(mapX<0||mapX>=MAPW||mapY<0||mapY>=MAPH)return {dist:30,side:side};
    if(map[mapY][mapX]===1)break;
  }
  var dist;
  if(side===0)dist=(mapX-px+(1-stepX)/2)/dirX;
  else dist=(mapY-py+(1-stepY)/2)/dirY;
  return {dist:Math.max(0.05,Math.abs(dist)),side:side};
}
function canStand(x,y){
  var r=0.2;
  return !isWall(x-r,y-r)&&!isWall(x+r,y-r)&&!isWall(x-r,y+r)&&!isWall(x+r,y+r);
}
function tryMove(nx,ny){
  if(canStand(nx,player.y))player.x=nx;
  if(canStand(player.x,ny))player.y=ny;
}
function shoot(){
  startAudio();
  if(!running)return;
  var now=performance.now();
  if(now-lastShotTime<330)return;
  lastShotTime=now;
  flashAlpha=1;
  playShoot();
  var wallHit=castRay(player.x,player.y,player.angle);
  var bestEnemy=null,bestDist=999;
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(!e.alive)continue;
    var dx=e.x-player.x,dy=e.y-player.y;
    var dist=Math.hypot(dx,dy);
    var angTo=Math.atan2(dy,dx)-player.angle;
    while(angTo>Math.PI)angTo-=Math.PI*2;
    while(angTo<-Math.PI)angTo+=Math.PI*2;
    if(Math.abs(angTo)<0.08 && dist<wallHit.dist && dist<bestDist){
      bestDist=dist;bestEnemy=e;
    }
  }
  if(bestEnemy){
    bestEnemy.alive=false;
    score+=50;
    updateUI();
    playHitEnemy();
    vibrate(15);
    msg.textContent='KENA!';
    checkWave();
  } else {
    playMiss();
  }
}
function checkWave(){
  if(!running||!enemies.length)return;
  for(var i=0;i<enemies.length;i++)if(enemies[i].alive)return;
  wave++;score+=100;
  playWave();
  updateUI();
  msg.textContent='WAVE '+wave+'! MUSUH BARU MUNCUL, CEK MINIMAP';
  spawnWave();
}
function syncBtn(){
  fwdBtn.className='ctrlbtn fwd'+(moveDir===1?' on':'');
  backBtn.className='ctrlbtn back'+(moveDir===-1?' on':'');
  fwdBtn.textContent=moveDir===1?'MAJU \u25CF':'MAJU';
  backBtn.textContent=moveDir===-1?'MUNDUR \u25CF':'MUNDUR';
}
function setMove(d){
  startAudio();
  if(!running)return;
  moveDir=(moveDir===d)?0:d;
  syncBtn();vibrate(10);
}
function playerHurt(){
  var now=performance.now();
  if(now-lastHurtTime<900)return;
  lastHurtTime=now;
  lives--;updateUI();playHurt();hurtFlash=1;
  vibrate(120);
  if(lives<=0){endGame();}
}
function endGame(){
  running=false;moveDir=0;syncBtn();
  finalScoreEl.textContent=score;
  over.className='over';
  playOver();
  vibrate([60,60,60]);
}
function resetGame(){
  audioOn=false;try{SFX.music(null);}catch(e){}
  buildMap();
  player.x=3.5;player.y=3.5;player.angle=0;
  score=0;lives=3;wave=1;running=true;moveDir=0;syncBtn();
  flashAlpha=0;hurtFlash=0;lastShotTime=0;lastHurtTime=-9999;
  over.className='over off';
  msg.textContent=MSG0;
  updateUI();
  spawnWave();
  lastTime=null;
  if(!loopOn){loopOn=true;requestAnimationFrame(loop);}
}
var lastTime=null,flowT=0,loopOn=false;
function loop(ts){
  if(!running){loopOn=false;draw();return;}
  if(lastTime===null)lastTime=ts;
  var dt=Math.min((ts-lastTime)/1000,0.05);
  lastTime=ts;

  if(moveDir){
    var mv=MOVE_SPEED*(lookActive?0.6:1)*(moveDir<0?0.8:1)*moveDir;
    tryMove(player.x+Math.cos(player.angle)*mv*dt,player.y+Math.sin(player.angle)*mv*dt);
  }
  flowT-=dt;if(flowT<=0){flowT=0.25;buildFlow();}
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(!e.alive)continue;
    if((ts-e.spawnTime)/1000<SPAWN_GRACE)continue;
    var dx=player.x-e.x,dy=player.y-e.y;
    var dist=Math.hypot(dx,dy);
    var spd=Math.min(0.75+wave*0.07,1.25);
    var tx=null,ty=null;
    if(dist<9&&castRay(e.x,e.y,Math.atan2(dy,dx)).dist>dist){tx=player.x;ty=player.y;}
    else if(flow){
      var ecx=Math.floor(e.x),ecy=Math.floor(e.y);
      var fd=(flow[ecy]&&flow[ecy][ecx]!==undefined)?flow[ecy][ecx]:-1;
      if(fd>0&&fd<=CHASE_PATH){
        var bd=fd,bx=-1,by=-1,k,nx2,ny2;
        for(k=0;k<4;k++){
          nx2=ecx+DX4[k];ny2=ecy+DY4[k];
          if(nx2<0||ny2<0||nx2>=MAPW||ny2>=MAPH)continue;
          if(flow[ny2][nx2]>=0&&flow[ny2][nx2]<bd){bd=flow[ny2][nx2];bx=nx2;by=ny2;}
        }
        if(bx>=0){tx=bx+0.5;ty=by+0.5;}
      }
    }
    if(tx!==null){
      var ddx=tx-e.x,ddy=ty-e.y,dd=Math.hypot(ddx,ddy);
      if(dd>0.001){
        var nx=e.x+(ddx/dd)*spd*dt,ny=e.y+(ddy/dd)*spd*dt;
        if(!isWall(nx,e.y))e.x=nx;
        if(!isWall(e.x,ny))e.y=ny;
      }
    }
    if(dist<0.55){e.alive=false;playerHurt();}
  }
  checkWave();
  if(flashAlpha>0)flashAlpha=Math.max(0,flashAlpha-dt*4);
  if(hurtFlash>0)hurtFlash=Math.max(0,hurtFlash-dt*2);

  draw();
  if(running)requestAnimationFrame(loop);else loopOn=false;
}
function draw(){
  if(!W||!H)return;
  ctx.fillStyle='#1b222c';ctx.fillRect(0,0,W,H/2);
  ctx.fillStyle='#241f18';ctx.fillRect(0,H/2,W,H/2);

  var colW=W/NUM_RAYS;
  for(var i=0;i<NUM_RAYS;i++){
    var rayAngle=player.angle-FOV/2+(i/NUM_RAYS)*FOV;
    var r=castRay(player.x,player.y,rayAngle);
    var corrected=r.dist*Math.cos(rayAngle-player.angle);
    wallDist[i]=corrected;
    var wallH=distProj/corrected;
    var top=H/2-wallH/2;
    var bright=Math.max(0.15,Math.min(1,1-corrected/9));
    var sideMul=r.side===1?0.65:1;
    var rr=Math.floor(90*bright*sideMul+30),gg=Math.floor(120*bright*sideMul+30),bb=Math.floor(150*bright*sideMul+40);
    ctx.fillStyle='rgb('+rr+','+gg+','+bb+')';
    ctx.fillRect(i*colW,top,colW+1,wallH);
  }

  var vis=[],j,e,dx,dy,dist,angTo,age,halfAng=FOV/2+0.2;
  for(j=0;j<enemies.length;j++){
    e=enemies[j];
    if(!e.alive)continue;
    dx=e.x-player.x;dy=e.y-player.y;
    dist=Math.hypot(dx,dy);
    angTo=Math.atan2(dy,dx)-player.angle;
    while(angTo>Math.PI)angTo-=Math.PI*2;
    while(angTo<-Math.PI)angTo+=Math.PI*2;
    if(Math.abs(angTo)>=halfAng)continue;
    age=(performance.now()-e.spawnTime)/1000;
    vis.push({dist:dist,perp:Math.max(0.15,dist*Math.cos(angTo)),angTo:angTo,alpha:Math.max(0,Math.min(1,age/SPAWN_FADE))});
  }
  vis.sort(function(a,b){return b.dist-a.dist;});
  for(var k=0;k<vis.length;k++){
    var ve=vis[k];
    var screenX=(0.5+ve.angTo/FOV)*W;
    var wallHAt=distProj/ve.perp;
    var spriteH=wallHAt*0.62*(0.7+0.3*ve.alpha);
    var spriteW=spriteH*0.55;
    var c0=Math.floor((screenX-spriteW/2)/colW),c1=Math.floor((screenX+spriteW/2)/colW);
    if(c1<0||c0>NUM_RAYS-1)continue;
    c0=Math.max(0,c0);c1=Math.min(NUM_RAYS-1,c1);
    ctx.save();
    ctx.beginPath();
    var run=-1,c,any=false,ok;
    for(c=c0;c<=c1+1;c++){
      ok=c<=c1&&wallDist[c]>ve.perp-0.05;
      if(ok&&run<0)run=c;
      if(!ok&&run>=0){ctx.rect(run*colW,0,(c-run)*colW+1,H);run=-1;any=true;}
    }
    if(!any){ctx.restore();continue;}
    ctx.clip();
    var bottomY=H/2+wallHAt/2,centerY=bottomY-spriteH/2;
    var bright=Math.max(0.4,Math.min(1,1-ve.dist/10));
    ctx.globalAlpha=ve.alpha;
    ctx.fillStyle='rgb('+Math.floor(220*bright)+','+Math.floor(60*bright)+','+Math.floor(50*bright)+')';
    ctx.beginPath();ctx.ellipse(screenX,centerY,spriteW/2,spriteH/2,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,200,170,'+(0.7*bright)+')';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='rgb('+Math.floor(40*bright)+',0,0)';
    ctx.beginPath();ctx.ellipse(screenX,centerY-spriteH*0.28,spriteW*0.3,spriteH*0.18,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffe066';
    ctx.beginPath();ctx.arc(screenX-spriteW*0.12,centerY-spriteH*0.28,Math.max(1.2,spriteW*0.05),0,6.2832);ctx.fill();
    ctx.beginPath();ctx.arc(screenX+spriteW*0.12,centerY-spriteH*0.28,Math.max(1.2,spriteW*0.05),0,6.2832);ctx.fill();
    ctx.globalAlpha=1;
    ctx.restore();
  }

  ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(W/2-8,H/2);ctx.lineTo(W/2+8,H/2);ctx.moveTo(W/2,H/2-8);ctx.lineTo(W/2,H/2+8);ctx.stroke();

  drawThreats();drawMini();
  if(flashAlpha>0){ctx.fillStyle='rgba(255,220,150,'+(flashAlpha*0.25)+')';ctx.fillRect(0,0,W,H);}
  if(hurtFlash>0){ctx.fillStyle='rgba(220,20,20,'+(hurtFlash*0.35)+')';ctx.fillRect(0,0,W,H);}
}

function drawThreats(){
  var i,e,dx,dy,dist,rel,a,fd;
  for(i=0;i<enemies.length;i++){
    e=enemies[i];
    if(!e.alive)continue;
    dx=e.x-player.x;dy=e.y-player.y;dist=Math.hypot(dx,dy);
    if(dist>4)continue;
    fd=(flow&&flow[Math.floor(e.y)])?flow[Math.floor(e.y)][Math.floor(e.x)]:-1;
    if(fd<0||fd>6)continue;
    rel=Math.atan2(dy,dx)-player.angle;
    while(rel>Math.PI)rel-=Math.PI*2;
    while(rel<-Math.PI)rel+=Math.PI*2;
    if(Math.abs(rel)<FOV/2+0.1)continue;
    a=Math.max(0.45,1-dist/4);
    ctx.fillStyle='rgba(255,60,40,'+a+')';
    ctx.beginPath();
    if(Math.abs(rel)>2.2){ctx.moveTo(W/2-14,H-30);ctx.lineTo(W/2+14,H-30);ctx.lineTo(W/2,H-10);}
    else if(rel>0){ctx.moveTo(W-6,H/2-16);ctx.lineTo(W-6,H/2+16);ctx.lineTo(W-26,H/2);}
    else{ctx.moveTo(6,H/2-16);ctx.lineTo(6,H/2+16);ctx.lineTo(26,H/2);}
    ctx.closePath();ctx.fill();
  }
}
function drawMini(){
  var cs=Math.max(3,Math.round(W*0.3/MAPW)),ox=W-MAPW*cs-6,oy=6,x,y,i,e,ex,ey,now=performance.now();
  ctx.fillStyle='rgba(8,10,13,.72)';ctx.fillRect(ox-2,oy-2,MAPW*cs+4,MAPH*cs+4);
  for(y=0;y<MAPH;y++)for(x=0;x<MAPW;x++){
    if(map[y][x]===0){ctx.fillStyle='rgba(120,150,190,.35)';ctx.fillRect(ox+x*cs,oy+y*cs,cs-1,cs-1);}
  }
  var px=ox+player.x*cs,py=oy+player.y*cs;
  ctx.fillStyle='rgba(255,157,61,.25)';
  ctx.beginPath();ctx.moveTo(px,py);ctx.arc(px,py,cs*5,player.angle-FOV/2,player.angle+FOV/2);ctx.closePath();ctx.fill();
  for(i=0;i<enemies.length;i++){
    e=enemies[i];
    if(!e.alive)continue;
    ex=ox+e.x*cs;ey=oy+e.y*cs;
    if((now-e.spawnTime)/1000<SPAWN_GRACE){
      ctx.strokeStyle='#ff4d3d';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(ex,ey,cs*(0.8+0.6*Math.abs(Math.sin(now/120))),0,6.2832);ctx.stroke();
    }else{
      ctx.fillStyle='#ff4d3d';
      ctx.beginPath();ctx.arc(ex,ey,Math.max(1.6,cs*0.45),0,6.2832);ctx.fill();
    }
  }
  ctx.fillStyle='#ff9d3d';ctx.beginPath();ctx.arc(px,py,Math.max(2,cs*0.5),0,6.2832);ctx.fill();
}

function bindTapOnce(btn,fn){
  function handler(e){
    if(e){if(e.cancelable)e.preventDefault();e.stopPropagation();}
    fn();
  }
  btn.addEventListener('touchstart',handler,{passive:false});
  btn.addEventListener('mousedown',handler);
}
bindTapOnce(shootBtn,shoot);
bindTapOnce(fwdBtn,function(){setMove(1);});
bindTapOnce(backBtn,function(){setMove(-1);});
addEventListener('keydown',function(e){
  startAudio();
  var k=e.key;
  if(k==='w'||k==='ArrowUp'){e.preventDefault();setMove(1);}
  else if(k==='s'||k==='ArrowDown'){e.preventDefault();setMove(-1);}
  else if(k===' '){e.preventDefault();shoot();}
  else if(k==='ArrowLeft'||k==='a'){player.angle-=0.12;}
  else if(k==='ArrowRight'||k==='d'){player.angle+=0.12;}
});
syncBtn();
restartBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();resetGame();});
restartBtn.addEventListener('touchend',function(e){e.preventDefault();e.stopPropagation();resetGame();},{passive:false});

var lookActive=false,lookId=null,lookLastX=0;
var LOOK_TURN=Math.PI*1.3;
function applyLook(x){
  var dx=x-lookLastX;
  lookLastX=x;
  if(!running||!dx)return;
  var gain=1+Math.min(Math.abs(dx)/16,1.8);
  player.angle+=dx*(LOOK_TURN/(W||330))*gain;
}
function findTouch(list,id){
  for(var i=0;i<list.length;i++)if(list[i].identifier===id)return list[i];
  return null;
}
canvas.addEventListener('touchstart',function(e){
  startAudio();
  if(e.cancelable)e.preventDefault();
  if(lookId!==null)return;
  var t=e.changedTouches[0];
  lookId=t.identifier;lookLastX=t.clientX;lookActive=true;
},{passive:false});
canvas.addEventListener('touchmove',function(e){
  if(e.cancelable)e.preventDefault();
  if(lookId===null)return;
  var t=findTouch(e.changedTouches,lookId);
  if(t)applyLook(t.clientX);
},{passive:false});
function lookEnd(e){
  if(lookId===null)return;
  if(findTouch(e.changedTouches,lookId)){lookId=null;lookActive=false;}
}
canvas.addEventListener('touchend',lookEnd);
canvas.addEventListener('touchcancel',lookEnd);
canvas.addEventListener('mousedown',function(e){
  startAudio();
  lookActive=true;lookLastX=e.clientX;
  function mm(e2){applyLook(e2.clientX);}
  function mu(){lookActive=false;document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);}
  document.addEventListener('mousemove',mm);
  document.addEventListener('mouseup',mu);
});
document.addEventListener('touchmove',function(e){
  if(lookActive&&e.cancelable)e.preventDefault();
},{passive:false});

addEventListener('resize',resize);
buildMap();
resize();
spawnWave();
updateUI();
loopOn=true;requestAnimationFrame(loop);
})();</script></body></html>
`.trim();

const buildRoomRaiderMessage = () => buildHtmlMessage(ROOMRAIDER_HTML);
const sendRoomRaiderGame = (sock, jid) => sendHtmlGame(sock, jid, ROOMRAIDER_HTML);

module.exports = { sendRoomRaiderGame, buildRoomRaiderMessage, ROOMRAIDER_HTML };