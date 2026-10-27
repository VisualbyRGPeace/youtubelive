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
const volumeIcon=document.querySelector('#volume-icon');
const seekSlider=document.querySelector('#seek-slider');
const currentTimeLabel=document.querySelector('#current-time');
const durationLabel=document.querySelector('#duration');
const lockToggle=document.querySelector('#lock-toggle');
const lockLabel=document.querySelector('#lock-label');
const inlineLock=document.querySelector('#inline-lock');
const transparencySlider=document.querySelector('#transparency-slider');
const transparencyValue=document.querySelector('#transparency-value');
const inlinePlayer=document.querySelector('#inline-player');
const inlineFrame=document.querySelector('#inline-frame');
const appMode=window.matchMedia('(display-mode: window-controls-overlay), (display-mode: standalone)').matches;
let activeVideo=null,pipWindow=null,pipFrame=null,inlineActive=false,playerLocked=false,isPlaying=true,isSeeking=false,videoDuration=0;
let seekHoldUntil=0,previewTimer=0,pendingPreview=null,lastSid='',lastSeq=0,lastTimeText='',lastDurationText='';

/* ---------- Tiện ích giao diện ---------- */
function setIcon(element,name){element.querySelector('use')?.setAttribute('href','#i-'+name);}
function setFill(input){
  const min=Number(input.min)||0,max=Number(input.max)||100;
  input.style.setProperty('--p',((Number(input.value)-min)/(max-min)*100)+'%');
}
function setText(element,text){if(element.textContent!==text)element.textContent=text;}

function updateLockButtons(){
  const label=playerLocked?'Mở khóa thao tác':'Khóa thao tác';
  setText(lockLabel,playerLocked?'Mở khóa cửa sổ nổi':'Khóa thao tác trong cửa sổ nổi');
  setIcon(lockToggle,playerLocked?'unlock':'lock');
  lockToggle.setAttribute('aria-pressed',String(playerLocked));
  setIcon(inlineLock,playerLocked?'unlock':'lock');
  inlineLock.title=label;inlineLock.setAttribute('aria-label',label);
  inlineLock.setAttribute('aria-pressed',String(playerLocked));
}
function updateVolumeIcon(){
  const value=Number(volumeSlider.value);
  setIcon(volumeIcon,value===0?'vol-mute':value<50?'vol-low':'vol-high');
  setFill(volumeSlider);
}
function updatePlayButton(){
  setIcon(playToggle,isPlaying?'pause':'play');
  playToggle.title=isPlaying?'Tạm dừng':'Tiếp tục';
  playToggle.setAttribute('aria-label',isPlaying?'Tạm dừng':'Tiếp tục');
}
function formatTime(seconds){if(!Number.isFinite(seconds)||seconds<0)return'0:00';const total=Math.floor(seconds);const mins=Math.floor(total/60);const secs=String(total%60).padStart(2,'0');return mins>=60?Math.floor(mins/60)+':'+String(mins%60).padStart(2,'0')+':'+secs:mins+':'+secs;}

/* ---------- Điều khiển trình phát ---------- */
function sendPlayerCommand(command,args=[]){
  const frame=pipFrame||(inlineActive?inlineFrame:null);
  if(frame?.contentWindow)frame.contentWindow.postMessage({type:'gon-command',func:command,args},location.origin);
}
function setPlaying(value){isPlaying=Boolean(value);updatePlayButton();if('mediaSession'in navigator)navigator.mediaSession.playbackState=isPlaying?'playing':'paused';sendPlayerCommand(isPlaying?'playVideo':'pauseVideo');}
function updateTimeline(currentTime,duration){
  videoDuration=Number(duration)||0;
  const durationText=videoDuration>0?formatTime(videoDuration):'--:--';
  if(durationText!==lastDurationText){lastDurationText=durationText;durationLabel.textContent=durationText;}
  const noDuration=videoDuration<=0;
  if(seekSlider.disabled!==noDuration)seekSlider.disabled=noDuration;
  if(isSeeking||performance.now()<seekHoldUntil)return;
  const current=Math.max(0,Number(currentTime)||0);
  const value=videoDuration>0?String(Math.round(current/videoDuration*1000)):'0';
  if(seekSlider.value!==value){seekSlider.value=value;setFill(seekSlider);}
  const timeText=formatTime(current);
  if(timeText!==lastTimeText){lastTimeText=timeText;currentTimeLabel.textContent=timeText;}
}
function applyLockToSurface(){
  const pointerEvents=playerLocked?'none':'';
  if(pipFrame)pipFrame.style.pointerEvents=pointerEvents;
  if(inlineFrame)inlineFrame.style.pointerEvents=pointerEvents;
}
function setPlayerLocked(value){
  playerLocked=Boolean(value);
  updateLockButtons();
  applyLockToSurface();
  sendPlayerCommand('setLocked',[playerLocked]);
}
function applyTransparency(value){
  const percent=Number(value);
  const opacity=String(1-percent/100);
  transparencyValue.textContent=percent+'%';
  setFill(transparencySlider);
  if(pipFrame)pipFrame.style.opacity=opacity;
  if(inlineFrame)inlineFrame.style.opacity=opacity;
}
try{
  const saved=localStorage.getItem('gon-video-transparency');
  if(saved!==null&&Number.isFinite(Number(saved)))transparencySlider.value=saved;
}catch{}
transparencySlider.addEventListener('input',()=>applyTransparency(transparencySlider.value));
transparencySlider.addEventListener('change',()=>{try{localStorage.setItem('gon-video-transparency',transparencySlider.value);}catch{}});
applyTransparency(transparencySlider.value);
updateLockButtons();updatePlayButton();updateVolumeIcon();setFill(seekSlider);

