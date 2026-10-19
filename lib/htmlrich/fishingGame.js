const { buildShell } = require('./actionShell');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Pancing Ikan — perahu bolak-balik di atas air. Ketuk untuk melempar kail ke bawah,
 * ketuk lagi untuk menarik naik (kail juga naik sendiri kalau sudah kena sesuatu atau mentok dasar).
 * Ikan dangkal cepat dan murah, ikan dalam lambat dan mahal:
 * ikan kecil +1, ikan tropis +2, buntal +3, cumi +5. Jangan kena sepatu (-1) dan hiu (-4).
 * Waktu 45 detik. Hasil tangkapan dihitung saat kail sampai di permukaan.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const SCRIPT = String.raw`
var ctx=G.ctx,W=G.W,H=G.H,SURF=100,TOTAL=45;
var TYPES=[
  {k:0,v:1,r:14,y0:140,y1:214,s0:70,s1:110,w:5},
  {k:1,v:2,r:14,y0:185,y1:281,s0:60,s1:90,w:4},
  {k:2,v:3,r:16,y0:252,y1:347,s0:45,s1:70,w:3},
  {k:3,v:5,r:18,y0:335,y1:407,s0:30,s1:45,w:2},
  {k:4,v:-1,r:14,y0:165,y1:397,s0:20,s1:40,w:2},
  {k:5,v:-4,r:22,y0:272,y1:397,s0:110,s1:150,w:1}
];
var TW=0;(function(){for(var i=0;i<TYPES.length;i++)TW+=TYPES[i].w;})();
var HDX=34,fish,bub,floats,bx,bdir,hx,hy,state,carry,score,left,dead,clouds=[],ci;
for(ci=0;ci<4;ci++)clouds.push({x:G.rnd(0,W),y:G.rnd(12,52),s:G.rnd(8,18),r:G.rnd(18,30)});

function newFish(startX){
  var k=Math.random()*TW,t=TYPES[0],i;
  for(i=0;i<TYPES.length;i++){k-=TYPES[i].w;if(k<=0){t=TYPES[i];break;}}
  var dir=Math.random()<0.5?-1:1;
  return {t:t,x:startX===undefined?G.rnd(0,W):startX,y:G.rnd(t.y0,t.y1),vx:dir*G.rnd(t.s0,t.s1),ph:G.rnd(0,6)};
}
function init(){
  fish=[];bub=[];floats=[];
  for(var i=0;i<11;i++)fish.push(newFish());
  bx=W/2;bdir=1;hx=bx+HDX;hy=SURF;state='idle';carry=null;score=0;left=TOTAL;dead=false;
  G.score(0);G.stat(TOTAL+' dtk');label();
}
function label(){
  var b=G.$('tap');
  if(b)b.textContent=state==='idle'?'LEMPAR KAIL':(state==='down'?'TARIK NAIK':'...menarik');
}
function act(){
  if(!G.running||dead)return;
  if(state==='idle'){state='down';hx=bx+HDX;G.sfx('cast');}
  else if(state==='down'){state='up';G.sfx('reel');}
  label();
}
function finish(){
  if(dead)return;
  dead=true;G.setBest(score);
  var note=score>=45?'Raja pemancing!':(score>=25?'Mantap, pemancing handal!':(score>=10?'Lumayan, terus berlatih.':'Ikannya masih pada kabur...'));
  G.over('Waktu habis!','Skor kamu <b>'+score+'</b><br>'+note);
}

function update(dt){
  var i,f,b;
  left-=dt;
  G.stat(Math.max(0,Math.ceil(left))+' dtk');
  if(left<=0){finish();return;}
  if(state==='idle'){
    bx+=bdir*115*dt;
    if(bx>W-45){bx=W-45;bdir=-1;}
    if(bx<45){bx=45;bdir=1;}
    hx=bx+HDX;hy=SURF;
  }else if(state==='down'){
    hy+=190*dt;
    if(hy>=H-14){hy=H-14;state='up';label();}
  }else{
    hy-=(carry?210:300)*dt;
    if(hy<=SURF){
      hy=SURF;state='idle';
      if(carry){
        var v=carry.t.v;
        score=Math.max(0,score+v);G.score(score);
        floats.push({x:hx,y:SURF-6,s:(v>0?'+':'')+v,life:0.9,bad:v<0});
        if(v>0)G.sfx('catchGood',v);else G.sfx('bad');
        carry=null;
      }
      label();
    }
  }
  for(i=0;i<fish.length;i++){
    f=fish[i];
    f.x+=f.vx*dt;f.ph+=dt*3;
    if(f.vx>0&&f.x>W+30){f.x=-30;f.y=G.rnd(f.t.y0,f.t.y1);}
    if(f.vx<0&&f.x<-30){f.x=W+30;f.y=G.rnd(f.t.y0,f.t.y1);}
  }
  if(!carry&&state!=='idle'){
    for(i=0;i<fish.length;i++){
      f=fish[i];
      var dx=f.x-hx,dy=(f.y+Math.sin(f.ph)*3)-(hy+4);
      if(dx*dx+dy*dy<(f.t.r+9)*(f.t.r+9)){
        carry=f;fish.splice(i,1);fish.push(newFish(Math.random()<0.5?-30:W+30));
        state='up';label();
        G.sfx(f.t.v>0?'hook':'bump');
        break;
      }
    }
  }
  if(Math.random()<dt*2.2)bub.push({x:G.rnd(10,W-10),y:H+5,s:G.rnd(40,90),r:G.rnd(1.5,4)});
  for(i=bub.length-1;i>=0;i--){bub[i].y-=bub[i].s*dt;if(bub[i].y<SURF)bub.splice(i,1);}
  for(i=floats.length-1;i>=0;i--){floats[i].y-=35*dt;floats[i].life-=dt;if(floats[i].life<=0)floats.splice(i,1);}
  for(i=0;i<clouds.length;i++){clouds[i].x+=clouds[i].s*dt;if(clouds[i].x>W+50)clouds[i].x=-50;}
}

function draw(){
  var i,f,T=Date.now()/1000,g;
  g=ctx.createLinearGradient(0,0,0,SURF);
  g.addColorStop(0,'#7fd3ff');g.addColorStop(1,'#d8f3ff');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,SURF);
  ctx.fillStyle='#fff';
  for(i=0;i<clouds.length;i++){
    var c=clouds[i];
    ctx.beginPath();ctx.ellipse(c.x,c.y,c.r*1.6,c.r*0.55,0,0,6.3);ctx.ellipse(c.x+c.r*0.6,c.y-c.r*0.3,c.r*0.9,c.r*0.5,0,0,6.3);ctx.fill();
  }
  ctx.fillStyle='#ffe082';ctx.beginPath();ctx.arc(W-44,30,16,0,6.3);ctx.fill();
  g=ctx.createLinearGradient(0,SURF,0,H);
  g.addColorStop(0,'#35b3e6');g.addColorStop(0.5,'#1a7fc0');g.addColorStop(1,'#124a82');
  ctx.fillStyle=g;ctx.fillRect(0,SURF,W,H-SURF);
  ctx.fillStyle='rgba(255,255,255,.35)';
  for(i=0;i<12;i++)ctx.fillRect((i*34+T*18)%(W+34)-17,SURF-1+Math.sin(T*2+i)*1.5,22,3);
  ctx.fillStyle='rgba(255,255,255,.25)';
  for(i=0;i<bub.length;i++){ctx.beginPath();ctx.arc(bub[i].x,bub[i].y,bub[i].r,0,6.3);ctx.fill();}
  /* ikan */
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(i=0;i<fish.length;i++){
    f=fish[i];
    ctx.save();ctx.translate(f.x,f.y+Math.sin(f.ph)*3);
    if(f.t.v<0){ctx.fillStyle='rgba(255,90,90,.22)';ctx.beginPath();ctx.arc(0,0,f.t.r+8,0,6.3);ctx.fill();}
    if(f.vx>0)ctx.scale(-1,1);
    G.spr.fish(f.t.k,f.t.r,f.ph);
    ctx.restore();
  }
  /* perahu */
  var by=SURF-10+Math.sin(T*3)*1.5;
  ctx.fillStyle='#8d5524';
  ctx.beginPath();ctx.moveTo(bx-38,by-8);ctx.lineTo(bx+38,by-8);ctx.lineTo(bx+26,by+12);ctx.lineTo(bx-26,by+12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fafafa';ctx.fillRect(bx-24,by-26,20,18);
  ctx.fillStyle='#e53935';ctx.fillRect(bx-26,by-30,24,5);
  ctx.fillStyle='#ffcc80';ctx.beginPath();ctx.arc(bx+10,by-24,7,0,6.3);ctx.fill();
  ctx.fillStyle='#1565c0';ctx.fillRect(bx+4,by-18,12,10);
  ctx.strokeStyle='#5d4037';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(bx+14,by-14);ctx.lineTo(bx+34,by-40);ctx.stroke();
  /* tali & kail */
  var tipx=bx+34,tipy=by-40;
  ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(tipx,tipy);ctx.lineTo(hx,state==='idle'?tipy+26:hy);ctx.stroke();
  if(state!=='idle'){
    ctx.strokeStyle='#cfd8dc';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx,hy+6);ctx.arc(hx-3,hy+6,3,0,3.3);ctx.stroke();
  }
  if(carry){
    ctx.save();ctx.translate(hx,hy+16);ctx.rotate(1.57);
    G.spr.fish(carry.t.k,carry.t.r,T*6);ctx.restore();
  }
  ctx.font='900 20px Verdana,sans-serif';
  for(i=0;i<floats.length;i++){
    var p=floats[i];ctx.globalAlpha=Math.max(0,p.life*1.4);
    ctx.fillStyle=p.bad?'#ff8a80':'#fff59d';ctx.fillText(p.s,p.x,p.y);
  }
  ctx.globalAlpha=1;
}

G.input({down:function(){act();}});
G.btn('tap',act);
G.key(function(k,e){if(k===' '||k==='ArrowDown'){e.preventDefault();act();}});
G.begin(init);
init();
G.music('*');
G.loop(update,draw);
`;

const FISHING_HTML = buildShell({
    compact: true,
    W: 360,
    H: 430,
    logo: 'PANCING<br>IKAN',
    label3: 'WAKTU',
    title: 'Pancing Ikan',
    intro: 'Perahu bergerak kiri-kanan. Ketuk untuk melempar kail, ketuk lagi untuk menarik naik.<br>Ikan kecil +1 • tropis +2 • buntal +3 • cumi +5<br>Hindari sepatu (-1) dan hiu (-4). Waktu 45 detik!',
    tip: 'Lempar saat perahu tepat di atas ikan • Ikan dalam lebih mahal tapi lambat',
    accent: '#80deea',
    bg: '#0a3358',
    panel: '#06284a',
    line: '#1b5f96',
    sub: '#8cc4e8',
    btnText: '#06284a',
    controls: '<button id="tap">LEMPAR KAIL</button>',
    script: SCRIPT
});

const buildFishingMessage = () => buildHtmlMessage(FISHING_HTML);
const sendFishingGame = (sock, jid) => sendHtmlGame(sock, jid, FISHING_HTML);

module.exports = { sendFishingGame, buildFishingMessage, FISHING_HTML };