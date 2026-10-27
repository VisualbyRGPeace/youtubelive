const loadForm=document.querySelector('#load-form');
const urlInput=document.querySelector('#video-url');
const welcome=document.querySelector('#welcome');
const playerView=document.querySelector('#player-view');
const statusText=document.querySelector('#status');
const pipStatus=document.querySelector('#pip-status');
const pipButton=document.querySelector('#pip-button');
const playToggle=document.querySelector('#play-toggle');
const previousButton=document.querySelector('#previous-button');
const nextButton=document.querySelector('#next-button');
const volumeSlider=document.querySelector('#volume-slider');
const seekSlider=document.querySelector('#seek-slider');
const currentTimeLabel=document.querySelector('#current-time');
const durationLabel=document.querySelector('#duration');
const lockToggle=document.querySelector('#lock-toggle');
const inlineLock=document.querySelector('#inline-lock');
const transparencySlider=document.querySelector('#transparency-slider');
const transparencyValue=document.querySelector('#transparency-value');
const inlinePlayer=document.querySelector('#inline-player');
const inlineFrame=document.querySelector('#inline-frame');
const appMode=window.matchMedia('(display-mode: window-controls-overlay), (display-mode: standalone)').matches;
let activeVideo=null,pipWindow=null,pipFrame=null,inlineActive=false,playerLocked=false,isPlaying=true,isSeeking=false,videoDuration=0;

function updateLockButtons(){
  const label=playerLocked?'Mở khóa thao tác':'Khóa thao tác';
  lockToggle.textContent=playerLocked?'Mở khóa cửa sổ nổi':'Khóa thao tác trong cửa sổ nổi';
  lockToggle.setAttribute('aria-pressed',String(playerLocked));
  inlineLock.textContent=playerLocked?'Mở khóa':'Khóa';
  inlineLock.setAttribute('aria-pressed',String(playerLocked));
}
function sendPlayerCommand(command,args=[]){
  const frame=pipFrame||(inlineActive?inlineFrame:null);
  if(frame?.contentWindow)frame.contentWindow.postMessage({type:'gon-command',func:command,args},location.origin);
}
function updatePlayButton(){playToggle.textContent=isPlaying?'Ⅱ':'▶';playToggle.title=isPlaying?'Tạm dừng':'Tiếp tục';playToggle.setAttribute('aria-label',isPlaying?'Tạm dừng':'Tiếp tục');}
function setPlaying(value){isPlaying=Boolean(value);updatePlayButton();if('mediaSession'in navigator)navigator.mediaSession.playbackState=isPlaying?'playing':'paused';sendPlayerCommand(isPlaying?'playVideo':'pauseVideo');}
function formatTime(seconds){if(!Number.isFinite(seconds)||seconds<0)return'0:00';const total=Math.floor(seconds);const mins=Math.floor(total/60);const secs=String(total%60).padStart(2,'0');return mins>=60?Math.floor(mins/60)+':'+String(mins%60).padStart(2,'0')+':'+secs:mins+':'+secs;}
function updateTimeline(currentTime,duration){videoDuration=Number(duration)||0;durationLabel.textContent=videoDuration>0?formatTime(videoDuration):'--:--';seekSlider.disabled=videoDuration<=0;if(!isSeeking){const current=Math.max(0,Number(currentTime)||0);seekSlider.value=videoDuration>0?String(Math.round(current/videoDuration*1000)):0;currentTimeLabel.textContent=formatTime(current);}}
function setPlayerLocked(value){
  playerLocked=Boolean(value);
  updateLockButtons();
  sendPlayerCommand('setLocked',[playerLocked]);
}
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
updateLockButtons();

