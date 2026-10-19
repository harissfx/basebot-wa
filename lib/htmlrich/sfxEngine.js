/**
 * Mesin suara bersama untuk game HTML mandiri (Dino, Flappy, Snake, Brick, Block, Match3,
 * Room Raider, Slot, Whack, Memory, Lava Cave). Semua suara dibuat lewat Web Audio API,
 * tanpa file audio, jadi ukuran HTML tetap kecil.
 *
 * Supaya terdengar lebih nyata, inti suara (SFX_CORE_JS) memakai:
 *  - noise putih / pink / brown (bukan hanya putih) untuk tubuh suara,
 *  - resonansi bahan (kayu, kaca, logam, glockenspiel) dengan rasio partial yang tidak harmonik,
 *  - reverb ruangan kecil (impulse response dibuat sendiri) lewat jalur send,
 *  - panning stereo, variasi nada acak, dan batas jumlah suara bersamaan,
 *  - kompresor di master supaya ledakan tidak pecah di speaker HP.
 * SFX_CORE_JS juga dipakai actionShell.js, jadi game aksi (G.sfx) ikut mendapat inti yang sama.
 * Catatan: jangan pakai backtick atau ${ di dalam string ini.
 */
const SFX_CORE_JS = String.raw`
  var ac=null,master=null,dry=null,verb=null,nb=null,live=0;
  function A(){
    try{
      if(!ac){
        ac=new (window.AudioContext||window.webkitAudioContext)();
        var cp=ac.createDynamicsCompressor();
        cp.threshold.value=-18;cp.knee.value=12;cp.ratio.value=4;cp.attack.value=0.003;cp.release.value=0.15;
        master=ac.createGain();master.gain.value=0.9;master.connect(cp);cp.connect(ac.destination);
        dry=ac.createGain();dry.connect(master);
        /* Reverb ruangan kecil: noise yang meluruh dan makin gelap di ujung ekor */
        var sr=ac.sampleRate,len=Math.floor(sr*0.55),ir=ac.createBuffer(2,len,sr),ch,i,d,lp,k,n;
        for(ch=0;ch<2;ch++){
          d=ir.getChannelData(ch);lp=0;
          for(i=0;i<len;i++){
            k=0.75-0.6*(i/len);n=Math.random()*2-1;lp+=(n-lp)*k;
            d[i]=lp*Math.pow(1-i/len,2.6)*(i<80?i/80:1);
          }
        }
        verb=ac.createConvolver();verb.buffer=ir;
        var wg=ac.createGain();wg.gain.value=0.55;verb.connect(wg);wg.connect(master);
        /* Tiga jenis noise: w=putih, p=pink (lebih hangat), b=brown (gemuruh rendah) */
        var L=sr*2,W=ac.createBuffer(1,L,sr),P=ac.createBuffer(1,L,sr),B=ac.createBuffer(1,L,sr);
        var wd=W.getChannelData(0),pd=P.getChannelData(0),bd=B.getChannelData(0);
        var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,br=0,w;
        for(i=0;i<L;i++){
          w=Math.random()*2-1;wd[i]=w;
          b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.969*b2+w*0.153852;
          b3=0.8665*b3+w*0.3104856;b4=0.55*b4+w*0.5329522;b5=-0.7616*b5-w*0.016898;
          pd[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;b6=w*0.115926;
          br=(br+0.02*w)/1.02;bd[i]=br*3.5;
        }
        nb={w:W,p:P,b:B};
        loadBank();
        loadMusic();
      }
      if(ac.state==='suspended')ac.resume();
      return ac;
    }catch(e){return null;}
  }
  function env(g,t,a,d,v){
    g.gain.setValueAtTime(0.0001,t);
    g.gain.linearRampToValueAtTime(v,t+a);
    g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  }
  /* Keluarkan suara ke jalur kering (+ pan opsional) dan jalur reverb (o.v = jumlah reverb) */
  function out(g,o){
    var p=null,s;
    if(o.p&&ac.createStereoPanner){p=ac.createStereoPanner();p.pan.value=o.p;g.connect(p);p.connect(dry);}
    else g.connect(dry);
    if(o.v){s=ac.createGain();s.gain.value=o.v;g.connect(s);s.connect(verb);}
  }
  /* N = semburan noise berfilter. o.n: 'w' | 'p' | 'b' */
  function N(o){
    var c=A();if(!c||live>96)return;
    var t=c.currentTime+(o.t||0),d=o.d||0.1,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),a=Math.min(o.a||0.004,d*0.5);
    s.buffer=nb[o.n||'w'];s.loop=true;
    f.type=o.type||'bandpass';f.Q.value=o.q||0.9;
    f.frequency.setValueAtTime(o.f0||1000,t);
    if(o.f1)f.frequency.exponentialRampToValueAtTime(o.f1,t+d);
    env(g,t,a,d,o.g||0.2);
    s.connect(f);f.connect(g);out(g,o);
    live++;s.onended=function(){live--;};
    s.start(t,Math.random()*1.5);s.stop(t+d+0.03);
  }
  /* T = nada. Opsi: lp/lp1 = lowpass (dan sapuannya), vib/vd = getar (Hz / kedalaman) */
  function T(o){
    var c=A();if(!c||live>96)return;
    var t=c.currentTime+(o.t||0),d=o.d||0.1,x=c.createOscillator(),g=c.createGain(),a=Math.min(o.a||0.004,d*0.5),lf,lo,lg;
    x.type=o.type||'sine';
    x.frequency.setValueAtTime(o.f0||440,t);
    if(o.f1)x.frequency.exponentialRampToValueAtTime(o.f1,t+d);
    if(o.vib){
      lo=c.createOscillator();lg=c.createGain();lo.frequency.value=o.vib;lg.gain.value=o.vd||6;
      lo.connect(lg);lg.connect(x.frequency);lo.start(t);lo.stop(t+d+0.03);
    }
    if(o.lp){
      lf=c.createBiquadFilter();lf.type='lowpass';lf.frequency.setValueAtTime(o.lp,t);
      if(o.lp1)lf.frequency.exponentialRampToValueAtTime(o.lp1,t+d);
      x.connect(lf);lf.connect(g);
    }else x.connect(g);
    env(g,t,a,d,o.g||0.2);out(g,o);
    live++;x.onended=function(){live--;};
    x.start(t);x.stop(t+d+0.03);
  }
  /* M = benda bergetar: partial tidak harmonik dengan peluruhan beda-beda tiap partial */
  var MOD={
    wood:{r:[1,2.58,4.35],a:[1,0.55,0.3],k:[1,0.5,0.3]},
    glass:{r:[1,2.32,4.25,6.63],a:[1,0.6,0.4,0.25],k:[1,0.7,0.5,0.35]},
    metal:{r:[1,2.76,5.4,8.93],a:[1,0.6,0.35,0.2],k:[1,0.6,0.4,0.25]},
    glock:{r:[1,2.76,5.4],a:[1,0.45,0.25],k:[1,0.3,0.12]}
  };
  function M(kind,f,t,g,d,o){
    var m=MOD[kind],i,oo=o||{},n=oo.np||m.r.length;
    for(i=0;i<n;i++){
      if(f*m.r[i]>9000)break;
      T({t:t,d:Math.max(0.03,d*m.k[i]),f0:f*m.r[i],g:g*m.a[i]*0.6,a:0.002,v:oo.v,p:oo.p});
    }
    if(oo.click)N({t:t,d:0.012,type:'highpass',f0:4000,g:g*0.5,a:0.001,v:oo.v,p:oo.p});
  }
  function bell(f,t,g,d){M('glock',f,t,g,d||0.5,{v:0.25});}
  function R(){return 0.93+Math.random()*0.14;}
  function RP(){return (Math.random()-0.5)*0.5;}
  var PENT=[523,659,784,988,1175,1319,1568];
  /* ===== Sampel rekaman (opsional): SFXBANK = {nama:[base64 mp3,...]} disisipkan oleh gameSender.js =====
     Kalau sampel untuk sebuah nama ada dan sudah ter-decode, sampel dimainkan; kalau tidak, jatuh ke suara sintetis. */
  var smp={},bankOn=false;
  function loadBank(){
    var B=(typeof SFXBANK!=='undefined')?SFXBANK:null;
    if(!B||bankOn||!ac||!ac.decodeAudioData)return;
    bankOn=true;
    Object.keys(B).forEach(function(k){
      smp[k]=[];
      B[k].forEach(function(s){
        try{
          var bin=atob(s),u=new Uint8Array(bin.length),i;
          for(i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
          ac.decodeAudioData(u.buffer,function(b){smp[k].push(b);},function(){});
        }catch(e){}
      });
    });
  }
  function PL(b,o){
    if(live>96)return;
    var s=ac.createBufferSource(),g=ac.createGain();
    s.buffer=b;s.playbackRate.value=(o.r||1)*(0.96+Math.random()*0.08);
    g.gain.value=o.g||1;
    s.connect(g);out(g,{p:o.p||RP()*0.6,v:o.v===undefined?0.12:o.v});
    live++;s.onended=function(){live--;};
    s.start(ac.currentTime+(o.t||0));
  }
  /* Cara sampel dipetakan untuk suara yang punya argumen (nada, baris, jumlah nada, jeda) */
  var PA={
    thock:function(a){return [{r:Math.pow(a||1,0.5)}];},
    glass:function(a){return [{r:1+(a||0)*0.06}];},
    clunk:function(a){return [{r:1-(a||0)*0.03}];},
    catchGood:function(a){return [{r:1+((a||1)-1)*0.08}];},
    over:function(a){return [{t:a||0}];},
    chime:function(a){
      var n=Math.max(1,Math.min(a||3,7)),i,q=[];
      for(i=0;i<n;i++)q.push({t:i*0.07,r:PENT[i]/523,g:0.8});
      return q;
    }
  };
  function P(name,a){
    var c=A(),v,q,i;
    if(!c)return false;
    v=smp[name];if(!v||!v.length)return false;
    q=PA[name]?PA[name](a):[{}];
    for(i=0;i<q.length;i++)PL(v[Math.floor(Math.random()*v.length)],q[i]);
    return true;
  }
  /* ===== Musik latar (opsional): SFXMUSIC = {nama:{d:base64 mp3,n:jumlah sampel,r:Hz}} disisipkan oleh gameSender.js =====
     Game memilih trek lewat satu baris. Musik mulai saat ada suara permainan, berhenti saat suara over,
     lalu mulai lagi di permainan berikutnya. Kalau trek tidak ada, semua fungsi ini tidak melakukan apa-apa. */
  var muBuf={},muWant=null,muVol=0.18,muReq=false,muSrc=null,muGain=null,muLock=0,muLoaded=false;
  function loadMusic(){
    var B=(typeof SFXMUSIC!=='undefined')?SFXMUSIC:null;
    if(!B||muLoaded||!ac||!ac.decodeAudioData)return;
    muLoaded=true;
    Object.keys(B).forEach(function(k){
      try{
        var s=B[k],bin=atob(s.d),u=new Uint8Array(bin.length),i;
        for(i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
        ac.decodeAudioData(u.buffer,function(b){
          var want=s.n/s.r,st=0;
          /* Decoder yang tidak membuang jeda awal MP3 (sekitar 1105 sampel) menghasilkan durasi lebih panjang: geser titik loop */
          if(b.duration-want>0.04)st=1105/s.r;
          muBuf[k]={b:b,s:st,e:Math.min(b.duration,st+want)};
          muTry();
        },function(){});
      }catch(e){}
    });
  }
  function muTry(){
    var m,t,ks,nm;
    if(!ac||!muReq||!muWant||muSrc)return;
    nm=muWant;
    if(nm==='*'){ks=Object.keys(muBuf);if(!ks.length)return;nm=ks[Math.floor(Math.random()*ks.length)];}
    m=muBuf[nm];if(!m)return;
    t=ac.currentTime;
    if(t<muLock)return;
    muGain=ac.createGain();
    muGain.gain.setValueAtTime(0.0001,t);
    muGain.gain.linearRampToValueAtTime(muVol,t+0.5);
    muGain.connect(master);
    muSrc=ac.createBufferSource();
    muSrc.buffer=m.b;muSrc.loop=true;muSrc.loopStart=m.s;muSrc.loopEnd=m.e;
    muSrc.connect(muGain);
    muSrc.start(t,m.s);
  }
  function muStop(f){
    var s=muSrc,g=muGain,t;
    muReq=false;
    if(!s||!ac)return;
    muSrc=null;muGain=null;t=ac.currentTime;f=f||0.3;
    try{
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(g.gain.value,0.0001),t);
      g.gain.linearRampToValueAtTime(0.0001,t+f);
      s.stop(t+f+0.05);
    }catch(e){}
  }
  /* Dipanggil tiap suara permainan: over menghentikan musik (dan menahan restart sebentar), suara lain menyalakannya */
  function muEv(n){
    if(!muWant)return;
    if(n==='over'){muStop(0.25);if(ac)muLock=ac.currentTime+1.5;return;}
    if(!A())return;
    muReq=true;muTry();
  }
  function muSet(n,v){muWant=n;if(v)muVol=v;}
  /* Musik berhenti saat halaman disembunyikan dan lanjut saat kembali */
  try{document.addEventListener('visibilitychange',function(){
    if(!ac)return;
    if(document.hidden)ac.suspend();else ac.resume();
  });}catch(x){}
  /* Buat AudioContext dari sentuhan pertama supaya sampel sudah ter-decode saat suara pertama dibutuhkan */
  try{['touchstart','mousedown','keydown'].forEach(function(e){document.addEventListener(e,function(){A();},{once:true,passive:true});});}catch(x){}
  /* Mulai decode sampel dan musik sejak halaman dimuat (konteks masih suspended sampai ada sentuhan pertama),
     supaya suara pertama tidak jatuh ke suara sintetis karena sampel belum siap. */
  try{A();}catch(x){}
`;

