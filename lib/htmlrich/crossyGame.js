const { buildShell } = require('./actionShell');
const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
 * Penyebrang Jalan (Crossy Road) — ayam menyeberang jalan raya dan sungai tanpa akhir.
 * Ketuk layar = maju. Geser kiri/kanan/bawah (atau tombol ◀ ▶ ▼) untuk pindah.
 * Hindari mobil, naik kayu untuk menyeberangi sungai, pohon menghalangi jalan.
 * Kalau diam lebih dari 9 detik, ayam dibawa elang. Skor = baris terjauh.
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const SCRIPT = String.raw`
var ctx=G.ctx,W=G.W,H=G.H,CS=48,COLS=7,SPAN=COLS+4,BASE=H-CS*3;
var rows={},px=3,pr=0,cam=0,top=0,idle=0,hop=0,dead=false,face=1;
var CARCOL=['#e53935','#fdd835','#1e88e5','#8e24aa','#fb8c00','#43a047'];

function mkRow(r){
  var row={t:'g',trees:[]},i;
  if(r<=1)return row;
  var p1=rows[r-1],p2=rows[r-2];
  var k=Math.random();
  var t=k<0.30?'g':(k<0.68?'r':'w');
  if(t==='w'&&p1&&p1.t==='w'&&Math.random()<0.5)t='r';
  if(p1&&p2&&p1.t===t&&p2.t===t)t='g';
  row.t=t;
  if(t==='g'){
    var n=Math.floor(Math.random()*3);
    for(i=0;i<n;i++){var c=Math.floor(Math.random()*COLS);if(row.trees.indexOf(c)<0)row.trees.push(c);}
  }else if(t==='r'){
    row.dir=Math.random()<0.5?-1:1;
    row.spd=G.rnd(1.2,2.6)+Math.min(r*0.015,1.4);
    row.items=[];
    var nc=2+(Math.random()<0.5?1:0);
    for(i=0;i<nc;i++)row.items.push({x:-2+i*SPAN/nc+G.rnd(0,0.8),w:Math.random()<0.25?2:1.2,c:G.pick(CARCOL)});
  }else{
    row.dir=Math.random()<0.5?-1:1;
    row.spd=G.rnd(0.8,1.5)+Math.min(r*0.01,0.8);
    row.items=[];
    for(i=0;i<3;i++)row.items.push({x:-2+i*SPAN/3+G.rnd(0,0.4),w:G.rnd(1.9,2.5)});
  }
  return row;
}
function row(r){if(!rows[r])rows[r]=mkRow(r);return rows[r];}

function init(){
  rows={};px=3;pr=0;cam=0;top=0;idle=0;hop=0;dead=false;face=1;
  for(var r=0;r<14;r++)row(r);
  G.score(0);G.stat('AMAN');
}
function die(msg){
  if(dead)return;
  dead=true;
  G.setBest(top);
  G.sfx(/sungai|Hanyut/.test(msg)?'splash':'crash');
  G.over('Game over',msg+'<br>Kamu sampai baris <b>'+top+'</b>');
}
function move(dx,dr){
  if(dead||!G.running)return;
  var nr=pr+dr;
  if(nr<0||nr<top-4)return;
  var cur=row(pr),tgt=row(nr);
  var nx=px+dx;
  if(dx===0&&dr!==0)nx=(tgt.t==='w')?px:Math.round(px);
  else if(cur.t!=='w'||tgt.t!=='w')nx=Math.round(nx);
  if(nx<-0.3||nx>COLS-0.7)return;
  if(tgt.t==='g'&&tgt.trees.indexOf(Math.round(nx))>=0){G.sfx('bump');return;}
  if(dx!==0)face=dx>0?1:-1;
  px=nx;pr=nr;hop=0.12;
  G.sfx('hop');
  if(pr>top){top=pr;idle=0;G.score(top);}
}

function update(dt){
  idle+=dt;hop-=dt;
  G.stat(idle>6?'AWAS!':'AMAN');
  if(idle>9){die('Kelamaan diam, dibawa elang');return;}
  var r0=Math.floor(cam)-4,r1=Math.floor(cam)+10,r,i,rw,it;
  for(r=r0;r<=r1;r++){
    if(r<0)continue;
    rw=row(r);
    if(!rw.items)continue;
    for(i=0;i<rw.items.length;i++){
      it=rw.items[i];
      it.x+=rw.dir*rw.spd*dt;
      if(rw.dir>0&&it.x>COLS+2)it.x-=SPAN;
      if(rw.dir<0&&it.x+it.w<-2)it.x+=SPAN;
    }
  }
  cam+=(pr-cam)*Math.min(1,dt*6);
  rw=row(pr);
  if(rw.t==='r'){
    for(i=0;i<rw.items.length;i++){
      it=rw.items[i];
      if(px+0.8>it.x&&px+0.2<it.x+it.w){die('Ditabrak kendaraan');return;}
    }
  }else if(rw.t==='w'){
    var c=px+0.5,on=false;
    for(i=0;i<rw.items.length;i++){
      it=rw.items[i];
      if(c>it.x+0.05&&c<it.x+it.w-0.05){on=true;break;}
    }
    if(on){px+=rw.dir*rw.spd*dt;}
    else if(hop<=0){die('Tenggelam di sungai');return;}
    if(px<-0.5||px>COLS-0.5){die('Hanyut terbawa arus');return;}
  }
}

function rowY(r){return BASE-(r-cam)*CS;}
function chicken(cx,cy,f){
  ctx.save();ctx.translate(cx,cy);ctx.scale(f,1);
  ctx.fillStyle='#ff9800';ctx.fillRect(-5,8,3,7);ctx.fillRect(3,8,3,7);
  ctx.fillStyle='#fff';ctx.strokeStyle='#546e7a';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(-1,0,14,11,0,0,6.3);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-12,-2);ctx.lineTo(-20,-10);ctx.lineTo(-15,4);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(9,-10,7.5,0,6.3);ctx.fill();ctx.stroke();
  ctx.fillStyle='#e0e6ea';ctx.beginPath();ctx.ellipse(-3,1,7,5,0.3,0,6.3);ctx.fill();
  ctx.fillStyle='#e53935';ctx.beginPath();ctx.ellipse(8,-18,4,3.5,0,0,6.3);ctx.fill();
  ctx.fillStyle='#ff9800';ctx.beginPath();ctx.moveTo(15,-11);ctx.lineTo(22,-8);ctx.lineTo(15,-6);ctx.closePath();ctx.fill();
  ctx.fillStyle='#212121';ctx.beginPath();ctx.arc(11,-11,1.7,0,6.3);ctx.fill();
  ctx.restore();
}
function tree(cx,by){
  ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(cx,by-5,15,5,0,0,6.3);ctx.fill();
  ctx.fillStyle='#6d4c41';ctx.fillRect(cx-3.5,by-19,7,14);
  ctx.fillStyle='#1b7a34';ctx.beginPath();ctx.arc(cx,by-29,13,0,6.3);ctx.fill();
  ctx.fillStyle='#2e9a45';ctx.beginPath();ctx.arc(cx-6,by-23,10,0,6.3);ctx.arc(cx+7,by-23,9,0,6.3);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.arc(cx-4,by-33,5,0,6.3);ctx.fill();
}
function draw(){
  var T=Date.now()/1000,r,i,y,rw,it;
  ctx.fillStyle='#2f7d3a';ctx.fillRect(0,0,W,H);
  var r0=Math.floor(cam)-3,r1=Math.floor(cam)+9;
  for(r=r0;r<=r1;r++){
    rw=r<0?{t:'g',trees:[]}:row(r);
    y=rowY(r);
    if(y<-CS||y>H)continue;
    if(rw.t==='g'){
      ctx.fillStyle=(r&1)?'#4caf50':'#58bd5c';ctx.fillRect(0,y,W,CS);
      for(i=0;i<rw.trees.length;i++)tree(rw.trees[i]*CS+CS/2,y+CS);
    }else if(rw.t==='r'){
      ctx.fillStyle='#3b3f4a';ctx.fillRect(0,y,W,CS);
      ctx.fillStyle='rgba(255,255,255,.35)';
      for(i=0;i<COLS*2;i++)ctx.fillRect(i*34+4,y+CS-3,18,3);
      for(i=0;i<rw.items.length;i++){
        it=rw.items[i];
        var cx=it.x*CS,cw=it.w*CS;
        ctx.fillStyle=it.c;ctx.fillRect(cx,y+9,cw,CS-18);
        ctx.fillStyle='rgba(255,255,255,.75)';
        ctx.fillRect(rw.dir>0?cx+cw-16:cx+4,y+13,12,CS-26);
        ctx.fillStyle='#111';
        ctx.fillRect(cx+6,y+6,10,5);ctx.fillRect(cx+cw-16,y+6,10,5);
        ctx.fillRect(cx+6,y+CS-11,10,5);ctx.fillRect(cx+cw-16,y+CS-11,10,5);
      }
    }else{
      ctx.fillStyle='#3b8fd9';ctx.fillRect(0,y,W,CS);
      ctx.fillStyle='rgba(255,255,255,.14)';
      for(i=0;i<6;i++)ctx.fillRect(((i*70+T*20*rw.dir)%(W+70)+W+70)%(W+70)-35,y+10+(i%3)*12,28,3);
      for(i=0;i<rw.items.length;i++){
        it=rw.items[i];
        ctx.fillStyle='#8b5a2b';ctx.fillRect(it.x*CS,y+6,it.w*CS,CS-12);
        ctx.fillStyle='#a8703a';ctx.fillRect(it.x*CS,y+10,it.w*CS,6);
        ctx.fillStyle='#6b4220';
        for(var k=1;k<it.w;k+=0.9)ctx.fillRect(it.x*CS+k*CS-2,y+8,4,CS-16);
      }
    }
  }
  var py=rowY(pr),h=hop>0?Math.sin(hop/0.12*Math.PI)*10:0;
  ctx.fillStyle='rgba(0,0,0,.25)';
  ctx.beginPath();ctx.ellipse(px*CS+CS/2,py+CS*0.82,13,5,0,0,6.3);ctx.fill();
  chicken(px*CS+CS/2,py+CS*0.56-h,face);
  if(G.running&&idle>6){
    ctx.fillStyle='rgba(229,57,53,'+(0.25+0.25*Math.sin(T*10))+')';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='900 16px Verdana,sans-serif';ctx.fillText('Cepat maju! Elang datang!',W/2,28);
  }
}

var sx=0,sy=0;
G.input({
  down:function(p){sx=p.x;sy=p.y;},
  up:function(p){
    var dx=p.x-sx,dy=p.y-sy;
    if(Math.abs(dx)<18&&Math.abs(dy)<18)move(0,1);
    else if(Math.abs(dx)>Math.abs(dy))move(dx>0?1:-1,0);
    else move(0,dy>0?-1:1);
  }
});
G.btn('bl',function(){move(-1,0)});
G.btn('bu',function(){move(0,1)});
G.btn('br',function(){move(1,0)});
G.btn('bd',function(){move(0,-1)});
G.key(function(k,e){
  if(k==='ArrowUp'||k==='w'||k===' '){e.preventDefault();move(0,1);}
  else if(k==='ArrowLeft'||k==='a')move(-1,0);
  else if(k==='ArrowRight'||k==='d')move(1,0);
  else if(k==='ArrowDown'||k==='s')move(0,-1);
});
G.begin(init);
init();
G.music('*');
G.loop(update,draw);
`;

const CROSSY_HTML = buildShell({
    W: 336,
    H: 480,
    logo: 'PENYEBRANG<br>JALAN',
    label3: 'ELANG',
    title: 'Penyebrang Jalan',
    intro: 'Ketuk layar untuk maju. Geser kiri / kanan / bawah untuk pindah jalur.<br>Hindari mobil, naiki kayu di sungai, jangan diam terlalu lama',
    tip: 'Ketuk = maju • Geser = belok • atau pakai tombol di bawah',
    accent: '#ffd54f',
    bg: '#1f4d2b',
    panel: '#173a21',
    line: '#2f7d3a',
    sub: '#9fd4a8',
    controls: '<button id="bl">◀</button><button id="bu">▲</button><button id="bd">▼</button><button id="br">▶</button>',
    script: SCRIPT
});

const buildCrossyMessage = () => buildHtmlMessage(CROSSY_HTML);
const sendCrossyGame = (sock, jid) => sendHtmlGame(sock, jid, CROSSY_HTML);

module.exports = { sendCrossyGame, buildCrossyMessage, CROSSY_HTML };