const { SFX_CORE_JS } = require('./sfxEngine');

const SHELL_JS = String.raw`
var SFXBANK=null;
var SFXMUSIC=null;
var G=(function(){
  var $=function(i){return document.getElementById(i)};
  var cv=$('cv'),ov=$('ov'),onStart=null;
  /* Kanvas dirender 2x (maks) supaya tajam di layar HP; kode game tetap memakai koordinat logis W x H. */
  var LW=cv.width,LH=cv.height,D=Math.min(2,Math.max(1,window.devicePixelRatio||1));
  cv.width=Math.round(LW*D);cv.height=Math.round(LH*D);
  var ctx=cv.getContext('2d');ctx.setTransform(D,0,0,D,0,0);
  var api={cv:cv,ctx:ctx,W:LW,H:LH,D:D,$:$,running:false,best:0};
  /* ===== Mesin suara: inti bersama dengan sfxEngine.js ===== */` + SFX_CORE_JS + String.raw`
  var SF={
    start:function(){T({d:0.12,type:'triangle',f0:330,f1:660,g:0.1,lp:2500});N({d:0.06,type:'highpass',f0:3000,g:0.05});},
    tap:function(){M('wood',700*R(),0,0.14,0.06);},
    toss:function(){N({d:0.22,type:'bandpass',f0:250,f1:700,q:0.6,g:0.1,a:0.04,n:'p'});},
    slice:function(n){
      var r=R(),i;
      N({d:0.14,type:'bandpass',f0:1400*r,f1:5200*r,q:0.7,g:0.28,a:0.012,n:'p'});
      N({t:0.035,d:0.1,type:'lowpass',f0:1100,f1:260,q:0.6,g:0.4,n:'p',v:0.1});
      T({t:0.03,d:0.1,f0:210*r,f1:70,g:0.28});
      for(i=0;i<4;i++)N({t:0.04+i*0.03+Math.random()*0.02,d:0.03,type:'highpass',f0:4500+Math.random()*2500,q:0.5,g:0.08+Math.random()*0.06,p:RP()});
      if(n>1)bell(660+Math.min(n,8)*90,0.06,0.07,0.3);
    },
    bomb:function(){
      var i;
      N({d:0.012,type:'highpass',f0:2500,g:0.3,a:0.001});
      N({d:1.0,type:'lowpass',f0:3000,f1:70,q:0.5,g:0.7,a:0.006,n:'b',v:0.35});
      T({d:0.7,f0:95,f1:28,g:0.6});
      N({d:0.3,type:'highpass',f0:3500,g:0.2});
      N({t:0.1,d:0.5,type:'bandpass',f0:500,f1:120,g:0.25,n:'p'});
      for(i=0;i<8;i++)N({t:0.1+Math.random()*0.7,d:0.04,type:'bandpass',f0:800+Math.random()*3000,q:1.5,g:0.05+Math.random()*0.07,v:0.2});
    },
    drop:function(){T({d:0.18,f0:150,f1:55,g:0.28,v:0.1});N({d:0.1,type:'lowpass',f0:600,f1:200,g:0.4,n:'b'});},
    combo:function(){M('glock',784,0,0.14,0.5,{v:0.3});M('glock',1175,0.09,0.14,0.6,{v:0.3});M('glock',1568,0.18,0.12,0.7,{v:0.3});},
    coin:function(){M('glock',1318,0,0.12,0.3,{v:0.2});M('glock',1976,0.07,0.12,0.45,{v:0.2});},
    laser:function(){
      T({d:0.13,type:'sawtooth',f0:1200*R(),f1:240,g:0.045,lp:4000,lp1:800,p:RP()});
      N({d:0.04,type:'highpass',f0:4000,g:0.05});
    },
    boom:function(){
      var i;
      N({d:0.01,type:'highpass',f0:2500,g:0.2,a:0.001});
      N({d:0.5,type:'lowpass',f0:2200,f1:150,q:0.5,g:0.45,n:'b',v:0.25});
      N({d:0.3,type:'lowpass',f0:3000,f1:250,g:0.2,n:'p'});
      T({d:0.3,f0:130,f1:40,g:0.35});
      for(i=0;i<4;i++)N({t:0.05+Math.random()*0.3,d:0.035,type:'bandpass',f0:800+Math.random()*3000,q:1.5,g:0.04+Math.random()*0.05,v:0.15});
    },
    boomBig:function(){
      var i;
      N({d:0.012,type:'highpass',f0:2500,g:0.28,a:0.001});
      N({d:0.85,type:'lowpass',f0:2600,f1:80,q:0.5,g:0.6,a:0.004,n:'b',v:0.3});
      N({d:0.5,type:'lowpass',f0:3500,f1:200,g:0.3,n:'p'});
      T({d:0.6,f0:100,f1:30,g:0.5});
      for(i=0;i<7;i++)N({t:0.08+Math.random()*0.5,d:0.04,type:'bandpass',f0:800+Math.random()*3000,q:1.5,g:0.05+Math.random()*0.06,v:0.2});
    },
    hit:function(){
      N({d:0.5,type:'lowpass',f0:1600,f1:110,q:0.5,g:0.5,n:'p',v:0.2});
      T({d:0.35,type:'sawtooth',f0:190,f1:50,g:0.16,lp:700});
      T({d:0.3,f0:90,f1:35,g:0.3});
      N({d:0.1,type:'highpass',f0:3000,g:0.15});
    },
    hurtShield:function(){M('metal',300,0,0.16,0.35,{v:0.2});N({d:0.1,type:'bandpass',f0:2500,g:0.12});},
    power:function(){M('glock',660,0,0.12,0.3,{v:0.3});M('glock',880,0.07,0.12,0.3,{v:0.3});M('glock',1320,0.14,0.12,0.5,{v:0.3});},
    shield:function(){T({d:0.3,type:'triangle',f0:300,f1:900,g:0.1,lp:2500});M('glock',1200,0.15,0.08,0.4,{v:0.3});},
    heartUp:function(){M('glock',523,0,0.12,0.4,{v:0.3});M('glock',784,0.1,0.12,0.5,{v:0.3});},
    splash:function(o){
      o=o||0;var i;
      N({t:o,d:0.35,type:'bandpass',f0:700,f1:2600,q:0.6,g:0.3,a:0.02,n:'p',v:0.2});
      N({t:o,d:0.25,type:'lowpass',f0:900,f1:300,g:0.25,n:'b'});
      for(i=0;i<4;i++)T({t:o+0.08+i*0.06+Math.random()*0.03,d:0.06,f0:380+Math.random()*200,f1:900+Math.random()*400,g:0.07,a:0.003,v:0.15,p:RP()});
    },
    cast:function(){N({d:0.2,type:'bandpass',f0:2200,f1:500,q:0.8,g:0.18,a:0.02,n:'p'});SF.splash(0.2);},
    reel:function(){
      for(var i=0;i<7;i++){
        N({t:i*0.045,d:0.016,type:'highpass',f0:3500,g:0.13});
        T({t:i*0.045,d:0.018,type:'square',f0:900,g:0.03,lp:2500});
      }
    },
    hook:function(){T({d:0.07,f0:900,f1:500,g:0.12});M('metal',1500,0,0.05,0.08,{np:2,click:true});},
    catchGood:function(v){M('glock',700+(v||1)*110,0,0.12,0.35,{v:0.25});N({d:0.2,type:'bandpass',f0:1500,f1:600,g:0.1,n:'p'});},
    bad:function(){
      T({d:0.35,type:'sawtooth',f0:220,f1:90,g:0.11,lp:900,vib:6,vd:6});
      T({t:0.1,d:0.35,type:'sawtooth',f0:165,f1:70,g:0.08,lp:800});
      N({d:0.2,type:'lowpass',f0:500,g:0.25,n:'b'});
    },
    hop:function(){T({d:0.09,f0:280,f1:520,g:0.13,lp:2500});N({d:0.05,type:'bandpass',f0:900,g:0.08,n:'p'});},
    bump:function(){T({d:0.07,f0:120,f1:80,g:0.18});N({d:0.04,type:'lowpass',f0:500,g:0.3,n:'b'});},
    crash:function(){
      var i;
      N({d:0.012,type:'highpass',f0:2500,g:0.25,a:0.001});
      N({d:0.55,type:'lowpass',f0:1800,f1:100,q:0.5,g:0.55,n:'p',v:0.2});
      T({d:0.4,type:'sawtooth',f0:95,f1:35,g:0.2,lp:600});
      N({d:0.12,type:'highpass',f0:2500,g:0.2});
      M('metal',220,0,0.12,0.4,{v:0.2});
      for(i=0;i<4;i++)M('metal',900+Math.random()*1800,0.05+Math.random()*0.25,0.04,0.12,{np:2,p:RP()});
    },
    jump:function(){T({d:0.14,f0:240,f1:620,g:0.13,lp:2500});N({d:0.12,type:'bandpass',f0:600,f1:1800,g:0.1,n:'p'});},
    lane:function(){N({d:0.08,type:'bandpass',f0:700,f1:1500,g:0.14,a:0.01,n:'p'});},
    duck:function(){N({d:0.1,type:'bandpass',f0:900,f1:350,g:0.14,n:'p'});},
    over:function(o){
      o=o||0;
      T({t:o,d:0.25,type:'sawtooth',f0:392,g:0.08,lp:1400,lp1:600,vib:5,vd:4,v:0.15});
      T({t:o+0.2,d:0.25,type:'sawtooth',f0:330,g:0.08,lp:1400,lp1:600,vib:5,vd:4,v:0.15});
      T({t:o+0.4,d:0.5,type:'sawtooth',f0:262,g:0.08,lp:1400,lp1:400,vib:5,vd:4,v:0.2});
    }
  };
  api.sfx=function(n,a){var f=SF[n];if(f){try{muEv(n);if(!P(n,a))f(a);}catch(e){}}};
  api.music=function(n,v){muSet(n,v);};
  api.musicStop=function(){muStop(0.3);};
  api.beep=function(f,d,type,vol){T({d:d||0.08,type:(type==='square'||!type)?'triangle':type,f0:f,g:(vol||0.035)*3});};
  api.score=function(n){$('sc').textContent=n};
  api.stat=function(s){$('x3').innerHTML=s};
  api.setBest=function(n){if(n>api.best)api.best=n;$('bs').textContent=api.best};
  api.over=function(title,msg){
    api.running=false;
    $('ot').textContent=title;$('os').innerHTML=msg;$('ob').textContent='Main lagi';
    ov.className='ov';
    api.sfx('over',0.5);
  };
  api.begin=function(fn){onStart=fn;};
  api.hideOv=function(){ov.className='ov off'};
  function start(e){
    if(e){e.preventDefault();e.stopPropagation();}
    api.sfx('start');
    ov.className='ov off';api.running=true;
    if(onStart)onStart();
  }
  var ob=$('ob');
  ob.addEventListener('click',start);
  ob.addEventListener('touchend',start,{passive:false});
  api.pos=function(e){
    var r=cv.getBoundingClientRect();
    var t=(e.touches&&e.touches[0])||(e.changedTouches&&e.changedTouches[0])||e;
    return {x:(t.clientX-r.left)*LW/r.width,y:(t.clientY-r.top)*LH/r.height};
  };
  /* input: down(p), move(p), up(p). Sentuh dan mouse digabung. */
  api.input=function(h){
    var down=false;
    function d(e){if(!api.running&&e.target!==cv)return;e.preventDefault();down=true;if(h.down)h.down(api.pos(e));}
    function m(e){if(!down)return;e.preventDefault();if(h.move)h.move(api.pos(e));}
    function u(e){if(!down)return;e.preventDefault();down=false;if(h.up)h.up(api.pos(e));}
    cv.addEventListener('touchstart',d,{passive:false});
    cv.addEventListener('touchmove',m,{passive:false});
    cv.addEventListener('touchend',u,{passive:false});
    cv.addEventListener('touchcancel',u,{passive:false});
    cv.addEventListener('mousedown',d);
    addEventListener('mousemove',m);
    addEventListener('mouseup',u);
  };
  api.btn=function(id,fn){
    var b=$(id);if(!b)return;
    b.addEventListener('touchstart',function(e){e.preventDefault();fn();},{passive:false});
    b.addEventListener('mousedown',function(e){e.preventDefault();fn();});
  };
  api.key=function(fn){addEventListener('keydown',function(e){fn(e.key,e);});};
  /* loop: update(dt detik) lalu draw(). Berhenti sendiri saat game tidak berjalan. */
  api.loop=function(update,draw){
    var last=0,id=0;
    function f(t){
      if(!last)last=t;
      var dt=Math.min(0.05,(t-last)/1000);last=t;
      if(api.running)update(dt);
      draw();
      id=requestAnimationFrame(f);
    }
    id=requestAnimationFrame(f);
  };
  api.rnd=function(a,b){return a+Math.random()*(b-a)};
  api.pick=function(a){return a[Math.floor(Math.random()*a.length)]};
  /* ===== Gambar vektor (pengganti emoji) ===== */
  var S={};
  function C(x,y,r,f){ctx.fillStyle=f;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();}
  function E(x,y,rx,ry,f,rot){ctx.fillStyle=f;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot||0,0,6.2832);ctx.fill();}
  function RG(x,y,r0,r1,c0,c1){var g=ctx.createRadialGradient(x,y,r0,x,y,r1);g.addColorStop(0,c0);g.addColorStop(1,c1);return g;}
  function LG(x0,y0,x1,y1,c0,c1){var g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,c0);g.addColorStop(1,c1);return g;}
  function HP(x,y,s){
    ctx.beginPath();ctx.moveTo(x,y+0.9*s);
    ctx.bezierCurveTo(x-1.2*s,y-0.1*s,x-0.6*s,y-0.95*s,x,y-0.35*s);
    ctx.bezierCurveTo(x+0.6*s,y-0.95*s,x+1.2*s,y-0.1*s,x,y+0.9*s);ctx.closePath();
  }
  function leaf(x,y,rx,ry,rot,c){E(x,y,rx,ry,c||'#43a047',rot);}
  var FP=[
    {sk:'#2e8b3d',rd:'#d7efc8',fl:'#ff4d6d',sd:'#2b1b1b'},
    {sk:'#fb8c00',rd:'#ffe0b2',fl:'#ffa726',sd:'#fff3e0'},
    {sk:'#d32f2f',rd:'#fff5d6',fl:'#fff8e1',sd:'#5d4037'},
    {sk:'#fdd835',rd:'#fffde7',fl:'#fff176',sd:'#fffde7'},
    {sk:'#f2a51a',rd:'#ffe082',fl:'#ffee58',sd:'#f9a825'},
    {sk:'#6a1b9a',rd:'#ba68c8',fl:'#d1a3e0',sd:'#4a148c'},
    {sk:'#e53935',rd:'#ffcdd2',fl:'#ff8a80',sd:'#fff59d'},
    {sk:'#8d6e63',rd:'#aed581',fl:'#9ccc65',sd:'#212121'}
  ];
  S.fruit=function(k,r){
    var i,a,p=FP[k];
    if(k===0){
      E(0,0,r*1.05,r*0.95,RG(-r*0.3,-r*0.3,r*0.1,r*1.1,'#4caf50',p.sk));
      ctx.strokeStyle='#1b5e20';ctx.lineWidth=r*0.13;ctx.lineCap='round';
      for(i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*0.42,-r*0.88);ctx.quadraticCurveTo(i*r*0.62,0,i*r*0.42,r*0.88);ctx.stroke();}
      E(-r*0.35,-r*0.4,r*0.3,r*0.16,'rgba(255,255,255,.22)',-0.6);
    }else if(k===1){
      C(0,0,r,RG(-r*0.3,-r*0.3,r*0.1,r*1.1,'#ffb74d',p.sk));
      for(i=0;i<9;i++){a=i*2.4;C(Math.cos(a)*r*0.6,Math.sin(a)*r*0.6,r*0.04,'rgba(150,70,0,.35)');}
      leaf(r*0.28,-r*0.95,r*0.28,r*0.14,-0.5);C(0,-r*0.97,r*0.1,'#6d4c41');
      E(-r*0.35,-r*0.38,r*0.26,r*0.14,'rgba(255,255,255,.28)',-0.6);
    }else if(k===2){
      ctx.fillStyle=RG(-r*0.3,-r*0.2,r*0.1,r*1.1,'#ef5350',p.sk);
      ctx.beginPath();ctx.arc(-r*0.3,r*0.05,r*0.78,0,6.2832);ctx.arc(r*0.3,r*0.05,r*0.78,0,6.2832);ctx.fill();
      E(0,r*0.12,r*0.9,r*0.85,RG(-r*0.3,-r*0.2,r*0.1,r*1.1,'#ef5350',p.sk));
      ctx.strokeStyle='#5d4037';ctx.lineWidth=r*0.1;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,-r*0.6);ctx.quadraticCurveTo(r*0.05,-r*0.9,r*0.18,-r*1.0);ctx.stroke();
      leaf(r*0.4,-r*0.78,r*0.3,r*0.14,-0.5);
      E(-r*0.4,-r*0.25,r*0.2,r*0.3,'rgba(255,255,255,.28)',0.4);
    }else if(k===3){
      C(-r*1.02,0,r*0.2,'#f9c80e');C(r*1.02,0,r*0.2,'#f9c80e');
      E(0,0,r*1.02,r*0.8,RG(-r*0.3,-r*0.3,r*0.1,r*1.1,'#fff176',p.sk));
      E(-r*0.35,-r*0.35,r*0.3,r*0.13,'rgba(255,255,255,.4)',-0.4);
    }else if(k===4){
      ctx.fillStyle='#2e7d32';
      for(i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*0.12,-r*0.6);ctx.lineTo(i*r*0.42,-r*1.4+Math.abs(i)*r*0.14);ctx.lineTo(i*r*0.12+r*0.14,-r*0.6);ctx.closePath();ctx.fill();}
      E(0,r*0.12,r*0.78,r*0.92,LG(-r,0,r,0,'#ffd54f','#e08e0b'));
      ctx.strokeStyle='rgba(120,60,0,.55)';ctx.lineWidth=1.4;
      for(i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*r*0.28-r*0.5,-r*0.7);ctx.lineTo(i*r*0.28+r*0.5,r*0.9);ctx.stroke();ctx.beginPath();ctx.moveTo(i*r*0.28+r*0.5,-r*0.7);ctx.lineTo(i*r*0.28-r*0.5,r*0.9);ctx.stroke();}
      E(-r*0.3,-r*0.1,r*0.14,r*0.4,'rgba(255,255,255,.25)',0.2);
    }else if(k===5){
      var gp=[[-0.5,-0.4],[0.1,-0.55],[0.6,-0.3],[-0.7,0.1],[-0.05,0],[0.55,0.2],[-0.35,0.62],[0.25,0.68]];
      ctx.strokeStyle='#5d4037';ctx.lineWidth=r*0.1;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,-r*0.7);ctx.lineTo(r*0.15,-r*1.15);ctx.stroke();
      leaf(r*0.45,-r*1.0,r*0.35,r*0.16,-0.4);
      for(i=0;i<gp.length;i++){C(gp[i][0]*r,gp[i][1]*r,r*0.4,RG(gp[i][0]*r-r*0.12,gp[i][1]*r-r*0.12,r*0.03,r*0.45,'#ab47bc',p.sk));C(gp[i][0]*r-r*0.14,gp[i][1]*r-r*0.14,r*0.08,'rgba(255,255,255,.5)');}
    }else if(k===6){
      ctx.beginPath();ctx.moveTo(0,-r*0.7);ctx.bezierCurveTo(r*1.05,-r*0.95,r*1.1,r*0.25,0,r*1.0);ctx.bezierCurveTo(-r*1.1,r*0.25,-r*1.05,-r*0.95,0,-r*0.7);
      ctx.fillStyle=RG(-r*0.3,-r*0.2,r*0.1,r*1.2,'#ff6f61',p.sk);ctx.fill();
      for(i=0;i<9;i++){a=i*2.2;E(Math.cos(a)*r*0.5,Math.sin(a)*r*0.5+r*0.1,r*0.05,r*0.08,'#fff59d',a);}
      for(i=0;i<5;i++)leaf(Math.cos(i*1.256-1.57)*r*0.3,-r*0.72+Math.sin(i*1.256-1.57)*r*0.12,r*0.3,r*0.1,i*1.256-1.57+0.3,'#2e9a45');
    }else{
      E(0,0,r*0.98,r*0.9,RG(-r*0.3,-r*0.3,r*0.1,r*1.1,'#a1887f',p.sk));
      ctx.strokeStyle='rgba(60,35,20,.5)';ctx.lineWidth=1.3;
      for(i=0;i<16;i++){a=i*0.39;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*0.55,Math.sin(a)*r*0.5);ctx.lineTo(Math.cos(a+0.15)*r*0.8,Math.sin(a+0.15)*r*0.72);ctx.stroke();}
      E(-r*0.35,-r*0.35,r*0.25,r*0.12,'rgba(255,255,255,.2)',-0.5);
    }
  };
  /* penampang buah (sisi potongan), dipakai untuk dua belahan */
  S.cut=function(k,r){
    var i,a,p=FP[k];
    if(k===6){
      var f=function(s,c){ctx.save();ctx.scale(s,s);ctx.beginPath();ctx.moveTo(0,-r*0.7);ctx.bezierCurveTo(r*1.05,-r*0.95,r*1.1,r*0.25,0,r*1.0);ctx.bezierCurveTo(-r*1.1,r*0.25,-r*1.05,-r*0.95,0,-r*0.7);ctx.fillStyle=c;ctx.fill();ctx.restore();};
      f(1,p.sk);f(0.88,p.fl);f(0.45,'#ffe9e4');
      return;
    }
    C(0,0,r,p.sk);C(0,0,r*0.92,p.rd);C(0,0,r*0.82,k===5?RG(0,0,r*0.1,r*0.8,'#e1bee7',p.fl):p.fl);
    if(k===0){
      C(0,0,r*0.18,'rgba(255,255,255,.25)');
      for(i=0;i<7;i++){a=i*0.9;E(Math.cos(a)*r*0.5,Math.sin(a)*r*0.5,r*0.07,r*0.12,p.sd,a);}
    }else if(k===1||k===3){
      ctx.strokeStyle=k===1?'#ffd180':'#fffde7';ctx.lineWidth=r*0.07;
      for(i=0;i<8;i++){a=i*0.785;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*0.12,Math.sin(a)*r*0.12);ctx.lineTo(Math.cos(a)*r*0.8,Math.sin(a)*r*0.8);ctx.stroke();}
      C(0,0,r*0.1,'#fff8e1');
    }else if(k===2){
      E(0,0,r*0.2,r*0.3,'#f0e0a8');
      E(-r*0.05,0,r*0.05,r*0.1,p.sd);E(r*0.05,0,r*0.05,r*0.1,p.sd);
    }else if(k===4){
      C(0,0,r*0.22,'#ffe082');
      for(i=0;i<10;i++){a=i*0.628;C(Math.cos(a)*r*0.55,Math.sin(a)*r*0.55,r*0.045,'#f9a825');}
    }else if(k===5){
      E(-r*0.12,0,r*0.06,r*0.1,p.sd);E(r*0.12,0,r*0.06,r*0.1,p.sd);
    }else if(k===7){
      E(0,0,r*0.28,r*0.22,'#f1f8e9');
      for(i=0;i<14;i++){a=i*0.449;E(Math.cos(a)*r*0.42,Math.sin(a)*r*0.42,r*0.035,r*0.06,p.sd,a);}
    }
  };
  S.bomb=function(r,t){
    C(0,r*0.1,r*0.9,RG(-r*0.3,-r*0.2,r*0.1,r,'#5a5a5a','#0b0b0b'));
    E(-r*0.32,-r*0.28,r*0.22,r*0.13,'rgba(255,255,255,.35)',-0.6);
    ctx.fillStyle='#37474f';ctx.fillRect(-r*0.24,-r*0.98,r*0.48,r*0.24);
    ctx.strokeStyle='#e53935';ctx.lineWidth=r*0.09;ctx.beginPath();ctx.arc(0,r*0.1,r*0.62,0.5,2.6);ctx.stroke();
    ctx.strokeStyle='#d7a86e';ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(0,-r*0.98);ctx.quadraticCurveTo(r*0.25,-r*1.22,r*0.5,-r*1.15);ctx.stroke();
    var s=0.65+0.35*Math.sin(t*30);
    C(r*0.5,-r*1.15,r*0.22*s,'#fff176');C(r*0.5,-r*1.15,r*0.12*s,'#ff7043');
  };
  S.heart=function(x,y,s,c){HP(x,y,s);ctx.fillStyle=c||'#ef5350';ctx.fill();};
  S.meteor=function(r,pts){
    var i,a,rr;
    ctx.beginPath();
    for(i=0;i<9;i++){a=i/9*6.2832;rr=r*pts[i];if(i)ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);else ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
    ctx.closePath();ctx.fillStyle=RG(-r*0.3,-r*0.3,r*0.1,r*1.1,'#a08c7c','#4e3f36');ctx.fill();
    ctx.strokeStyle='#33261f';ctx.lineWidth=2;ctx.stroke();
    C(-r*0.3,-r*0.2,r*0.22,'#5f4e44');C(r*0.35,r*0.25,r*0.16,'#5f4e44');C(r*0.1,-r*0.5,r*0.12,'#5f4e44');
    C(-r*0.32,-r*0.24,r*0.1,'rgba(255,255,255,.1)');
  };
  S.ufo=function(r,t,big){
    var i,c0=big?'#ef5350':'#8e6fd1',c1=big?'#7f1d1d':'#3f2b7a';
    ctx.fillStyle='rgba(128,222,234,.85)';ctx.beginPath();ctx.arc(0,-r*0.05,r*0.52,3.1416,6.2832);ctx.closePath();ctx.fill();
    C(0,-r*0.28,r*0.2,'#9ccc65');E(-r*0.07,-r*0.3,r*0.05,r*0.08,'#111');E(r*0.07,-r*0.3,r*0.05,r*0.08,'#111');
    E(-r*0.2,-r*0.3,r*0.1,r*0.2,'rgba(255,255,255,.35)',0.3);
    E(0,r*0.15,r*1.0,r*0.38,LG(0,-r*0.3,0,r*0.5,c0,c1));
    E(0,r*0.38,r*0.45,r*0.14,'#37474f');
    for(i=0;i<5;i++)C(-r*0.7+i*r*0.35,r*0.16,r*0.09,(Math.floor(t*6+i)%2)?'#fff176':'#ff8a65');
    if(big){ctx.strokeStyle='#cfd8dc';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-r*0.55);ctx.lineTo(0,-r*0.85);ctx.stroke();C(0,-r*0.88,r*0.07,(Math.floor(t*4)%2)?'#ff5252':'#ffcdd2');}
  };
  S.pup=function(k,t){
    var i,a,rr;
    C(0,0,18,'rgba(255,255,255,.14)');C(0,0,14,'rgba(255,255,255,.1)');
    if(k==='star'){
      ctx.beginPath();
      for(i=0;i<10;i++){a=-1.5708+i*0.6283;rr=i%2?5.5:14;if(i)ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);else ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
      ctx.closePath();ctx.fillStyle='#ffd54f';ctx.fill();ctx.strokeStyle='#f9a825';ctx.lineWidth=1.5;ctx.stroke();
    }else if(k==='shield'){
      ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(12,-9);ctx.quadraticCurveTo(12,7,0,15);ctx.quadraticCurveTo(-12,7,-12,-9);ctx.closePath();
      ctx.fillStyle=LG(-12,-14,12,15,'#64b5f6','#1565c0');ctx.fill();ctx.strokeStyle='#e3f2fd';ctx.lineWidth=1.5;ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(0,9);ctx.moveTo(-7,-1);ctx.lineTo(7,-1);ctx.stroke();
    }else{
      HP(0,0,13);ctx.fillStyle='#ef5350';ctx.fill();ctx.strokeStyle='#b71c1c';ctx.lineWidth=1.2;ctx.stroke();
      E(-5,-5,3,2,'rgba(255,255,255,.55)',-0.6);
    }
  };
  /* ikan: menghadap kiri; r = jari-jari hitbox */
  S.fish=function(k,r,ph){
    var s=r/14,w=Math.sin(ph*2)*2*s,i;
    if(k===0){
      ctx.fillStyle='#ef6c00';ctx.beginPath();ctx.moveTo(9*s,0);ctx.lineTo(19*s,-8*s+w);ctx.lineTo(16*s,0);ctx.lineTo(19*s,8*s+w);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ef6c00';ctx.beginPath();ctx.moveTo(-3*s,-7*s);ctx.quadraticCurveTo(2*s,-14*s,7*s,-6*s);ctx.closePath();ctx.fill();
      E(0,0,13*s,8*s,LG(0,-8*s,0,8*s,'#ffcc80','#fb8c00'));
      E(0.5*s,3.5*s,10*s,3.5*s,'rgba(255,255,255,.35)');
      ctx.strokeStyle='rgba(120,50,0,.4)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(-4*s,0,6*s,-1,1);ctx.stroke();
      C(-8*s,-2*s,2.6*s,'#fff');C(-8.4*s,-2*s,1.3*s,'#111');
    }else if(k===1){
      ctx.fillStyle='#1e88e5';ctx.beginPath();ctx.moveTo(9*s,0);ctx.lineTo(19*s,-9*s+w);ctx.lineTo(17*s,0);ctx.lineTo(19*s,9*s+w);ctx.closePath();ctx.fill();
      ctx.fillStyle='#1e88e5';ctx.beginPath();ctx.moveTo(-6*s,-8*s);ctx.lineTo(0,-16*s);ctx.lineTo(8*s,-8*s);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(-4*s,8*s);ctx.lineTo(2*s,14*s);ctx.lineTo(6*s,8*s);ctx.closePath();ctx.fill();
      E(0,0,12*s,9.5*s,LG(0,-9*s,0,9*s,'#ffee58','#f9a825'));
      ctx.save();ctx.beginPath();ctx.ellipse(0,0,12*s,9.5*s,0,0,6.2832);ctx.clip();
      ctx.fillStyle='#1e88e5';ctx.fillRect(-3*s,-10*s,3*s,20*s);ctx.fillRect(4*s,-10*s,3*s,20*s);ctx.restore();
      C(-8*s,-2.5*s,2.8*s,'#fff');C(-8.4*s,-2.5*s,1.4*s,'#111');
    }else if(k===2){
      ctx.fillStyle='#9e9d24';
      for(i=0;i<12;i++){var a=i*0.5236;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(-2*s,-12*s);ctx.lineTo(0,-17*s);ctx.lineTo(2*s,-12*s);ctx.closePath();ctx.fill();ctx.restore();}
      ctx.fillStyle='#c0ca33';ctx.beginPath();ctx.moveTo(12*s,0);ctx.lineTo(19*s,-5*s+w);ctx.lineTo(19*s,5*s+w);ctx.closePath();ctx.fill();
      C(0,0,13*s,RG(-4*s,-5*s,2*s,15*s,'#e6ee9c','#aeb72d'));
      E(0,5*s,9*s,5*s,'rgba(255,253,231,.7)');
      C(-6*s,-3*s,3.6*s,'#fff');C(-6.6*s,-3*s,1.8*s,'#111');
      ctx.strokeStyle='#6d6d1a';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(-12*s,3*s,2*s,0,6.2832);ctx.stroke();
    }else if(k===3){
      ctx.strokeStyle='#d81b60';ctx.lineWidth=2.2*s;ctx.lineCap='round';
      for(i=0;i<5;i++){var yy=-6*s+i*3*s;ctx.beginPath();ctx.moveTo(2*s,yy*0.6);ctx.quadraticCurveTo(9*s,yy+Math.sin(ph*3+i)*3*s,17*s,yy*1.3+Math.sin(ph*3+i)*4*s);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(-18*s,0);ctx.quadraticCurveTo(-8*s,-12*s,4*s,-8*s);ctx.lineTo(4*s,8*s);ctx.quadraticCurveTo(-8*s,12*s,-18*s,0);ctx.closePath();
      ctx.fillStyle=LG(0,-10*s,0,10*s,'#f48fb1','#c2185b');ctx.fill();
      ctx.fillStyle='#ad1457';ctx.beginPath();ctx.moveTo(-18*s,0);ctx.lineTo(-24*s,-6*s);ctx.lineTo(-22*s,0);ctx.lineTo(-24*s,6*s);ctx.closePath();ctx.fill();
      C(-1*s,-4*s,3.4*s,'#fff');C(-1.6*s,-4*s,1.7*s,'#111');C(-1*s,4*s,3.4*s,'#fff');C(-1.6*s,4*s,1.7*s,'#111');
    }else if(k===4){
      ctx.beginPath();ctx.moveTo(-4*s,-12*s);ctx.lineTo(7*s,-12*s);ctx.lineTo(7*s,4*s);ctx.lineTo(9*s,10*s);ctx.lineTo(-12*s,10*s);ctx.quadraticCurveTo(-15*s,6*s,-11*s,3*s);ctx.lineTo(-4*s,1*s);ctx.closePath();
      ctx.fillStyle='#8d5a2b';ctx.fill();ctx.strokeStyle='#4e2f14';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#3e2723';ctx.fillRect(-13*s,8*s,22*s,3*s);
      ctx.fillStyle='#a1703a';ctx.fillRect(-5*s,-13*s,13*s,4*s);
      ctx.strokeStyle='#d7b98e';ctx.lineWidth=1.3;for(i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-3*s,-6*s+i*3.5*s);ctx.lineTo(4*s,-6*s+i*3.5*s);ctx.stroke();}
    }else{
      var u=r/22;
      ctx.fillStyle='#546e7a';ctx.beginPath();ctx.moveTo(-6*u,-13*u);ctx.lineTo(4*u,-27*u);ctx.lineTo(9*u,-13*u);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(-34*u,2*u);ctx.bezierCurveTo(-24*u,-14*u,6*u,-15*u,22*u,-3*u);ctx.lineTo(32*u,-14*u+w);ctx.lineTo(28*u,0);ctx.lineTo(33*u,14*u+w);ctx.lineTo(22*u,3*u);ctx.bezierCurveTo(6*u,14*u,-24*u,12*u,-34*u,2*u);ctx.closePath();
      ctx.fillStyle=LG(0,-14*u,0,13*u,'#90a4ae','#546e7a');ctx.fill();
      ctx.save();ctx.clip();E(-6*u,9*u,26*u,6*u,'rgba(255,255,255,.75)');ctx.restore();
      ctx.fillStyle='#455a64';ctx.beginPath();ctx.moveTo(-8*u,4*u);ctx.lineTo(-2*u,13*u);ctx.lineTo(3*u,4*u);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(38,50,56,.6)';ctx.lineWidth=1.3;for(i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-14*u+i*3*u,-3*u);ctx.lineTo(-15*u+i*3*u,4*u);ctx.stroke();}
      ctx.strokeStyle='#263238';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-34*u,3*u);ctx.quadraticCurveTo(-26*u,7*u,-18*u,5*u);ctx.stroke();
      ctx.fillStyle='#fff';for(i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-31*u+i*4*u,3.6*u);ctx.lineTo(-29*u+i*4*u,3.8*u+3*u);ctx.lineTo(-27*u+i*4*u,4*u);ctx.closePath();ctx.fill();}
      C(-24*u,-3*u,2.4*u,'#fff');C(-24.4*u,-3*u,1.3*u,'#000');
    }
  };
  api.hearts=function(n,total,off){
    var s='',i,p='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
    for(i=0;i<total;i++)s+='<svg width="13" height="13" viewBox="0 0 24 24" style="margin:0 1px;vertical-align:-1px"><path fill="'+(i<n?'#ef5350':(off||'#5a3a24'))+'" d="'+p+'"/></svg>';
    return s;
  };
  api.spr=S;
  return api;
})();
`;