function openTikTokBrowseWindow(){
  const popup=window.open('https://www.tiktok.com/','_blank','popup=yes,width=420,height=760,resizable=yes,scrollbars=yes,noreferrer');
  if(popup){
    try{popup.focus();}catch{}
    setText(statusText,'TikTok đã mở trong cửa sổ dọc nhỏ. Kéo viền cửa sổ để đổi kích thước.');
    return true;
  }
  setText(statusText,'Trình duyệt đã chặn cửa sổ bật lên. Hãy cho phép pop-up cho trang này rồi thử lại.');
  return false;
}
document.querySelector('#open-tiktok').addEventListener('click',event=>{
  event.preventDefault();
  openTikTokBrowseWindow();
});

/* ---------- Nhận link YouTube và TikTok ---------- */
function isTikTokHome(value){
  try{const url=new URL(value.trim());return url.hostname.toLowerCase().replace(/^www\./,'')==='tiktok.com'&&url.pathname==='/';}catch{return false;}
}
function tiktokVideoFromUrl(url){
  const host=url.hostname.toLowerCase().replace(/^www\./,'');
  if(host!=='tiktok.com'&&!host.endsWith('.tiktok.com'))return null;
  const match=url.pathname.match(/^\/(?:@[^/]+\/video\/|player\/v1\/)(\d+)/i);
  if(match)return {platform:'tiktok',id:match[1],list:'',embedUrl:new URL('/player/v1/'+match[1],'https://www.tiktok.com')};
  const profile=url.pathname.match(/^\/@([A-Za-z0-9._]+)\/?$/);
  if(profile)return {platform:'tiktok-profile',id:'',username:profile[1],list:'',embedUrl:url};
  return null;
}
function videoFromUrl(url){
  const tiktok=tiktokVideoFromUrl(url);
  if(tiktok)return tiktok;
  const host=url.hostname.toLowerCase().replace(/^www\./,'');
  const isYoutube=['youtube.com','youtube-nocookie.com'].some(domain=>host===domain||host.endsWith('.'+domain));
  const copyParams=target=>{for(const key of ['start','end','si','list','index']){const value=url.searchParams.get(key);if(value)target.searchParams.set(key,value)}};
  if(host==='youtu.be'){
    const id=url.pathname.split('/').filter(Boolean)[0];
    if(!id)return null;
    const embedUrl=new URL('/embed/'+id,'https://www.youtube.com');copyParams(embedUrl);
    return {platform:'youtube',id,list:url.searchParams.get('list')||'',embedUrl};
  }
  if(!isYoutube)return null;
  if(url.pathname==='/playlist'){
    const list=url.searchParams.get('list');
    if(!list)return null;
    const id=url.searchParams.get('v')||'';
    const embedUrl=new URL(id?'/embed/'+id:'/embed/videoseries','https://www.youtube.com');
    copyParams(embedUrl);
    return {platform:'youtube',id,list,embedUrl};
  }
  if(url.pathname==='/watch'){
    const id=url.searchParams.get('v')||'';
    const list=url.searchParams.get('list')||'';
    if(!id&&!list)return null;
    const embedUrl=new URL(id?'/embed/'+id:'/embed/videoseries','https://www.youtube.com');copyParams(embedUrl);
    return {platform:'youtube',id,list,embedUrl};
  }
  const match=url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
  if(!match)return null;
  const id=match[1];
  const list=url.searchParams.get('list')||'';
  const embedUrl=new URL(id==='videoseries'?'/embed/videoseries':'/embed/'+id,'https://www.youtube.com');
  copyParams(embedUrl);
  return {platform:'youtube',id:id==='videoseries'?'':id,list,embedUrl};
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
  url.searchParams.set('platform',video.platform||'youtube');
  if(video.id)url.searchParams.set('v',video.id);
  if(video.username)url.searchParams.set('username',video.username);
  if(video.list)url.searchParams.set('list',video.list);
  for(const key of ['start','end','si','list','index']){
    const value=video.embedUrl.searchParams.get(key);
    if(value)url.searchParams.set(key,value);
  }
  return url.toString();
}
function setupMediaSession(){
  if(!('mediaSession'in navigator)||!activeVideo||activeVideo.platform==='tiktok-profile')return;
  try{
    const metadata={title:(activeVideo.platform==='tiktok'?'TikTok':'YouTube')+' video',artist:activeVideo.platform==='tiktok'?'TikTok':'YouTube'};
    if(activeVideo.platform!=='tiktok'&&activeVideo.id)metadata.artwork=[{src:'https://i.ytimg.com/vi/'+activeVideo.id+'/hqdefault.jpg',sizes:'480x360',type:'image/jpeg'}];
    navigator.mediaSession.metadata=new MediaMetadata(metadata);
    navigator.mediaSession.playbackState='playing';
    navigator.mediaSession.setActionHandler('play',()=>setPlaying(true));
    navigator.mediaSession.setActionHandler('pause',()=>setPlaying(false));
    navigator.mediaSession.setActionHandler('stop',()=>setPlaying(false));
  }catch{}
}

