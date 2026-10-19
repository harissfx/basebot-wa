const { buildShell } = require('./actionShell');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Lari 3 Jalur (Subway Runner) — lari terus di jalan 3 jalur dengan tampilan perspektif.
 * Geser kiri/kanan = pindah jalur, geser atas (atau ketuk) = lompat, geser bawah = menunduk.
 * Rintangan: gerbong merah (pindah jalur), palang rendah (lompat), palang atas (menunduk).
 * Kumpulkan koin (+5 skor). Kecepatan naik pelan-pelan. Sekali tabrak = game over.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const SCRIPT = String.raw`
var ctx=G.ctx,W=G.W,H=G.H,CX=W/2,HY=150,PY=450,LW=100,JD=0.62;
var obs,nextAt,speed,dist,coins,pl,lane,jt,dk,off,dead;
var city=[],ci,bx=0;
for(ci=0;ci<14;ci++){var bw=G.rnd(22,44);city.push({x:bx,w:bw,h:G.rnd(14,48),c:ci%2?'#16224a':'#1d2c5e'});bx+=bw-2;}

function S(z){return 1/(1+z/110);}
function X(l,s){return CX+(l-1)*LW*s;}
function Y(s){return HY+(PY-HY)*s;}
function init(){
  obs=[];nextAt=450;speed=300;dist=0;coins=0;pl=1;lane=1;jt=9;dk=0;off=0;dead=false;
  G.score(0);G.stat('0');
}
function score(){return Math.floor(dist/40)+coins*5;}
function finish(msg){
  if(dead)return;
  dead=true;
  var sc=score();G.setBest(sc);
  G.sfx('crash');
  G.over(msg,'Skor <b>'+sc+'</b><br>Jarak '+Math.floor(dist/40)+' m • Koin '+coins);
}
function ri(n){return Math.floor(Math.random()*n);}
function coinLine(l,z,n){for(var k=0;k<n;k++)obs.push({k:'coin',lane:l,z:z+k*55});}
function addPattern(){
  var r=Math.random(),z=720,a,b;
  if(dist<4000)r*=0.65;
  a=ri(3);
  if(r<0.30){coinLine(a,z,6);}
  else if(r<0.50){
    obs.push({k:'train',lane:a,z:z});
    b=(a+1+ri(2))%3;coinLine(b,z-60,6);
  }else if(r<0.65){
    b=ri(3);
    for(var l=0;l<3;l++)if(l!==b)obs.push({k:'train',lane:l,z:z});
    coinLine(b,z-40,6);
  }else if(r<0.80){
    obs.push({k:'low',lane:-1,z:z});coinLine(1,z+90,3);
  }else if(r<0.92){
    obs.push({k:'high',lane:Math.random()<0.5?-1:a,z:z});coinLine(ri(3),z+90,3);
  }else{
    obs.push({k:'low',lane:a,z:z});coinLine((a+1)%3,z,5);
  }
}
function go(d){
  if(!G.running||dead)return;
  var n=lane+d;
  if(n<0||n>2)return;
  lane=n;G.sfx('lane');
}
function jump(){
  if(!G.running||dead||jt<JD)return;
  jt=0;dk=0;G.sfx('jump');
}
function duck(){
  if(!G.running||dead)return;
  if(jt<JD)jt=JD;
  dk=0.6;G.sfx('duck');
}
function jh(){return jt<JD?92*Math.sin(Math.PI*jt/JD):0;}

function update(dt){
  var i,o,h=jh();
  speed=Math.min(620,speed+6*dt);
  dist+=speed*dt;off+=speed*dt;
  if(jt<JD)jt+=dt;
  if(dk>0)dk-=dt;
  var df=lane-pl;
  if(Math.abs(df)>0)pl+=Math.sign(df)*Math.min(Math.abs(df),dt*9);
  nextAt-=speed*dt;
  if(nextAt<=0){addPattern();nextAt=Math.max(300,speed*0.85)+G.rnd(0,120);}
  for(i=obs.length-1;i>=0;i--){
    o=obs[i];o.z-=speed*dt;
    if(o.z<-70){obs.splice(i,1);continue;}
    if(o.z>16||o.z<-10)continue;
    var hit=o.lane<0||Math.abs(pl-o.lane)<0.6;
    if(!hit)continue;
    if(o.k==='coin'){
      coins++;obs.splice(i,1);G.sfx('coin');G.stat(String(coins));
    }else if(o.k==='train'){finish('Tabrak gerbong');return;}
    else if(o.k==='low'){if(h<26){finish('Tersandung palang');return;}}
    else if(o.k==='high'){if(dk<=0){finish('Kena palang atas');return;}}
  }
  G.score(score());
}

function stripes(){
  var k,z0,z1,s0,s1;
  ctx.strokeStyle='rgba(255,255,255,.55)';
  for(k=0;k<10;k++){
    z0=Math.max(k*140-(off%140),-20);z1=k*140-(off%140)+60;
    if(z1<-20)continue;
    s0=S(z0);s1=S(z1);
    ctx.lineWidth=Math.max(1,5*s1);
    ctx.beginPath();ctx.moveTo(X(0.5,s0),Y(s0));ctx.lineTo(X(0.5,s1),Y(s1));ctx.stroke();
    ctx.beginPath();ctx.moveTo(X(1.5,s0),Y(s0));ctx.lineTo(X(1.5,s1),Y(s1));ctx.stroke();
  }
  ctx.fillStyle='#ffd54f';
  for(k=0;k<8;k++){
    z0=k*160-(off%160);
    if(z0<-20)continue;
    s0=S(z0);
    var h=46*s0,w=Math.max(2,5*s0);
    ctx.fillRect(X(-0.8,s0)-w/2,Y(s0)-h,w,h);
    ctx.fillRect(X(2.8,s0)-w/2,Y(s0)-h,w,h);
    ctx.fillStyle='#fff59d';
    ctx.fillRect(X(-0.8,s0)-w,Y(s0)-h-4*s0,w*2,4*s0+1);
    ctx.fillRect(X(2.8,s0)-w,Y(s0)-h-4*s0,w*2,4*s0+1);
    ctx.fillStyle='#ffd54f';
  }
}
function drawObs(o,T){
  var s=S(o.z),y=Y(s),x=o.lane<0?CX:X(o.lane,s),w,h,i;
  if(o.k==='coin'){
    var rw=Math.abs(Math.cos(T*6+o.z*0.02))*11*s+1.5*s;
    ctx.fillStyle='#ffca28';
    ctx.beginPath();ctx.ellipse(x,y-26*s,rw,11*s,0,0,6.3);ctx.fill();
    ctx.fillStyle='#fff8e1';
    ctx.beginPath();ctx.ellipse(x-rw*0.25,y-29*s,rw*0.3,4*s,0,0,6.3);ctx.fill();
  }else if(o.k==='train'){
    w=88*s;h=88*s;
    ctx.fillStyle='#b71c1c';ctx.fillRect(x-w/2,y-h,w,h);
    ctx.fillStyle='#e53935';ctx.fillRect(x-w/2,y-h,w,h*0.18);
    ctx.fillStyle='#ffe082';ctx.fillRect(x-w*0.38,y-h*0.78,w*0.76,h*0.3);
    ctx.fillStyle='#212121';ctx.fillRect(x-w*0.38,y-h*0.34,w*0.2,h*0.16);ctx.fillRect(x+w*0.18,y-h*0.34,w*0.2,h*0.16);
  }else if(o.k==='low'){
    w=(o.lane<0?292:90)*s;h=26*s;
    ctx.fillStyle='#fafafa';ctx.fillRect(x-w/2,y-h,w,h);
    ctx.fillStyle='#e53935';
    var n=o.lane<0?10:3,sw=w/(n*2);
    for(i=0;i<n;i++)ctx.fillRect(x-w/2+i*2*sw,y-h,sw,h);
    ctx.fillStyle='#555';ctx.fillRect(x-w/2,y-h,3*s,h+8*s);ctx.fillRect(x+w/2-3*s,y-h,3*s,h+8*s);
  }else{
    w=(o.lane<0?292:90)*s;
    ctx.fillStyle='#37474f';ctx.fillRect(x-w/2,y-72*s,4*s,72*s);ctx.fillRect(x+w/2-4*s,y-72*s,4*s,72*s);
    ctx.fillStyle='#ffd600';ctx.fillRect(x-w/2,y-72*s,w,28*s);
    ctx.fillStyle='#212121';
    var m=o.lane<0?12:4,mw=w/(m*2);
    for(i=0;i<m;i++)ctx.fillRect(x-w/2+i*2*mw+mw*0.5,y-72*s,mw,28*s);
  }
}
function drawPlayer(T){
  var px=X(pl,1),h=jh(),ducking=dk>0,base=PY-h;
  var lh=ducking?10:20,th=ducking?16:28,sw=Math.sin(T*16)*4;
  ctx.fillStyle='rgba(0,0,0,.35)';
  ctx.beginPath();ctx.ellipse(px,PY+2,Math.max(8,18-h*0.1),5,0,0,6.3);ctx.fill();
  ctx.fillStyle='#263238';
  ctx.fillRect(px-10+sw,base-lh,8,lh);ctx.fillRect(px+2-sw,base-lh,8,lh);
  ctx.fillStyle='#ff7043';ctx.fillRect(px-13,base-lh-th,26,th);
  ctx.fillStyle='#ffcc80';ctx.fillRect(px-19,base-lh-th+3+sw*0.5,6,12);ctx.fillRect(px+13,base-lh-th+3-sw*0.5,6,12);
  ctx.fillStyle='#3e2723';ctx.beginPath();ctx.arc(px,base-lh-th-8,10,0,6.3);ctx.fill();
  ctx.fillStyle='#ffcc80';ctx.fillRect(px-4,base-lh-th-2,8,3);
}
function draw(){
  var T=Date.now()/1000,i,g;
  g=ctx.createLinearGradient(0,0,0,HY);
  g.addColorStop(0,'#0b1d4d');g.addColorStop(1,'#f4a259');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,HY);
  for(i=0;i<city.length;i++){ctx.fillStyle=city[i].c;ctx.fillRect(city[i].x,HY-city[i].h,city[i].w,city[i].h);}
  ctx.fillStyle='#17321f';ctx.fillRect(0,HY,W,H-HY);
  var hw=1.5*LW*((H-HY)/(PY-HY));
  ctx.fillStyle='#3a3f4b';
  ctx.beginPath();ctx.moveTo(CX,HY);ctx.lineTo(CX+hw,H);ctx.lineTo(CX-hw,H);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ffd54f';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(CX,HY);ctx.lineTo(CX+hw,H);ctx.moveTo(CX,HY);ctx.lineTo(CX-hw,H);ctx.stroke();
  stripes();
  var list=obs.slice().sort(function(a,b){return b.z-a.z;});
  var drawn=false;
  for(i=0;i<list.length;i++){
    if(!drawn&&list[i].z<0){drawPlayer(T);drawn=true;}
    drawObs(list[i],T);
  }
  if(!drawn)drawPlayer(T);
}

var sx=0,sy=0;
G.input({
  down:function(p){sx=p.x;sy=p.y;},
  up:function(p){
    var dx=p.x-sx,dy=p.y-sy;
    if(Math.abs(dx)<22&&Math.abs(dy)<22)jump();
    else if(Math.abs(dx)>Math.abs(dy))go(dx>0?1:-1);
    else if(dy<0)jump();
    else duck();
  }
});
G.btn('bl',function(){go(-1)});
G.btn('bu',jump);
G.btn('bd',duck);
G.btn('br',function(){go(1)});
G.key(function(k,e){
  if(k==='ArrowLeft'||k==='a')go(-1);
  else if(k==='ArrowRight'||k==='d')go(1);
  else if(k==='ArrowUp'||k==='w'||k===' '){e.preventDefault();jump();}
  else if(k==='ArrowDown'||k==='s')duck();
});
G.begin(init);
init();
G.music('*');
G.loop(update,draw);
`;

const LANE_RUNNER_HTML = buildShell({
    W: 360,
    H: 520,
    logo: 'LARI<br>3 JALUR',
    label3: 'KOIN',
    title: 'Lari 3 Jalur',
    intro: 'Geser kiri / kanan untuk pindah jalur, geser atas untuk lompat, geser bawah untuk menunduk.<br>Gerbong: pindah jalur • Palang bawah: lompat • Palang atas: menunduk • Koin: kumpulkan',
    tip: 'Ketuk = lompat • Geser = pindah / lompat / tunduk • atau pakai tombol',
    accent: '#ffb74d',
    bg: '#101a3d',
    panel: '#0b1330',
    line: '#2a3a7a',
    sub: '#93a3dd',
    controls: '<button id="bl">◀</button><button id="bu">▲ LONCAT</button><button id="bd">▼ TUNDUK</button><button id="br">▶</button>',
    script: SCRIPT
});

const buildLaneRunnerMessage = () => buildHtmlMessage(LANE_RUNNER_HTML);
const sendLaneRunnerGame = (sock, jid) => sendHtmlGame(sock, jid, LANE_RUNNER_HTML);

module.exports = { sendLaneRunnerGame, buildLaneRunnerMessage, LANE_RUNNER_HTML };