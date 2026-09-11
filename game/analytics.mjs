// Public-site telemetry only. Never send store names, location choices, saves or money.
export const MEASUREMENT_ID='G-CHWF6QKRJ6';
export const OPT_OUT_KEY='renspe.analytics.disabled';
const stages=new Set(['title','welcome','genre','area','property','research','setup','manage','waiting','recap','goal','gameover','epilogue']);
const genres=new Set(['party','photo','dance','meeting']);
const events=new Set(['game_visit','game_play','game_start','game_resume','game_return','game_stage_view','game_progress','game_quiz_answer','game_lesson_open','game_textbook_view','game_textbook_click','game_product_click']);
export function context(s={},screen='title'){
 return {game_stage:stages.has(screen)?screen:'other',game_genre:genres.has(s.genreId)?s.genreId:'none',game_week:Math.max(0,Math.min(96,Number(s.completedWeeks)||0)),game_version:'0.5.1'};
}
export function textbookTarget(href){
 try{const u=new URL(href);if(u.origin!=='https://rental-space.net'||u.pathname!=='/kyokasho/'||u.searchParams.get('utm_source')!=='renspe_game')return null;
 const content=u.searchParams.get('utm_content')||'';const m=/^(guide|chapter|footer)_([a-z_]{1,32})$/.exec(content);
 return m?{game_placement:m[1],game_topic:m[2]}:null;}catch{return null;}
}
export function createAnalytics(w,doc){
 let enabled=false,lastScreen='',played=false,observer;const seen=new Set();
 const safeGet=k=>{try{return w.localStorage.getItem(k);}catch{return null;}};
 const safeSet=(k,v)=>{try{w.localStorage.setItem(k,v);}catch{}};
 const production=w.location.hostname==='rental-space.net'&&w.location.pathname.startsWith('/game/');
 const test=new URLSearchParams(w.location.search).get('analytics_test')==='1';
 function emit(name,params={}){
  if(!enabled||!events.has(name))return;
  const clean={send_to:MEASUREMENT_ID,game_test:test?'yes':'no',transport_type:'beacon'};
  for(const [k,v] of Object.entries(params))if(/^game_(stage|genre|week|version|topic|placement|action|result|days)$/.test(k)&&((typeof v==='string'&&/^[a-z0-9_.-]{1,50}$/i.test(v))||(typeof v==='number'&&Number.isFinite(v))))clean[k]=v;
  if(test)clean.debug_mode=true;
  try{w.gtag('event',name,clean);}catch{/* Metrics must never interrupt a game. */}
 }
 function init(){
  if(!production||safeGet(OPT_OUT_KEY)==='1')return;
  w.dataLayer=w.dataLayer||[];w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
  w.gtag('js',new Date());
  w.gtag('config',MEASUREMENT_ID,{page_location:'https://rental-space.net/game/',page_referrer:referrerOrigin(doc.referrer),allow_google_signals:false,allow_ad_personalization_signals:false,...(test?{debug_mode:true}:{})});
  const script=doc.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;doc.head.append(script);enabled=true;
  emit('game_visit',context());
  const now=Date.now(),last=Number(safeGet('renspe.analytics.lastVisit'));
  if(last&&now-last>=86400000)emit('game_return',{...context(),game_days:Math.min(365,Math.floor((now-last)/86400000))});
  safeSet('renspe.analytics.lastVisit',String(now));
 }
 function play(s,resume=false){if(played)return;played=true;emit('game_play',context(s,s.phase));emit(resume?'game_resume':'game_start',context(s,s.phase));}
 function progress(prev,next){
  if(prev.phase!==next.phase||prev.completedWeeks!==next.completedWeeks||(prev.research?.checks.length||0)!==(next.research?.checks.length||0))emit('game_progress',context(next,next.phase));
 }
 function render(s,screen){
  const c=context(s,screen),key=`${c.game_stage}:${c.game_genre}`;
  if(key!==lastScreen){lastScreen=key;emit('game_stage_view',c);}
  observer?.disconnect();if(!enabled||!w.IntersectionObserver)return;
  observer=new w.IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting||entry.intersectionRatio<0.5)continue;const target=textbookTarget(entry.target.href);if(!target)continue;
   const id=`${c.game_stage}:${c.game_genre}:${target.game_placement}:${target.game_topic}`;if(!seen.has(id)){seen.add(id);emit('game_textbook_view',{...c,...target});}observer.unobserve(entry.target);
  }},{threshold:0.5});
  for(const a of doc.querySelectorAll('a[href]'))if(textbookTarget(a.href))observer.observe(a);
 }
 function click(a,s,screen){const t=textbookTarget(a.href);if(t)emit('game_textbook_click',{...context(s,screen),...t});else if(a.closest('.equipment-products'))emit('game_product_click',context(s,screen));}
 function disable(){safeSet(OPT_OUT_KEY,'1');w[`ga-disable-${MEASUREMENT_ID}`]=true;enabled=false;observer?.disconnect();}
 function enable(){safeSet(OPT_OUT_KEY,'0');w.location.reload();}
 return {init,emit,play,progress,render,click,disable,enable,isDisabled:()=>safeGet(OPT_OUT_KEY)==='1'};
}
function referrerOrigin(ref){try{return new URL(ref).origin;}catch{return '';}}
export function analyticsNotice(disabled){return `<h2>アクセス解析について</h2><p>遊びやすさの改善と教材紹介の効果を知るため、Google アナリティクスで訪問・プレイ開始・進行状況・教材へのクリックを計測します。</p><p>Google にCookieなどのブラウザ識別情報と利用状況が送信されます。入力したお店の名前や保存データは送信しません。端末が変わると別の利用者として数える場合があります。</p><p><a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener noreferrer">Googleによるデータの利用について ↗</a></p><p>このブラウザの計測：${disabled?'停止中':'有効（公開サイトのみ）'}</p><button class="secondary" data-action="analytics-${disabled?'enable':'disable'}">${disabled?'計測を有効にする':'このブラウザの計測を停止する'}</button>`;}
