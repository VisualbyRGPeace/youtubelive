const loadForm=document.querySelector('#load-form');
const urlInput=document.querySelector('#video-url');
const welcome=document.querySelector('#welcome');
const playerView=document.querySelector('#player-view');
const statusText=document.querySelector('#status');
const pipStatus=document.querySelector('#pip-status');
const pipButton=document.querySelector('#pip-button');
const transparencySlider=document.querySelector('#transparency-slider');
const transparencyValue=document.querySelector('#transparency-value');
const inlinePlayer=document.querySelector('#inline-player');
const inlineFrame=document.querySelector('#inline-frame');
const appMode=window.matchMedia('(display-mode: window-controls-overlay), (display-mode: standalone)').matches;
let activeVideo=null,pipWindow=null,pipFrame=null,inlineActive=false;

function applyTransparency(value){
  const percent=Number(value);
  const opacity=String(1-percent/100);
  transparencyValue.textContent=percent+'%';
  if(pipFrame)pipFrame.style.opacity=opacity;
  if(inlineFrame)inlineFrame.style.opacity=opacity;
  try{localStorage.setItem('gon-video-transparency',String(percent));}catch{}
}
try{
  const saved=localStorage.getItem('gon-video-transparency');
  if(saved!==null&&Number.isFinite(Number(saved)))transparencySlider.value=saved;
}catch{}
transparencySlider.addEventListener('input',()=>applyTransparency(transparencySlider.value));
applyTransparency(transparencySlider.value);

function getVideo(value){
  const text=value.trim();
  const src=text.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  const candidates=src?[src[1],text]:[text];
  for(const candidate of candidates){
    try{
      const url=new URL(candidate);
      const host=url.hostname.toLowerCase().replace(/^www\./,'');
      const isYoutube=['youtube.com','youtube-nocookie.com'].some(domain=>host===domain||host.endsWith('.'+domain));
      if(host==='youtu.be'){
        const id=url.pathname.split('/').filter(Boolean)[0];
        if(id)return {id,embedUrl:new URL('/embed/'+id,'https://www.youtube.com')};
      }
      if(isYoutube){
        if(url.pathname==='/watch'){
          const id=url.searchParams.get('v');
          if(id)return {id,embedUrl:new URL('/embed/'+id,'https://www.youtube.com')};
        }
        const id=url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
        if(id){
          const embedUrl=new URL('/embed/'+id,'https://www.youtube.com');
          for(const [key,val] of url.searchParams)if(key==='start'||key==='end'||key==='si')embedUrl.searchParams.set(key,val);
          return {id,embedUrl};
        }
      }
    }catch{}
  }
  return null;
}

function makePlayerUrl(video){
  const url=new URL('player.html',location.href);
  url.searchParams.set('v',video.id);
  for(const key of ['start','end','si']){
    const val=video.embedUrl.searchParams.get(key);
    if(val)url.searchParams.set(key,val);
  }
  return url.toString();
}

function sendPlayerCommand(command){
  const frame=pipFrame||(inlineActive?inlineFrame:null);
  if(!frame?.contentWindow)return;
  frame.contentWindow.postMessage({type:'gon-command',func:command},location.origin);
}

function setupMediaSession(){
  if(!('mediaSession'in navigator)||!activeVideo)return;
  try{
    navigator.mediaSession.metadata=new MediaMetadata({
      title:'YouTube video',
      artist:'YouTube',
      artwork:[{src:'https://i.ytimg.com/vi/'+activeVideo.id+'/hqdefault.jpg',sizes:'480x360',type:'image/jpeg'}]
    });
    navigator.mediaSession.playbackState='playing';
    navigator.mediaSession.setActionHandler('play',()=>sendPlayerCommand('playVideo'));
    navigator.mediaSession.setActionHandler('pause',()=>sendPlayerCommand('pauseVideo'));
    navigator.mediaSession.setActionHandler('stop',()=>sendPlayerCommand('pauseVideo'));
  }catch{}
}