const SFX_JS = String.raw`
var SFXBANK=null;
var SFXMUSIC=null;
var SFX=(function(){` + SFX_CORE_JS + String.raw`
  var SF={
    tick:function(){N({d:0.018,type:'highpass',f0:3500*R(),g:0.1});T({d:0.012,type:'square',f0:1800,g:0.03,lp:3000});},
    tap:function(){M('wood',620*R(),0,0.16,0.07,{p:RP()});N({d:0.015,type:'highpass',f0:3000,g:0.05});},
    click:function(){N({d:0.025,type:'bandpass',f0:2600*R(),q:2,g:0.15});M('wood',1100*R(),0,0.07,0.03);},
    thock:function(p){
      p=p||1;
      T({d:0.11,f0:210*p*R(),f1:90*p,g:0.28,v:0.1,p:RP()});
      N({d:0.045,type:'lowpass',f0:1400,g:0.22,n:'p'});
      N({d:0.012,type:'highpass',f0:3200,g:0.1});
    },
    thud:function(){T({d:0.16,f0:140,f1:55,g:0.32,v:0.12});N({d:0.1,type:'lowpass',f0:600,f1:150,g:0.5,n:'b'});},
    wood:function(){M('wood',330*R(),0,0.24,0.09,{v:0.1,p:RP()});N({d:0.05,type:'bandpass',f0:900,q:3,g:0.15,n:'p'});},
    swish:function(){N({d:0.16,type:'bandpass',f0:500,f1:2400,q:0.8,g:0.2,a:0.03,n:'p',p:RP()});},
    pop:function(){
      T({d:0.06,f0:380+Math.random()*160,f1:1100,g:0.2,a:0.002,v:0.08});
      N({d:0.025,type:'highpass',f0:2500,g:0.1});
    },
    clink:function(){M('metal',2200*R(),0,0.1,0.22,{np:3,click:true,v:0.2,p:RP()});},
    clunk:function(c){
      T({d:0.13,f0:130+(c||0)*8,f1:68,g:0.3,v:0.08});
      N({d:0.06,type:'lowpass',f0:900,g:0.5,n:'b'});
      N({d:0.02,type:'highpass',f0:2500,g:0.12});
      M('metal',900,0,0.06,0.12,{np:2});
    },
    whirr:function(){
      var i;
      for(i=0;i<8;i++)N({t:i*0.05,d:0.025,type:'highpass',f0:3000,g:0.1});
      N({d:0.4,type:'bandpass',f0:300,f1:900,g:0.09,a:0.05,n:'p'});
      T({d:0.4,type:'sawtooth',f0:90,f1:150,g:0.03,lp:500,a:0.05});
    },
    shot:function(){
      N({d:0.012,type:'highpass',f0:3000,g:0.35,a:0.001});
      N({d:0.2,type:'lowpass',f0:5000,f1:250,q:0.5,g:0.5,a:0.002,n:'p',v:0.25});
      T({d:0.14,type:'sawtooth',f0:170,f1:45,g:0.25,lp:600});
      N({t:0.02,d:0.35,type:'lowpass',f0:1200,f1:150,g:0.3,n:'b',v:0.35});
    },
    hitEnemy:function(){
      N({d:0.12,type:'lowpass',f0:1800,f1:300,g:0.35,n:'p'});
      T({d:0.1,type:'triangle',f0:300,f1:90,g:0.2});
      N({d:0.03,type:'highpass',f0:2500,g:0.12});
    },
    ricochet:function(){
      T({d:0.28,f0:3200,f1:1400,g:0.04,vib:30,vd:120,p:RP()});
      N({d:0.2,type:'bandpass',f0:3800,f1:2200,q:12,g:0.12});
      M('metal',1800*R(),0,0.05,0.1,{np:2,click:true});
    },
    crunch:function(){
      var i;
      for(i=0;i<5;i++)N({t:i*0.028+Math.random()*0.012,d:0.035,type:'bandpass',f0:1400+Math.random()*2200,q:1.4,g:0.22+Math.random()*0.1,a:0.002,n:'p'});
      T({d:0.07,f0:190,f1:110,g:0.1});
    },
    flap:function(){
      N({d:0.1,type:'bandpass',f0:600,f1:1500,q:0.7,g:0.17,a:0.012,n:'p'});
      N({t:0.07,d:0.08,type:'bandpass',f0:900,f1:400,q:0.7,g:0.1,a:0.01,n:'p'});
      T({d:0.08,type:'triangle',f0:300,f1:180,g:0.05});
    },
    glass:function(row){
      var i;
      N({d:0.1,type:'highpass',f0:4500,g:0.22});
      M('glass',900+(row||0)*110,0,0.1,0.28,{v:0.2});
      for(i=0;i<6;i++)T({t:i*0.012+Math.random()*0.02,d:0.08+Math.random()*0.1,f0:2500+Math.random()*5000,g:0.03,a:0.002,v:0.15,p:RP()});
      T({d:0.05,f0:300,f1:150,g:0.1});
    },
    chime:function(n){
      var i;n=Math.max(1,Math.min(n||3,7));
      for(i=0;i<n;i++)M('glock',PENT[i],i*0.07,0.13,0.45,{v:0.3});
    },
    squeak:function(){
      T({d:0.1,type:'triangle',f0:600,f1:1400,g:0.12,lp:3000,vib:28,vd:25});
      T({t:0.08,d:0.08,type:'triangle',f0:1400,f1:800,g:0.1,lp:3000});
    },
    whack:function(){
      T({d:0.13,f0:170,f1:55,g:0.35,v:0.1});
      N({d:0.06,type:'lowpass',f0:900,g:0.6,n:'b'});
      N({d:0.012,type:'highpass',f0:3000,g:0.12});
      SF.squeak();
    },
    creak:function(){
      T({d:0.3,type:'sawtooth',f0:85,f1:130,g:0.05,lp:500,vib:13,vd:10,v:0.2});
      N({d:0.28,type:'bandpass',f0:350,f1:700,q:6,g:0.08,n:'p'});
    },
    jump:function(){T({d:0.14,f0:240,f1:620,g:0.13,lp:2500});N({d:0.12,type:'bandpass',f0:600,f1:1800,g:0.1,n:'p'});},
    coin:function(){M('glock',1318,0,0.12,0.3,{v:0.2});M('glock',1976,0.07,0.12,0.45,{v:0.2});},
    bump:function(){T({d:0.07,f0:120,f1:80,g:0.18});N({d:0.04,type:'lowpass',f0:500,g:0.3,n:'b'});},
    hit:function(){
      N({d:0.5,type:'lowpass',f0:1600,f1:110,q:0.5,g:0.5,n:'p',v:0.2});
      T({d:0.35,type:'sawtooth',f0:190,f1:50,g:0.16,lp:700});
      T({d:0.3,f0:90,f1:35,g:0.3});
      N({d:0.1,type:'highpass',f0:3000,g:0.15});
    },
    boom:function(){
      var i;
      N({d:0.012,type:'highpass',f0:2500,g:0.3,a:0.001});
      N({d:0.8,type:'lowpass',f0:2600,f1:70,q:0.5,g:0.6,a:0.004,n:'b',v:0.3});
      N({d:0.5,type:'lowpass',f0:3500,f1:200,q:0.5,g:0.3,n:'p'});
      T({d:0.6,f0:95,f1:28,g:0.5});
      for(i=0;i<8;i++)N({t:0.1+Math.random()*0.55,d:0.04,type:'bandpass',f0:800+Math.random()*3000,q:1.5,g:0.05+Math.random()*0.07,v:0.2});
    },
    win:function(){
      M('glock',523,0,0.12,0.5,{v:0.3});M('glock',659,0.09,0.12,0.5,{v:0.3});M('glock',784,0.18,0.14,0.7,{v:0.3});
      SF.clink();
    },
    jackpot:function(){
      var i;
      for(i=0;i<9;i++){M('glock',523*Math.pow(2,i/5),i*0.08,0.12,0.45,{np:2,v:0.3});SF.clinkAt(i*0.08+0.03);}
      for(i=0;i<8;i++)SF.clinkAt(0.7+Math.random()*0.9);
    },
    clinkAt:function(t){M('metal',2200+Math.random()*1000,t,0.05,0.2,{np:2,p:RP()});},
    lose:function(){T({d:0.35,type:'sawtooth',f0:260,f1:165,g:0.07,lp:900,vib:6,vd:5});},
    over:function(o){
      o=o||0;
      T({t:o,d:0.25,type:'sawtooth',f0:392,g:0.08,lp:1400,lp1:600,vib:5,vd:4,v:0.15});
      T({t:o+0.2,d:0.25,type:'sawtooth',f0:330,g:0.08,lp:1400,lp1:600,vib:5,vd:4,v:0.15});
      T({t:o+0.4,d:0.5,type:'sawtooth',f0:262,g:0.08,lp:1400,lp1:400,vib:5,vd:4,v:0.2});
    }
  };
  var out2={};
  Object.keys(SF).forEach(function(k){out2[k]=function(a){try{muEv(k);if(!P(k,a))SF[k](a);}catch(e){}};});
  out2.music=function(n,v){muSet(n,v);};
  out2.musicStop=function(){muStop(0.3);};
  out2.musicStart=function(){
    try{
      if(!muWant||!A())return;
      muReq=true;muTry();
      if(!muSrc&&ac.currentTime<muLock)setTimeout(function(){muTry();},(muLock-ac.currentTime)*1000+60);
    }catch(e){}
  };
  return out2;
})();
`;

module.exports = { SFX_JS, SFX_CORE_JS };