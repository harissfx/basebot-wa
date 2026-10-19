const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
Dino Runner — lari terus, loncat kaktus dan burung rendah, tunduk di bawah burung
 * tinggi. Kecepatan naik pelan-pelan sampai batas 620 px/detik. Kontrol: ketuk layar
 * atau tombol LONCAT, tahan TUNDUK (keyboard: spasi/panah atas, panah bawah).
 * Efek suara dibuat langsung lewat Web Audio, tanpa file eksternal.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const DINO_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Trebuchet MS',Verdana,sans-serif}
body{padding:8px;background:#151a2e}
.wrap{max-width:460px;margin:0 auto}
.top{display:flex;align-items:center;gap:8px;margin-bottom:8px;color:#8e9bd1;font-size:11px}
.logo{margin-right:auto;font:900 20px/1 'Trebuchet MS',Verdana,sans-serif;color:#f2c14e}
.top b{color:#fff;font-size:16px;margin-left:3px}
.scene{position:relative;border-radius:12px;overflow:hidden;background:#0e1224;border:2px solid #2a3360}
canvas{display:block;width:100%;height:auto;touch-action:none}
.ov{position:absolute;left:0;right:0;top:0;height:62%;display:grid;place-items:center;text-align:center;color:#fff;padding:6px;pointer-events:none}
.ov.off{display:none}
.ov h2{margin:0 0 2px;font-size:20px;color:#f2c14e;text-shadow:0 2px 6px #0e1224}
.ov p{margin:0;color:#c3cdf2;font-size:12px;line-height:1.3;text-shadow:0 2px 6px #0e1224}
.ctl{display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-top:8px}
.ctl button{height:54px;border:0;border-radius:12px;font:900 15px 'Trebuchet MS',Verdana,sans-serif;color:#fff;background:#2f3b78}
.ctl button.j{background:#e8734a}
.ctl button:active{filter:brightness(1.25)}
.tip{margin-top:8px;text-align:center;color:#6c78ab;font-size:11px}
</style></head><body>
<div class="wrap">
  <div class="top"><div class="logo">DINO RUN</div><span>HI<b id="hi">00000</b></span><span>SKOR<b id="sc">00000</b></span></div>
  <div class="scene">
    <canvas id="cv" width="600" height="240"></canvas>
    <div class="ov" id="ov"><div><h2 id="ot">Dino Run</h2><p id="os">Ketuk MULAI untuk lari</p></div></div>
  </div>
  <div class="ctl"><button class="j" id="bj">MULAI</button><button id="bd">TUNDUK</button></div>
  <div class="tip">Loncati kaktus, tunduk di bawah burung tinggi. Tahan TUNDUK untuk menunduk.</div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var $=function(i){return document.getElementById(i)};
var cv=$('cv'),ctx=cv.getContext?cv.getContext('2d'):null,ov=$('ov');
var W=600,H=240,GY=205,DX=50,G=2200,V0=760,PS=3;
var BODY=['.......#######','.......##.####','.......#######','.......#######','.......####...','#....######...','#...#########.','##.##########.','##############','.############.','..##########..','...########...'];
var LEGS=[['....##..##....','....#...##....'],['....##..##....','....##..#.....']];
var state='idle',auto=true,y=0,vy=0,duck=false,speed=280,t=0,dist=0,nextIn=0,obs=[],clouds=[],score=0,hi=0,last=0,ac=null,fr=0,overAt=0;

function beep(f,d){
  try{
    ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    var o=ac.createOscillator(),g=ac.createGain();
    o.type='square';o.frequency.value=f;g.gain.value=0.04;
    o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d);
  }catch(e){}
}
function pad(n){return ('00000'+Math.floor(n)).slice(-5);}
function reset(){
  y=0;vy=0;duck=false;speed=280;t=0;dist=0;score=0;obs=[];nextIn=380;fr=0;
  clouds=[{x:120,y:30,s:1},{x:360,y:55,s:.8},{x:540,y:22,s:1.2}];
}
function spawn(){
  var r=Math.random(),o;
  if(score>300&&r<0.22)o=Math.random()<0.5?{k:'bh',w:36,h:24,b:28}:{k:'bl',w:36,h:24,b:4};
  else if(r<0.45)o={k:'c1',w:18,h:36,b:0};
  else if(r<0.75)o={k:'c2',w:24,h:50,b:0};
  else o={k:'c3',w:46,h:36,b:0};
  o.x=W+20;obs.push(o);
  nextIn=300+Math.random()*300+speed*0.45;
}
function hits(){
  var dl=DX+8,dr=DX+40,db=y+2,dt=y+((duck&&y===0)?24:38);
  for(var i=0;i<obs.length;i++){
    var o=obs[i],ol=o.x+3,or_=o.x+o.w-3,ob=o.b+2,ot=o.b+o.h-3;
    if(dr>ol&&dl<or_&&dt>ob&&db<ot)return true;
  }
  return false;
}
function over(){
  state='over';
  if(score>hi)hi=score;
  $('hi').textContent=pad(hi);
  $('ot').textContent='Game over';
  $('os').innerHTML='Skor <b>'+Math.floor(score)+'</b> &nbsp;•&nbsp; ketuk MAIN LAGI';
  ov.className='ov';
  overAt=Date.now();label();
  SFX.hit();SFX.over(0.35);
  draw();
}
function step(dt){
  if(state!=='run')return;
  t+=dt;
  speed=Math.min(620,280+t*7);
  if(y>0||vy>0){
    vy-=G*dt*(duck?2.2:1);
    y+=vy*dt;
    if(y<=0){y=0;vy=0;}
  }
  var move=speed*dt;
  dist+=move;score=dist/10;
  for(var i=0;i<obs.length;i++)obs[i].x-=move;
  obs=obs.filter(function(o){return o.x+o.w>-10;});
  for(i=0;i<clouds.length;i++){clouds[i].x-=move*0.25;if(clouds[i].x<-60){clouds[i].x=W+40;clouds[i].y=15+Math.random()*50;}}
  nextIn-=move;
  if(nextIn<=0)spawn();
  fr+=dt*speed/38;
  $('sc').textContent=pad(score);
  if(hits())over();
}
function label(){$('bj').textContent=state==='run'?'LONCAT':(state==='over'?'MAIN LAGI':'MULAI');}
function act(){
  if(state==='run')jump();
  else if(Date.now()-overAt>450)start();
}
function jump(){
  if(state!=='run')return;
  if(y===0&&vy===0){vy=V0;SFX.jump();}
}
function rect(x,yy,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(yy),Math.ceil(w),Math.ceil(h));}
function drawDino(){
  var sx=duck&&y===0?1.2:1,sy=duck&&y===0?0.6:1;
  var legs=y>0?LEGS[0]:LEGS[Math.floor(fr)%2];
  var rows=BODY.concat(legs),h=rows.length*PS*sy,top=GY-y-h;
  for(var r=0;r<rows.length;r++){
    for(var c=0;c<rows[r].length;c++){
      if(rows[r].charAt(c)==='#')rect(DX+c*PS*sx,top+r*PS*sy,PS*sx,PS*sy,'#e9edf7');
    }
  }
}
function drawObs(o){
  var top=GY-o.b-o.h;
  if(o.k.charAt(0)==='c'){
    var n=o.k==='c3'?2:1,w=o.k==='c3'?o.w/2:o.w;
    for(var i=0;i<n;i++){
      var x=o.x+i*w,sw=Math.max(6,w*0.38),sx=x+(w-sw)/2;
      rect(sx,top,sw,o.h,'#4ade80');
      rect(x,top+o.h*0.34,sw*0.7+(w-sw)/2,sw*0.55,'#4ade80');
      rect(x,top+o.h*0.18,sw*0.55,o.h*0.2,'#4ade80');
      rect(sx+sw*0.6,top+o.h*0.5,(w-sw)/2+sw*0.4,sw*0.55,'#4ade80');
    }
  }else{
    var up=Math.floor(fr)%2===0;
    rect(o.x+6,top+8,o.w-12,10,'#f08a8a');
    rect(o.x,top+12,8,4,'#f2c14e');
    rect(o.x+14,up?top:top+14,12,10,'#f08a8a');
    rect(o.x+o.w-8,top+10,6,5,'#f08a8a');
  }
}
function draw(){
  if(!ctx)return;
  ctx.clearRect(0,0,W,H);
  rect(0,0,W,H,'#0e1224');
  for(var s=0;s<14;s++)rect((s*97)%W,(s*41)%90+6,2,2,'#46508a');
  rect(500,24,22,22,'#3a4478');rect(508,24,14,22,'#0e1224');
  for(var i=0;i<clouds.length;i++){var c=clouds[i];rect(c.x,c.y,46*c.s,9*c.s,'#232b4f');rect(c.x+10*c.s,c.y-6*c.s,26*c.s,8*c.s,'#232b4f');}
  rect(0,GY,W,2,'#6b7bb3');
  for(i=0;i<20;i++)rect(((i*53)-(dist%W)+W*2)%W,GY+8+(i%3)*8,10+(i%4)*4,2,'#2a3360');
  for(i=0;i<obs.length;i++)drawObs(obs[i]);
  drawDino();
}
function loop(ts){
  if(state!=='run')return;
  var dt=Math.min(0.05,(ts-last)/1000||0.016);last=ts;
  step(dt);draw();
  if(auto&&state==='run')requestAnimationFrame(loop);
}
function start(){
  reset();state='run';ov.className='ov off';last=performance.now();label();
  $('sc').textContent=pad(0);
  if(auto)requestAnimationFrame(loop);
}
function press(el,on,off){
  el.addEventListener('touchstart',function(e){e.preventDefault();on();},{passive:false});
  el.addEventListener('touchend',function(e){e.preventDefault();off();},{passive:false});
  el.addEventListener('mousedown',on);
  el.addEventListener('mouseup',off);
  el.addEventListener('mouseleave',off);
}
press($('bj'),act,function(){});
press($('bd'),function(){duck=true;},function(){duck=false;});
press(cv,act,function(){});
addEventListener('keydown',function(e){
  if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();act();}
  else if(e.key==='ArrowDown'){e.preventDefault();duck=true;}
});
addEventListener('keyup',function(e){if(e.key==='ArrowDown')duck=false;});
reset();draw();
})();</script></body></html>
`.trim();

const buildDinoMessage = () => buildHtmlMessage(DINO_HTML);
const sendDinoGame = (sock, jid) => sendHtmlGame(sock, jid, DINO_HTML);

module.exports = { sendDinoGame, buildDinoMessage, DINO_HTML };