async function openPictureInPicture(){
  if(!activeVideo)return;
  if(!('documentPictureInPicture'in window)){
    pipStatus.textContent='Cửa sổ nổi cần Chrome hoặc Edge trên máy tính.';
    return;
  }
  try{
    if(!pipWindow||pipWindow.closed){
      pipWindow=await window.documentPictureInPicture.requestWindow({width:240,height:135,disallowReturnToOpener:true});
      pipWindow.document.title='YouTube — Gọn';
      const style=pipWindow.document.createElement('style');
      style.textContent='html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}iframe{display:block;width:100vw;height:100vh;border:0}';
      pipWindow.document.head.append(style);
      pipWindow.addEventListener('pagehide',()=>{
        pipWindow=null;
        pipFrame=null;
        pipStatus.textContent='Cửa sổ nổi đã đóng. Dán link khác hoặc mở lại video.';
        if('mediaSession'in navigator)navigator.mediaSession.playbackState='paused';
      });
    }
    pipFrame=pipWindow.document.createElement('iframe');
    pipFrame.title='YouTube video';
    pipFrame.referrerPolicy='strict-origin-when-cross-origin';
    pipFrame.allow='autoplay; encrypted-media; picture-in-picture; web-share';
    pipFrame.src=makePlayerUrl(activeVideo);
    applyTransparency(transparencySlider.value);
    pipWindow.document.body.replaceChildren(pipFrame);
    pipStatus.textContent='Video đang phát trong cửa sổ nổi. Bạn có thể di chuyển hoặc đổi kích thước cửa sổ.';
    setupMediaSession();
  }catch{
    pipStatus.textContent='Không mở được cửa sổ nổi. Hãy dùng Chrome hoặc Edge trên máy tính.';
  }
}

if(!('documentPictureInPicture'in window)){
  pipButton.title='Cửa sổ nổi cần Chrome hoặc Edge trên máy tính';
}
pipButton.addEventListener('click',openPictureInPicture);

function startVideo(value){
  const video=getVideo(value);
  if(!video){
    statusText.textContent='Không nhận ra link hoặc mã nhúng YouTube. Hãy dán nguyên mã iframe từ YouTube.';
    return;
  }
  activeVideo=video;
  document.querySelector('#track-title').textContent='YouTube video';
  document.querySelector('#track-author').textContent='Cửa sổ nổi';
  welcome.hidden=true;
  if(appMode){startInline();return;}
  playerView.hidden=false;
  openPictureInPicture();
}

function startInline(){
  inlineActive=true;
  playerView.hidden=true;
  inlineFrame.src=makePlayerUrl(activeVideo);
  applyTransparency(transparencySlider.value);
  inlinePlayer.hidden=false;
  setupMediaSession();
}

function stopInline(){
  inlineActive=false;
  inlineFrame.src='about:blank';
  inlinePlayer.hidden=true;
  welcome.hidden=false;
  urlInput.focus();
}
document.querySelector('#inline-back').addEventListener('click',stopInline);

loadForm.addEventListener('submit',event=>{
  event.preventDefault();
  startVideo(urlInput.value);
});

urlInput.addEventListener('paste',event=>{
  const text=event.clipboardData?.getData('text')?.trim()||'';
  if(!getVideo(text))return;
  event.preventDefault();
  urlInput.value=text;
  startVideo(text);
});

document.querySelector('#back-button').addEventListener('click',()=>{
  pipWindow?.close();
  playerView.hidden=true;
  welcome.hidden=false;
  urlInput.focus();
});
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  document.querySelector('#install-button').hidden=false;
  document.querySelector('#install-button').addEventListener('click',async()=>{
    event.prompt();
    await event.userChoice;
  },{once:true});
});
if('serviceWorker'in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').then(registration=>registration.update()).catch(()=>{}));
}