// Health Tracker UI. Data is saved on this device first (store.js) and copied to the
// user's own Google Drive (drive.js). Nothing personal lives in this code.
import * as store from './store.js';
import * as drive from './drive.js';
import * as ai from './ai.js';

const MEALS=[['breakfast','Breakfast','green'],['lunch','Lunch','blue'],['dinner','Dinner','yellow'],['snacks','Snacks','grey']];
const WTYPES=['Walk','Run','Cycling','Strength','Yoga','Swim','HIIT','Sports'];
const DRAFT_IDS=['wkg','wnote','wtype','wmin','wwnote','goal','sscore','sh','sm','swake','wgoal','wcustom','setname'];
const WATER_DEFAULT=4000,WATER_STEP=250,FIBER_REF=30;
const $=id=>document.getElementById(id);
const nf0=new Intl.NumberFormat('en-GB',{maximumFractionDigits:0});
const nf1=new Intl.NumberFormat('en-GB',{maximumFractionDigits:1});
const nf2=new Intl.NumberFormat('en-GB',{maximumFractionDigits:2});
const r1=n=>Math.round(n*10)/10;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const clone=o=>JSON.parse(JSON.stringify(o));
const plural=(l,n)=>n===1?l:(/s$/.test(l)?l:l+'s');
const litres=ml=>nf2.format(ml/1000);

const ICON={
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  bowl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.5 1-2 1-3.5M13 7c0-1.5 1-2 1-3.5"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/></svg>',
  apple:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7c-1.5-1-5-1.2-6 2.5-1 3.8 1.5 10 4 10 1 0 1.3-.5 2-.5s1 .5 2 .5c2.5 0 5-6.2 4-10C17 5.8 13.5 6 12 7z"/><path d="M12 7c0-2 1-3.5 2.5-4"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M13 3L5 13h6l-1 8 8-10h-6z"/></svg>',
  scale:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 10a3 3 0 0 1 6 0M12 10l1.2-1.6"/></svg>',
  drop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8.5 12.5L12 16l3.5-3.5"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 16V8M8.5 11.5L12 8l3.5 3.5"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.5 6l-6 6 6 6"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.5 6l6 6-6 6"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
  trend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15l4-4 3 3 6-7"/><path d="M14 7h4v4"/></svg>'
};

function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function todayStr(){return ymd(new Date())}
function parse(s){const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])}
function addDays(s,n){const d=parse(s);d.setDate(d.getDate()+n);return ymd(d)}
function fmtDay(s){return parse(s).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
function fmtLong(s){return parse(s).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
function fmtShort(s){return parse(s).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
function fmtDur(m){return Math.floor(m/60)+'h '+(m%60)+'m'}
function monday(s){const d=parse(s),k=(d.getDay()+6)%7;return addDays(s,-k)}

const state={foods:{},days:{},settings:{},loaded:{foods:false,days:false,settings:false},view:'today',date:todayStr(),demo:false,sheet:null,goalEdit:false,waterEdit:false,confirmDel:null,foodQuery:'',draft:{},undo:null,sync:{status:'idle',pending:0,last:null,error:null},photoTarget:null,viewer:null,hasKey:false,open:{},weightEdit:false};

const emptyDay=date=>({date:date,entries:[],workouts:[],weight:null,sleep:null,water:0,photos:[]});
const getDay=date=>{const d=state.days[date];if(!d)return emptyDay(date);return Object.assign({entries:[],workouts:[],weight:null,water:0,photos:[]},d)};
const waterGoal=()=>Number(state.settings.waterGoalMl)||WATER_DEFAULT;
const waterOf=day=>Number(day.water)||0;
function totals(day){const t={kcal:0,p:0,c:0,f:0,fi:0};for(const e of day.entries){t.kcal+=e.kcal||0;t.p+=e.p||0;t.c+=e.c||0;t.f+=e.f||0;t.fi+=e.fi||0}return t}
function calc(food,amount){const k=amount/100,p=food.per100;return{kcal:r1(p.kcal*k),p:r1(p.p*k),c:r1(p.c*k),f:r1(p.f*k),fi:r1(p.fi*k)}}
function hasData(d){return !!d&&(d.entries&&d.entries.length||d.workouts&&d.workouts.length||d.weight||d.sleep||waterOf(d)>0||d.photos&&d.photos.length)}

/* ---------- persistence: device first, then Google Drive ---------- */
const queues={};
function enqueue(key,fn){
  if(state.demo)return;
  queues[key]=(queues[key]||Promise.resolve()).then(fn).then(scheduleSync).catch(()=>{toast('Could not save that change on this device. Try again.')});
}
function persistDay(date){
  enqueue('d:'+date,()=>{const d=state.days[date];return store.setRecord('days/'+date,hasData(d)?d:null)});
}
function mutateDay(date,fn){const d=clone(getDay(date));fn(d);state.days[date]=d;renderMain();persistDay(date)}
function persistFood(id){
  enqueue('f:'+id,()=>store.setRecord('foods/'+id,state.foods[id]||null));
}
function setSetting(key,v){
  const s=Object.assign({},state.settings,{v:1});
  if(v)s[key]=v;else delete s[key];
  state.settings=s;
  enqueue('s',()=>store.setRecord('settings/main',s));
}

let syncTimer=null,syncing=false,syncAgain=false;
function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(runSync,1500)}
async function refreshPending(){if(!state.demo){state.sync.pending=await store.pendingCount();renderHeader()}}
async function runSync(){
  await refreshPending();
  if(state.demo||!drive.configured()||!drive.connected()||!drive.token()||!navigator.onLine)return;
  if(syncing){syncAgain=true;return}
  syncing=true;state.sync.status='busy';renderHeader();
  try{
    const pulled=await drive.sync();
    state.sync.status='ok';state.sync.last=Date.now();state.sync.error=null;
    if(pulled){Object.assign(state,await store.loadState());renderMain()}
  }catch(e){
    state.sync.status=e instanceof drive.AuthError?'auth':'error';state.sync.error=e.message;
  }finally{
    syncing=false;await refreshPending();
    if(state.sheet&&state.sheet.mode==='settings')renderSheet();
    if(syncAgain){syncAgain=false;scheduleSync()}
  }
}

/* ---------- photos ---------- */
const photoUrls={};
async function shrinkPhoto(file){
  // Re-drawing on a canvas resizes the photo and drops its EXIF data, including GPS location.
  let bmp;
  try{bmp=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){bmp=await createImageBitmap(file)}
  const s=Math.min(1,1600/Math.max(bmp.width,bmp.height));
  const c=document.createElement('canvas');c.width=Math.round(bmp.width*s);c.height=Math.round(bmp.height*s);
  c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('encode')),'image/jpeg',0.82));
}
// The profile picture is a small image kept in settings, so it syncs through Drive like the name.
const avatarSrc=()=>{const a=state.settings.avatar;return typeof a==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(a)?a:null};
async function setAvatar(file){
  if(!file)return;
  try{
    let bmp;
    try{bmp=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){bmp=await createImageBitmap(file)}
    const side=Math.min(bmp.width,bmp.height),c=document.createElement('canvas');c.width=c.height=160;
    c.getContext('2d').drawImage(bmp,(bmp.width-side)/2,(bmp.height-side)/2,side,side,0,0,160,160);
    setSetting('avatar',c.toDataURL('image/png'));
    renderHeader();renderSheet();toast('Picture saved');
  }catch(e){toast('That picture could not be opened.')}
}
async function addPhoto(file){
  const t=state.photoTarget;state.photoTarget=null;
  if(!t||!file)return;
  if(state.demo){toast('Photos are not saved in demo mode.');return}
  try{
    const blob=await shrinkPhoto(file),id=uid(),name=t.date+'-'+t.kind+'-'+id+'.jpg';
    await store.put('photos',id,{name:name,blob:blob,driveId:null,deleted:false});
    photoUrls[id]=URL.createObjectURL(blob);
    if(t.kind!=='progress')state.open[t.kind]=true;
    mutateDay(t.date,x=>{x.photos=(x.photos||[]).concat({id:id,kind:t.kind,name:name})});
    if(t.kind!=='progress'&&state.hasKey)readPhoto(t.date,id);
    else toast(t.kind==='progress'||state.hasKey?'Photo added':'Photo saved. Add a Claude API key in Settings to log calories from photos.');
  }catch(e){toast('Could not read that photo. Try another one.')}
}
async function removePhoto(date,id){
  const day=getDay(date),p=(day.photos||[]).find(x=>x.id===id);
  if(!p)return;
  mutateDay(date,x=>{x.photos=(x.photos||[]).filter(y=>y.id!==id)});
  if(state.demo)return;
  const cur=await store.get('photos',id);
  await store.put('photos',id,{name:p.name,blob:null,driveId:cur?cur.driveId:null,deleted:true});
  if(photoUrls[id]){URL.revokeObjectURL(photoUrls[id]);delete photoUrls[id]}
  scheduleSync();
}
async function photoBlob(p){
  const cur=await store.get('photos',p.id);
  if(cur&&cur.blob)return cur.blob;
  if(drive.token()&&navigator.onLine){try{return await drive.fetchPhoto(p.id,p.name)}catch(e){return null}}
  return null;
}
const reading=new Set();
function setPhotoAi(date,id,v){mutateDay(date,x=>{x.photos=(x.photos||[]).map(y=>y.id===id?Object.assign({},y,{ai:v}):y)})}
async function readPhoto(date,id){
  const p=(getDay(date).photos||[]).find(x=>x.id===id);
  if(!p||reading.has(id))return;
  reading.add(id);renderMain();
  try{
    const blob=await photoBlob(p);
    if(!blob)throw new ai.ReadError('This photo is not on this phone yet. Sync, then try again.');
    const mealName=(MEALS.find(m=>m[0]===p.kind)||[0,'meal'])[1].toLowerCase();
    const res=await ai.readMeal(blob,mealName,state.foods);
    const items=res.items.filter(it=>it&&it.name&&isFinite(it.kcal)&&it.kcal>=0);
    if(!items.length){setPhotoAi(date,id,'none');toast(res.note||'No food found in that photo.');return}
    const added=items.map(it=>({id:uid(),meal:p.kind,foodId:it.food_id&&state.foods[it.food_id]?it.food_id:null,name:String(it.name).slice(0,60),amount:r1(nz(it.amount)),unit:it.unit==='ml'?'ml':'g',kcal:r1(nz(it.kcal)),p:r1(nz(it.protein_g)),c:r1(nz(it.carbs_g)),f:r1(nz(it.fat_g)),fi:r1(nz(it.fiber_g)),photoId:id}));
    mutateDay(date,x=>{x.entries=x.entries.concat(added);x.photos=(x.photos||[]).map(y=>y.id===id?Object.assign({},y,{ai:'done'}):y)});
    const kc=added.reduce((a,e)=>a+e.kcal,0),ids=added.map(e=>e.id);
    toast('Added '+added.length+(added.length===1?' item, ':' items, ')+nf0.format(kc)+' kcal',()=>mutateDay(date,x=>{x.entries=x.entries.filter(e=>ids.indexOf(e.id)<0);x.photos=(x.photos||[]).map(y=>y.id===id?Object.assign({},y,{ai:'undone'}):y)}));
  }catch(e){
    setPhotoAi(date,id,'failed');
    toast(e instanceof ai.ReadError?e.message:'Could not read that photo. Try again.');
  }finally{reading.delete(id);renderMain()}
}
async function photoUrl(p){
  if(photoUrls[p.id])return photoUrls[p.id];
  let blob=null;
  const cur=await store.get('photos',p.id);
  if(cur&&cur.blob)blob=cur.blob;
  else if(drive.token()&&navigator.onLine){try{blob=await drive.fetchPhoto(p.id,p.name)}catch(e){blob=null}}
  if(!blob)return null;
  return photoUrls[p.id]=URL.createObjectURL(blob);
}
function hydratePhotos(){
  document.querySelectorAll('img[data-photo]:not([src])').forEach(async img=>{
    const u=await photoUrl({id:img.dataset.photo,name:img.dataset.name});
    if(u&&img.isConnected){img.src=u;const w=img.parentNode.querySelector('.wait');if(w)w.remove()}
    else if(img.isConnected){const w=img.parentNode.querySelector('.wait');if(w)w.textContent=drive.connected()?'Syncs later':'Not here'}
  });
}
function photoStrip(date,kind,label){
  const ps=(getDay(date).photos||[]).filter(p=>p.kind===kind);
  if(!ps.length)return '';
  return '<div class="photos">'+ps.map((p,i)=>{
    const confirm=state.confirmDel==='ph:'+p.id;
    const busy=reading.has(p.id),canRead=kind!=='progress'&&state.hasKey&&!busy&&p.ai!=='done';
    return '<div class="ph"><img data-photo="'+esc(p.id)+'" data-name="'+esc(p.name)+'" alt="'+esc(label)+' photo '+(i+1)+'"><span class="wait">Loading</span><button class="open" data-act="viewphoto" data-id="'+esc(p.id)+'" aria-label="Open '+esc(label)+' photo '+(i+1)+'"></button>'+(busy?'<span class="busy" role="status">Reading…</span>':'')+(canRead?'<button class="read" data-act="readphoto" data-id="'+esc(p.id)+'">'+(p.ai==='failed'?'Retry':'Read')+'</button>':'')+'<button class="x" data-act="rmphoto" data-id="'+esc(p.id)+'" aria-label="'+(confirm?'Tap again to delete':'Delete')+' '+esc(label)+' photo '+(i+1)+'">'+(confirm?'✓':'×')+'</button></div>';
  }).join('')+'</div>';
}
function cameraBtn(kind,label){return '<button class="camera" data-act="photo" data-kind="'+kind+'" aria-label="Add a '+esc(label)+' photo">'+ICON.camera+'</button>'}
function renderViewer(){
  const el=$('viewer');
  if(!state.viewer){el.hidden=true;el.innerHTML='';return}
  el.hidden=false;
  el.innerHTML='<div class="viewer" data-act="closeviewer" role="dialog" aria-modal="true" aria-label="Photo"><img alt="Photo" src="'+esc(photoUrls[state.viewer]||'')+'"><button class="x" data-act="closeviewer" aria-label="Close">×</button></div>';
}