/* ---------- Nhận trạng thái từ player.html ---------- */
function receivePlayerState(event){
  const data=event.data;
  if(data?.type!=='gon-player-state')return;
  // player.html gửi cùng một tin tới 2 nơi; bỏ qua bản trùng để khỏi xử lý hai lần
  if(data.sid){
    if(data.sid!==lastSid){lastSid=data.sid;lastSeq=0;}
    if(data.seq<=lastSeq)return;
    lastSeq=data.seq;
  }
  if(playerLocked!==Boolean(data.locked)){playerLocked=Boolean(data.locked);updateLockButtons();}
  if(Number.isFinite(Number(data.duration)))updateTimeline(data.currentTime,data.duration);
  if(data.state===1){
    if(!isPlaying){isPlaying=true;updatePlayButton();}
    if('mediaSession'in navigator)navigator.mediaSession.playbackState='playing';
  }else if(data.state===2||data.state===0||data.autoplayBlocked){
    if(isPlaying){isPlaying=false;updatePlayButton();}
    if('mediaSession'in navigator)navigator.mediaSession.playbackState='paused';
  }
  if(data.autoplayBlocked)setText(pipStatus,'Trình duyệt đã chặn tự phát. Bấm Tiếp tục trên trang chính để phát video.');
  else if(data.error)setText(pipStatus,'Video không cho phép phát nhúng hoặc đã xảy ra lỗi ('+data.error+').');
}
window.addEventListener('message',event=>{
  if(event.source===inlineFrame.contentWindow||event.source===pipFrame?.contentWindow)receivePlayerState(event);
});
function attachPipMessages(){
  pipWindow.addEventListener('message',event=>{
    if(event.source===pipFrame?.contentWindow)receivePlayerState(event);
  });
}

