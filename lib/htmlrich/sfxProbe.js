const { randomBytes } = require('crypto');
const { sendHtmlGame } = require('./gameSender');

const PROBE_MP3 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAADAAABZwAMjIyMjIyMjJFRUVFRUVFRVhYWFhYWFhYampqampqampqfX19fX19fX2QkJCQkJCQkKKioqKioqKiorW1tbW1tbW1yMjIyMjIyMja2tra2tra2trt7e3t7e3t7f//////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQDNwAAAAAAAAWcKZ4eFwAAAAAAAAAAAAAAAAD/80DEABBwingfTzAAMbclAV6vV6vV6vfv37xgVisViseQFYh7OpBJAHQASACgDAPwPhMBhZMmD4ABAEDmD7+CEp7+U9/R7/RoB/lPf/+hAmAAAbMFhXgAiAsRVwMAHAySV14C4eA3if/zQsQZGpniaA2UqAF4DUw7BIPgZQ1IGHwqBgELAayrQAyGAXAQAQGBsNbeI5DVoatHK/xcwrYho5o5v/k0RYixiXSZMv/8ixFjEul0yLxeR///IqXTIvF5Eul1IKiq/////////wqAFP/zQMQKFsnuEAHfoABgB4AMCgBowCIAZMAyASTAGwHgwLcHMMO9FODEh2lgznIUTMRCCMTAagC4wGkC+A/DcDCCAOPGAy5IFgRPJf/////////////+b///+JN3//XVqgAnmiIvPm/H//NCxAkQkIYVlA5+hGJ+dgFbAjHMD4wF1ZuMxQArDAFwBks4oG191IHHAApNn7NXWx7Xd0736tifH7aPT//y2rUj//3k4xWAQv/ff1+8+Z0/aSxDCq75v2qU1qU5XgwU+RUNbGARDAlQ//NAxCIZSe4EqtfExAxGgA0wBcAFCoADBigZUALCIAWsKBi1O6ESevZv+tvkb61096o2SxNLf7v0t6iJJaTFNiPReB0vZFbXezyEvmzASXSqwEj8t/+tf+Xd48rvEvllRaIIIjz8/h3/80LEFxTpzgyq1+bAMI/YEDQkgKcwMkAiIgFADAB4W/iJB0IJ6CgnSWi+1/o1fayr/1nl//776/f//5x+Q8gn7tfK20+iin9ffU4gAOQgaL11s2rmJHDGiFgueAOAgZMIBwGZit5/HRf/80DEHxIxHho0p4TEBCmDyAQNAcoHrzZ83EhAGY9+rLStrf1//1G7PZonf9XT///fi38guj+t//sURyg/UMBABAgMYJA0p4DydzHp5mPOIREwswLAMDKNAHqLp7K2ioBy4v1///1/7//zQsQxEUnODACnhMQGN//97f///gnavT3/9T8oj//69Sq65AAW12uSwbkT75zFlSxpcpiOgewCr2lvayhjyV/7vyWK//Ff6O7//9ndso3M1/oqpgAZGKab6U4WGmGpjFljAgsxMmNAjf/zQMRHDBCCVl4OxqYDKy9ADoAUMDDuDwDAwAkOmGNDVwgiGXiS7W/7f9v/OtR/Z2/6O3o//2c+3//6KoAIsiDeRlTBXqTMNOKyZNZCkIAjBCE0iFOWUzAx4gBWERiRS2gk9g6KV2dF//NCxHERERoRkhbshPqi7t//hQH+xGPv/7tKf//q//72/VWIJGC1GYlEpLBD7tYYuW9AKBA8cOi4iCFwBYoXUIpkuBHsGtDEKFQiVxQGgRBYPI0DbmkKIqmw/AZFRQ0FYwVYkY3///ir//NAxIgQWRYRVA7EcHin/////rFFTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEoRNgxbwADhI4VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

function buildProbeHtml(kb) {
    const payload = randomBytes(Math.floor(kb * 1024 * 0.75)).toString('base64');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:14px;font:14px/1.5 sans-serif;background:#111;color:#eee}h3{margin:0 0 8px}
pre{background:#1d1d1d;padding:10px;border-radius:8px;white-space:pre-wrap;margin:8px 0}
button{padding:10px 16px;border:0;border-radius:8px;background:#4dd0e1;color:#000;font-weight:700;margin:4px 6px 4px 0}</style></head>
<body><h3>Tes ukuran &amp; audio</h3><div>Muatan target: <b>${kb}</b> KB</div><pre id="o">JS belum jalan...</pre>
<button id="b1">Tes MP3 base64</button><button id="b2">Tes bip sintetis</button>
<script>
var PAYLOAD="${payload}";
var MP3="${PROBE_MP3}";
var o=document.getElementById('o'),ac=null,lines=[];
function log(s){lines.push(s);o.textContent=lines.join('\\n');}
log('JS jalan. Muatan diterima: '+(PAYLOAD.length/1024).toFixed(0)+' KB (target ${kb} KB)');
var AC=window.AudioContext||window.webkitAudioContext;
log('AudioContext: '+(AC?'ada':'TIDAK ada'));
if(AC){
  try{
    var t=new AC();
    log('decodeAudioData: '+(t.decodeAudioData?'ada':'TIDAK ada'));
    log('ConvolverNode (reverb): '+(t.createConvolver?'ada':'TIDAK ada'));
    log('StereoPanner: '+(t.createStereoPanner?'ada':'TIDAK ada'));
    log('state awal: '+t.state);
  }catch(e){log('AudioContext error: '+e.message);}
}
log('atob: '+(typeof atob==='function'?'ada':'TIDAK ada'));
function get(){if(!ac)ac=new AC();if(ac.state==='suspended')ac.resume();return ac;}
document.getElementById('b2').addEventListener('click',function(){
  try{var c=get(),x=c.createOscillator(),g=c.createGain();x.frequency.value=660;g.gain.value=0.2;x.connect(g);g.connect(c.destination);x.start();x.stop(c.currentTime+0.2);log('bip sintetis: dijalankan (kedengaran?)');}catch(e){log('bip gagal: '+e.message);}
});
document.getElementById('b1').addEventListener('click',function(){
  try{
    var c=get(),bin=atob(MP3),u=new Uint8Array(bin.length),i;
    for(i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    c.decodeAudioData(u.buffer,function(b){
      var s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start();
      log('MP3 base64: ter-decode ('+b.duration.toFixed(2)+' dtk) dan diputar (kedengaran?)');
    },function(){log('MP3 base64: GAGAL decode');});
  }catch(e){log('MP3 gagal: '+e.message);}
});
</script></body></html>`;
}

async function sendSfxProbe(sock, jid, kb) {
    return sendHtmlGame(sock, jid, buildProbeHtml(kb));
}

module.exports = { buildProbeHtml, sendSfxProbe };