/* ---------- export and import ---------- */
function exportAll(){
  const data={format:'health-tracker-export/1',exportedAt:new Date().toISOString(),days:state.days,foods:state.foods,settings:state.settings};
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));
  a.download='health-tracker-export-'+todayStr()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  toast('Export saved. Photos stay in your Drive.');
}
async function importFile(file){
  if(state.demo){toast('Import is off in demo mode.');return}
  try{
    const data=JSON.parse(await file.text());
    if(!data||typeof data!=='object'||(!data.days&&!data.foods))throw new Error('format');
    let n=0;
    for(const d of Object.keys(data.days||{})){if(/^\d{4}-\d{2}-\d{2}$/.test(d)){state.days[d]=data.days[d];await store.setRecord('days/'+d,data.days[d]);n++}}
    for(const id of Object.keys(data.foods||{})){state.foods[id]=data.foods[id];await store.setRecord('foods/'+id,data.foods[id])}
    if(data.settings&&typeof data.settings==='object'){state.settings=Object.assign({},state.settings,data.settings);await store.setRecord('settings/main',state.settings)}
    renderAll();scheduleSync();
    toast('Imported '+n+(n===1?' day':' days')+' and '+Object.keys(data.foods||{}).length+' foods');
  }catch(e){toast('That file is not a Health Tracker export.')}
}

/* ---------- pieces ---------- */
const notice='<div class="banner" role="status">Demo mode with invented data. Nothing you change here is saved. <a href="./">Open the real app</a></div>';

function entryRow(e){
  const amt=(e.unit==='serving'?'Quick add':nf1.format(e.amount)+' '+esc(e.unit))+(e.photoId?' · from photo':'');
  return '<div class="entry"><div class="nm">'+esc(e.name)+'<div class="amt">'+amt+'</div></div><span class="kc">'+nf0.format(e.kcal)+'<small> kcal</small></span><button class="x" data-act="rmentry" data-id="'+esc(e.id)+'" aria-label="Remove '+esc(e.name)+'">×</button></div>';
}

function ring(kc,goal){
  const pct=goal?Math.min(1,kc/goal):0,arc=83.33;
  return '<div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="inner" cx="60" cy="60" r="36"/><circle class="track" cx="60" cy="60" r="50" fill="none" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="'+arc+' 100" transform="rotate(120 60 60)"/><circle class="fill" cx="60" cy="60" r="50" fill="none" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="'+(pct>0?Math.max(.5,arc*pct):0)+' 100" transform="rotate(120 60 60)"/></svg><div class="c"><b>'+nf0.format(kc)+'</b><span>kcal eaten</span></div></div>';
}

function weekStrip(){
  const start=monday(state.date),today=todayStr();
  let h='<div class="weekhead"><h2>Week of '+fmtShort(start)+'</h2><div class="nav"><button class="round" data-act="week" data-n="-7" aria-label="Previous week">'+ICON.left+'</button><button class="round" data-act="week" data-n="7" aria-label="Next week">'+ICON.right+'</button></div></div><div class="week">';
  for(let i=0;i<7;i++){
    const d=addDays(start,i),dt=parse(d);
    const lab=dt.toLocaleDateString('en-GB',{weekday:'narrow'});
    h+='<button class="wd'+(d===today?' today':'')+'" data-act="pick" data-d="'+d+'"'+(d===state.date?' aria-current="date"':'')+' aria-label="'+fmtLong(d)+'"><span class="l">'+lab+'</span><span class="p"><span class="dot'+(hasData(state.days[d])?' on':'')+'"></span><span class="d">'+dt.getDate()+'</span></span></button>';
  }
  return h+'</div>';
}

function weightInfo(){
  const pts=weightPts();
  if(!pts.length)return null;
  const last=pts[pts.length-1],win=pts.filter(p=>p.d>=addDays(todayStr(),-29));
  const ch=win.length>=2?win[win.length-1].kg-win[0].kg:null;
  return {last:last,ch:ch,base:win.length?win[0].kg:null};
}