/* ---------- Cửa sổ nổi ---------- */
async function openPictureInPicture(){
  if(!activeVideo)return;
  if(!('documentPictureInPicture'in window)){
    pipStatus.textContent='Cửa sổ nổi cần Chrome hoặc Edge trên máy tính.';
    return;
  }
  try{
    if(!pipWindow||pipWindow.closed){
      pipWindow=await window.documentPictureInPicture.requestWindow({width:activeVideo.platform==='tiktok'?240:activeVideo.platform==='tiktok-profile'?320:360,height:activeVideo.platform==='tiktok'?426:activeVideo.platform==='tiktok-profile'?560:220,disallowReturnToOpener:true});
      pipWindow.document.title='Video — Gọn';
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
    pipFrame.title=(activeVideo.platform==='tiktok'?'TikTok':'YouTube')+' video';
    pipFrame.style.pointerEvents=playerLocked?'none':'';
    pipFrame.referrerPolicy='strict-origin-when-cross-origin';
    pipFrame.allow='autoplay; encrypted-media; picture-in-picture; web-share';
    pipFrame.src=makePlayerUrl(activeVideo);
    applyTransparency(transparencySlider.value);
    pipWindow.document.body.replaceChildren(pipFrame);
    pipStatus.textContent=activeVideo.platform==='tiktok-profile'?'Hồ sơ TikTok đã mở. Cuộn ngang qua các video của creator.':activeVideo.platform==='tiktok'?'TikTok đang phát trong cửa sổ nổi. Video liên quan có thể xuất hiện khi clip kết thúc.':activeVideo.list?'Video tự phát. Các nút điều khiển nằm trên trang chính.':'Video tự phát. Muốn chuyển bài, hãy mở một playlist.';
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
volumeSlider.addEventListener('input',()=>{updateVolumeIcon();sendPlayerCommand('setVolume',[Number(volumeSlider.value)]);});

/* ---------- Thanh tua ---------- */
function queuePreview(time){
  // gộp các lần kéo thanh trượt, tối đa ~8 lệnh/giây để video không bị giật
  pendingPreview=time;
  if(previewTimer)return;
  previewTimer=setTimeout(()=>{
    previewTimer=0;
    if(pendingPreview!==null){sendPlayerCommand('seekToPreview',[pendingPreview]);pendingPreview=null;}
  },120);
}
function endSeeking(){isSeeking=false;}
seekSlider.addEventListener('pointerdown',()=>{isSeeking=true;});
seekSlider.addEventListener('keydown',()=>{isSeeking=true;});
seekSlider.addEventListener('keyup',endSeeking);
window.addEventListener('pointerup',endSeeking);
window.addEventListener('pointercancel',endSeeking);
seekSlider.addEventListener('input',()=>{
  setFill(seekSlider);
  if(videoDuration>0){
    const preview=Number(seekSlider.value)/1000*videoDuration;
    currentTimeLabel.textContent=lastTimeText=formatTime(preview);
    queuePreview(preview);
  }
});
seekSlider.addEventListener('change',()=>{
  if(previewTimer){clearTimeout(previewTimer);previewTimer=0;}
  pendingPreview=null;
  if(videoDuration>0){
    sendPlayerCommand('seekTo',[Number(seekSlider.value)/1000*videoDuration]);
    seekHoldUntil=performance.now()+700; // chờ YouTube tua xong để thanh không nhảy lại vị trí cũ
  }
  isSeeking=false;
});
lockToggle.addEventListener('click',()=>setPlayerLocked(!playerLocked));
inlineLock.addEventListener('click',()=>setPlayerLocked(!playerLocked));

/* ---------- Bắt đầu / dừng ---------- */
function startVideo(value){
  const video=getVideo(value);
  if(!video&&isTikTokHome(value)){
    openTikTokBrowseWindow();
    return;
  }
  if(!video){statusText.textContent='Không nhận ra link. Dùng link YouTube hoặc link TikTok đầy đủ dạng tiktok.com/@ten/video/... hay tiktok.com/@ten.';return;}
  activeVideo=video;
  const isTikTokProfile=video.platform==='tiktok-profile';
  document.querySelector('#track-title').textContent=isTikTokProfile?'TikTok creator':video.platform==='tiktok'?'TikTok video':video.id?'YouTube video':'YouTube playlist';
  document.querySelector('#track-author').textContent=isTikTokProfile?'Cuộn video trong hồ sơ':video.platform==='tiktok'?'Cửa sổ nổi · TikTok':video.list?'Danh sách phát':'Cửa sổ nổi';
  playerLocked=false;isPlaying=!isTikTokProfile;seekHoldUntil=0;updatePlayButton();updateTimeline(0,0);previousButton.disabled=!video.list;nextButton.disabled=!video.list;playToggle.disabled=isTikTokProfile;volumeSlider.disabled=isTikTokProfile;updateVolumeIcon();updateLockButtons();welcome.hidden=true;
  if(appMode){startInline();return;}
  playerView.hidden=false;
  openPictureInPicture();
}
function startInline(){
  inlineActive=true;playerView.hidden=true;
  inlineFrame.src=makePlayerUrl(activeVideo);
  applyLockToSurface();
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
