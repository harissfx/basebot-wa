const { buildHtmlMessage, sendHtmlGame } = require('./gameSender');

/**
Wordle Indonesia — tebak kata 5 huruf dalam 6 kesempatan. Hijau = huruf dan
 * posisi benar, kuning = huruf ada tapi posisi salah. Daftar kata jawaban ada di
 * dalam file ini (konstanta W di script), tambah/kurangi sesukamu (harus 5 huruf).
 * Dikirim lewat sendHtml / richResponseMessage (lihat gameSender.js).
 */

const WORDLE_HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:'Trebuchet MS',Verdana,sans-serif}
body{padding:8px;background:#12202b}
.wrap{max-width:400px;margin:0 auto}
.top{display:flex;align-items:center;margin-bottom:8px}
.logo{margin-right:auto;font:900 26px/1 'Trebuchet MS',Verdana,sans-serif;color:#e7b23e;letter-spacing:1px}
.new{padding:8px 12px;border:0;border-radius:9px;font:900 12px 'Trebuchet MS',Verdana,sans-serif;color:#12202b;background:#e7b23e}
.msg{min-height:34px;margin-bottom:8px;padding:8px;border-radius:8px;background:#1b3040;color:#d6e4ee;text-align:center;font-size:13px;font-weight:700}
.board{display:grid;gap:6px;width:min(100%,300px);margin:0 auto 12px}
.rw{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.tile{aspect-ratio:1/1;display:grid;place-items:center;border:2px solid #2f4656;border-radius:8px;color:#fff;font-weight:900;font-size:clamp(20px,8vw,30px);text-transform:uppercase;transition:background .25s,border-color .25s,transform .1s}
.tile.f{border-color:#6b8799;transform:scale(1.06)}
.tile.c,.key.c{background:#3fb68b;border-color:#3fb68b;color:#06221a}
.tile.p,.key.p{background:#e7b23e;border-color:#e7b23e;color:#2a1d00}
.tile.x,.key.x{background:#3a4a57;border-color:#3a4a57;color:#8ea2b0}
.kb{display:grid;gap:6px}
.kr{display:flex;justify-content:center;gap:4px}
.key{flex:1;max-width:34px;height:44px;border:0;border-radius:7px;background:#2a3d4b;color:#e4eef5;font:800 14px 'Trebuchet MS',Verdana,sans-serif;padding:0}
.key.w{flex:1.5;max-width:52px;font-size:16px}
.tip{margin-top:10px;text-align:center;color:#6f8797;font-size:11px}
</style></head><body>
<div class="wrap">
  <div class="top"><div class="logo">WORDLE ID</div><button class="new" id="new">Kata baru</button></div>
  <div class="msg" id="msg"></div>
  <div class="board" id="board"></div>
  <div class="kb" id="kb"></div>
  <div class="tip">Hijau: huruf dan posisi benar. Kuning: huruf ada, posisi salah.</div>
</div>
<script>(function(){
var $=function(i){return document.getElementById(i)};
var W='abadi acara ajaib akhir alami angin angka antar aroma arsip asing atlas atlet bakso bahan bakar balas bambu bantu barat basah batas batik bayar bebas bekas belah belut benar benda berat besar besok betis bibir bijak bilik binar bisik bocah bodoh bosan buang bubur bukan bukit bulan bumbu bunga bunyi cabai cabut cemas cepat cinta cuaca cukup curam dahan dalam damai dapur darah datar datuk dekat dewan dosen dunia emosi fajar fakta gagah gajah galak garam garis gelap gemuk genap gigit gurih gurun habis hadap hadir hakim halus hamil hampa hanya harap harga harta hasil hebat hemat heran hitam iklan indah ingat jaket jalan jalur jamur janji jarak jatuh jejak jelas jemur jeruk joget jujur kabar kabel kaget kakak kakek kamar kamus kanan kapal kapan karet kasar kasih kasur katak kawan kelas kemas keras kerja ketat kotak kotor kuasa kudus kulit kurus lahan lahir lalat lampu lapar laris latar layak layar lebah lebar lemah lemak lembu lepas licin lidah lihat lipat logam luput lurus macam makna malam malas mampu manis marah masak masih masuk mawar medan melon merah merek mimpi minta modal motor mudah murah murid musim nakal nasib nenek nilai nyata nyala objek obrol omong orang pagar pahit pajak pakai panas pasar pasir paham pedas pelan perut pesan pikir pintu pisau pohon pukul pulau pusat putih puasa radio rajin ramah ramai rapat rawat rebut resep rokok rumah sabar sabun sakit salah salju sandi sawah sayap sayur segar sehat sejuk selai semua serat setia siang sibuk sikap silat sinar sulit supir surat suara tahan tahun tajam takut tamat tanah tanda tarik tebal tegas telur tempe tenda tepat teman tenun tikus timur tinta tiket tidur tolak tomat tukar tulis tunai tunda turun ujian ulang untuk utama utara wajah wajib warna warga warta waktu wangi yakin yatim zaman zebra angsa apung arang badai badan bagus bakat balik batal beban belum benci benih biaya bocor boleh botol buruk celah cicak duduk dukun dusun gaduh ganas ganti garpu gebuk gelar gelas gerak getah hajat halal hantu harum hukum hutan ikuti inang intan jahat jahit jambu jawab jodoh juara jurus karya kebun kecap kedai kenal kilat kirim kolam korek kubur kuman kunci kupas kursi laksa lebat leher lemas libur lukis makan mandi mudik mulai mulut'.split(' ');
var ans='',row=0,col=0,done=false,keys={};
var rows=[],board=$('board'),kb=$('kb');

for(var r=0;r<6;r++){
  var rw=document.createElement('div');rw.className='rw';
  var tl=[];
  for(var c=0;c<5;c++){var t=document.createElement('div');t.className='tile';rw.appendChild(t);tl.push(t);}
  board.appendChild(rw);rows.push(tl);
}
var KB=['QWERTYUIOP','ASDFGHJKL','>ZXCVBNM<'];
KB.forEach(function(s){
  var kr=document.createElement('div');kr.className='kr';
  s.split('').forEach(function(ch){
    var b=document.createElement('button');
    b.className='key'+(ch==='>'||ch==='<'?' w':'');
    b.textContent=ch==='>'?'OK':ch==='<'?'⌫':ch;
    b.setAttribute('data-k',ch);
    b.onclick=function(){press(ch)};
    kr.appendChild(b);keys[ch]=b;
  });
  kb.appendChild(kr);
});

function msg(s){$('msg').textContent=s;}
function newGame(){
  ans=W[Math.random()*W.length|0].toUpperCase();
  row=0;col=0;done=false;
  for(var r=0;r<6;r++)for(var c=0;c<5;c++){var t=rows[r][c];t.textContent='';t.className='tile';t.style.transitionDelay='0ms';}
  for(var k in keys){keys[k].removeAttribute('data-s');if(keys[k].className.indexOf('w')>-1)keys[k].className='key w';else keys[k].className='key';}
  msg('Tebak kata 5 huruf. Kamu punya 6 kesempatan.');
}
function score(g,a){
  var res=[],used=[],i,j;
  for(i=0;i<5;i++){res.push('x');used.push(false);}
  for(i=0;i<5;i++)if(g.charAt(i)===a.charAt(i)){res[i]='c';used[i]=true;}
  for(i=0;i<5;i++){
    if(res[i]==='c')continue;
    for(j=0;j<5;j++){
      if(!used[j]&&g.charAt(i)===a.charAt(j)){res[i]='p';used[j]=true;break;}
    }
  }
  return res;
}
var RANK={x:1,p:2,c:3};
function paintKey(ch,st){
  var b=keys[ch];if(!b)return;
  var cur=b.getAttribute('data-s')||'';
  if(cur&&RANK[cur]>=RANK[st])return;
  b.setAttribute('data-s',st);
  b.className='key '+st;
}
function type(ch){
  if(done||col>4)return;
  var t=rows[row][col];t.textContent=ch;t.className='tile f';col++;
}
function back(){
  if(done||col<1)return;
  col--;var t=rows[row][col];t.textContent='';t.className='tile';
}
function enter(){
  if(done)return;
  if(col<5){msg('Isi 5 huruf dulu ya.');return;}
  var g='',i;
  for(i=0;i<5;i++)g+=rows[row][i].textContent;
  var res=score(g,ans);
  for(i=0;i<5;i++){
    var t=rows[row][i];
    t.style.transitionDelay=(i*90)+'ms';
    t.className='tile '+res[i];
    paintKey(g.charAt(i),res[i]);
  }
  if(g===ans){done=true;msg('Benar! Selesai di tebakan ke-'+(row+1)+' dari 6.');return;}
  row++;col=0;
  if(row>5){done=true;msg('Habis! Katanya: '+ans+'. Tekan Kata baru untuk main lagi.');}
  else msg('Tebakan ke-'+(row+1)+' dari 6.');
}
function press(k){
  if(k==='>')enter();else if(k==='<')back();else type(k);
}
addEventListener('keydown',function(e){
  if(e.key==='Enter')press('>');
  else if(e.key==='Backspace')press('<');
  else if(/^[a-zA-Z]$/.test(e.key))press(e.key.toUpperCase());
});
$('new').onclick=newGame;
newGame();
})();</script></body></html>
`.trim();

const buildWordleMessage = () => buildHtmlMessage(WORDLE_HTML);
const sendWordleGame = (sock, jid) => sendHtmlGame(sock, jid, WORDLE_HTML);

module.exports = { sendWordleGame, buildWordleMessage, WORDLE_HTML };