function waterCard(day){
  const ml=waterOf(day),goal=waterGoal(),pct=Math.min(1,ml/goal);
  const start=monday(state.date);
  let bars='';
  for(let i=0;i<7;i++){
    const d=addDays(start,i),w=waterOf(getDay(d));
    bars+='<div class="wbar'+(d===state.date?' on':'')+'"><span>'+parse(d).toLocaleDateString('en-GB',{weekday:'narrow'})+'</span><i><b style="height:'+Math.round(Math.min(1,w/goal)*100)+'%"></b></i></div>';
  }
  const glasses=Math.round(goal/WATER_STEP),filled=Math.floor(ml/WATER_STEP);
  let g='';for(let i=0;i<Math.min(glasses,24);i++)g+='<i'+(i<filled?' class="f"':'')+'></i>';
  const left=goal-ml;
  let h='<section class="tile blue water" aria-labelledby="wtitle"><div class="wtop"><div><div class="tlabel" id="wtitle">Water</div><div class="amount num">'+litres(ml)+'<small> L</small></div><div class="goal">'+(left>0?litres(left)+' L to go of '+litres(goal)+' L':'Goal of '+litres(goal)+' L reached')+'</div></div><div class="wbars" role="img" aria-label="Water this week against your '+litres(goal)+' litre goal">'+bars+'</div></div>';
  h+='<div class="glass" role="img" aria-label="'+filled+' of '+glasses+' glasses of 250 ml">'+g+'</div>';
  h+='<div class="wact"><button class="pill" data-act="water" data-ml="-250" aria-label="Remove 250 ml"'+(ml<=0?' disabled':'')+'>'+ICON.minus+'</button><button class="pill dark" data-act="water" data-ml="250">'+ICON.plus+'250 ml</button><button class="pill" data-act="water" data-ml="500">'+ICON.plus+'500 ml</button><button class="link" data-act="wateredit">'+(state.waterEdit?'Close':'More')+'</button></div>';
  if(state.waterEdit){
    const dv=(id,def)=>esc(id in state.draft?state.draft[id]:def);
    h+='<div class="inline stack" style="gap:10px"><form class="stackf" data-submit="watercustom"><div class="grid2"><div class="field"><label for="wcustom">Add a custom amount (ml)</label><input id="wcustom" type="number" inputmode="numeric" min="10" max="3000" step="10" placeholder="330" value="'+dv('wcustom','')+'"></div><div class="field"><label for="wgoal">Daily goal (L)</label><input id="wgoal" type="number" inputmode="decimal" min="0.5" max="10" step="0.25" value="'+dv('wgoal',goal/1000)+'"></div></div><div class="actions"><button class="btn" type="submit">Save</button>'+(ml>0?'<button class="link" type="button" data-act="waterreset">Reset today to 0</button>':'')+'</div></form></div>';
  }
  return h+'</section>';
}

function macroPills(t,goal){
  const kc=t.kcal,mp=t.p*4,mc=t.c*4,mf=t.f*9,ms=mp+mc+mf,pc=x=>ms?Math.round(x/ms*100)+'% of calories':'';
  const items=[
    ['Calories',nf0.format(kc)+' kcal',goal?'of '+nf0.format(goal):'',goal?kc/goal:0,'cal'],
    ['Protein',nf1.format(t.p)+' g',pc(mp),ms?mp/ms:0,'p'],
    ['Carbs',nf1.format(t.c)+' g',pc(mc),ms?mc/ms:0,'c'],
    ['Fat',nf1.format(t.f)+' g',pc(mf),ms?mf/ms:0,'f'],
    ['Fiber',nf1.format(t.fi)+' g','of '+FIBER_REF+' g',t.fi/FIBER_REF,'fi']
  ];
  return '<section class="tile macros" aria-label="Totals for this day">'+items.map(it=>
    '<div class="mb '+it[4]+'"><div class="mrow"><span class="n">'+it[0]+'</span><span class="v"><b>'+it[1]+'</b>'+(it[2]?' <small>'+it[2]+'</small>':'')+'</span></div><div class="bar" role="presentation"><i style="width:'+Math.round(Math.min(1,it[3])*100)+'%"></i></div></div>'
  ).join('')+'</section>';
}

function mealCard(m,day){
  const es=day.entries.filter(e=>e.meal===m[0]),t=totals({entries:es});
  const icon=m[0]==='breakfast'?ICON.sun:m[0]==='lunch'?ICON.bowl:m[0]==='dinner'?ICON.moon:ICON.apple;
  let h='<section class="tile '+m[2]+' meal"><div class="mh"><span class="ticon" aria-hidden="true">'+icon+'</span><div class="ttl"><h3>'+m[1]+'</h3><small>'+(es.length?nf0.format(t.kcal)+' calories':'Nothing logged yet')+'</small></div>'+cameraBtn(m[0],m[1])+'<button class="plus" data-act="add" data-meal="'+m[0]+'" aria-label="Add food to '+m[1]+'">'+ICON.plus+'</button></div>';
  const ps=(day.photos||[]).filter(p=>p.kind===m[0]),open=!!state.open[m[0]];
  if(es.length){
    h+='<div class="mstats"><div><span>Protein</span><b>'+nf1.format(t.p)+'</b></div><div><span>Fats</span><b>'+nf1.format(t.f)+'</b></div><div><span>Carbs</span><b>'+nf1.format(t.c)+'</b></div><div><span>Fiber</span><b>'+nf1.format(t.fi)+'</b></div></div>';
  }
  if(es.length||ps.length){
    const what=[es.length?es.length+(es.length===1?' item':' items'):'',ps.length?ps.length+(ps.length===1?' photo':' photos'):''].filter(Boolean).join(' · ');
    h+='<button class="more" data-act="togglemeal" data-meal="'+m[0]+'" aria-expanded="'+open+'">'+(open?'Hide':'Show')+' '+what+'<span class="chev'+(open?' up':'')+'" aria-hidden="true">'+ICON.chev+'</span></button>';
    if(open)h+=(es.length?'<div class="entries">'+es.map(entryRow).join('')+'</div>':'')+photoStrip(state.date,m[0],m[1]);
  }
  return h+'</section>';
}

