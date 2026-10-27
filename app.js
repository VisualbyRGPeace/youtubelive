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
const speedControl=document.querySelector('#speed-control');
const speedSelect=document.querySelector('#speed-select');
const youtubeOptions=document.querySelector('#youtube-options');
const captionsToggle=document.querySelector('#captions-toggle');
const volumeIcon=document.querySelector('#volume-icon');
const seekSlider=document.querySelector('#seek-slider');
const currentTimeLabel=document.querySelector('#current-time');
const durationLabel=document.querySelector('#duration');
const lockToggle=document.querySelector('#lock-toggle');
const lockLabel=document.querySelector('#lock-label');
const inlineLock=document.querySelector('#inline-lock');
const transparencySlider=document.querySelector('#transparency-slider');
const transparencyValue=document.querySelector('#transparency-value');
const scaleControl=document.querySelector('#scale-control');
const scaleSlider=document.querySelector('#scale-slider');
const scaleValue=document.querySelector('#scale-value');
const inlinePlayer=document.querySelector('#inline-player');
const inlineFrame=document.querySelector('#inline-frame');
let queue=[],queueIndex=0,lastAdvance=0,pipNav=null;
let feedState={query:'',token:'',loading:false,seen:new Set()};
const feedForm=document.querySelector('#feed-form');
const feedQuery=document.querySelector('#feed-query');
const apiKeyInput=document.querySelector('#api-key');
const apiKeyBox=document.querySelector('#api-key-box');
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
function updateSpeedOptions(rates,currentRate){
  const values=[...new Set((Array.isArray(rates)?rates:[1]).map(Number).filter(rate=>Number.isFinite(rate)&&rate>0))].sort((a,b)=>a-b);
  if(!values.length)values.push(1);
  const key=values.join(',');
  if(speedSelect.dataset.rates!==key){
    speedSelect.replaceChildren(...values.map(rate=>{const option=document.createElement('option');option.value=String(rate);option.textContent=rate+'×';return option;}));
    speedSelect.dataset.rates=key;
  }
  const actual=Number(currentRate);
  if(values.includes(actual))speedSelect.value=String(actual);
  else if(!values.includes(Number(speedSelect.value)))speedSelect.value=String(values.includes(1)?1:values[0]);
  speedSelect.disabled=values.length<2;
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
function scaleFrame(frame,scale,wUnit,hUnit){
  if(!frame)return;
  if(scale>=1){frame.style.width='';frame.style.height='';frame.style.transform='';frame.style.transformOrigin='';return;}
  // render iframe lớn hơn rồi co lại để nội dung TikTok hiện nhỏ hơn nhưng vẫn lấp đầy cửa sổ
  frame.style.width=(100/scale)+wUnit;frame.style.height=(100/scale)+hUnit;
  frame.style.transformOrigin='0 0';frame.style.transform='scale('+scale+')';
}
function applyScale(value=scaleSlider.value){
  const percent=Math.max(40,Math.min(100,Number(value)||100));
  const scale=percent/100;
  scaleValue.textContent=percent+'%';
  setFill(scaleSlider);
  const isTikTok=activeVideo?.platform?.startsWith('tiktok')||activeVideo?.isShort;
  scaleFrame(pipFrame,isTikTok?scale:1,'vw','vh');
  scaleFrame(inlineFrame,isTikTok?scale:1,'%','%');
}
try{
  const savedScale=localStorage.getItem('gon-tiktok-scale');
  if(savedScale!==null&&Number.isFinite(Number(savedScale)))scaleSlider.value=savedScale;
}catch{}
scaleSlider.addEventListener('input',()=>applyScale());
scaleSlider.addEventListener('change',()=>{try{localStorage.setItem('gon-tiktok-scale',scaleSlider.value);}catch{}});
setFill(scaleSlider);
try{
  const saved=localStorage.getItem('gon-video-transparency');
  if(saved!==null&&Number.isFinite(Number(saved)))transparencySlider.value=saved;
}catch{}
transparencySlider.addEventListener('input',()=>applyTransparency(transparencySlider.value));
transparencySlider.addEventListener('change',()=>{try{localStorage.setItem('gon-video-transparency',transparencySlider.value);}catch{}});
applyTransparency(transparencySlider.value);
updateLockButtons();updatePlayButton();updateVolumeIcon();setFill(seekSlider);
try{const savedCaptions=localStorage.getItem('gon-youtube-captions-enabled');if(savedCaptions!==null)captionsToggle.checked=savedCaptions==='1';}catch{}

function openTikTokBrowseWindow(){
  const popup=window.open('https://www.tiktok.com/','_blank','popup=yes,width=400,height=720,resizable=yes,scrollbars=yes,noreferrer');
  if(popup){
    try{popup.focus();}catch{}
    setText(statusText,'TikTok đã mở. Muốn bỏ thanh địa chỉ: trong cửa sổ TikTok bấm ⋮ → Truyền, lưu và chia sẻ → Cài đặt trang dưới dạng ứng dụng. Thu nhỏ/độ trong suốt: dùng nút ◐ của tiện ích (xem README).');
    return true;
  }
  setText(statusText,'Trình duyệt đã chặn cửa sổ bật lên. Hãy cho phép pop-up cho trang này rồi thử lại.');
  return false;
}

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
  return {platform:'youtube',id:id==='videoseries'?'':id,list,embedUrl,isShort:url.pathname.startsWith('/shorts/')};
}
function getVideo(value){
  const text=value.trim();
  const source=text.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  for(const candidate of source?[source[1],text]:[text]){
    try{const video=videoFromUrl(new URL(candidate));if(video)return video;}catch{}
  }
  return null;
}
function parseVideoList(value){
  const tokens=value.trim().split(/\s+|(?=https?:\/\/)/).filter(Boolean);
  if(tokens.length<2)return [];
  return tokens.map(token=>getVideo(token)).filter(Boolean);
}
function stepQueue(direction){
  if(queue.length<2)return;
  queueIndex=(queueIndex+direction+queue.length)%queue.length;
  lastAdvance=performance.now();
  if(feedState.query&&feedState.token&&!feedState.loading&&queueIndex>=queue.length-4)loadMoreFeed();
  beginVideo(queue[queueIndex]);
}
function getPreferredPlaybackRate(){try{const rate=Number(localStorage.getItem('gon-youtube-playback-rate'));return Number.isFinite(rate)&&rate>0?rate:1;}catch{return 1;}}
function makePlayerUrl(video){
  if(video.platform==='tiktok-home')return 'https://www.tiktok.com/';
  const url=new URL('player.html',location.href);
  url.searchParams.set('platform',video.platform||'youtube');
  if((video.platform||'youtube')==='youtube'){
    url.searchParams.set('rate',String(getPreferredPlaybackRate()));
    url.searchParams.set('cc',captionsToggle.checked?'1':'0');
  }
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
  if(!('mediaSession'in navigator)||!activeVideo||activeVideo.platform==='tiktok-profile'||activeVideo.platform==='tiktok-home')return;
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
  if(activeVideo?.platform==='youtube'&&Array.isArray(data.playbackRates))updateSpeedOptions(data.playbackRates,data.playbackRate);
  if(data.state===1){
    if(!isPlaying){isPlaying=true;updatePlayButton();}
    if('mediaSession'in navigator)navigator.mediaSession.playbackState='playing';
  }else if(data.state===0&&queue.length>1&&performance.now()-lastAdvance>1500){
    stepQueue(1);
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

/* ---------- Lướt Shorts theo từ khóa (YouTube Data API) ---------- */
function makeShort(id){return {platform:'youtube',id,list:'',embedUrl:new URL('/embed/'+id,'https://www.youtube.com'),isShort:true};}
function parseIsoDuration(text){
  const m=/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(text||'');
  if(!m)return Infinity;
  return (Number(m[1])||0)*3600+(Number(m[2])||0)*60+(Number(m[3])||0);
}
async function callYouTube(path,params){
  const url=new URL('https://www.googleapis.com/youtube/v3/'+path);
  url.search=new URLSearchParams(params).toString();
  const response=await fetch(url);
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data?.error?.message||('Lỗi '+response.status));
  return data;
}
async function fetchFeedPage(){
  const key=apiKeyInput.value.trim();
  if(!key)throw new Error('Chưa có API key');
  const params={part:'snippet',type:'video',videoDuration:'short',videoEmbeddable:'true',maxResults:'25',q:feedState.query+' #shorts',key};
  if(feedState.token)params.pageToken=feedState.token;
  const found=await callYouTube('search',params);
  feedState.token=found.nextPageToken||'';
  const ids=(found.items||[]).map(item=>item.id?.videoId).filter(id=>id&&!feedState.seen.has(id));
  if(!ids.length)return [];
  const details=await callYouTube('videos',{part:'contentDetails',id:ids.join(','),key});
  const ok=new Set((details.items||[]).filter(item=>parseIsoDuration(item.contentDetails?.duration)<=180).map(item=>item.id));
  return ids.filter(id=>ok.has(id)).map(id=>{feedState.seen.add(id);return makeShort(id);});
}
async function loadMoreFeed(){
  feedState.loading=true;
  try{queue.push(...await fetchFeedPage());}catch{}
  finally{feedState.loading=false;}
}
async function startFeed(query){
  if(!query)return;
  if(!apiKeyInput.value.trim()){
    setText(statusText,'Cần dán API key YouTube ở mục bên dưới (chỉ làm một lần).');
    apiKeyBox.open=true;apiKeyInput.focus();return;
  }
  feedState={query,token:'',loading:true,seen:new Set()};
  queue=[];queueIndex=0;
  setText(statusText,'Đang tải Shorts…');
  // mở cửa sổ nổi ngay trong lúc bấm (cần thao tác người dùng), rồi mới tải danh sách
  if(!appMode&&'documentPictureInPicture'in window){
    welcome.hidden=true;playerView.hidden=false;
    activeVideo={platform:'youtube',id:'',list:'',isShort:true,loading:true};
    await openPictureInPicture();
  }
  try{
    let list=await fetchFeedPage();
    if(!list.length&&feedState.token)list=await fetchFeedPage();
    if(!list.length){setText(statusText,'Không tìm thấy Shorts cho từ khóa này.');pipWindow?.close();welcome.hidden=false;playerView.hidden=true;return;}
    queue=list;queueIndex=0;beginVideo(queue[0]);
  }catch(error){
    setText(statusText,'Không tải được: '+error.message);pipWindow?.close();welcome.hidden=false;playerView.hidden=true;
  }finally{feedState.loading=false;}
}
function buildPipNav(win){
  const doc=win.document;
  const edge=doc.createElement('div');edge.className='gon-edge';
  edge.innerHTML='<button type="button" data-d="-1" aria-label="Clip trước" title="Clip trước">▲</button><button type="button" data-d="1" aria-label="Clip tiếp theo" title="Clip tiếp theo">▼</button>';
  edge.addEventListener('click',event=>{const d=Number(event.target.dataset?.d);if(d)stepQueue(d);});
  let lastWheel=0,startY=null;
  edge.addEventListener('wheel',event=>{event.preventDefault();const now=performance.now();if(now-lastWheel<700)return;lastWheel=now;stepQueue(event.deltaY>0?1:-1);},{passive:false});
  edge.addEventListener('pointerdown',event=>{startY=event.clientY;});
  edge.addEventListener('pointerup',event=>{if(startY===null)return;const dy=event.clientY-startY;startY=null;if(Math.abs(dy)>40)stepQueue(dy<0?1:-1);});
  doc.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'||event.key==='PageDown')stepQueue(1);
    else if(event.key==='ArrowUp'||event.key==='PageUp')stepQueue(-1);
  });
  return edge;
}
try{apiKeyInput.value=localStorage.getItem('gon-yt-api-key')||'';}catch{}
apiKeyInput.addEventListener('change',()=>{try{localStorage.setItem('gon-yt-api-key',apiKeyInput.value.trim());}catch{}});
feedForm.addEventListener('submit',event=>{event.preventDefault();startFeed(feedQuery.value.trim());});