function videoFromUrl(url){
  const host=url.hostname.toLowerCase().replace(/^www\./,'');
  const isYoutube=['youtube.com','youtube-nocookie.com'].some(domain=>host===domain||host.endsWith('.'+domain));
  const copyParams=target=>{for(const key of ['start','end','si','list','index']){const value=url.searchParams.get(key);if(value)target.searchParams.set(key,value)}};
  if(host==='youtu.be'){
    const id=url.pathname.split('/').filter(Boolean)[0];
    if(!id)return null;
    const embedUrl=new URL('/embed/'+id,'https://www.youtube.com');copyParams(embedUrl);
    return {id,list:url.searchParams.get('list')||'',embedUrl};
  }
  if(!isYoutube)return null;
  if(url.pathname==='/playlist'){
    const list=url.searchParams.get('list');
    if(!list)return null;
    const id=url.searchParams.get('v')||'';
    const embedUrl=new URL(id?'/embed/'+id:'/embed/videoseries','https://www.youtube.com');
    copyParams(embedUrl);
    return {id,list,embedUrl};
  }
  if(url.pathname==='/watch'){
    const id=url.searchParams.get('v')||'';
    const list=url.searchParams.get('list')||'';
    if(!id&&!list)return null;
    const embedUrl=new URL(id?'/embed/'+id:'/embed/videoseries','https://www.youtube.com');copyParams(embedUrl);
    return {id,list,embedUrl};
  }
  const match=url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
  if(!match)return null;
  const id=match[1];
  const list=url.searchParams.get('list')||'';
  const embedUrl=new URL(id==='videoseries'?'/embed/videoseries':'/embed/'+id,'https://www.youtube.com');
  copyParams(embedUrl);
  return {id:id==='videoseries'?'':id,list,embedUrl};
}
function getVideo(value){
  const text=value.trim();
  const source=text.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  for(const candidate of source?[source[1],text]:[text]){
    try{const video=videoFromUrl(new URL(candidate));if(video)return video;}catch{}
  }
  return null;
}
function makePlayerUrl(video){
  const url=new URL('player.html',location.href);
  if(video.id)url.searchParams.set('v',video.id);
  if(video.list)url.searchParams.set('list',video.list);
  for(const key of ['start','end','si','list','index']){
    const value=video.embedUrl.searchParams.get(key);
    if(value)url.searchParams.set(key,value);
  }
  return url.toString();
}
function setupMediaSession(){
  if(!('mediaSession'in navigator)||!activeVideo)return;
  try{
    const metadata={title:'YouTube video',artist:'YouTube'};
    if(activeVideo.id)metadata.artwork=[{src:'https://i.ytimg.com/vi/'+activeVideo.id+'/hqdefault.jpg',sizes:'480x360',type:'image/jpeg'}];
    navigator.mediaSession.metadata=new MediaMetadata(metadata);
    navigator.mediaSession.playbackState='playing';
    navigator.mediaSession.setActionHandler('play',()=>setPlaying(true));
    navigator.mediaSession.setActionHandler('pause',()=>setPlaying(false));
    navigator.mediaSession.setActionHandler('stop',()=>setPlaying(false));
  }catch{}
}
function receivePlayerState(event){
  const data=event.data;
  if(data?.type!=='gon-player-state')return;
  playerLocked=Boolean(data.locked);
  updateLockButtons();
  if(Number.isFinite(Number(data.duration)))updateTimeline(data.currentTime,data.duration);
  if(data.state===1){isPlaying=true;updatePlayButton();if('mediaSession'in navigator)navigator.mediaSession.playbackState='playing';}
  else if(data.state===2||data.state===0||data.autoplayBlocked){isPlaying=false;updatePlayButton();if('mediaSession'in navigator)navigator.mediaSession.playbackState='paused';}
  if(data.autoplayBlocked)pipStatus.textContent='Trình duyệt đã chặn tự phát. Bấm Tiếp tục trên trang chính để phát video.';
  else if(data.error)pipStatus.textContent='Video không cho phép phát nhúng hoặc đã xảy ra lỗi YouTube ('+data.error+').';
}
window.addEventListener('message',event=>{
  if(event.source===inlineFrame.contentWindow||event.source===pipFrame?.contentWindow)receivePlayerState(event);
});
function attachPipMessages(){
  pipWindow.addEventListener('message',event=>{
    if(event.source===pipFrame?.contentWindow)receivePlayerState(event);
  });
}
async function openPictureInPicture(){
  if(!activeVideo)return;
  if(!('documentPictureInPicture'in window)){
    pipStatus.textContent='Cửa sổ nổi cần Chrome hoặc Edge trên máy tính.';
    return;
  }
  try{
    if(!pipWindow||pipWindow.closed){
      pipWindow=await window.documentPictureInPicture.requestWindow({width:360,height:220,disallowReturnToOpener:true});
      pipWindow.document.title='YouTube — Gọn';
      const style=pipWindow.document.createElement('style');
      style.textContent='html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}iframe{display:block;width:100vw;height:100vh;border:0}';
      pipWindow.document.head.append(style);
      attachPipMessages();
      pipWindow.addEventListener('pagehide',()=>{
        pipWindow=null;pipFrame=null;playerLocked=false;updateLockButtons();
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
    pipStatus.textContent=activeVideo.list?'Video tự phát. Các nút điều khiển nằm trên trang chính.':'Video tự phát. Muốn chuyển bài, hãy mở một playlist.';
    updateLockButtons();
    if(playerLocked)sendPlayerCommand('setLocked',[true]);
    setupMediaSession();
  }catch{
    pipStatus.textContent='Không mở được cửa sổ nổi. Hãy dùng Chrome hoặc Edge trên máy tính.';
  }
}
if(!('documentPictureInPicture'in window))pipButton.title='Cửa sổ nổi cần Chrome hoặc Edge trên máy tính';
pipButton.addEventListener('click',openPictureInPicture);
playToggle.addEventListener('click',()=>setPlaying(!isPlaying));
previousButton.addEventListener('click',()=>sendPlayerCommand('previousVideo'));
nextButton.addEventListener('click',()=>sendPlayerCommand('nextVideo'));
volumeSlider.addEventListener('input',()=>sendPlayerCommand('setVolume',[Number(volumeSlider.value)]));
seekSlider.addEventListener('pointerdown',()=>{isSeeking=true;});
seekSlider.addEventListener('keydown',()=>{isSeeking=true;});
seekSlider.addEventListener('input',()=>{if(videoDuration>0){const preview=Number(seekSlider.value)/1000*videoDuration;currentTimeLabel.textContent=formatTime(preview);sendPlayerCommand('seekToPreview',[preview]);}});
seekSlider.addEventListener('change',()=>{if(videoDuration>0)sendPlayerCommand('seekTo',[Number(seekSlider.value)/1000*videoDuration]);isSeeking=false;});
lockToggle.addEventListener('click',()=>setPlayerLocked(!playerLocked));
inlineLock.addEventListener('click',()=>setPlayerLocked(!playerLocked));

function startVideo(value){
  const video=getVideo(value);
  if(!video){statusText.textContent='Không nhận ra link hoặc mã nhúng YouTube. Hãy dán nguyên mã iframe từ YouTube.';return;}
  activeVideo=video;
  document.querySelector('#track-title').textContent=video.id?'YouTube video':'YouTube playlist';
  document.querySelector('#track-author').textContent=video.list?'Danh sách phát':'Cửa sổ nổi';
  playerLocked=false;isPlaying=true;updatePlayButton();updateTimeline(0,0);previousButton.disabled=!video.list;nextButton.disabled=!video.list;updateLockButtons();welcome.hidden=true;
  if(appMode){startInline();return;}
  playerView.hidden=false;
  openPictureInPicture();
}
function startInline(){
  inlineActive=true;playerView.hidden=true;
  inlineFrame.src=makePlayerUrl(activeVideo);
  applyTransparency(transparencySlider.value);
  inlinePlayer.hidden=false;setupMediaSession();
}
function stopInline(){
  inlineActive=false;inlineFrame.src='about:blank';inlinePlayer.hidden=true;
  playerLocked=false;updateLockButtons();welcome.hidden=false;urlInput.focus();
}
document.querySelector('#inline-back').addEventListener('click',stopInline);
loadForm.addEventListener('submit',event=>{event.preventDefault();startVideo(urlInput.value);});
urlInput.addEventListener('paste',event=>{
  const text=event.clipboardData?.getData('text')?.trim()||'';
  if(!getVideo(text))return;
  event.preventDefault();urlInput.value=text;startVideo(text);
});
document.querySelector('#back-button').addEventListener('click',()=>{
  pipWindow?.close();playerView.hidden=true;welcome.hidden=false;urlInput.focus();
});
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  const button=document.querySelector('#install-button');button.hidden=false;
  button.addEventListener('click',async()=>{event.prompt();await event.userChoice;},{once:true});
});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').then(registration=>registration.update()).catch(()=>{}));