/* ---------- views ---------- */
function viewToday(){
  const date=state.date,day=getDay(date),t=totals(day),ready=state.loaded.days;
  const isToday=date===todayStr(),goal=Number(state.settings.goalKcal)||0;
  const kc=Math.round(t.kcal);
  const dv=(id,def)=>esc(id in state.draft?state.draft[id]:def);
  let h='';
  if(state.demo)h+=notice;
  h+=weekStrip();

  // progress
  const pct=goal?Math.round(kc/goal*100):null;
  h+='<section class="tile blue"><div class="progress"><div><div class="thead" style="justify-content:flex-start;align-items:center;gap:10px"><span class="ticon" aria-hidden="true">'+ICON.trend+'</span><span class="tlabel">Your progress</span></div><div class="pct num">'+(!ready?'…':pct==null?'–':nf0.format(pct)+'<small>%</small>')+'</div><div class="sub">'+(isToday?'Today, ':'')+fmtShort(date)+(goal?' · '+nf0.format(goal)+' kcal goal':'')+'</div></div>'+ring(kc,goal)+'</div>';
  h+='<div class="actions" style="margin-top:6px"><button class="link" data-act="goaledit">'+(goal?'Change calorie goal':'Set a calorie goal')+'</button></div>';
  if(state.goalEdit){
    h+='<form class="stackf" data-submit="savegoal"><div class="field"><label for="goal" style="color:inherit">Daily goal (kcal)</label><input id="goal" type="number" inputmode="numeric" min="500" max="10000" step="10" value="'+dv('goal',goal||'')+'"></div><div class="actions"><button class="btn" type="submit">Save goal</button><button class="btn ghost" type="button" data-act="goaledit">Cancel</button>'+(goal?'<button class="link danger" type="button" data-act="cleargoal">Remove goal</button>':'')+'</div></form>';
  }
  h+='</section>';

  // weight + workouts tiles
  const wi=weightInfo(),wmin=day.workouts.reduce((a,x)=>a+(x.min||0),0);
  h+='<div class="row2"><section class="tile"><div class="thead"><span class="tlabel">Current<br>weight</span><span class="ticon" aria-hidden="true">'+ICON.scale+'</span></div>';
  if(wi){
    h+='<div class="big num">'+nf1.format(wi.last.kg)+'<small class="muted">kg</small></div><div class="delta">'+(wi.ch==null?'Since '+fmtShort(wi.last.d):(wi.ch<=0?ICON.down:ICON.up)+nf1.format(Math.abs(wi.ch))+' kg ('+(wi.ch>0?'+':'−')+nf1.format(Math.abs(wi.ch/wi.base*100))+'%) in 30 days')+'</div>';
  }else h+='<div class="big num muted">–</div><div class="delta">Log a weigh-in below</div>';
  h+='</section><section class="tile"><div class="thead"><span class="tlabel">Workout<br>'+(isToday?'today':'this day')+'</span><span class="ticon" aria-hidden="true">'+ICON.bolt+'</span></div><div class="big num">'+nf0.format(wmin)+'<small class="muted">min</small></div><div class="delta">'+(day.workouts.length?day.workouts.length+(day.workouts.length===1?' session':' sessions'):'Nothing logged yet')+'</div></section></div>';

  // water
  h+=waterCard(day);

  // calories left
  const left=goal?goal-kc:null;
  const mp=t.p*4,mc=t.c*4,mf=t.f*9,ms=mp+mc+mf,cap=Math.max(goal||0,kc,1);
  h+='<section class="tile left"><div class="tlabel">'+(left==null?'Calories eaten':left>=0?'Calories left':'Over your goal by')+'</div><div class="big num">'+nf0.format(left==null?kc:Math.abs(left))+'<small class="muted">kcal</small></div>';
  h+='<div class="seg3" role="img" aria-label="Calories by macro">'+(ms>0?'<i style="width:'+(mp/ms*kc/cap*100)+'%;background:var(--blue-deep)"></i><i style="width:'+(mc/ms*kc/cap*100)+'%;background:var(--green-deep)"></i><i style="width:'+(mf/ms*kc/cap*100)+'%;background:var(--yellow-deep)"></i>':'')+'</div>';
  if(ms>0){
    const pp=Math.round(mp/ms*100),pc=Math.round(mc/ms*100),pf=100-pp-pc;
    h+='<div class="legend"><span><i style="background:var(--blue-deep)"></i>Protein '+pp+'%</span><span><i style="background:var(--green-deep)"></i>Carbs '+pc+'%</span><span><i style="background:var(--yellow-deep)"></i>Fat '+pf+'%</span><span>'+nf0.format(Math.round(t.kcal*4.184))+' kJ</span></div>';
  }else h+='<p class="cap">Add food to a meal below to fill this bar.</p>';
  h+='</section>';

  h+=macroPills(t,goal);

  for(const m of MEALS)h+=mealCard(m,day);

  // weigh-in: one fasted morning reading per day
  const w=day.weight,editing=!w||state.weightEdit;
  h+='<section class="tile grey weigh"><div class="thead"><h3 class="sec">'+(isToday?'Today\'s weigh-in':'Weigh-in, '+fmtShort(date))+'</h3>'+cameraBtn('progress','progress')+'</div>';
  if(editing){
    h+='<form class="wform" data-submit="saveweight"><div class="field"><label for="wkg">Weight (kg)</label><input id="wkg" type="number" inputmode="decimal" step="0.1" min="20" max="300" placeholder="'+(wi?nf1.format(wi.last.kg):'kg')+'" value="'+dv('wkg',w?w.kg:'')+'"></div><button class="btn" type="submit">Save</button>'+(w?'<button class="btn ghost" type="button" data-act="weightedit">Cancel</button>':'')+'</form>';
  }else{
    h+='<div class="wdone"><span class="ok" aria-hidden="true">✓</span><div><b class="num">'+nf1.format(w.kg)+' kg</b><small>'+(isToday?'Done for today':'Logged')+'</small></div><button class="link" data-act="weightedit">Edit</button><button class="link danger" data-act="delweight">Remove</button></div>';
  }
  h+=photoStrip(date,'progress','Progress')+'</section>';

  // workouts
  h+='<section class="tile grey"><h3 class="sec">Workouts</h3>';
  if(day.workouts.length){
    h+='<div class="entries" style="margin:0 0 12px">'+day.workouts.map(x=>'<div class="entry"><div class="nm">'+esc(x.type)+(x.note?'<div class="amt">'+esc(x.note)+'</div>':'')+'</div><span class="kc">'+nf0.format(x.min)+'<small> min</small></span><button class="x" data-act="rmworkout" data-id="'+esc(x.id)+'" aria-label="Remove '+esc(x.type)+'">×</button></div>').join('')+'</div>';
  }
  h+='<form class="stackf" data-submit="addworkout"><div class="grid2"><div class="field"><label for="wtype">Type</label><input id="wtype" type="text" list="wtypes" maxlength="30" placeholder="Run" value="'+dv('wtype','')+'"></div><div class="field"><label for="wmin">Minutes</label><input id="wmin" type="number" inputmode="numeric" min="1" max="600" step="1" value="'+dv('wmin','')+'"></div></div><div class="field"><label for="wwnote">Note</label><input id="wwnote" type="text" maxlength="80" placeholder="Optional" value="'+dv('wwnote','')+'"></div><datalist id="wtypes">'+WTYPES.map(x=>'<option value="'+x+'">').join('')+'</datalist><div class="actions"><button class="btn" type="submit">Add workout</button></div></form></section>';

  // sleep
  const sl=day.sleep,slh=sl?Math.floor(sl.minutes/60):'',slm=sl?sl.minutes%60:'';
  h+='<section class="tile grey"><h3 class="sec">Sleep</h3><form class="stackf" data-submit="savesleep"><div class="grid2"><div class="field"><label for="sscore">Sleep score (0 to 100)</label><input id="sscore" type="number" inputmode="numeric" min="0" max="100" step="1" value="'+dv('sscore',sl?sl.score:'')+'"></div><div class="field"><label for="swake">Wake-ups, optional</label><input id="swake" type="number" inputmode="numeric" min="0" max="99" step="1" value="'+dv('swake',sl&&sl.wakeups!=null?sl.wakeups:'')+'"></div></div><div class="grid2"><div class="field"><label for="sh">Hours asleep</label><input id="sh" type="number" inputmode="numeric" min="0" max="24" step="1" value="'+dv('sh',slh)+'"></div><div class="field"><label for="sm">Minutes</label><input id="sm" type="number" inputmode="numeric" min="0" max="59" step="1" value="'+dv('sm',slm)+'"></div></div><div class="actions"><button class="btn" type="submit">Save sleep</button>'+(sl?'<button class="btn ghost" type="button" data-act="delsleep">Remove</button><span class="saved">Saved: '+sl.score+' · '+fmtDur(sl.minutes)+'</span>':'')+'</div><p class="cap" style="margin:0">Log the night that ended on this date.</p></form></section>';
  return h;
}

function weightPts(){
  const out=[];
  for(const d in state.days){const w=state.days[d].weight;if(w&&w.kg)out.push({d:d,kg:w.kg})}
  out.sort((a,b)=>a.d<b.d?-1:1);
  return out;
}

function barChart(vals,opts){
  // vals: [{d,v,has}] for 14 days, opts: {goal,top,step,fmt,cls,label}
  const W=340,H=176,L=38,R=6,T=16,B=24,pw=W-L-R,ph=H-T-B,slot=pw/vals.length,bw=slot*0.6;
  const top=opts.top,y=v=>T+ph-v/top*ph,last=vals.length-1;
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(opts.label)+'">';
  for(let v=0;v<=top+1e-9;v+=opts.step){const yy=y(v);s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'"/><text x="'+(L-6)+'" y="'+(yy+3.5)+'" text-anchor="end">'+opts.fmt(v)+'</text>'}
  vals.forEach((x,i)=>{
    const cx=L+i*slot+slot/2;
    if(x.has&&x.v>0)s+='<rect class="bar '+(opts.cls||'')+'" x="'+(cx-bw/2)+'" y="'+y(Math.min(x.v,top))+'" width="'+bw+'" height="'+(Math.min(x.v,top)/top*ph)+'" rx="'+Math.min(5,bw/2)+'"/>';
    if(i===last&&x.has&&x.v>0)s+='<text class="val" x="'+cx+'" y="'+(y(Math.min(x.v,top))-5)+'" text-anchor="end">'+opts.fmt(x.v)+'</text>';
    s+='<text'+(i===last?' class="today"':'')+' x="'+cx+'" y="'+(H-8)+'" text-anchor="middle">'+parse(x.d).getDate()+'</text>';
  });
  if(opts.goal)s+='<line class="goal" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(opts.goal)+'" y2="'+y(opts.goal)+'"/>';
  return s+'</svg>';
}

function last14(fn){const today=todayStr(),out=[];for(let i=13;i>=0;i--){const d=addDays(today,-i);out.push(Object.assign({d:d},fn(getDay(d))))}return out}

function calChart(){
  const goal=Number(state.settings.goalKcal)||0;
  const days=last14(day=>{const v=Math.round(totals(day).kcal);return{v:v,has:v>0}});
  const maxV=Math.max(goal,...days.map(x=>x.v),1);
  const step=maxV>4000?1000:maxV>1500?500:250;
  const top=Math.ceil(maxV*1.08/step)*step;
  return barChart(days,{goal:goal,top:top,step:step,fmt:v=>nf0.format(v),label:'Daily calories for the last 14 days, '+days.filter(x=>x.has).length+' days logged'});
}
function waterChart(){
  const goal=waterGoal();
  const days=last14(day=>{const v=waterOf(day);return{v:v,has:v>0}});
  const maxV=Math.max(goal,...days.map(x=>x.v));
  const top=Math.ceil(maxV*1.05/1000)*1000;
  return barChart(days,{goal:goal,top:top,step:1000,fmt:v=>litres(v),cls:'',label:'Water in litres for the last 14 days against a '+litres(goal)+' litre goal'});
}
function sleepChart(){
  const days=last14(day=>({v:day.sleep?day.sleep.score:0,has:!!day.sleep}));
  return barChart(days,{top:100,step:25,fmt:v=>String(v),cls:'lilac',label:'Sleep score for the last 14 days, '+days.filter(x=>x.has).length+' nights logged'});
}

