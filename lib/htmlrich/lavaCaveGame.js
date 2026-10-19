const { SFX_JS } = require('./sfxEngine');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Gua Lava — platformer 2D bergaya pixel. Lari dan lompat melewati 3 level gua:
 * kumpulkan koin dan apel, hindari lava dan duri, injak slime dari atas, naik tangga,
 * lalu masuk pintu keluar. 3 nyawa untuk seluruh permainan.
 * Kontrol: tombol layar ◀ ▶ dan ▲ LOMPAT (tahan ▲ di tangga untuk memanjat).
 * Keyboard: panah/WASD, spasi untuk lompat.
 * Level ditulis sebagai daftar operasi kotak [karakter, x, y, lebar, tinggi] di array LV.
 * Grafik digambar lewat canvas (tanpa gambar eksternal), suara lewat sfxEngine.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const LAVA_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Trebuchet MS',Verdana,sans-serif}
body{padding:8px;background:#1a1226}
.wrap{max-width:460px;margin:0 auto}
.top{display:flex;align-items:stretch;gap:6px;margin-bottom:8px}
.logo{margin-right:auto;align-self:center;font:900 19px/1.05 'Trebuchet MS',Verdana,sans-serif;color:#ff9a3c}
.box{min-width:54px;padding:4px 7px;border-radius:8px;background:#2a1b3d;color:#b9a2d6;font-size:9px;text-align:center}
.box b{display:block;color:#fff;font-size:15px;white-space:nowrap}
.scene{position:relative;border-radius:12px;overflow:hidden;background:#120b1c;border:2px solid #4a3560}
canvas{display:block;width:100%;height:auto;touch-action:none}
.ov{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#fff;padding:6px;background:rgba(18,11,28,.9)}
.ov.off{display:none}
.ov h2{margin:0 0 3px;font-size:20px;color:#ff9a3c}
.ov p{margin:0 0 8px;color:#cdbbe6;font-size:12px;line-height:1.35}
.ov button{padding:8px 24px;border:0;border-radius:10px;font:900 14px 'Trebuchet MS',Verdana,sans-serif;color:#2a1306;background:#ffb02e}
.ctl{display:grid;grid-template-columns:1fr 1fr 1.7fr;gap:8px;margin-top:8px}
.ctl button{height:56px;-webkit-touch-callout:none;border:0;border-radius:12px;font:900 18px 'Trebuchet MS',Verdana,sans-serif;color:#fff;background:#3b2a56;touch-action:none}
.ctl button.j{background:#e8734a;font-size:15px}
.ctl button:active{filter:brightness(1.3)}
.tip{margin-top:8px;text-align:center;color:#8a74a8;font-size:11px;line-height:1.5}
</style></head><body>
<div class="wrap">
  <div class="top">
    <div class="logo">GUA<br>LAVA</div>
    <div class="box">LEVEL<b id="lv">1/3</b></div>
    <div class="box">NYAWA<b id="lf">&#9829;&#9829;&#9829;</b></div>
    <div class="box">SKOR<b id="sc">0</b></div>
  </div>
  <div class="scene">
    <canvas id="cv" width="600" height="364"></canvas>
    <div class="ov" id="ov"><div><h2 id="ot">Gua Lava</h2><p id="os"></p><button id="ob">Mulai</button></div></div>
  </div>
  <div class="ctl"><button id="bl">&#9664;</button><button id="br">&#9654;</button><button class="j" id="bj">&#9650; LOMPAT</button></div>
  <div class="tip">Ketuk &#9664; &#9654; untuk lari, ketuk lagi untuk berhenti.<br>Di tangga, ketuk LOMPAT untuk memanjat. Injak slime dari atas.</div>
</div>
<script>${SFX_JS}</script>
<script>SFX.music('*');</script>
<script>(function(){
var $=function(i){return document.getElementById(i)};
var cv=$('cv'),ctx=cv.getContext?cv.getContext('2d'):null,ov=$('ov');
var TS=28,LH=13,W=600,H=364,PW=14,PH=22;
var GR=TS*75,JV=TS*25.6,SPD=TS*6.4,CL=TS*4.5,MAXV=TS*26,ES=TS*1.6;
var LV=[
{w:52,o:[['#',0,11,52,2],['.',12,11,3,2],['~',12,12,3,1],['.',45,11,3,2],['~',45,12,3,1],['#',18,8,4,1],['^',24,10,2],
 ['#',36,10,3,1],['#',39,9,3,2],['#',42,8,3,3],['o',5,10,4],['o',12,8,3],['o',18,7,4],['o',23,8,4],['o',37,9,2],['o',40,8,2],
 ['o',43,7,2],['o',45,7,3],['o',48,10,2],['E',30,10],['P',2,10],['D',50,10]]},
{w:60,o:[['#',0,11,60,2],['H',15,6,1,5],['#',16,7,5,4],['o',16,6,5],['.',22,11,7,2],['~',22,12,7,1],['#',23,9,2,1],['#',27,9,2,1],
 ['o',23,8,2],['o',27,8,2],['^',33,10,3],['o',32,8,5],['E',10,10],['E',39,10],['E',43,10],['#',46,9,2,2],['#',49,7,3,1],['a',50,6],
 ['o',46,8,2],['.',53,11,3,2],['~',53,12,3,1],['o',53,8,3],['o',5,10,3],['P',2,10],['D',58,10]]},
{w:71,o:[['#',0,11,71,2],['.',12,11,3,2],['~',12,12,3,1],['^',18,10,2],['#',22,10,2,1],['#',24,9,2,2],['#',26,8,2,3],
 ['.',28,11,5,2],['~',28,12,5,1],['#',30,9,2,1],['^',39,10,2],['H',47,4,1,7],['#',48,5,3,6],['o',48,4,3],['^',52,10,1],
 ['.',56,11,3,2],['~',56,12,3,1],['a',57,7],['#',61,10,2,1],['#',63,9,2,2],['^',66,10,2],['o',5,10,4],['o',12,8,3],['o',17,8,4],
 ['o',24,7,2],['o',26,6,2],['o',30,7,2],['o',36,8,2],['o',53,8,3],['o',60,8,2],['o',64,7,2],['o',67,8,2],
 ['E',8,10],['E',36,10],['E',43,10],['P',2,10],['D',69,10]]}
];
var G,LW,ens,pts,fts,sx,sy,camx=0,t=0,state='idle',lvi=0,lives=3,score=0,best=0,last=0,jb=0,dead=0,inv=0,act=null;
var inp={l:false,r:false,j:false},hl=false,hr=false,hj=false,kl=false,kr=false,kj=false,lat=0,t0={l:0,r:0,j:0};
var p={x:0,y:0,vx:0,vy:0,g:false,co:0,face:1,climb:false,up:false,jh:0};
function sync(){inp.l=hl||kl||lat<0;inp.r=hr||kr||lat>0;inp.j=hj||kj;}
function cell(x,y){if(x<0||x>=LW)return '#';if(y<0||y>=LH)return '.';return G[y][x];}
function solidAt(px,py){return cell(Math.floor(px/TS),Math.floor(py/TS))==='#';}
function place(){p.x=sx*TS+(TS-PW)/2;p.y=sy*TS+TS-PH;p.vx=0;p.vy=0;p.g=false;p.co=0;p.face=1;p.climb=false;p.up=false;p.jh=0;lat=0;sync();camx=Math.max(0,Math.min(LW*TS-W,p.x+PW/2-W/2));}
function load(i){
  var d=LV[i],g=[],x,y,k,o,i2,j2,c;
  LW=d.w;
  for(y=0;y<LH;y++){g.push([]);for(x=0;x<LW;x++)g[y].push('.');}
  for(k=0;k<d.o.length;k++){o=d.o[k];
    for(j2=o[2];j2<o[2]+(o[4]||1);j2++)for(i2=o[1];i2<o[1]+(o[3]||1);i2++)if(j2>=0&&j2<LH&&i2>=0&&i2<LW)g[j2][i2]=o[0];}
  ens=[];pts=[];fts=[];
  for(y=0;y<LH;y++)for(x=0;x<LW;x++){c=g[y][x];
    if(c==='P'){sx=x;sy=y;g[y][x]='.';}
    else if(c==='E'){ens.push({x:x*TS+3,y:y*TS+TS-16,d:-1,dead:false});g[y][x]='.';}}
  G=g;place();
}
function hud(){
  var h='',i;for(i=0;i<3;i++)h+=i<lives?'\u2665':'\u2661';
  $('lv').textContent=(lvi+1)+'/'+LV.length;$('lf').textContent=h;$('sc').textContent=score;
}
function show(title,html,btn,fn){$('ot').textContent=title;$('os').innerHTML=html;$('ob').textContent=btn;act=fn;ov.className='ov';}
function spawn(x,y,col,n){var i;for(i=0;i<n;i++)pts.push({x:x,y:y,vx:(Math.random()-0.5)*220,vy:-Math.random()*260,l:0.5+Math.random()*0.4,c:col});}
function ftext(x,y,s){fts.push({x:x,y:y,s:s,l:0.8});}
function die(){
  if(state!=='run')return;
  lives--;state='dead';dead=0.9;spawn(p.x+PW/2,p.y+PH/2,'#ff8a3c',18);hud();
  if(lives<=0)SFX.over();else SFX.hit();
}
function finish(win){
  state=win?'win':'over';best=Math.max(best,score);hud();
  if(win)SFX.musicStop();
  if(win)show('Kamu Menang!','Semua level tuntas.<br>Skor <b>'+score+'</b> &bull; Terbaik <b>'+best+'</b>','Main lagi',start);
  else show('Game Over','Skor <b>'+score+'</b> &bull; Terbaik <b>'+best+'</b>','Main lagi',start);
}
function clear(){
  if(state!=='run')return;
  SFX.win();score+=200;
  if(lvi===LV.length-1){score+=lives*150;state='clear';finish(true);return;}
  state='clear';hud();
  show('Level '+(lvi+1)+' selesai!','Bonus +200 &bull; Skor <b>'+score+'</b>','Lanjut',function(){lvi++;load(lvi);inv=1;state='run';hud();});
}
function start(){lvi=0;lives=3;score=0;load(0);inv=1;state='run';hud();}
function ladderAt(dy){
  dy=dy||0;
  var tx=Math.floor((p.x+PW/2)/TS),y0=Math.floor((p.y+dy+2)/TS),y1=Math.floor((p.y+dy+PH-2)/TS),y;
  for(y=y0;y<=y1;y++)if(cell(tx,y)==='H')return true;
  return false;
}
function moveX(dx){
  p.x+=dx;
  var y0=Math.floor(p.y/TS),y1=Math.floor((p.y+PH-0.01)/TS),y,tx;
  if(dx>0){tx=Math.floor((p.x+PW)/TS);for(y=y0;y<=y1;y++)if(cell(tx,y)==='#'){p.x=tx*TS-PW-0.01;p.vx=0;break;}}
  else if(dx<0){tx=Math.floor(p.x/TS);for(y=y0;y<=y1;y++)if(cell(tx,y)==='#'){p.x=(tx+1)*TS+0.01;p.vx=0;break;}}
}
function moveY(dy){
  p.y+=dy;p.g=false;
  var x0=Math.floor(p.x/TS),x1=Math.floor((p.x+PW-0.01)/TS),x,ty;
  if(dy>0){ty=Math.floor((p.y+PH)/TS);for(x=x0;x<=x1;x++)if(cell(x,ty)==='#'){p.y=ty*TS-PH-0.01;if(p.vy>TS*11)SFX.bump();p.vy=0;p.g=true;break;}}
  else if(dy<0){ty=Math.floor(p.y/TS);for(x=x0;x<=x1;x++)if(cell(x,ty)==='#'){p.y=(ty+1)*TS+0.01;p.vy=0;break;}}
}
function player(dt){
  var dir=(inp.r?1:0)-(inp.l?1:0);
  p.vx+=(dir*SPD-p.vx)*Math.min(1,(p.g?16:9)*dt);
  if(!dir&&Math.abs(p.vx)<4)p.vx=0;
  if(dir)p.face=dir;
  var lad=ladderAt();
  if(!lad){p.climb=false;p.up=false;}
  else if(jb>0){if(!p.climb){p.climb=true;p.up=true;}else p.up=!p.up;jb=0;}
  p.jh-=dt;
  if(p.climb){
    var cu=ladderAt(-CL*dt*1.5);
    if(!cu)p.up=false;
    p.vy=((inp.j||p.up)&&cu)?-CL:0;jb=0;
  }else{
    p.vy=Math.min(p.vy+GR*dt,MAXV);
    if(!inp.j&&p.jh<=0&&p.vy<-JV*0.45)p.vy+=GR*dt*1.5;
  }
  if(p.g)p.co=0.09;else p.co-=dt;
  jb-=dt;
  if(jb>0&&p.co>0&&!p.climb){p.vy=-JV;p.co=0;jb=0;p.g=false;p.jh=0.14;SFX.jump();}
  moveX(p.vx*dt);moveY(p.vy*dt);
}
function enemies(dt){
  var i,e,nx,ax,c,b;
  for(i=0;i<ens.length;i++){e=ens[i];if(e.dead)continue;
    nx=e.x+e.d*ES*dt;ax=e.d>0?nx+22+1:nx-1;
    c=cell(Math.floor(ax/TS),Math.floor((e.y+8)/TS));b=cell(Math.floor(ax/TS),Math.floor((e.y+18)/TS));
    if(c==='#'||c==='^'||b!=='#')e.d=-e.d;else e.x=nx;
    if(state==='run'&&p.x<e.x+22&&p.x+PW>e.x&&p.y<e.y+16&&p.y+PH>e.y){
      if(p.vy>40&&p.y+PH-e.y<13){
        e.dead=true;p.vy=-TS*14;p.climb=false;score+=100;hud();SFX.hitEnemy();spawn(e.x+11,e.y+8,'#6fdc6f',12);ftext(e.x,e.y-4,'+100');
      }else if(inv<=0)die();
    }
  }
}
function interact(){
  var x0=Math.floor((p.x+2)/TS),x1=Math.floor((p.x+PW-3)/TS),y0=Math.floor((p.y+3)/TS),y1=Math.floor((p.y+PH-1)/TS),x,y,c,bad=false;
  for(y=y0;y<=y1;y++)for(x=x0;x<=x1;x++){c=cell(x,y);
    if(c==='o'){G[y][x]='.';score+=10;hud();SFX.coin();ftext(x*TS,y*TS,'+10');}
    else if(c==='a'){G[y][x]='.';score+=50;hud();SFX.chime(4);ftext(x*TS,y*TS,'+50');spawn(x*TS+14,y*TS+14,'#ff6b5a',10);}
    else if(c==='~')bad=true;
    else if(c==='^'&&p.y+PH>y*TS+14)bad=true;
    else if(c==='D'){clear();return;}
  }
  if(bad&&inv<=0)die();
}
function step(dt){
  t+=dt;var i;
  if(state==='run'){
    if(inv>0)inv-=dt;
    player(dt);enemies(dt);if(state==='run')interact();
    if(state==='run'&&p.y>LH*TS+30)die();
  }else if(state==='dead'){
    dead-=dt;
    if(dead<=0){if(lives<=0)finish(false);else{place();inv=1.5;state='run';}}
  }
  for(i=pts.length-1;i>=0;i--){var q=pts[i];q.vy+=700*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.l-=dt;if(q.l<=0)pts.splice(i,1);}
  for(i=fts.length-1;i>=0;i--){fts[i].y-=30*dt;fts[i].l-=dt;if(fts[i].l<=0)fts.splice(i,1);}
  var tg=Math.max(0,Math.min(LW*TS-W,p.x+PW/2-W/2));
  camx+=(tg-camx)*Math.min(1,8*dt);
}
function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function tri(a,b,c,d,e,f,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.lineTo(e,f);ctx.closePath();ctx.fill();}
function tile(c,tx,ty,x,y){
  var i,tp,a,cy,cx,rw,dy,gl;
  if(c==='#'){
    var top=cell(tx,ty-1)!=='#',o=(ty%2)?7:17;
    R(x,y,TS,TS,top?'#5d4178':'#4a3361');R(x,y+13,TS,2,'#37244a');
    R(x+o,y,2,13,'#37244a');R(x+((o+10)%TS),y+15,2,13,'#37244a');
    if(top){R(x,y,TS,5,'#8a63a8');R(x,y,TS,2,'#b794d6');}
  }else if(c==='~'){
    var ab=cell(tx,ty-1)==='~';
    R(x,y,TS,TS,'#d9421a');
    for(i=0;i<TS;i+=4){tp=ab?0:3+Math.round(2*Math.sin(t*3+(tx*TS+i)*0.22));R(x+i,y+tp,4,TS-tp,'#ff7a1f');if(!ab)R(x+i,y+tp,4,3,'#ffc43d');}
    R(x+((tx*7+Math.floor(t*2))%20),y+16,5,3,'#ffb02e');
  }else if(c==='^'){
    R(x,y+TS-4,TS,4,'#6b7285');
    for(i=0;i<3;i++){a=x+i*9;tri(a,y+TS-3,a+9,y+TS-3,a+4.5,y+11,'#d5dcec');tri(a+4.5,y+11,a+9,y+TS-3,a+4.5,y+TS-3,'#9aa3b8');}
  }else if(c==='H'){
    R(x+5,y,3,TS,'#9a6b3a');R(x+20,y,3,TS,'#9a6b3a');
    for(i=3;i<TS;i+=7)R(x+5,y+i,18,3,'#c08a52');
  }else if(c==='o'){
    cx=x+14;cy=y+14+Math.round(Math.sin(t*4+tx)*2);rw=2+Math.abs(Math.cos(t*3+tx*0.7))*6;
    ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.ellipse(cx,cy,rw,8,0,0,6.283);ctx.fill();
    R(cx-1,cy-4,2,5,'#fff2a8');
  }else if(c==='a'){
    cy=y+15+Math.round(Math.sin(t*3)*2);
    ctx.fillStyle='#e0392b';ctx.beginPath();ctx.arc(x+14,cy,9,0,6.283);ctx.fill();
    R(x+13,cy-12,2,5,'#6b4a2a');R(x+15,cy-12,6,3,'#4fbf4a');R(x+9,cy-5,3,3,'#ff8a7a');
  }else if(c==='D'){
    dy=y+TS-48;gl=0.35+0.25*Math.sin(t*3);
    R(x+1,dy-2,26,50,'#d7a86e');R(x+4,dy+2,20,46,'#1a0f08');
    R(x+6,dy+5,16,43,'rgba(255,224,138,'+gl.toFixed(2)+')');R(x+19,dy+26,3,3,'#d7a86e');
  }
}
function drawPlayer(){
  var x=Math.round(p.x-camx),y=Math.round(p.y),mv=Math.abs(p.vx)>20,fr=Math.floor(t*10)%2,f=p.face>0,l1=2,l2=8;
  if(inv>0&&Math.floor(t*14)%2)return;
  if(p.climb){fr=Math.floor(t*8)%2;l1=fr?1:3;l2=fr?9:7;}
  else if(!p.g){l1=1;l2=9;}
  else if(mv){l1=fr?0:3;l2=fr?10:7;}
  R(x+l1,y+17,4,5,'#3b4a8a');R(x+l2,y+17,4,5,'#3b4a8a');
  R(x+l1-1,y+20,6,2,'#3a2a20');R(x+l2,y+20,6,2,'#3a2a20');
  R(x+1,y+9,12,8,'#d9453a');R(x+1,y+14,12,2,'#8f2a22');
  R(x+(f?10:0),y+10,3,5,'#f2c9a0');
  R(x+1,y+1,12,9,'#f2c9a0');R(x,y-1,14,4,'#5a3a22');R(x+(f?0:10),y+1,4,6,'#5a3a22');
  R(x+(f?8:4),y+4,2,3,'#1b1220');
}
function drawEnemy(e){
  var x=Math.round(e.x-camx),y=Math.round(e.y),s=Math.round(Math.sin(t*8+e.x)*1.5);
  R(x+1,y+5+s,20,11-s,'#4db55a');R(x+4,y+1+s,14,6,'#5fd16a');R(x+5,y+2+s,5,2,'#a9f0b0');
  R(x+4,y+6+s,5,5,'#fff');R(x+13,y+6+s,5,5,'#fff');
  R(x+(e.d>0?6:4),y+8+s,3,3,'#1b1220');R(x+(e.d>0?15:13),y+8+s,3,3,'#1b1220');
  R(x+1,y+14,20,2,'#2f8a3a');
}
function draw(){
  if(!ctx)return;
  var i,g=ctx.createLinearGradient(0,0,0,H),bx,bh,c0,c1,tx,ty,c,e;
  g.addColorStop(0,'#150d22');g.addColorStop(1,'#42192a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(i=0;i<16;i++){bx=((i*113-camx*0.3)%1800+1800)%1800-120;bh=34+((i*53)%46);tri(bx,0,bx+44,0,bx+22,bh,'#1f1330');}
  for(i=0;i<14;i++){bx=((i*127+60-camx*0.5)%1800+1800)%1800-120;bh=40+((i*37)%50);tri(bx,H,bx+54,H,bx+27,H-bh,'#2b1630');}
  for(i=0;i<16;i++){bx=((i*71+Math.sin(t+i)*20-camx*0.8)%W+W)%W;var by=H-((t*26+i*53)%H);R(bx,by,2,2,'rgba(255,160,60,'+(0.85-by/H*0.7).toFixed(2)+')');}
  c0=Math.max(0,Math.floor(camx/TS));c1=Math.min(LW-1,c0+Math.ceil(W/TS)+1);
  for(ty=0;ty<LH;ty++)for(tx=c0;tx<=c1;tx++){c=G[ty][tx];if(c!=='.')tile(c,tx,ty,Math.round(tx*TS-camx),ty*TS);}
  for(i=0;i<ens.length;i++){e=ens[i];if(!e.dead)drawEnemy(e);}
  if(state!=='dead')drawPlayer();
  for(i=0;i<pts.length;i++)R(Math.round(pts[i].x-camx),Math.round(pts[i].y),3,3,pts[i].c);
  ctx.font='bold 13px Trebuchet MS,Verdana,sans-serif';ctx.fillStyle='#ffe08a';
  for(i=0;i<fts.length;i++)ctx.fillText(fts[i].s,Math.round(fts[i].x-camx),Math.round(fts[i].y));
}
function loop(ts){
  var dt=Math.min(0.033,(ts-last)/1000||0.016);last=ts;
  step(dt/2);step(dt/2);draw();
  requestAnimationFrame(loop);
}
function press(el,on,off){
  el.addEventListener('touchstart',function(e){e.preventDefault();on();},{passive:false});
  el.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
  el.addEventListener('touchend',function(e){e.preventDefault();off();},{passive:false});
  el.addEventListener('touchcancel',off);
  el.addEventListener('mousedown',on);
  el.addEventListener('mouseup',off);
  el.addEventListener('mouseleave',off);
}
function nw(){return performance.now();}
function dirOn(k){return function(){
  if(k<0){if(hl)return;hl=true;t0.l=nw();if(lat>0)lat=0;}
  else{if(hr)return;hr=true;t0.r=nw();if(lat<0)lat=0;}
  sync();};}
function dirOff(k){return function(){
  var tap;
  if(k<0){if(!hl)return;hl=false;tap=nw()-t0.l<230;}
  else{if(!hr)return;hr=false;tap=nw()-t0.r<230;}
  if(tap)lat=(lat===k)?0:k;else if(lat===k)lat=0;
  sync();};}
press($('bl'),dirOn(-1),dirOff(-1));
press($('br'),dirOn(1),dirOff(1));
press($('bj'),function(){if(hj)return;hj=true;jb=0.12;t0.j=nw();sync();},function(){if(!hj)return;hj=false;if(nw()-t0.j>=230)p.up=false;sync();});
$('ob').addEventListener('click',function(){SFX.click();ov.className='ov off';if(act)act();});
addEventListener('keydown',function(e){
  var k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A'){kl=true;e.preventDefault();}
  else if(k==='ArrowRight'||k==='d'||k==='D'){kr=true;e.preventDefault();}
  else if(k==='ArrowUp'||k==='w'||k==='W'||k===' '){if(!kj)jb=0.12;kj=true;e.preventDefault();}
  sync();
});
addEventListener('keyup',function(e){
  var k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')kl=false;
  else if(k==='ArrowRight'||k==='d'||k==='D')kr=false;
  else if(k==='ArrowUp'||k==='w'||k==='W'||k===' '){kj=false;p.up=false;}
  sync();
});
['contextmenu','selectstart','dragstart'].forEach(function(n){addEventListener(n,function(e){e.preventDefault();});});
load(0);hud();
show('Gua Lava','Kumpulkan koin, hindari lava &amp; duri,<br>injak slime, masuk pintu keluar.<br>3 level &bull; 3 nyawa','Mulai',start);
last=performance.now();requestAnimationFrame(loop);
})();</script></body></html>
`.trim();

const buildLavaCaveMessage = () => buildHtmlMessage(LAVA_HTML);
const sendLavaCaveGame = (sock, jid) => sendHtmlGame(sock, jid, LAVA_HTML);

module.exports = { sendLavaCaveGame, buildLavaCaveMessage, LAVA_HTML };