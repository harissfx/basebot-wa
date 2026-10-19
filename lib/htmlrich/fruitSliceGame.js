const { buildShell } = require('./actionShell');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Tebas Buah (Fruit Slice) — buah terlempar ke atas, geser jari untuk memotongnya.
 * +1 per buah, potong 3 buah atau lebih dalam satu geseran = bonus. Bom jangan dipotong.
 * 3 buah lolos (jatuh tanpa dipotong) = game over. Makin lama makin ramai dan banyak bom.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const SCRIPT = String.raw`
var ctx=G.ctx,W=G.W,H=G.H,GRAV=620;
var NF=8;
var JC=['#ff4d6d','#ffa726','#ef5350','#fff176','#ffee58','#ab47bc','#ff5252','#9ccc65'];
var fr,halves,parts,trail,floats,splats,score,lives,t,spawnT,swipe,last,shake,dead;

function init(){
  fr=[];halves=[];parts=[];trail=[];floats=[];splats=[];
  score=0;lives=3;t=0;spawnT=0.6;swipe=0;last=null;shake=0;dead=false;
  G.score(0);showLives();
}
function showLives(){
  G.stat(G.hearts(lives,3));
}
function launch(){
  var x=G.rnd(55,W-55);
  var bomb=Math.random()<Math.min(0.12+t*0.002,0.28);
  var idx=Math.floor(Math.random()*NF);
  fr.push({
    x:x,y:H+30,
    vx:(W/2-x)*G.rnd(0.2,0.5)+G.rnd(-40,40),
    vy:-G.rnd(600,720),
    r:27,ci:idx,bomb:bomb,rot:0,vr:G.rnd(-4,4)
  });
}
function burst(x,y,c,n){
  for(var i=0;i<n;i++)parts.push({x:x,y:y,vx:G.rnd(-180,180),vy:G.rnd(-220,60),life:G.rnd(0.35,0.7),c:c});
}
function hitSeg(ax,ay,bx,by,cx,cy,r){
  var dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;
  var k=l?((cx-ax)*dx+(cy-ay)*dy)/l:0;
  k=Math.max(0,Math.min(1,k));
  var x=ax+k*dx-cx,y=ay+k*dy-cy;
  return x*x+y*y<=r*r;
}
function end(msg){
  if(dead)return;
  dead=true;
  G.setBest(score);
  G.over('Game over',msg+'<br>Skor kamu <b>'+score+'</b>');
}
function slice(a,b){
  var i,f;
  for(i=0;i<fr.length;i++){
    f=fr[i];
    if(f.cut||!hitSeg(a.x,a.y,b.x,b.y,f.x,f.y,f.r+6))continue;
    f.cut=true;
    if(f.bomb){
      shake=0.4;burst(f.x,f.y,'#ffb300',26);G.sfx('bomb');
      end('Kena bom!');return;
    }
    swipe++;score++;
    G.score(score);
    G.sfx('slice',swipe);
    burst(f.x,f.y,JC[f.ci],16);
    splats.push({x:f.x,y:f.y,c:JC[f.ci],life:2.2,d:[[0,0,14],[-11,6,7],[12,-4,8],[4,13,6],[-6,-12,5]]});
    halves.push({x:f.x,y:f.y,vx:f.vx-95,vy:f.vy*0.3,k:f.ci,rot:f.rot,vr:-3,side:-1,life:1.2});
    halves.push({x:f.x,y:f.y,vx:f.vx+95,vy:f.vy*0.3,k:f.ci,rot:f.rot,vr:3,side:1,life:1.2});
    floats.push({x:f.x,y:f.y,s:'+1',life:0.6});
  }
}

function update(dt){
  var i,f,p;
  t+=dt;
  spawnT-=dt;
  if(spawnT<=0){
    var n=1+Math.floor(Math.random()*(1+Math.min(3,Math.floor(t/25))));
    for(i=0;i<n;i++)launch();
    G.sfx('toss');
    spawnT=Math.max(0.8,1.7-t*0.012);
  }
  for(i=fr.length-1;i>=0;i--){
    f=fr[i];
    f.vy+=GRAV*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.rot+=f.vr*dt;
    if(f.cut){fr.splice(i,1);continue;}
    if(f.y>H+40&&f.vy>0){
      fr.splice(i,1);
      if(!f.bomb){
        lives--;showLives();G.sfx('drop');
        if(lives<=0){end('Terlalu banyak buah lolos');return;}
      }
    }
  }
  for(i=halves.length-1;i>=0;i--){
    p=halves[i];p.vy+=GRAV*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.life-=dt;
    if(p.life<=0||p.y>H+60)halves.splice(i,1);
  }
  for(i=parts.length-1;i>=0;i--){
    p=parts[i];p.vy+=GRAV*0.8*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.life<=0)parts.splice(i,1);
  }
  for(i=splats.length-1;i>=0;i--){splats[i].life-=dt;if(splats[i].life<=0)splats.splice(i,1);}
  for(i=floats.length-1;i>=0;i--){
    p=floats[i];p.y-=40*dt;p.life-=dt;
    if(p.life<=0)floats.splice(i,1);
  }
  while(trail.length&&Date.now()-trail[0].t>260)trail.shift();
  if(shake>0)shake-=dt;
}

function draw(){
  var i,p,f;
  ctx.save();
  if(shake>0)ctx.translate(G.rnd(-6,6),G.rnd(-6,6));
  var g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#3a2417');g.addColorStop(1,'#1d110b');
  ctx.fillStyle=g;ctx.fillRect(-10,-10,W+20,H+20);
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=2;
  for(i=0;i<9;i++){ctx.beginPath();ctx.moveTo(0,i*60+20);ctx.lineTo(W,i*60+8);ctx.stroke();}
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(i=0;i<splats.length;i++){
    p=splats[i];ctx.globalAlpha=Math.min(0.5,p.life*0.3);ctx.fillStyle=p.c;
    for(f=0;f<p.d.length;f++){ctx.beginPath();ctx.arc(p.x+p.d[f][0],p.y+p.d[f][1],p.d[f][2],0,6.3);ctx.fill();}
  }
  ctx.globalAlpha=1;
  for(i=0;i<halves.length;i++){
    p=halves[i];
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
    ctx.globalAlpha=Math.min(1,p.life*2);
    ctx.beginPath();ctx.rect(p.side<0?-40:0,-40,40,80);ctx.clip();
    G.spr.cut(p.k,27);
    ctx.restore();
  }
  for(i=0;i<fr.length;i++){
    f=fr[i];
    ctx.save();ctx.translate(f.x,f.y);
    if(f.bomb)G.spr.bomb(27,Date.now()/1000);
    else{ctx.rotate(f.rot);G.spr.fruit(f.ci,27);}
    ctx.restore();
  }
  for(i=0;i<parts.length;i++){
    p=parts[i];
    ctx.globalAlpha=Math.max(0,p.life*1.6);
    ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,6.3);ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.font='900 18px Verdana,sans-serif';
  for(i=0;i<floats.length;i++){
    p=floats[i];ctx.globalAlpha=Math.max(0,p.life*1.6);
    ctx.fillStyle='#ffe082';ctx.fillText(p.s,p.x,p.y);
  }
  ctx.globalAlpha=1;
  var now=Date.now();
  ctx.lineCap='round';
  for(i=1;i<trail.length;i++){
    var a=trail[i-1],b=trail[i],al=1-(now-b.t)/260;
    if(al<=0)continue;
    ctx.strokeStyle='rgba(255,255,255,'+al+')';
    ctx.lineWidth=2+8*al;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  ctx.restore();
}

G.input({
  down:function(p){
    last=p;swipe=0;
    trail.push({x:p.x,y:p.y,t:Date.now()});
    if(G.running)slice(p,p);
  },
  move:function(p){
    if(!last)return;
    trail.push({x:p.x,y:p.y,t:Date.now()});
    if(G.running)slice(last,p);
    last=p;
  },
  up:function(){
    if(G.running&&swipe>=3){
      score+=swipe;G.score(score);
      floats.push({x:W/2,y:H/2,s:'COMBO x'+swipe+'! +'+swipe,life:1});
      G.sfx('combo');
    }
    swipe=0;last=null;
  }
});
G.begin(init);
init();
G.music('*');
G.loop(update,draw);
`;

const FRUIT_SLICE_HTML = buildShell({
    W: 360,
    H: 500,
    logo: 'TEBAS<br>BUAH',
    label3: 'NYAWA',
    title: 'Tebas Buah',
    intro: 'Geser jari untuk memotong buah yang terlempar.<br>Jangan potong bom hitam. Buah lolos 3x = game over.<br>Potong 3 buah atau lebih sekali geser = bonus combo!',
    tip: 'Geser cepat melewati buah • Bom = langsung kalah',
    accent: '#ffb74d',
    bg: '#2a170d',
    panel: '#1d110b',
    line: '#5a3a24',
    sub: '#c9a27f',
    script: SCRIPT
});

const buildFruitSliceMessage = () => buildHtmlMessage(FRUIT_SLICE_HTML);
const sendFruitSliceGame = (sock, jid) => sendHtmlGame(sock, jid, FRUIT_SLICE_HTML);

module.exports = { sendFruitSliceGame, buildFruitSliceMessage, FRUIT_SLICE_HTML };