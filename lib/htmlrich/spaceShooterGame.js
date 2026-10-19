const { buildShell } = require('./actionShell');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Pesawat Tempur (Space Shooter) — geser jari untuk menggerakkan pesawat, tembakan otomatis.
 * Musuh: meteor (2 tembakan), UFO (menembak balik), kapal besar (muncul belakangan).
 * Power-up dari musuh yang hancur: bintang tembakan naik (maks 3), perisai 10 detik, hati nyawa +1.
 * Terkena tembakan/tabrakan = nyawa -1 dan level tembakan turun. Nyawa habis = game over.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const SCRIPT = String.raw`
var ctx=G.ctx,W=G.W,H=G.H;
var ship,bullets,ebul,enemies,pups,parts,score,lives,t,fireT,spawnT,wlvl,shield,inv,tx,ty,dead,shake;
var stars=[],i0;
for(i0=0;i0<45;i0++)stars.push({x:G.rnd(0,W),y:G.rnd(0,H),s:G.rnd(20,90),r:G.rnd(0.6,1.8)});

function init(){
  ship={x:W/2,y:H-80};tx=W/2;ty=H-80;
  bullets=[];ebul=[];enemies=[];pups=[];parts=[];
  score=0;lives=3;t=0;fireT=0.2;spawnT=0.8;wlvl=1;shield=0;inv=1;dead=false;shake=0;
  G.score(0);showLives();
}
function showLives(){
  G.stat(lives>0?G.hearts(lives,lives):'0');
}
function shoot(){
  var x=ship.x,y=ship.y-18;
  if(wlvl===1)bullets.push({x:x,y:y,vx:0,vy:-640});
  else if(wlvl===2){bullets.push({x:x-9,y:y,vx:0,vy:-640});bullets.push({x:x+9,y:y,vx:0,vy:-640});}
  else{bullets.push({x:x,y:y,vx:0,vy:-660});bullets.push({x:x-12,y:y+4,vx:-70,vy:-620});bullets.push({x:x+12,y:y+4,vx:70,vy:-620});}
  G.sfx('laser');
}
function spawn(){
  var k=Math.random(),e;
  if(t>30&&k<0.08)e={k:'big',r:30,hp:6,sc:10,x:G.rnd(50,W-50),y:-40,vy:42,vx:0,sh:G.rnd(0.5,1.2),ph:0};
  else if(t>8&&k<0.42)e={k:'ufo',r:20,hp:1,sc:3,x:G.rnd(50,W-50),y:-30,vy:G.rnd(60,95)+t*0.5,vx:0,x0:0,ph:G.rnd(0,6),sh:G.rnd(0.8,1.8)};
  else e={k:'ast',r:22,hp:t>40?3:2,sc:2,x:G.rnd(30,W-30),y:-30,vy:G.rnd(70,130)+t*1.2,vx:G.rnd(-35,35),rot:0,vr:G.rnd(-2,2)};
  e.fl=0;
  if(e.k==='ast'){e.pts=[];for(var q=0;q<9;q++)e.pts.push(G.rnd(0.82,1.08));}
  if(e.k==='ufo')e.x0=e.x;
  enemies.push(e);
}
function boom(x,y,c,n){
  for(var i=0;i<n;i++)parts.push({x:x,y:y,vx:G.rnd(-170,170),vy:G.rnd(-170,170),life:G.rnd(0.3,0.7),c:c,s:G.rnd(2,4.5)});
}
function hurt(){
  if(inv>0)return;
  if(shield>0){shield=0;inv=0.8;G.sfx('hurtShield');return;}
  lives--;inv=1.6;wlvl=Math.max(1,wlvl-1);shake=0.25;
  boom(ship.x,ship.y,'#4dd0e1',18);G.sfx('hit');
  showLives();
  if(lives<=0&&!dead){
    dead=true;G.setBest(score);
    G.over('Pesawat hancur','Skor kamu <b>'+score+'</b><br>Bertahan '+Math.floor(t)+' detik');
  }
}
function drop(x,y){
  if(Math.random()>0.14)return;
  var r=Math.random();
  pups.push({x:x,y:y,k:r<0.5?'star':(r<0.8?'shield':'heart')});
}
function ebShoot(e,vx,vy){ebul.push({x:e.x,y:e.y+e.r*0.6,vx:vx,vy:vy});}

function update(dt){
  var i,j,e,b,p;
  t+=dt;inv-=dt;if(shield>0)shield-=dt;if(shake>0)shake-=dt;
  ship.x+=(tx-ship.x)*Math.min(1,dt*14);
  ship.y+=(ty-ship.y)*Math.min(1,dt*14);
  fireT-=dt;if(fireT<=0){shoot();fireT=0.22;}
  spawnT-=dt;if(spawnT<=0){spawn();spawnT=Math.max(0.33,1.0-t*0.008);}
  for(i=0;i<stars.length;i++){stars[i].y+=stars[i].s*dt;if(stars[i].y>H){stars[i].y=-2;stars[i].x=G.rnd(0,W);}}
  for(i=bullets.length-1;i>=0;i--){
    b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.y<-20)bullets.splice(i,1);
  }
  for(i=ebul.length-1;i>=0;i--){
    b=ebul[i];b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.y>H+20||b.x<-20||b.x>W+20){ebul.splice(i,1);continue;}
    if(Math.abs(b.x-ship.x)<12&&Math.abs(b.y-ship.y)<14){ebul.splice(i,1);hurt();if(dead)return;}
  }
  for(i=enemies.length-1;i>=0;i--){
    e=enemies[i];
    e.y+=e.vy*dt;
    if(e.k==='ast'){e.x+=e.vx*dt;e.rot+=e.vr*dt;}
    else{
      e.ph=(e.ph||0)+dt*2;
      e.x=(e.k==='ufo'?e.x0:e.x)+(e.k==='ufo'?Math.sin(e.ph)*55:0);
      if(e.k==='big'){e.x+=Math.sin(e.ph*0.6)*40*dt;}
      e.sh-=dt;
      if(e.sh<=0&&e.y>10&&e.y<H*0.6){
        if(e.k==='ufo'){ebShoot(e,0,210);e.sh=G.rnd(1.3,2.2);}
        else{ebShoot(e,-90,190);ebShoot(e,0,210);ebShoot(e,90,190);e.sh=G.rnd(1.4,2);}
      }
    }
    if(e.fl>0)e.fl-=dt;
    if(e.y>H+50||e.x<-60||e.x>W+60){enemies.splice(i,1);continue;}
    if(Math.abs(e.x-ship.x)<e.r+10&&Math.abs(e.y-ship.y)<e.r+12){
      e.hp=0;boom(e.x,e.y,'#ffb74d',14);enemies.splice(i,1);hurt();if(dead)return;continue;
    }
    for(j=bullets.length-1;j>=0;j--){
      b=bullets[j];
      if(Math.abs(b.x-e.x)<e.r&&Math.abs(b.y-e.y)<e.r){
        bullets.splice(j,1);e.hp--;e.fl=0.08;
        if(e.hp<=0)break;
      }
    }
    if(e.hp<=0){
      score+=e.sc;G.score(score);
      boom(e.x,e.y,e.k==='ast'?'#bcaaa4':'#ce93d8',e.k==='big'?30:14);
      G.sfx(e.k==='big'?'boomBig':'boom');
      drop(e.x,e.y);
      enemies.splice(i,1);
    }
  }
  for(i=pups.length-1;i>=0;i--){
    p=pups[i];p.y+=90*dt;
    if(p.y>H+20){pups.splice(i,1);continue;}
    if(Math.abs(p.x-ship.x)<24&&Math.abs(p.y-ship.y)<24){
      if(p.k==='star'){wlvl=Math.min(3,wlvl+1);score+=5;G.score(score);G.sfx('power');}
      else if(p.k==='shield'){shield=10;G.sfx('shield');}
      else{lives=Math.min(5,lives+1);showLives();G.sfx('heartUp');}
      pups.splice(i,1);
    }
  }
  for(i=parts.length-1;i>=0;i--){
    p=parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.life<=0)parts.splice(i,1);
  }
}

function drawShip(){
  var x=ship.x,y=ship.y;
  if(inv>0&&Math.floor(inv*12)%2===0&&lives>0)return;
  ctx.fillStyle='#ff9800';
  ctx.beginPath();ctx.moveTo(x-5,y+14);ctx.lineTo(x,y+22+Math.random()*8);ctx.lineTo(x+5,y+14);ctx.fill();
  ctx.fillStyle='#90a4ae';
  ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+20,y+14);ctx.lineTo(x+8,y+10);ctx.lineTo(x,y+16);ctx.lineTo(x-8,y+10);ctx.lineTo(x-20,y+14);ctx.closePath();ctx.fill();
  ctx.fillStyle='#4dd0e1';
  ctx.beginPath();ctx.moveTo(x,y-14);ctx.lineTo(x+7,y+6);ctx.lineTo(x-7,y+6);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e53935';ctx.fillRect(x-20,y+10,5,5);ctx.fillRect(x+15,y+10,5,5);
  if(shield>0){
    ctx.strokeStyle='rgba(129,212,250,'+(shield<3?(0.3+0.3*Math.sin(Date.now()/60)):0.8)+')';
    ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,28,0,6.3);ctx.stroke();
  }
}
function draw(){
  var i,e,b,p;
  ctx.save();
  if(shake>0)ctx.translate(G.rnd(-5,5),G.rnd(-5,5));
  var g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#05071a');g.addColorStop(1,'#14123a');
  ctx.fillStyle=g;ctx.fillRect(-10,-10,W+20,H+20);
  ctx.fillStyle='#fff';
  for(i=0;i<stars.length;i++){ctx.globalAlpha=0.35+stars[i].r/3;ctx.fillRect(stars[i].x,stars[i].y,stars[i].r,stars[i].r);}
  ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(i=0;i<pups.length;i++){
    p=pups[i];ctx.save();ctx.translate(p.x,p.y+Math.sin(Date.now()/150+i)*3);G.spr.pup(p.k,Date.now()/1000);ctx.restore();
  }
  for(i=0;i<enemies.length;i++){
    e=enemies[i];
    ctx.save();ctx.translate(e.x,e.y);
    if(e.fl>0)ctx.globalAlpha=0.55;
    if(e.k==='ast'){
      ctx.fillStyle='rgba(255,140,0,.22)';ctx.beginPath();ctx.ellipse(-e.vx*0.15,-e.r*1.1,e.r*0.5,e.r*1.0,0,0,6.3);ctx.fill();
      ctx.rotate(e.rot);G.spr.meteor(e.r,e.pts);
    }else G.spr.ufo(e.r,t,e.k==='big');
    ctx.restore();
  }
  ctx.fillStyle='#fff59d';
  for(i=0;i<bullets.length;i++){b=bullets[i];ctx.fillRect(b.x-2,b.y-9,4,14);}
  ctx.fillStyle='#ff5252';
  for(i=0;i<ebul.length;i++){b=ebul[i];ctx.beginPath();ctx.arc(b.x,b.y,5,0,6.3);ctx.fill();}
  for(i=0;i<parts.length;i++){
    p=parts[i];ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s);
  }
  ctx.globalAlpha=1;
  if(ship)drawShip();
  ctx.font='900 12px Verdana,sans-serif';ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.75)';
  ctx.fillText('TEMBAK Lv'+wlvl+(shield>0?'   PERISAI '+Math.ceil(shield)+'s':''),8,16);
  ctx.restore();
}

function target(p){
  tx=Math.max(20,Math.min(W-20,p.x));
  ty=Math.max(H*0.42,Math.min(H-34,p.y-55));
}
G.input({down:target,move:target});
G.begin(init);
init();
G.music('*');
G.loop(update,draw);
`;

const SPACE_SHOOTER_HTML = buildShell({
    compact: true,
    W: 360,
    H: 450,
    logo: 'PESAWAT<br>TEMPUR',
    label3: 'NYAWA',
    title: 'Pesawat Tempur',
    intro: 'Seret jari untuk menggerakkan pesawat, tembakan otomatis.<br>Hancurkan meteor dan UFO.<br>Ambil bintang (tembakan naik), perisai, dan hati (nyawa).',
    tip: 'Seret jari di layar • Pesawat mengikuti jarimu',
    accent: '#4dd0e1',
    bg: '#0a0c24',
    panel: '#05071a',
    line: '#262a66',
    sub: '#8a93d6',
    script: SCRIPT
});

const buildSpaceShooterMessage = () => buildHtmlMessage(SPACE_SHOOTER_HTML);
const sendSpaceShooterGame = (sock, jid) => sendHtmlGame(sock, jid, SPACE_SHOOTER_HTML);

module.exports = { sendSpaceShooterGame, buildSpaceShooterMessage, SPACE_SHOOTER_HTML };