/* ---------- Cửa sổ nổi ---------- */
async function openPictureInPicture(){
  if(!activeVideo)return;
  if(!('documentPictureInPicture'in window)){
    pipStatus.textContent='Cửa sổ nổi cần Chrome hoặc Edge trên máy tính.';
    return;
  }
  try{
    if(!pipWindow||pipWindow.closed){
      pipWindow=await window.documentPictureInPicture.requestWindow({width:activeVideo.isShort?270:activeVideo.platform==='tiktok'?240:activeVideo.platform==='tiktok-profile'?320:activeVideo.platform==='tiktok-home'?360:360,height:activeVideo.isShort?480:activeVideo.platform==='tiktok'?426:activeVideo.platform==='tiktok-profile'?560:activeVideo.platform==='tiktok-home'?640:220,disallowReturnToOpener:true});
      pipWindow.document.title='Video — Gọn';
      const style=pipWindow.document.createElement('style');
      style.textContent='html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}iframe{display:block;width:100vw;height:100vh;border:0}body{color:#aaa;font:13px system-ui,sans-serif;display:grid;place-items:center;text-align:center}.gon-edge{position:fixed;right:0;top:0;bottom:0;width:38px;z-index:5;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:10px;touch-action:none}.gon-edge button{width:30px;height:30px;border:0;border-radius:50%;background:#000a;color:#fff;font-size:12px;cursor:pointer;opacity:0;transition:opacity .2s}body:hover .gon-edge button{opacity:.85}';
      pipWindow.document.head.append(style);
      pipNav=buildPipNav(pipWindow);
      attachPipMessages();
      pipWindow.addEventListener('pagehide',()=>{
        pipWindow=null;pipFrame=null;pipNav=null;playerLocked=false;updateLockButtons();
        pipStatus.textContent='Cửa sổ nổi đã đóng. Dán link khác hoặc mở lại video.';
        if('mediaSession'in navigator)navigator.mediaSession.playbackState='paused';
      });
    }
    if(activeVideo.loading){pipWindow.document.body.replaceChildren('Đang tải Shorts…',...(pipNav?[pipNav]:[]));return;}
    pipFrame=pipWindow.document.createElement('iframe');
    pipFrame.title=(activeVideo.platform.startsWith('tiktok')?'TikTok':'YouTube')+' video';
    pipFrame.style.pointerEvents=playerLocked?'none':'';
    pipFrame.referrerPolicy='strict-origin-when-cross-origin';
    pipFrame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture; web-share';
    pipFrame.src=makePlayerUrl(activeVideo);
    pipWindow.document.body.replaceChildren(pipFrame,...(pipNav?[pipNav]:[]));
    applyTransparency(transparencySlider.value);
    applyScale();
    pipStatus.textContent=activeVideo.platform==='tiktok-home'?'Đang tải bảng tin TikTok. Nếu cửa sổ trống hoặc báo từ chối kết nối, hãy cài/tải lại tiện ích Gọn (thư mục tiktok-overlay-extension) hoặc dùng nút TikTok popup.':activeVideo.platform==='tiktok-profile'?'Hồ sơ TikTok đã mở. Cuộn ngang qua các video của creator.':activeVideo.platform==='tiktok'?'TikTok đang phát trong cửa sổ nổi. Video liên quan có thể xuất hiện khi clip kết thúc.':activeVideo.list?'Video tự phát. Các nút điều khiển nằm trên trang chính.':'Video tự phát. Muốn chuyển bài, hãy mở một playlist.';
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
previousButton.addEventListener('click',()=>{if(queue.length>1)stepQueue(-1);else sendPlayerCommand('previousVideo');});
nextButton.addEventListener('click',()=>{if(queue.length>1)stepQueue(1);else sendPlayerCommand('nextVideo');});
volumeSlider.addEventListener('input',()=>{updateVolumeIcon();sendPlayerCommand('setVolume',[Number(volumeSlider.value)]);});
speedSelect.addEventListener('change',()=>{
  const rate=Number(speedSelect.value)||1;
  try{localStorage.setItem('gon-youtube-playback-rate',String(rate));}catch{}
  sendPlayerCommand('setPlaybackRate',[rate]);
});
captionsToggle.addEventListener('change',()=>{
  try{localStorage.setItem('gon-youtube-captions-enabled',captionsToggle.checked?'1':'0');}catch{}
  sendPlayerCommand('setCaptions',[captionsToggle.checked]);
});
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
  feedState={query:'',token:'',loading:false,seen:new Set()};
  const many=parseVideoList(value);
  if(many.length>1){queue=many;queueIndex=0;beginVideo(queue[0]);return;}
  queue=[];queueIndex=0;
  const video=getVideo(value);
  if(!video&&isTikTokHome(value)){
    openTikTokBrowseWindow();
    return;
  }
  if(!video){statusText.textContent='Không nhận ra link. Dùng link YouTube hoặc link TikTok đầy đủ dạng tiktok.com/@ten/video/... hay tiktok.com/@ten.';return;}
  beginVideo(video);
}
/* Bảng tin TikTok trong cửa sổ nổi (cần tiện ích Gọn để gỡ chặn nhúng của TikTok) */
function openTikTokFeed(){
  // Mở trang bệ phóng nhỏ của tiện ích; bấm "Ghim TikTok" ở đó để có cửa sổ nổi luôn trên cùng
  const popup=window.open('https://www.tiktok.com/robots.txt','_blank','popup=yes,width=340,height=190,resizable=yes');
  if(popup){try{popup.focus();}catch{}setText(statusText,'Đã mở cửa sổ ghim. Bấm nút "Ghim TikTok" trong đó (cần cài tiện ích Gọn).');return;}
  setText(statusText,'Trình duyệt đã chặn cửa sổ bật lên. Hãy cho phép pop-up cho trang này rồi thử lại.');
}
function beginVideo(video){
  activeVideo=video;
  const isTikTokProfile=video.platform==='tiktok-profile'||video.platform==='tiktok-home';
  document.querySelector('#track-title').textContent=video.platform==='tiktok-home'?'TikTok':video.platform==='tiktok-profile'?'TikTok creator':video.platform==='tiktok'?'TikTok video':video.isShort?'YouTube Shorts':video.id?'YouTube video':'YouTube playlist';
  document.querySelector('#track-author').textContent=video.platform==='tiktok-home'?'Lướt bảng tin trong cửa sổ nổi':video.platform==='tiktok-profile'?'Cuộn video trong hồ sơ':video.platform==='tiktok'?'Cửa sổ nổi · TikTok':video.isShort?'Cửa sổ nổi dọc':video.list?'Danh sách phát':'Cửa sổ nổi';
  if(queue.length>1)document.querySelector('#track-author').textContent+=' · '+(queueIndex+1)+'/'+queue.length;
  playerLocked=false;isPlaying=!isTikTokProfile;seekHoldUntil=0;updatePlayButton();updateTimeline(0,0);previousButton.disabled=!(video.list||queue.length>1);nextButton.disabled=!(video.list||queue.length>1);playToggle.disabled=isTikTokProfile;volumeSlider.disabled=isTikTokProfile;speedControl.hidden=video.platform!=='youtube';youtubeOptions.hidden=video.platform!=='youtube';scaleControl.hidden=!(video.platform.startsWith('tiktok')||video.isShort);speedSelect.disabled=false;updateVolumeIcon();updateLockButtons();welcome.hidden=true;
  if(appMode){startInline();return;}
  playerView.hidden=false;
  openPictureInPicture();
}
function startInline(){
  inlineActive=true;playerView.hidden=true;
  inlineFrame.src=makePlayerUrl(activeVideo);
  applyLockToSurface();
  applyTransparency(transparencySlider.value);
  applyScale();
  inlinePlayer.hidden=false;setupMediaSession();
}
function stopInline(){
  queue=[];queueIndex=0;inlineActive=false;inlineFrame.src='about:blank';inlinePlayer.hidden=true;
  playerLocked=false;updateLockButtons();welcome.hidden=false;urlInput.focus();
}
document.querySelector('#inline-back').addEventListener('click',stopInline);
loadForm.addEventListener('submit',event=>{event.preventDefault();startVideo(urlInput.value);});
urlInput.addEventListener('paste',event=>{
  const text=event.clipboardData?.getData('text')?.trim()||'';
  if(!getVideo(text)&&parseVideoList(text).length<2)return;
  event.preventDefault();urlInput.value=text;startVideo(text);
});
document.querySelector('#back-button').addEventListener('click',()=>{
  queue=[];queueIndex=0;pipWindow?.close();playerView.hidden=true;welcome.hidden=false;urlInput.focus();
});
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  const button=document.querySelector('#install-button');button.hidden=false;
  button.addEventListener('click',async()=>{event.prompt();await event.userChoice;},{once:true});
});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').then(registration=>registration.update()).catch(()=>{}));