function weightChart(){
  const today=todayStr(),start=addDays(today,-29);
  const pts=weightPts().filter(p=>p.d>=start);
  if(!pts.length)return null;
  const mn=Math.min(...pts.map(p=>p.kg)),mx=Math.max(...pts.map(p=>p.kg));
  const range=mx-mn,step=range<=2?0.5:range<=5?1:2;
  const lo=Math.floor((mn-0.2)/step)*step,hi=Math.ceil((mx+0.2)/step)*step;
  const W=340,H=176,L=40,R=14,T=16,B=24,pw=W-L-R,ph=H-T-B;
  const xi=d=>Math.round((parse(d)-parse(start))/864e5);
  const x=d=>L+xi(d)/29*pw,y=v=>T+ph-(v-lo)/(hi-lo)*ph;
  let s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Weight over the last 30 days, latest '+nf1.format(pts[pts.length-1].kg)+' kilograms">';
  for(let v=lo;v<=hi+1e-9;v+=step){const yy=y(v);s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'"/><text x="'+(L-6)+'" y="'+(yy+3.5)+'" text-anchor="end">'+v.toFixed(step<1?1:0)+'</text>'}
  [0,7,14,21,29].forEach(i=>{const d=addDays(start,i);s+='<text x="'+x(d)+'" y="'+(H-8)+'" text-anchor="'+(i===0?'start':i===29?'end':'middle')+'">'+fmtShort(d)+'</text>'});
  if(pts.length>1)s+='<polyline class="ln" points="'+pts.map(p=>x(p.d).toFixed(1)+','+y(p.kg).toFixed(1)).join(' ')+'"/>';
  pts.forEach(p=>{s+='<circle class="dot" cx="'+x(p.d)+'" cy="'+y(p.kg)+'" r="5"/>'});
  const last=pts[pts.length-1],lx=x(last.d);
  s+='<text class="val" x="'+(lx>W-50?Math.min(lx+6,W-2):lx)+'" y="'+(y(last.kg)-10)+'" text-anchor="'+(lx>W-50?'end':'middle')+'">'+nf1.format(last.kg)+' kg</text>';
  return s+'</svg>';
}

function viewTrends(){
  const today=todayStr(),goal=Number(state.settings.goalKcal)||0;
  let h='';
  if(state.demo)h+=notice;
  const logged=[];
  for(let i=13;i>=0;i--){const day=getDay(addDays(today,-i));if(day.entries.length)logged.push(Math.round(totals(day).kcal))}
  const avg=logged.length?Math.round(logged.reduce((a,b)=>a+b,0)/logged.length):0;
  h+='<section class="tile"><h2 class="sec">Calories, last 14 days</h2>'+calChart()+'<p class="cap">'+(logged.length?'Average on days with food logged: <b>'+nf0.format(avg)+' kcal</b> over '+logged.length+(logged.length===1?' day.':' days.'):'Log food on the Today tab to see daily totals here.')+(goal?' The dashed line is your goal of '+nf0.format(goal)+' kcal.':'')+'</p></section>';

  const wg=waterGoal(),wdays=last14(day=>({v:waterOf(day)})),wlog=wdays.filter(x=>x.v>0);
  const hit=wdays.filter(x=>x.v>=wg).length,wavg=wlog.length?wlog.reduce((a,x)=>a+x.v,0)/wlog.length:0;
  h+='<section class="tile"><h2 class="sec">Water, last 14 days</h2>'+waterChart()+'<p class="cap">'+(wlog.length?'Average on logged days: <b>'+litres(wavg)+' L</b>. Goal of '+litres(wg)+' L reached on <b>'+hit+(hit===1?' day':' days')+'</b>. The dashed line is the goal.':'Tap +250 ml on the Today tab each time you drink a glass.')+'</p></section>';

  const pts=weightPts(),wc=weightChart();
  h+='<section class="tile"><h2 class="sec">Weight, last 30 days</h2>'+(wc||'<p class="empty">No weigh-ins in the last 30 days. Add one on the Today tab.</p>');
  if(pts.length){
    const last=pts[pts.length-1];
    const wk=pts.filter(p=>p.d>=addDays(today,-6));
    const wkAvg=wk.length>=2?wk.reduce((a,p)=>a+p.kg,0)/wk.length:null;
    const win=pts.filter(p=>p.d>=addDays(today,-29));
    const ch=win.length>=2?win[win.length-1].kg-win[0].kg:null;
    h+='<div class="stats"><div class="stat"><div class="l">Latest</div><div class="v">'+nf1.format(last.kg)+' kg</div><div class="s">'+fmtShort(last.d)+'</div></div><div class="stat"><div class="l">7-day avg</div><div class="v">'+(wkAvg==null?'–':nf1.format(wkAvg)+' kg')+'</div><div class="s">'+(wkAvg==null?'Needs 2 weigh-ins':wk.length+' weigh-ins')+'</div></div><div class="stat"><div class="l">30-day change</div><div class="v">'+(ch==null?'–':(ch>0?'+':'')+nf1.format(ch)+' kg')+'</div><div class="s">'+(ch==null?'Needs 2 weigh-ins':'first to latest')+'</div></div></div>';
  }
  h+='</section>';

  const nights=[];
  for(let i=13;i>=0;i--){const s=getDay(addDays(today,-i)).sleep;if(s)nights.push(s)}
  const avgS=nights.length?Math.round(nights.reduce((a,s)=>a+s.score,0)/nights.length):0;
  const avgM=nights.length?Math.round(nights.reduce((a,s)=>a+s.minutes,0)/nights.length):0;
  h+='<section class="tile"><h2 class="sec">Sleep score, last 14 days</h2>'+sleepChart()+'<p class="cap">'+(nights.length?'Average over '+nights.length+(nights.length===1?' night: ':' nights: ')+'<b>score '+avgS+'</b> and <b>'+fmtDur(avgM)+'</b> asleep.':'Log your sleep score on the Today tab to see it here.')+'</p></section>';

  const ws=[];
  for(let i=0;i<7;i++){const d=addDays(today,-i);getDay(d).workouts.forEach(x=>ws.push({d:d,x:x}))}
  const mins=ws.reduce((a,o)=>a+o.x.min,0);
  h+='<section class="tile"><h2 class="sec">Workouts, last 7 days</h2>';
  if(ws.length){
    h+='<p><b>'+ws.length+(ws.length===1?' session':' sessions')+'</b> · '+nf0.format(mins)+' min</p><div style="margin-top:8px">'+ws.map(o=>'<div class="wk"><span>'+fmtDay(o.d)+' · '+esc(o.x.type)+'</span><span>'+nf0.format(o.x.min)+' min</span></div>').join('')+'</div>';
  }else h+='<p class="empty">No workouts logged this week.</p>';
  return h+'</section>';
}

function foodMatches(q){
  q=(q||'').trim().toLowerCase();
  return Object.keys(state.foods).map(id=>[id,state.foods[id]]).filter(p=>!q||(p[1].name+' '+(p[1].brand||'')).toLowerCase().includes(q)).sort((a,b)=>a[1].name.localeCompare(b[1].name));
}
function per100Line(f){const p=f.per100;return 'Per 100 '+esc(f.unit)+': '+nf0.format(p.kcal)+' kcal · P '+nf1.format(p.p)+' · C '+nf1.format(p.c)+' · F '+nf1.format(p.f)+' · Fiber '+nf1.format(p.fi)}
function foodListHtml(){
  const list=foodMatches(state.foodQuery);
  if(!list.length)return '<p class="empty">'+(Object.keys(state.foods).length?'No foods match.':'No foods yet. Add one from the label on its packaging.')+'</p>';
  return list.map(p=>{
    const id=p[0],f=p[1];
    return '<div class="food"><div class="fi"><b>'+esc(f.name)+'</b>'+(f.brand?' <small>'+esc(f.brand)+'</small>':'')+'<div class="amt">'+per100Line(f)+'</div></div><div class="fa"><button class="link" data-act="editfood" data-id="'+esc(id)+'">Edit</button><button class="link danger" data-act="delfood" data-id="'+esc(id)+'">'+(state.confirmDel===id?'Tap to confirm':'Delete')+'</button></div></div>';
  }).join('');
}
function viewFoods(){
  let h='';
  if(state.demo)h+=notice;
  h+='<div class="fhead"><h2>Foods</h2><button class="btn soft" data-act="newfood">New food</button></div><div class="field"><label for="fq">Search</label><input id="fq" type="search" autocomplete="off" value="'+esc(state.foodQuery)+'"></div><section class="tile" id="foodlist">'+foodListHtml()+'</section>';
  return h;
}