function buildShell(o) {
    const W = o.W || 360;
    const H = o.H || 520;
    const ac = o.accent || '#f2c14e';
    const bg = o.bg || '#151a2e';
    const panel = o.panel || '#0e1224';
    const line = o.line || '#2a3360';
    const sub = o.sub || '#8e9bd1';
    const btnTxt = o.btnText || '#151a2e';
    return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Trebuchet MS',Verdana,sans-serif}
body{padding:8px;background:${bg}}
.wrap{max-width:420px;margin:0 auto}
.top{display:flex;align-items:stretch;gap:6px;margin-bottom:8px}
.logo{margin-right:auto;align-self:center;font:900 20px/1.05 'Trebuchet MS',Verdana,sans-serif;color:${ac}}
.box{min-width:58px;padding:5px 8px;border-radius:8px;background:${panel};color:${sub};font-size:10px;text-align:center}
.box b{display:block;color:#fff;font-size:16px}
.scene{position:relative;border-radius:12px;overflow:hidden;background:${panel};border:2px solid ${line}}
canvas{display:block;width:100%;height:auto;touch-action:none}
.ov{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#fff;padding:14px;background:rgba(10,12,24,.88)}
.ov.off{display:none}
.ov h2{margin:0 0 6px;font-size:24px;color:${ac}}
.ov p{margin:0 0 14px;color:#cfd6f5;font-size:13px;line-height:1.55}
.ov button{padding:11px 28px;border:0;border-radius:10px;font:900 14px 'Trebuchet MS',Verdana,sans-serif;color:${btnTxt};background:${ac}}
.ctl{display:flex;gap:8px;margin-top:8px}
.ctl button{flex:1;height:50px;border:0;border-radius:12px;font:900 18px 'Trebuchet MS',Verdana,sans-serif;color:#fff;background:${line}}
.ctl button:active{filter:brightness(1.3)}
.tip{margin-top:8px;text-align:center;color:${sub};font-size:11px;line-height:1.5}
${o.compact ? '.top{gap:4px}.logo{font-size:15px;min-width:0;flex:1 1 0}.box{min-width:0;flex:0 0 auto;padding:5px 6px;font-size:9px;white-space:nowrap}.box b{font-size:14px}' : ''}
</style></head><body>
<div class="wrap">
  <div class="top">
    <div class="logo">${o.logo}</div>
    <div class="box">${o.label3 || 'INFO'}<b id="x3">-</b></div>
    <div class="box">SKOR<b id="sc">0</b></div>
    <div class="box">TERBAIK<b id="bs">0</b></div>
  </div>
  <div class="scene">
    <canvas id="cv" width="${W}" height="${H}"></canvas>
    <div class="ov" id="ov"><div><h2 id="ot">${o.title}</h2><p id="os">${o.intro}</p><button id="ob">Mulai</button></div></div>
  </div>
  ${o.controls ? '<div class="ctl">' + o.controls + '</div>' : ''}
  <div class="tip">${o.tip || ''}</div>
</div>
<script>${SHELL_JS}</script>
<script>(function(){
${o.script}
})();</script></body></html>
`.trim();
}

module.exports = { buildShell };