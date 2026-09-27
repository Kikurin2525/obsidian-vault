import {MOODS,ROLE_NAMES,normalizeHex,extractColors} from './engine.mjs?v=20260928-knowledge1';
import {USAGES,isUsage,STRATEGIES,SOURCES,defaultGoal,recommend,designPalette,exportDesign,promptDesign,cssDesign} from './advisor.mjs?v=20260928-knowledge1';
import {KNOWLEDGE,HARMONIES} from './palette-knowledge.mjs?v=20260928-knowledge1';
import {RECIPES} from './composition.mjs?v=20260928-knowledge1';
import {previewMarkup} from './previews.mjs?v=20260928-knowledge1';
import {setupRecolor} from './recolor-ui.mjs?v=20260928-knowledge1';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={count:3,harmony:'auto',mood:'standard',source:'mood',base:'#2563EB',imageColors:[],comment:'',locks:{},seed:0,palettes:[],selected:0,view:'web',mode:'light',goal:'reading',legibility:'normal',focus:'subject',evaluated:0,rejected:0,shortage:'',format:'prompt',history:[],favorites:[]};
let toastTimer,imageUrl=null,recolor=null,referenceFile=null;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3200);}
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function swatches(colors,className){const div=el('div',className);for(const c of colors){const i=el('i');i.style.setProperty('--s',c);div.append(i);}return div;}
function palette(){return state.palettes[state.selected];}
function stash(){if(!palette())return;state.history.push(JSON.stringify({palettes:state.palettes,selected:state.selected,locks:state.locks,count:palette().colors.length,harmony:state.harmony,view:state.view,mode:state.mode,goal:state.goal,legibility:state.legibility,focus:state.focus,evaluated:state.evaluated,rejected:state.rejected,shortage:state.shortage}));if(state.history.length>20)state.history.shift();$('#undo').disabled=false;}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('コピーしました');}catch{const field=el('textarea');field.value=text;field.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(field);field.select();let ok=false;try{ok=document.execCommand('copy')}catch{}field.remove();toast(ok?'コピーしました':'コピーできませんでした。出力欄の文字を選択してコピーしてください。');}}
function setSource(source){state.source=source;$$('[data-source]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.source===source));for(const name of ['mood','color','image'])$('#'+name+'-panel').hidden=name!==source;}
function updateMood(){for(const b of $$('[data-mood]'))b.setAttribute('aria-pressed',b.dataset.mood===state.mood);}
function readInputs(){state.count=+$('#color-count').value;state.harmony=$('#harmony').value;state.comment=$('#request').value.trim();if(state.source==='color'){const hex=normalizeHex($('#base-hex').value);$('#base-error').hidden=!!hex;if(!hex){$('#base-hex').focus();return false;}state.base=hex;$('#base-color').value=hex;$('#base-hex').value=hex;}if(state.source==='image'&&!state.imageColors.length){toast('先に参考画像を選んでください');$('#image-input').focus();return false;}return true;}
function options(){return {view:state.view,mode:state.mode,goal:state.goal,legibility:state.legibility,focus:state.focus};}
function currentDesign(p=palette()){return designPalette(p,{...options(),goal:p.strategy||state.goal});}
function generate(advance=false){
 if(!readInputs())return;stash();if(advance)state.seed++;
 const result=recommend({...state,referenceColors:advance&&palette()?palette().colors:[]});
 state.palettes=result.palettes;state.selected=0;state.evaluated=result.evaluated;state.rejected=result.rejected;state.shortage=result.shortage;
 $('#interpretation').textContent=(result.parsed.labels.length?'反映した条件：'+result.parsed.labels.join(' ／ '):state.comment?'対応する語句が見つかりません。要望の全文をAI指示文に引き継ぎます。':'色の調和・役割・候補同士の違いを確認して選びました。')+(palette().warnings?.length?' '+palette().warnings.join(' '):'');
 render();
}
function renderControls(){
 $('#harmony').value=state.harmony||'auto';
 $('#usage').value=state.view;$('#goal').replaceChildren(...STRATEGIES[state.view].map(x=>{const o=el('option',null,x.label);o.value=x.id;return o;}));$('#goal').value=state.goal;
 $('#legibility').value=state.legibility;$('#legibility').hidden=state.view==='illustration';$('label[for="legibility"]').hidden=state.view==='illustration';$('#art-focus').hidden=state.view!=='illustration';$('#focus').value=state.focus;
 $('.mode-buttons').hidden=state.view==='illustration';$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===state.mode));
}
function render(){renderControls();renderPreview();renderActive();renderCandidates();renderExport();$('#selected-name').textContent=palette().name;$('#count-label').value=state.count+'色';$('#color-count').value=state.count;$('#undo').disabled=!state.history.length;}
function renderPreview(){
 const d=currentDesign(),r=d.roles,preview=$('#preview'),poor=$('#poor-example').checked;
 preview.className='preview purpose-'+state.view+' strategy-'+d.strategy+(poor?' poor-example':'')+($('#grayscale').checked?' is-grayscale':'');
 for(const [k,v]of Object.entries(r))preview.style.setProperty('--'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v);
 preview.style.setProperty('--p',r.brand);preview.style.setProperty('--s',r.secondary);preview.style.setProperty('--a',r.accent);
 $('#preview-caption').textContent={web:'WEBSITE PREVIEW',lp:'LANDING PAGE PREVIEW',app:'MOBILE APP PREVIEW',illustration:'ILLUSTRATION PREVIEW'}[state.view];
 $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===state.view));
 $('#comparison-note').hidden=!poor;preview.innerHTML=previewMarkup(state.view,d,{poor});renderAdvice(d);recolor?.update();
}
function renderAdvice(d){
 $('#advice-title').textContent='この配色の組み立て方';
 $('#theme-roles').replaceChildren(...d.themeRoles.map(c=>{const row=el('div','theme-role-row'),dot=el('i');dot.style.background=c.hex;const title=el('strong',null,c.role+' '+c.hex),copyButton=el('button','theme-role-code');copyButton.title='色コードをコピー';copyButton.append(dot,title);copyButton.addEventListener('click',()=>copy(c.hex));const use=el('div');use.append(el('strong',null,c.usage),el('p',null,c.note));row.append(copyButton,use);return row;}));
 $('#evaluation-status').textContent=palette().constraintFailure?'条件を見直してください':d.pass?(state.view==='illustration'?'構図の目安を確認':'指定した色の検査を通過'):'要調整';
 $('#advice-reasons').replaceChildren(...d.reason.map(x=>el('p',null,x)));
 $('#applied-rules').replaceChildren(...d.appliedRules.map(r=>{const li=el('li');const source=SOURCES.find(s=>s.id===r.source),a=el('a',null,source.title);a.href=source.url;a.target='_blank';a.rel='noopener';li.append(el('strong',null,r.title+' — '+r.action),el('p',null,r.detail),a);return li;}));
 $('#usage-instructions').replaceChildren(...d.instructions.map(x=>el('li',null,x)));
 const roleEntries=state.view==='illustration'?[['背景',d.roles.sceneBackground],['主役',d.roles.subject],['アクセント',d.roles.focal],['輪郭',d.roles.sceneLine]]:[['背景',d.roles.background],['本文',d.roles.text],['カード',d.roles.surface],['主要ボタン',d.roles.action],['ボタン文字',d.roles.onAction],['リンク',d.roles.link],...(state.view==='app'?[['選択中の面',d.roles.selectedSurface],['選択中の文字',d.roles.selectedText],['エラー',d.roles.error]]:[])];
 $('#role-colors').replaceChildren(...roleEntries.map(([label,hex])=>{const b=el('button','role-chip');const dot=el('i');dot.style.background=hex;b.append(dot,el('span',null,label+' '+hex));b.title='この色をコピー';b.addEventListener('click',()=>copy(hex));return b;}));
 $('#allocation').replaceChildren(...d.allocation.map(x=>{const n=el('span');n.style.background=x.hex;n.style.flex=x.percent;n.title=x.label+' '+x.percent+'%';return n;}));
 $('#allocation-labels').replaceChildren(...d.allocation.map(x=>el('span',null,x.label+' '+x.percent+'%')));
 $('#avoid-advice').textContent=d.avoid;
 $('#design-warnings').replaceChildren(...d.warnings.map(x=>el('p','design-warning',x)));
 $('#contrast').replaceChildren(...d.checks.map(c=>el('span',c.pass?'pass':'warn',`${c.label} ${c.ratio.toFixed(2)}:1 / 目標 ${c.min}:1 ${c.pass?'✓':'要調整'}`)));
 $('#check-scope').textContent=state.view==='illustration'?'イラストの数値は、このツールの構図確認の目安です。WCAG基準や芸術的な良さの点数ではありません。':'この見本の色の組み合わせを検査しています。実際の文字サイズ、写真上の文字、全体のWCAG適合を保証するものではありません。';
}
function renderActive(){const colors=palette().colors,div=$('#active-colors');div.replaceChildren();div.style.setProperty('--count',colors.length);div.classList.toggle('many',colors.length>4);colors.forEach((color,i)=>{const tile=el('div','color-tile'),block=el('div','color-block');block.style.setProperty('--s',color);const picker=el('input','color-edit');picker.type='color';picker.value=color;picker.setAttribute('aria-label',ROLE_NAMES[i]+'の色を編集');picker.addEventListener('change',()=>{stash();palette().colors[i]=picker.value.toUpperCase();if(state.locks[i])state.locks[i]=palette().colors[i];palette().name='自分で調整した配色';palette().intent='';palette().family='custom';render();});const lock=el('button','lock',state.locks[i]?'固定中':'固定');lock.setAttribute('aria-label',ROLE_NAMES[i]+'を固定');lock.setAttribute('aria-pressed',!!state.locks[i]);lock.addEventListener('click',()=>{if(state.locks[i])delete state.locks[i];else state.locks[i]=color;renderActive();});block.append(picker,lock);const hex=el('button','hex-copy',color);hex.title=color+' をコピー';hex.addEventListener('click',()=>copy(color));tile.append(block,hex,el('span','role-label',ROLE_NAMES[i]));div.append(tile);});}
function renderCandidates(){
 const div=$('#candidates');div.replaceChildren();$('#candidates-heading').textContent=`色の違いで選べる、${state.palettes.length}案。`;$('#pool-summary').textContent=state.evaluated?`${state.evaluated}組から、色の調和・読みやすさ・案同士の違いを確認して選びました。${state.shortage||''}`:'保存・共有された配色を現在の用途で再検査しています。';
 state.palettes.forEach((p,i)=>{const d=currentDesign(p),button=el('button','candidate');button.setAttribute('aria-pressed',state.selected===i);button.setAttribute('aria-label',p.name+'、'+p.colors.join('、'));button.append(swatches(p.colors,'candidate-swatches'));const info=el('div','candidate-info');info.append(el('strong',null,p.name),el('span','candidate-harmony',d.harmony),el('small',null,d.strategyLabel+' / '+(d.pass&&!p.constraintFailure?'色の検査通過':'条件を見直してください')));button.append(info);button.addEventListener('click',()=>{if(state.selected===i)return;stash();state.selected=i;for(const key of Object.keys(state.locks))state.locks[key]=p.colors[key];render();});div.append(button);});
}
function renderExport(){
 const imageRecolor=recolor?.data();
 const output=state.format==='css'?cssDesign(palette(),options())+(imageRecolor?'\n/* 画像の変更対応はJSONまたはAIへの指示文に含まれます。 */':''):state.format==='json'?JSON.stringify({...exportDesign(palette(),options(),state.comment),...(imageRecolor?{imageRecolor}:{})},null,2):promptDesign(palette(),options(),state.comment)+(recolor?.prompt()||'');
 $('#export-text').value=output;$$('[data-format]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.format===state.format));$('#copy-export').textContent={prompt:'指示文をコピー ↗',css:'CSSをコピー ↗',json:'JSONをコピー ↗'}[state.format];
}
function renderFavorites(){const div=$('#favorites');div.replaceChildren();$('#favorites-section').hidden=!state.favorites.length;state.favorites.forEach((p,index)=>{const wrap=el('div','favorite-item'),load=el('button');load.title=p.name;load.setAttribute('aria-label',p.name+'を読み込む');load.append(...swatches(p.colors,'').children);load.addEventListener('click',()=>{stash();state.palettes=[{...p,colors:[...p.colors],description:'保存した配色',warnings:[]}];state.selected=0;state.count=p.colors.length;state.locks={};state.evaluated=0;state.rejected=0;state.shortage='';if(isUsage(p.view)){state.view=p.view;state.mode=p.mode==='dark'?'dark':'light';state.goal=STRATEGIES[state.view].some(x=>x.id===p.strategy)?p.strategy:defaultGoal(state.view);state.legibility=p.legibility==='high'?'high':'normal';state.focus=p.focus==='accent'?'accent':'subject';}render();toast('保存した配色を読み込みました');});const remove=el('button',null,'×');remove.setAttribute('aria-label',p.name+'を保存から削除');remove.addEventListener('click',()=>{state.favorites.splice(index,1);persistFavorites();renderFavorites();});wrap.append(load,remove);div.append(wrap);});}
function persistFavorites(){try{localStorage.setItem('iro-atelierv1',JSON.stringify(state.favorites));return true;}catch{toast('このブラウザでは保存できません。共有リンクか配色画像をご利用ください。');return false;}}
function validSaved(p){return p&&typeof p.name==='string'&&Array.isArray(p.colors)&&p.colors.length>=2&&p.colors.length<=8&&p.colors.every(c=>normalizeHex(c));}
function loadSharedPalette(){
 const params=new URLSearchParams(location.hash.slice(1)),shared=params.get('palette');if(!shared)return false;
 const colors=shared.split('-').map(x=>normalizeHex(x));
 if(colors.length<2||colors.length>8||!colors.every(Boolean)){toast('共有リンクの配色を読み込めませんでした');return false;}
 state.view=isUsage(params.get('view'))?params.get('view'):'web';state.mode=params.get('mode')==='dark'?'dark':'light';state.goal=STRATEGIES[state.view].some(x=>x.id===params.get('goal'))?params.get('goal'):defaultGoal(state.view);state.legibility=params.get('legibility')==='high'?'high':'normal';state.focus=params.get('focus')==='accent'?'accent':'subject';
 state.count=colors.length;state.selected=0;state.locks={};state.evaluated=0;state.shortage='';state.comment='';$('#request').value='';state.palettes=[{name:'共有された配色',description:'共有リンクから読み込みました',colors,warnings:[],strategy:state.goal}];toast('共有された配色を読み込みました');return true;
}
function setup(){
 recolor=setupRecolor({snapshot:()=>({palettes:state.palettes,selected:state.selected,designs:state.palettes.map(p=>currentDesign(p))}),onChange:renderExport,notify:toast});
 $('#use-reference-image').addEventListener('click',async()=>{if(referenceFile){await recolor.load(referenceFile);$('#custom-preview').scrollIntoView({behavior:'smooth',block:'start'});}});
 const moods=$('#moods');MOODS.forEach(m=>{const b=el('button','mood-button');b.dataset.mood=m.id;b.setAttribute('aria-pressed',state.mood===m.id);b.append(swatches((RECIPES.find(p=>p.tags.includes(m.id))?.colors||m.colors).slice(0,3),'mini-dots'),el('span',null,m.label));b.addEventListener('click',()=>{state.mood=m.id;state.seed=0;updateMood();generate();});moods.append(b);});
 ['#2563EB','#DC2626','#FACC15','#16A34A','#F97316','#9333EA','#06B6D4','#111111'].forEach(c=>{let b=el('button');b.style.setProperty('--s',c);b.title=c;b.setAttribute('aria-label',`基準色を${c}にする`);b.addEventListener('click',()=>{$('#base-color').value=c;$('#base-hex').value=c;state.base=c;state.seed=0;generate();});$('#base-presets').append(b);});
 $$('[data-source]').forEach(b=>b.addEventListener('click',()=>{setSource(b.dataset.source);if(state.source!=='image'||state.imageColors.length){state.seed=0;generate();}}));
 $('#color-count').addEventListener('input',()=>{$('#count-label').value=$('#color-count').value+'色'});$('#color-count').addEventListener('change',()=>{const n=+$('#color-count').value;for(const k of Object.keys(state.locks))if(+k>=n)delete state.locks[k];generate();});
 $('#base-color').addEventListener('input',()=>{$('#base-hex').value=$('#base-color').value.toUpperCase();$('#base-error').hidden=true;});$('#base-color').addEventListener('change',()=>{state.seed=0;generate();});$('#base-hex').addEventListener('change',()=>{state.seed=0;generate();});
 $('#request').addEventListener('input',()=>{state.comment=$('#request').value.trim();renderExport();});
 $$('[data-request]').forEach(b=>b.addEventListener('click',()=>{const t=$('#request');t.value=(t.value.trim()?t.value.trim()+'。':'')+b.dataset.request;generate(true);}));
 $('#generate').addEventListener('click',()=>generate(true));$('#more').addEventListener('click',()=>generate(true));
 function changeUsage(view){if(view===state.view)return;state.view=view;state.goal=defaultGoal(view);state.seed=0;generate();}
 $('#usage').addEventListener('change',()=>changeUsage($('#usage').value));
 $$('[data-view]').forEach(b=>b.addEventListener('click',()=>changeUsage(b.dataset.view)));
 $('#harmony').addEventListener('change',()=>{state.seed=0;generate();});
 $('#goal').addEventListener('change',()=>{state.goal=$('#goal').value;generate();});
 $('#legibility').addEventListener('change',()=>{state.legibility=$('#legibility').value;generate();});
 $('#focus').addEventListener('change',()=>{state.focus=$('#focus').value;render();});
 $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{stash();state.mode=b.dataset.mode;render();}));
 $('#grayscale').addEventListener('change',renderPreview);$('#poor-example').addEventListener('change',renderPreview);
 $$('[data-format]').forEach(b=>b.addEventListener('click',()=>{state.format=b.dataset.format;renderExport();}));
 $('#copy-export').addEventListener('click',()=>copy($('#export-text').value));
 $('#undo').addEventListener('click',()=>{if(!state.history.length)return;Object.assign(state,JSON.parse(state.history.pop()));render();});
 $('#save-favorite').addEventListener('click',()=>{if(state.favorites.some(p=>p.colors.join()===palette().colors.join()))return toast('この配色は保存済みです');if(state.favorites.length>=12)return toast('保存は12件までです。不要な配色を削除してください。');state.favorites.push({name:palette().name,intent:palette().intent||'',colors:[...palette().colors],strategy:palette().strategy||state.goal,...options()});if(persistFavorites())toast('配色を保存しました');renderFavorites();});
 $('#download').addEventListener('click',downloadImage);$('#share').addEventListener('click',()=>{const url=new URL(location.href);url.hash='palette='+palette().colors.map(c=>c.slice(1)).join('-')+'&view='+state.view+'&mode='+state.mode+'&goal='+(palette().strategy||state.goal)+'&legibility='+state.legibility+'&focus='+state.focus;copy(url.toString());});
 $('#image-input').addEventListener('change',loadImage);
 try{const saved=JSON.parse(localStorage.getItem('iro-atelierv1')||'[]');if(Array.isArray(saved))state.favorites=saved.filter(validSaved).slice(0,12).map(p=>({...p,name:p.name.slice(0,80),colors:p.colors.map(normalizeHex)}));}catch{}
 $('#harmony').replaceChildren(...Object.entries(HARMONIES).map(([id,label])=>{const o=el('option',null,label);o.value=id;return o;}));
 const initial=recommend(state);state.palettes=initial.palettes;state.evaluated=initial.evaluated;state.shortage=initial.shortage;loadSharedPalette();
 window.addEventListener('hashchange',()=>{if(new URLSearchParams(location.hash.slice(1)).has('palette')){stash();if(loadSharedPalette())render();}});
 $('#knowledge-summary').textContent=`${SOURCES.length}の一次資料を参照し、${KNOWLEDGE.length}項目に整理。33組の基本配色に6種類の構成を展開し、役割・明暗・彩度の競合・案同士の違いで候補を選びます。`;
 const categories=[...new Set(KNOWLEDGE.map(r=>r.category))];
 $('#knowledge-library').replaceChildren(...categories.map(category=>{const detail=el('details'),summary=el('summary',null,category),list=el('ul');for(const r of KNOWLEDGE.filter(r=>r.category===category)){const li=el('li'),a=el('a',null,SOURCES.find(s=>s.id===r.source).title);a.href=SOURCES.find(s=>s.id===r.source).url;a.target='_blank';a.rel='noopener';li.append(el('strong',null,r.title+'（'+r.action+'）'),el('p',null,r.detail),a);list.append(li);}detail.append(summary,list);return detail;}));
 $('#theory-sources').replaceChildren(...SOURCES.map(s=>{const p=el('p');const a=el('a',null,s.title);a.href=s.url;a.target='_blank';a.rel='noopener';p.append(a,el('span',null,' — '+s.rule));return p;}));
 render();renderFavorites();
}
let imageJob=0;
async function loadImage(){const job=++imageJob,file=$('#image-input').files[0];if(!file)return;if(file.size>15*1024*1024){$('#image-status').textContent='15MB以下の画像を選んでください。';return;}if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)){$('#image-status').textContent='PNG・JPEG・WebP・GIF・AVIFの画像を選んでください。';return;}
 $('#image-status').textContent='画像から色を抽出しています…';const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();if(job!==imageJob){URL.revokeObjectURL(url);return;}const canvas=document.createElement('canvas'),scale=Math.min(1,180/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);const colors=extractColors(ctx.getImageData(0,0,canvas.width,canvas.height).data);if(!colors.length)throw new Error('透明な画像からは色を抽出できません。');state.imageColors=colors;referenceFile=file;if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=url;$('#image-preview').src=url;$('#image-result').hidden=false;const div=$('#image-colors');div.replaceChildren();colors.forEach(c=>{const b=el('button');b.style.setProperty('--s',c);b.title=c;b.setAttribute('aria-label',c+'を基準色にする');b.addEventListener('click',()=>{setSource('color');$('#base-color').value=c;$('#base-hex').value=c;state.seed=0;generate();});div.append(b);});$('#image-status').textContent=`${colors.length}色を抽出しました。抽出色をもとに、用途別の3案を提案します。画像は送信していません。`;state.seed=0;generate();}catch(e){URL.revokeObjectURL(url);if(job===imageJob)$('#image-status').textContent=e.message.includes('透明')?e.message:'この画像は読み込めませんでした。別のPNGやJPEGをお試しください。';}}