/* ---------- rendering ---------- */
function renderMain(){
  const el=$('main'),a=document.activeElement;
  const fid=a&&a.id&&el.contains(a)?a.id:null;
  const pos=fid&&typeof a.selectionStart==='number'?a.selectionStart:null;
  el.innerHTML=state.view==='today'?viewToday():state.view==='trends'?viewTrends():viewFoods();
  if(fid){const n=$(fid);if(n){n.focus();if(pos!=null&&n.type!=='number'){try{n.setSelectionRange(pos,pos)}catch(e){}}}}
  hydratePhotos();
}
function renderHeader(){
  const name=(state.settings.name||'').trim();
  $('hello').textContent=name?'Hello, '+name+'!':'Hello!';
  const av=$('avatar'),pic=avatarSrc();
  if(pic){av.textContent='';const im=document.createElement('img');im.src=pic;im.alt='';av.appendChild(im)}
  else av.textContent=name?name.charAt(0).toUpperCase():'☺';
  $('hdate').textContent=fmtLong(todayStr());
  const p=$('syncpill'),s=state.sync;
  let txt='',cls='';
  if(state.demo){txt='Demo';cls='busy'}
  else if(!drive.configured()){txt=''}
  else if(!drive.connected()){txt='Connect Drive';cls='warn'}
  else if(s.status==='busy'){txt='Syncing';cls='busy'}
  else if(!drive.token()||s.status==='auth'){txt=s.pending?'Tap to sync':'';cls='warn'}
  else if(s.status==='error'){txt='Sync failed';cls='warn'}
  else if(!navigator.onLine&&s.pending){txt='Offline';cls='warn'}
  p.hidden=!txt;
  p.className='syncpill '+cls;
  p.innerHTML='<i></i>'+esc(txt);
}
function renderTabs(){document.querySelectorAll('.tab').forEach(b=>{if(b.dataset.tab===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function renderAll(){renderHeader();renderMain();renderTabs()}

let tt;
function toast(msg,undo){
  const el=$('toast');
  state.undo=undo||null;
  el.innerHTML='<span>'+esc(msg)+'</span>'+(undo?'<button data-act="undo">Undo</button>':'');
  el.hidden=false;
  clearTimeout(tt);
  tt=setTimeout(()=>{el.hidden=true},undo?6000:3500);
}

/* ---------- add food sheet ---------- */
function openSheet(o){
  state.sheet=Object.assign({mode:'lib',meal:'snacks',foodId:null,editId:null,fromAdd:false},o);
  renderSheet();
}
function closeSheet(){state.sheet=null;renderSheet()}
function mealSelect(sel){return '<div class="field"><label for="sMeal">Meal</label><select id="sMeal">'+MEALS.map(m=>'<option value="'+m[0]+'"'+(m[0]===sel?' selected':'')+'>'+m[1]+'</option>').join('')+'</select></div>'}
function numField(id,label,val,extra){return '<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" type="number" inputmode="decimal" step="any" min="0" value="'+(val==null?'':esc(val))+'" '+(extra||'')+'></div>'}

function sheetHtml(){
  const s=state.sheet;
  const title=s.mode==='settings'?'Settings':s.mode==='new'?(s.editId?'Edit food':'New food'):s.mode==='quick'?'Quick add':'Add food';
  let h='<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="'+title+'"><div class="shead"><h2>'+title+'</h2><button class="x" data-act="closesheet" aria-label="Close">×</button></div>';
  if(s.fromAdd&&!s.editId){
    h+='<div class="seg">'+[['lib','From foods'],['quick','Quick add'],['new','New food']].map(m=>'<button type="button" data-act="smode" data-mode="'+m[0]+'" aria-pressed="'+(s.mode===m[0])+'">'+m[1]+'</button>').join('')+'</div>';
  }
  if(s.mode==='settings'){
    h+=settingsHtml();
  }else if(s.mode==='lib'){
    h+=mealSelect(s.meal)+'<div id="sFind" class="stack" style="gap:12px"><div class="field"><label for="sSearch">Search your foods</label><input id="sSearch" type="search" autocomplete="off"></div><div id="sResults" class="results"></div></div><div id="sPick" hidden></div>';
  }else if(s.mode==='quick'){
    h+='<form class="stackf" data-submit="addquick">'+mealSelect(s.meal)+'<div class="field"><label for="qName">Name</label><input id="qName" type="text" maxlength="60" placeholder="Restaurant lunch"></div><div class="grid2">'+numField('qKcal','Calories (kcal)','','required')+numField('qProt','Protein (g), optional','')+'</div><div class="actions"><button class="btn" type="submit">Add to log</button></div></form>';
  }else{
    const f=s.editId?state.foods[s.editId]:null,p=f?f.per100:{},sv=f&&f.servings&&f.servings[0];
    h+='<form class="stackf" data-submit="savefood"><div class="field"><label for="nName">Name</label><input id="nName" type="text" maxlength="60" required value="'+esc(f?f.name:'')+'"></div><div class="grid2"><div class="field"><label for="nBrand">Brand, optional</label><input id="nBrand" type="text" maxlength="40" value="'+esc(f?f.brand||'':'')+'"></div><div class="field"><label for="nUnit">Measured in</label><select id="nUnit"><option value="g"'+(f&&f.unit==='ml'?'':' selected')+'>Grams (g)</option><option value="ml"'+(f&&f.unit==='ml'?' selected':'')+'>Millilitres (ml)</option></select></div></div><p class="muted" style="font-size:14px">Values per 100 g or 100 ml, as printed on the label.</p><div class="grid5">'+numField('nKcal','kcal',p.kcal,'required')+numField('nP','Protein g',p.p)+numField('nC','Carbs g',p.c)+numField('nF','Fat g',p.f)+numField('nFi','Fiber g',p.fi)+'</div><div class="grid2"><div class="field"><label for="nSL">Serving name, optional</label><input id="nSL" type="text" maxlength="30" placeholder="slice" value="'+esc(sv?sv.label:'')+'"></div>'+numField('nSA','Serving size',sv?sv.amount:'')+'</div><div class="actions"><button class="btn" type="submit">'+(s.editId?'Save changes':'Save food')+'</button></div></form>';
  }
  return h+'</div></div>';
}
function settingsHtml(){
  const s=state.sync,dv=(id,def)=>esc(id in state.draft?state.draft[id]:def);
  let h='<section class="tile"><h3 class="sec">Your name</h3><form class="stackf" data-submit="savename"><div class="field"><label for="setname">Shown in the greeting. Saved in your Drive, not in the app code.</label><input id="setname" type="text" maxlength="30" autocomplete="given-name" value="'+dv('setname',state.settings.name||'')+'"></div><div class="actions"><button class="btn" type="submit">Save name</button></div></form></section>';
  h+='<section class="tile"><h3 class="sec">Your picture</h3><p class="cap" style="margin:0 0 12px">Shown in the circle next to your name. Saved in your Drive, not in the app code.</p><div class="actions"><button class="btn ghost" data-act="pickavatar">'+(avatarSrc()?'Change picture':'Choose picture')+'</button>'+(avatarSrc()?'<button class="link danger" data-act="removeavatar">Remove</button>':'')+'</div></section>';
  h+='<section class="tile"><h3 class="sec">Google Drive</h3>';
  if(state.demo)h+='<p class="cap" style="margin:0">Drive is off in demo mode.</p>';
  else if(!drive.configured())h+='<p class="cap" style="margin:0">This copy of the app has no Google client ID yet, so your log stays on this device. See the README to add one.</p>';
  else if(!drive.connected()){
    h+='<p class="cap" style="margin:0 0 12px">Your log and photos are saved on this phone only. Connect to keep a copy in a <b>Health Tracker</b> folder in your Drive. The app can only see files it creates there.</p><div class="actions"><button class="btn" data-act="connect">Connect Google Drive</button></div>';
  }else{
    const when=s.last?new Date(s.last).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):null;
    const line=s.status==='busy'?'Syncing now.':s.status==='error'?'Last sync failed: '+esc(s.error||'unknown error')+'.':!drive.token()||s.status==='auth'?'Sign-in expired. Tap Sync now to reconnect.':when?'Last synced at '+when+'.':'Connected.';
    h+='<p class="cap" style="margin:0 0 12px">'+line+(s.pending?' <b>'+s.pending+'</b> '+(s.pending===1?'change':'changes')+' waiting to upload.':' Everything is uploaded.')+'</p><div class="actions"><button class="btn" data-act="syncnow">Sync now</button><button class="link danger" data-act="disconnect">Disconnect</button></div>';
  }
  h+='</section>';
  h+='<section class="tile"><h3 class="sec">Calories from photos</h3>';
  if(state.hasKey)h+='<p class="cap" style="margin:0 0 12px">On. Meal photos are sent to Claude, which adds the foods and calories to that meal. Your API key is saved on this phone only.</p><div class="actions"><button class="link danger" data-act="removekey">Remove key</button></div>';
  else h+='<p class="cap" style="margin:0 0 12px">Paste an API key from console.anthropic.com to log meals from a photo. Give it its own key with a monthly spend limit. The key stays on this phone only, and meal photos are sent to Claude to be read.</p><form class="stackf" data-submit="savekey"><div class="field"><label for="setkey">Claude API key</label><input id="setkey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-..."></div><div class="actions"><button class="btn" type="submit">Save key</button></div></form>';
  h+='</section>';
  h+='<section class="tile"><h3 class="sec">Backup</h3><p class="cap" style="margin:0 0 12px">Save everything you logged as one JSON file, or bring in an export from another copy of the app. Photos stay in your Drive and are not part of the file.</p><div class="actions"><button class="btn ghost" data-act="export">Export all</button><button class="btn ghost" data-act="import">Import a file</button></div></section>';
  return h;
}
function renderSheet(){
  const el=$('sheet'),s=state.sheet;
  if(!s){el.hidden=true;el.innerHTML='';return}
  el.hidden=false;
  el.innerHTML=sheetHtml();
  if(s.mode==='lib')updateLib();
}
function resultsHtml(q){
  const list=foodMatches(q);
  if(!list.length)return '<p class="empty" style="padding:12px">'+(Object.keys(state.foods).length?'No foods match.':'No foods yet. Use New food to add one.')+'</p>';
  return list.map(p=>'<button type="button" class="res" data-act="pickfood" data-id="'+esc(p[0])+'"><span><b>'+esc(p[1].name)+'</b>'+(p[1].brand?' <small>'+esc(p[1].brand)+'</small>':'')+'</span><small>'+nf0.format(p[1].per100.kcal)+' kcal / 100 '+esc(p[1].unit)+'</small></button>').join('');
}
function previewText(f,amt){
  if(!(amt>0))return 'Enter an amount to see the calories.';
  const c=calc(f,amt);
  return nf0.format(c.kcal)+' kcal · '+nf1.format(c.p)+' g protein · '+nf1.format(c.fi)+' g fiber';
}
function updateLib(){
  const s=state.sheet,find=$('sFind'),pick=$('sPick');
  if(!find||!pick)return;
  const f=s.foodId&&state.foods[s.foodId];
  if(!f){
    find.hidden=false;pick.hidden=true;
    $('sResults').innerHTML=resultsHtml($('sSearch').value);
    return;
  }
  find.hidden=true;pick.hidden=false;
  const chips=(f.servings||[]).map(sv=>[1,2].map(n=>'<button type="button" class="chip" data-act="serv" data-amt="'+(sv.amount*n)+'">'+n+' '+esc(plural(sv.label,n))+'<small>'+nf1.format(sv.amount*n)+' '+esc(f.unit)+'</small></button>').join('')).join('');
  pick.innerHTML='<form class="stackf" data-submit="addentry"><div class="picked"><div><b>'+esc(f.name)+'</b>'+(f.brand?' <small>'+esc(f.brand)+'</small>':'')+'<div class="amt muted" style="font-size:13px">'+per100Line(f)+'</div></div><button type="button" class="link" data-act="changefood">Change</button></div>'+numField('sAmt','Amount ('+esc(f.unit)+')',s.amount,'required')+(chips?'<div class="chips">'+chips+'</div>':'')+'<p id="sPreview" class="preview"></p><div class="actions"><button class="btn" type="submit">Add to log</button></div></form>';
  $('sPreview').textContent=previewText(f,parseFloat(s.amount));
  const a=$('sAmt');a.focus();a.select();
}

/* ---------- actions ---------- */
const gv=id=>{const n=$(id);return n?n.value:''};
const num=id=>{const v=parseFloat(String(gv(id)).replace(',','.'));return isFinite(v)?v:NaN};
const nz=v=>isFinite(v)&&v>=0?v:0;

function act(name,el){
  const d=(el&&el.dataset)||{};
  switch(name){
    case 'tab':state.view=d.tab;state.confirmDel=null;renderAll();window.scrollTo(0,0);break;
    case 'week':state.date=addDays(state.date,Number(d.n));state.draft={};state.goalEdit=false;state.weightEdit=false;renderMain();break;
    case 'pick':state.date=d.d;state.draft={};state.goalEdit=false;state.weightEdit=false;renderMain();break;
    case 'today':state.date=todayStr();state.draft={};if(state.view!=='today'){state.view='today';renderAll()}else renderMain();window.scrollTo(0,0);break;
    case 'togglemeal':state.open[d.meal]=!state.open[d.meal];renderMain();break;
    case 'weightedit':state.weightEdit=!state.weightEdit;renderMain();if(state.weightEdit&&$('wkg'))$('wkg').focus();break;
    case 'goaledit':state.goalEdit=!state.goalEdit;renderMain();if(state.goalEdit&&$('goal'))$('goal').focus();break;
    case 'savegoal':{const v=parseInt(gv('goal'),10);if(!(v>=500&&v<=10000)){toast('Enter a goal between 500 and 10,000 kcal.');break}setSetting('goalKcal',v);state.goalEdit=false;delete state.draft.goal;renderMain();break}
    case 'cleargoal':setSetting('goalKcal',null);state.goalEdit=false;delete state.draft.goal;renderMain();break;
    case 'water':{
      const delta=Number(d.ml),date=state.date,before=waterOf(getDay(date)),after=Math.max(0,Math.min(20000,before+delta));
      if(after===before)break;
      mutateDay(date,x=>{x.water=after});
      if(delta>0&&before<waterGoal()&&after>=waterGoal())toast('Water goal reached. Nice work.');
      break}
    case 'wateredit':state.waterEdit=!state.waterEdit;renderMain();break;
    case 'watercustom':{
      const add=num('wcustom'),g=num('wgoal');
      if(gv('wcustom')!==''&&!(add>=10&&add<=3000)){toast('Enter an amount between 10 and 3,000 ml.');break}
      if(!(g>=0.5&&g<=10)){toast('Enter a daily goal between 0.5 and 10 litres.');break}
      const gm=Math.round(g*1000);
      if(gm!==waterGoal())setSetting('waterGoalMl',gm===WATER_DEFAULT?null:gm);
      delete state.draft.wcustom;delete state.draft.wgoal;state.waterEdit=false;
      if(add>0)mutateDay(state.date,x=>{x.water=(Number(x.water)||0)+Math.round(add)});else renderMain();
      toast(add>0?'Added '+nf0.format(add)+' ml':'Water goal saved');
      break}
    case 'waterreset':{
      const date=state.date,prev=waterOf(getDay(date));
      mutateDay(date,x=>{x.water=0});state.waterEdit=false;renderMain();
      toast('Water reset',()=>mutateDay(date,x=>{x.water=prev}));break}
    case 'add':openSheet({mode:'lib',meal:d.meal,fromAdd:true});break;
    case 'rmentry':{
      const date=state.date,list=getDay(date).entries,idx=list.findIndex(e=>e.id===d.id);
      if(idx<0)break;
      const entry=clone(list[idx]);
      mutateDay(date,x=>{x.entries.splice(idx,1)});
      toast('Removed '+entry.name,()=>mutateDay(date,x=>{x.entries.splice(Math.min(idx,x.entries.length),0,entry)}));
      break}
    case 'saveweight':{
      const kg=num('wkg');
      if(!(kg>=20&&kg<=300)){toast('Enter your weight in kg, for example 55.4.');break}
      mutateDay(state.date,x=>{x.weight={kg:Math.round(kg*10)/10,note:x.weight&&x.weight.note||''}});
      delete state.draft.wkg;state.weightEdit=false;renderMain();toast('Weigh-in saved');break}
    case 'delweight':{
      const date=state.date,prev=clone(getDay(date).weight);
      mutateDay(date,x=>{x.weight=null});delete state.draft.wkg;state.weightEdit=false;renderMain();
      toast('Weigh-in removed',()=>mutateDay(date,x=>{x.weight=prev}));break}
    case 'savesleep':{
      const score=num('sscore'),h=nz(num('sh')),m=nz(num('sm')),wk=num('swake'),mins=Math.round(h*60+m);
      if(!(score>=0&&score<=100)){toast('Enter a sleep score from 0 to 100.');break}
      if(!(mins>0&&mins<=1440)){toast('Enter the time asleep, for example 8 hours and 8 minutes.');break}
      mutateDay(state.date,x=>{x.sleep={score:Math.round(score),minutes:mins};if(wk>=0)x.sleep.wakeups=Math.round(wk)});
      ['sscore','sh','sm','swake'].forEach(k=>delete state.draft[k]);renderMain();toast('Sleep saved');break}
    case 'delsleep':{
      const date=state.date,prev=clone(getDay(date).sleep);
      mutateDay(date,x=>{delete x.sleep});
      ['sscore','sh','sm','swake'].forEach(k=>delete state.draft[k]);renderMain();
      toast('Sleep removed',()=>mutateDay(date,x=>{x.sleep=prev}));break}
    case 'addworkout':{
      const type=gv('wtype').trim(),min=num('wmin');
      if(!type||!(min>=1&&min<=600)){toast('Add a workout type and the minutes, for example Run and 30.');break}
      const note=gv('wwnote').trim();
      mutateDay(state.date,x=>{x.workouts.push({id:uid(),type:type,min:Math.round(min),note:note})});
      ['wtype','wmin','wwnote'].forEach(k=>delete state.draft[k]);renderMain();toast('Workout added');break}
    case 'rmworkout':{
      const date=state.date,list=getDay(date).workouts,idx=list.findIndex(x=>x.id===d.id);
      if(idx<0)break;
      const w=clone(list[idx]);
      mutateDay(date,x=>{x.workouts.splice(idx,1)});
      toast('Removed '+w.type,()=>mutateDay(date,x=>{x.workouts.splice(Math.min(idx,x.workouts.length),0,w)}));
      break}
    case 'newfood':openSheet({mode:'new',fromAdd:false});break;
    case 'editfood':openSheet({mode:'new',editId:d.id,fromAdd:false});break;
    case 'delfood':
      if(state.confirmDel===d.id){delete state.foods[d.id];persistFood(d.id);state.confirmDel=null;toast('Food deleted. Past log entries keep their values.')}
      else state.confirmDel=d.id;
      renderMain();break;
    case 'settings':openSheet({mode:'settings'});break;
    case 'savename':{const v=gv('setname').trim().slice(0,30);setSetting('name',v||null);delete state.draft.setname;renderHeader();renderSheet();toast(v?'Name saved':'Name removed');break}
    case 'connect':if(drive.configured())drive.signIn(false);break;
    case 'syncnow':
      if(!drive.connected()){if(drive.configured())drive.signIn(false);else act('settings');break}
      if(!drive.token()){drive.signIn(true);break}
      runSync();break;
    case 'disconnect':drive.disconnect().then(()=>{state.sync.status='idle';renderHeader();renderSheet();toast('Disconnected. Your Drive files are untouched.')});break;
    case 'export':exportAll();break;
    case 'savekey':{
      const k=gv('setkey').trim();
      if(!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(k)){toast('That does not look like a Claude API key (it starts with sk-ant-).');break}
      ai.setKey(k).then(()=>{state.hasKey=true;renderSheet();renderMain();toast('Key saved on this phone')});break}
    case 'removekey':ai.setKey('').then(()=>{state.hasKey=false;renderSheet();renderMain();toast('Key removed from this phone')});break;
    case 'readphoto':readPhoto(state.date,d.id);break;
    case 'import':$('importInput').click();break;
    case 'pickavatar':$('avatarInput').click();break;
    case 'removeavatar':setSetting('avatar',null);renderHeader();renderSheet();toast('Picture removed');break;
    case 'photo':state.photoTarget={date:state.date,kind:d.kind};$('photoInput').click();break;
    case 'rmphoto':
      if(state.confirmDel==='ph:'+d.id){state.confirmDel=null;removePhoto(state.date,d.id);toast('Photo deleted')}
      else{state.confirmDel='ph:'+d.id;renderMain()}
      break;
    case 'viewphoto':if(photoUrls[d.id]){state.viewer=d.id;renderViewer()}break;
    case 'closeviewer':state.viewer=null;renderViewer();break;
    case 'undo':if(state.undo){const f=state.undo;state.undo=null;$('toast').hidden=true;f()}break;
    case 'closesheet':closeSheet();break;
    case 'smode':{const s=state.sheet;if(s){const m=$('sMeal');if(m)s.meal=m.value;s.mode=d.mode;s.foodId=null;renderSheet()}break}
    case 'pickfood':state.sheet.foodId=d.id;state.sheet.amount='';updateLib();break;
    case 'changefood':state.sheet.foodId=null;state.sheet.amount='';updateLib();break;
    case 'serv':{const s=state.sheet,a=$('sAmt');a.value=d.amt;s.amount=d.amt;$('sPreview').textContent=previewText(state.foods[s.foodId],parseFloat(d.amt));break}
    case 'addentry':{
      const s=state.sheet,f=state.foods[s.foodId],amt=num('sAmt');
      if(!f||!(amt>0)){toast('Enter an amount greater than zero.');break}
      const meal=gv('sMeal')||s.meal;
      const c=calc(f,amt);
      const entry=Object.assign({id:uid(),meal:meal,foodId:s.foodId,name:f.name,amount:amt,unit:f.unit},c);
      mutateDay(state.date,x=>{x.entries.push(entry)});
      closeSheet();toast('Added '+f.name);break}
    case 'addquick':{
      const kcal=num('qKcal');
      if(!(kcal>=0)){toast('Enter the calories for this item.');break}
      const name=gv('qName').trim()||'Quick add',p=nz(num('qProt'));
      const entry={id:uid(),meal:gv('sMeal'),foodId:null,name:name,amount:1,unit:'serving',kcal:r1(kcal),p:r1(p),c:0,f:0,fi:0};
      mutateDay(state.date,x=>{x.entries.push(entry)});
      closeSheet();toast('Added '+name);break}
    case 'savefood':{
      const s=state.sheet,name=gv('nName').trim(),kcal=num('nKcal');
      if(!name){toast('Give the food a name.');break}
      if(!(kcal>=0)){toast('Enter the calories per 100 g or 100 ml.');break}
      const old=s.editId?state.foods[s.editId]:null;
      const sl=gv('nSL').trim(),sa=num('nSA');
      const servings=(sl&&sa>0?[{label:sl,amount:sa}]:[]).concat(old&&old.servings?old.servings.slice(1):[]);
      const food={name:name,brand:gv('nBrand').trim(),unit:gv('nUnit')==='ml'?'ml':'g',per100:{kcal:kcal,p:nz(num('nP')),c:nz(num('nC')),f:nz(num('nF')),fi:nz(num('nFi'))},servings:servings};
      const id=s.editId||(name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'food')+'-'+uid().slice(0,4);
      state.foods[id]=food;persistFood(id);
      if(s.fromAdd&&!s.editId){s.mode='lib';s.foodId=id;s.amount='';renderSheet()}
      else{closeSheet();toast('Food saved')}
      renderMain();break}
  }
}

document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act],[data-tab]');
  if(!t)return;
  if(t.dataset.tab){act('tab',t);return}
  const name=t.dataset.act;
  if(name==='scrim'){if(e.target===t)closeSheet();return}
  act(name,t);
});
document.addEventListener('submit',e=>{
  e.preventDefault();
  const k=e.target.dataset&&e.target.dataset.submit;
  if(k)act(k,e.target);
});
document.addEventListener('input',e=>{
  const t=e.target,id=t.id;
  if(DRAFT_IDS.indexOf(id)>=0)state.draft[id]=t.value;
  else if(id==='fq'){state.foodQuery=t.value;$('foodlist').innerHTML=foodListHtml()}
  else if(id==='sSearch')$('sResults').innerHTML=resultsHtml(t.value);
  else if(id==='sAmt'){state.sheet.amount=t.value;$('sPreview').textContent=previewText(state.foods[state.sheet.foodId],parseFloat(t.value))}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='sMeal'&&state.sheet)state.sheet.meal=t.value;
  else if(t.id==='photoInput'){const f=t.files&&t.files[0];t.value='';addPhoto(f)}
  else if(t.id==='avatarInput'){const f=t.files&&t.files[0];t.value='';setAvatar(f)}
  else if(t.id==='importInput'){const f=t.files&&t.files[0];t.value='';if(f)importFile(f)}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(state.viewer){state.viewer=null;renderViewer()}else if(state.sheet)closeSheet()}});
