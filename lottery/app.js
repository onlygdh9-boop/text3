(()=>{
  const API_URL='https://script.google.com/macros/s/AKfycbxeXyUy7aAYbWkgb9hJ7_Uc_2bgPgnuKIXWFrTGt6qp21nxKp72lQ_TO4Umns6p8cOW0Q/exec';
  const DEVICE_KEY='lotteryGithubDeviceV1';
  const TOKEN_KEY='lotteryGithubTokenV1';
  const $=id=>document.getElementById(id);
  const loading=$('loading'),errorPanel=$('errorPanel'),soldout=$('soldout'),ticketPanel=$('ticket');
  const canvas=$('scratchCanvas'),scratchArea=$('scratchArea'),debris=$('debris'),confetti=$('confetti'),resultBox=$('resultBox');
  let currentTicket=null,ctx=null,drawing=false,lastPoint=null,moves=0,finished=false,soundEnabled=false,audioContext=null,lastSound=0,resizeTimer=null;

  function showOnly(name){
    [[loading,'loading'],[errorPanel,'error'],[soldout,'soldout'],[ticketPanel,'ticket']].forEach(([el,n])=>{
      el.classList.toggle('hidden',n!==name);
      if(n===name)requestAnimationFrame(()=>el.classList.add('on'));
    });
  }

  function api(params){
    return new Promise((resolve,reject)=>{
      const callback='__lottery_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script');
      const timer=setTimeout(()=>{cleanup();reject(new Error('서버 연결 시간이 초과되었습니다.'));},15000);
      function cleanup(){clearTimeout(timer);try{delete window[callback]}catch(_){window[callback]=undefined}script.remove()}
      window[callback]=data=>{cleanup();resolve(data)};
      script.src=API_URL+'?'+new URLSearchParams({...params,callback}).toString();
      script.async=true;
      script.onerror=()=>{cleanup();reject(new Error('Apps Script 서버에 연결하지 못했습니다.'))};
      document.body.appendChild(script);
    });
  }

  function deviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){id='device-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));localStorage.setItem(DEVICE_KEY,id)}
    return id;
  }

  function animateNumber(el,target){
    const end=Number(target);
    if(!Number.isFinite(end)){el.textContent=target??'-';return}
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=end;return}
    cancelAnimationFrame(el._raf||0);
    const cur=Number(el.textContent),start=Number.isFinite(cur)?cur:0,t0=performance.now();
    const tick=now=>{const t=Math.min(1,(now-t0)/420),e=1-Math.pow(1-t,3);el.textContent=Math.round(start+(end-start)*e);if(t<1)el._raf=requestAnimationFrame(tick)};
    el._raf=requestAnimationFrame(tick);
  }

  function updateCounts(data){if(!data)return;if(data.total!==undefined)animateNumber($('total'),data.total);if(data.remaining!==undefined)animateNumber($('remaining'),data.remaining)}
  function showError(msg){$('errorText').textContent=msg||'Apps Script 서버에 연결하지 못했습니다.';showOnly('error')}

  async function drawLottery(){
    showOnly('loading');
    try{
      const result=await api({action:'draw',deviceId:deviceId(),resumeToken:localStorage.getItem(TOKEN_KEY)||''});
      updateCounts(result);
      if(!result||!result.ok){
        if(result&&result.soldOut){localStorage.removeItem(TOKEN_KEY);showOnly('soldout');return}
        throw new Error(result&&result.message||'복권을 받을 수 없습니다.');
      }
      currentTicket=result.ticket;
      localStorage.setItem(TOKEN_KEY,currentTicket.token);
      renderTicket();
    }catch(error){console.error(error);showError(error.message)}
  }

  function renderTicket(){
    $('resultText').textContent=currentTicket.result||'결과';
    $('resultDescription').textContent=currentTicket.description||'';
    const type=String(currentTicket.type||'').trim();
    resultBox.classList.remove('lose','special');
    if(type==='꽝'){
      resultBox.classList.add('lose');$('resultIcon').className='fa-solid fa-arrow-rotate-right';$('resultLabel').textContent='TRY AGAIN';
    }else if(type==='특별'){
      resultBox.classList.add('special');$('resultIcon').className='fa-solid fa-crown';$('resultLabel').textContent='SPECIAL';
    }else{
      $('resultIcon').className='fa-solid fa-gift';$('resultLabel').textContent='WINNER';
    }
    $('percent').textContent='0%';$('bar').style.width='0%';finished=false;drawing=false;moves=0;lastPoint=null;
    showOnly('ticket');requestAnimationFrame(makeFoil);
  }

  function makeFoil(){
    const rect=scratchArea.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,2),w=rect.width,h=rect.height;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';canvas.style.opacity='1';canvas.style.pointerEvents='auto';
    ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.setTransform(dpr,0,0,dpr,0,0);
    const g=ctx.createLinearGradient(0,0,w,h);
    [[0,'#8d8880'],[.12,'#f8f3ea'],[.27,'#b4ab9e'],[.43,'#fffdf8'],[.58,'#9f978c'],[.73,'#f2ede4'],[.88,'#bbb1a4'],[1,'#ddd5c9']].forEach(([p,c])=>g.addColorStop(p,c));
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const glow=ctx.createRadialGradient(w*.30,h*.20,0,w*.30,h*.20,w*.58);glow.addColorStop(0,'rgba(255,255,255,.42)');glow.addColorStop(.45,'rgba(255,255,255,.08)');glow.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.22;
    for(let y=-h;y<h*2;y+=8){ctx.strokeStyle=Math.random()>.5?'#fffaf2':'#6e675e';ctx.lineWidth=Math.random()*.65+.2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y+w*.22);ctx.stroke()}
    ctx.globalAlpha=1;
    for(let i=0,n=Math.min(920,Math.floor(w*h/110));i<n;i++){ctx.fillStyle=Math.random()>.48?'rgba(255,255,255,.48)':'rgba(72,64,55,.18)';ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*1.2+.18,0,Math.PI*2);ctx.fill()}
    ctx.strokeStyle='rgba(255,250,242,.55)';ctx.lineWidth=1;ctx.strokeRect(7,7,w-14,h-14);
    ctx.textAlign='center';ctx.fillStyle='rgba(67,61,54,.76)';ctx.font='800 17px Montserrat, sans-serif';ctx.fillText('LUCKY MOMENT',w/2,h/2-4);ctx.font='700 13px Pretendard, sans-serif';ctx.fillText('손가락이나 마우스로 긁어 주세요',w/2,h/2+24);
  }

  function point(event){const rect=canvas.getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top,time:performance.now()}}
  function scratch(from,to){
    if(!ctx)return;
    const distance=Math.hypot(to.x-from.x,to.y-from.y),elapsed=Math.max(8,to.time-from.time),speed=distance/elapsed,width=Math.min(58,35+speed*13);
    ctx.save();ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();
    for(let i=0;i<9;i++){const angle=Math.random()*Math.PI*2,radius=Math.random()*width*.64;ctx.beginPath();ctx.arc(to.x+Math.cos(angle)*radius,to.y+Math.sin(angle)*radius,Math.random()*4.6+.9,0,Math.PI*2);ctx.fill()}
    ctx.restore();spawnChips(to.x,to.y,width);playScratchSound(speed);
  }

  function spawnChips(x,y,width){
    for(let i=0;i<2;i++){
      const chip=document.createElement('span');chip.className='chip';chip.style.left=x+(Math.random()-.5)*width+'px';chip.style.top=y+(Math.random()-.5)*width*.45+'px';chip.style.setProperty('--dx',(Math.random()-.5)*38+'px');chip.style.setProperty('--dy',12+Math.random()*30+'px');debris.appendChild(chip);setTimeout(()=>chip.remove(),760);
    }
  }

  function scratchedPercent(){
    if(!ctx)return 0;
    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,step=Math.max(14,Math.round(17*(devicePixelRatio||1)));
    let total=0,clear=0;
    for(let y=0;y<canvas.height;y+=step)for(let x=0;x<canvas.width;x+=step){total++;if(data[(y*canvas.width+x)*4+3]<40)clear++}
    return total?Math.round(clear/total*100):0;
  }

  function checkProgress(){if(finished||!ctx)return;const value=Math.min(100,scratchedPercent());$('percent').textContent=value+'%';$('bar').style.width=value+'%';if(value>=55)reveal()}
  function reveal(){
    if(finished)return;finished=true;drawing=false;$('percent').textContent='100%';$('bar').style.width='100%';canvas.style.opacity='0';canvas.style.pointerEvents='none';
    if(currentTicket&&currentTicket.type!=='꽝')celebrate();
    if(currentTicket&&currentTicket.token)api({action:'scratched',token:currentTicket.token}).catch(()=>{});
  }

  function celebrate(){
    if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    const hues=[94,116,38,253,210,20];
    for(let i=0;i<46;i++){const p=document.createElement('span');p.style.left=Math.random()*100+'%';p.style.setProperty('--h',hues[Math.floor(Math.random()*hues.length)]);p.style.setProperty('--d',1.7+Math.random()*1.8+'s');p.style.setProperty('--x',(Math.random()-.5)*190+'px');confetti.appendChild(p);setTimeout(()=>p.remove(),3800)}
  }

  function playScratchSound(speed){
    if(!soundEnabled||performance.now()-lastSound<65)return;lastSound=performance.now();
    try{
      audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();
      const len=Math.floor(audioContext.sampleRate*.035),buffer=audioContext.createBuffer(1,len,audioContext.sampleRate),values=buffer.getChannelData(0);
      for(let i=0;i<len;i++)values[i]=(Math.random()*2-1)*(1-i/len);
      const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();filter.type='highpass';filter.frequency.value=900;gain.gain.value=Math.min(.032,.01+speed*.008);source.buffer=buffer;source.connect(filter).connect(gain).connect(audioContext.destination);source.start();
    }catch(_){}
  }

  canvas.addEventListener('pointerdown',event=>{if(finished||!ctx)return;drawing=true;lastPoint=point(event);try{canvas.setPointerCapture(event.pointerId)}catch(_){}});
  canvas.addEventListener('pointermove',event=>{if(!drawing||finished||!lastPoint)return;const current=point(event);scratch(lastPoint,current);lastPoint=current;if(++moves%7===0)checkProgress()});
  ['pointerup','pointercancel','pointerleave'].forEach(name=>canvas.addEventListener(name,()=>{if(drawing){drawing=false;checkProgress()}}));

  $('soundButton').addEventListener('click',async()=>{
    soundEnabled=!soundEnabled;
    if(soundEnabled)try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')await audioContext.resume()}catch(_){}
    $('soundButton').innerHTML=soundEnabled?'<i class="fa-solid fa-volume-high" aria-hidden="true"></i>':'<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>';
    $('soundButton').setAttribute('aria-label',soundEnabled?'긁는 소리 끄기':'긁는 소리 켜기');
  });
  $('retryButton').addEventListener('click',drawLottery);
  window.addEventListener('resize',()=>{if(!currentTicket||finished||ticketPanel.classList.contains('hidden'))return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>requestAnimationFrame(makeFoil),140)});

  function initReveal(){
    if(matchMedia('(prefers-reduced-motion:reduce)').matches||!('IntersectionObserver'in window)){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('on'));return}
    document.documentElement.classList.add('js-reveal');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('on');observer.unobserve(entry.target)}}),{threshold:.1});
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  }

  function initTilt(){
    if(!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    document.querySelectorAll('.tilt').forEach(card=>{
      card.addEventListener('pointermove',event=>{const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;card.style.setProperty('--sx',x*100+'%');card.style.setProperty('--sy',y*100+'%');card.style.transform=`perspective(950px) rotateX(${(.5-y)*3.4}deg) rotateY(${(x-.5)*4.2}deg) translateY(-1px)`});
      card.addEventListener('pointerleave',()=>{card.style.transform='';card.style.removeProperty('--sx');card.style.removeProperty('--sy')});
    });
  }

  async function start(){
    try{
      const status=await api({action:'status'});
      if(!status||!status.ok)throw new Error(status&&status.message||'복권 현황을 불러오지 못했습니다.');
      updateCounts(status);await new Promise(resolve=>setTimeout(resolve,420));await drawLottery();
    }catch(error){console.error(error);showError(error.message)}
  }

  initReveal();initTilt();start();
})();