function downloadImage(){const p=palette(),canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1030;const ctx=canvas.getContext('2d');ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,1440,1030);ctx.fillStyle='#111111';ctx.font='600 30px "Noto Sans JP", sans-serif';ctx.fillText('いろのアトリエ / COLOR STUDIO',64,75);ctx.font='22px "Noto Sans JP", sans-serif';ctx.fillText(p.name,64,120);const width=1312/p.colors.length;p.colors.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(64+width*i,164,width,350);ctx.fillStyle='#111111';ctx.font='600 22px monospace';ctx.fillText(c,72+width*i,552);ctx.font='17px "Noto Sans JP", sans-serif';ctx.fillText(ROLE_NAMES[i],72+width*i,590);});ctx.font='19px "Noto Sans JP", sans-serif';const d=currentDesign();ctx.fillText(USAGES[state.view]+' / '+d.strategyLabel+' / '+d.mode,64,647);const used=state.view==='illustration'?[['背景',d.roles.sceneBackground],['主役',d.roles.subject],['アクセント',d.roles.focal],['輪郭',d.roles.sceneLine]]:[['背景',d.roles.background],['本文',d.roles.text],['カード',d.roles.surface],['主要ボタン',d.roles.action],['ボタン文字',d.roles.onAction],['リンク',d.roles.link]];used.forEach(([name,hex],i)=>{const x=64+(i%2)*660,y=700+Math.floor(i/2)*64;ctx.fillStyle=hex;ctx.fillRect(x,y-24,36,36);ctx.strokeStyle='#999';ctx.strokeRect(x,y-24,36,36);ctx.fillStyle='#111111';ctx.fillText(name+' '+hex,x+52,y);});ctx.fillStyle='#666666';ctx.font='16px sans-serif';ctx.fillText('rental-space.net/tools/color-studio/',64,963);canvas.toBlob(blob=>{if(!blob)return toast('画像を保存できませんでした');const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='iro-palette-'+p.colors.map(c=>c.slice(1)).join('-')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('配色画像を保存しました');},'image/png');}
setup();