window.addEventListener('online',()=>{renderHeader();scheduleSync()});
window.addEventListener('offline',renderHeader);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')scheduleSync()});

/* ---------- start ---------- */
async function loadDemo(){
  // Invented data for screenshots and trying the app. Dates are relative to today.
  const r=await fetch('demo/sample-data.json');
  const data=await r.json();
  state.foods=data.foods||{};
  state.settings=data.settings||{};
  state.days={};
  for(const d of data.days||[]){const date=addDays(todayStr(),-d.daysAgo),x=clone(d);delete x.daysAgo;x.date=date;state.days[date]=x}
}

async function init(){
  state.demo=new URLSearchParams(location.search).has('demo');
  if(!state.demo){
    const ret=drive.handleRedirect();
    if(ret&&ret.error==='interaction_required'||ret&&ret.error==='login_required'||ret&&ret.error==='consent_required'){drive.signIn(false);return}
    if(ret&&ret.error)setTimeout(()=>toast(ret.error==='access_denied'?'Drive was not connected.':'Could not connect Drive. Try again.'),300);
    if(ret&&ret.ok)setTimeout(()=>toast('Google Drive connected'),300);
  }
  renderAll();
  try{
    if(state.demo)await loadDemo();
    else{Object.assign(state,await store.loadState());state.hasKey=!!(await ai.getKey())}
  }catch(e){toast(state.demo?'Could not load the demo data.':'Could not open storage on this device. Private browsing can block it.')}
  state.loaded={foods:true,days:true,settings:true};
  renderAll();
  if(!state.demo){
    if('serviceWorker' in navigator){
      // When a new version takes over, reload once so the new code runs.
      const hadController=!!navigator.serviceWorker.controller;
      let reloaded=false;
      navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!reloaded){reloaded=true;location.reload()}});
      navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
    }
    if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
    runSync();
  }
}
init();
