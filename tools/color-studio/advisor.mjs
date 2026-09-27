import {contrast,toHsl,fromHsl,rgb,toHex,normalizeHex,ROLE_NAMES} from './engine.mjs?v=20260928-composition1';
import {composePool,compositionNotes,visiblyDifferent,oklab} from './composition.mjs?v=20260928-composition1';

export const USAGES={web:'Webサイト',lp:'LP',app:'スマホアプリ',illustration:'イラスト'};
export const isUsage=value=>Object.hasOwn(USAGES,value);
export const SOURCES=[
 {id:'difference',title:'Oklab：見た目の色の違いを扱う色空間',url:'https://bottosson.github.io/posts/oklab/',rule:'候補間の色の違いを比較するために使用。似た案を除く閾値は、このツール独自の設計判断です。'},
 {id:'text',title:'W3C：文字のコントラスト',url:'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',rule:'通常の文字は4.5:1以上。読みやすさ優先では7:1を目標にする。'},
 {id:'controls',title:'W3C：操作部品などのコントラスト',url:'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',rule:'操作部品の識別に必要な境界・状態の表示は隣接色と3:1以上を確保する。装飾には一律適用しない。'},
 {id:'meaning',title:'W3C：色だけで情報を伝えない',url:'https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html',rule:'リンクには下線、選択中には印と文字、エラーには記号と説明を添える。'},
 {id:'hierarchy',title:'Adobe：明暗・彩度と視線誘導',url:'https://www.adobe.com/uk/creativecloud/design/discover/color-contrast.html',rule:'主役と周囲の明暗・彩度・面積に差をつける。グレースケールでも構図を確認する。'}
];
export const STRATEGIES={
 web:[{id:'reading',label:'読みやすさ重視',reason:'本文と余白を中心に、装飾色の面積を抑えます。'}, {id:'action',label:'導線の分かりやすさ重視',reason:'主要な操作に強調色をまとめ、リンクと装飾を区別します。'}, {id:'brand',label:'ブランドの印象重視',reason:'メイン色を図や見出し周りに繰り返し使い、本文は基本色で読みやすくします。'}],
 lp:[{id:'action',label:'申込み導線重視',reason:'申込みボタンに強調を集め、ほかの装飾との競合を抑えます。'}, {id:'reading',label:'説明の読みやすさ重視',reason:'説明や比較を読むための余白を広くし、強い色を使う面積を抑えます。'}, {id:'brand',label:'商品の印象重視',reason:'商品を紹介する面にメイン色を使い、申込みボタンとは役割を分けます。'}],
 app:[{id:'action',label:'操作の分かりやすさ重視',reason:'主要ボタンと選択中の表示に一貫した色を使い、操作の手がかりをそろえます。'}, {id:'reading',label:'毎日の読みやすさ重視',reason:'一覧とカードの色を抑え、本文と補助文字の明暗差を確保します。'}, {id:'brand',label:'アプリらしさ重視',reason:'ブランド色は上部の面に、操作色はボタンと選択状態に使い分けます。'}],
 illustration:[{id:'focus',label:'主役を引き立てる',reason:'主役と背景の明暗を分け、少量のアクセントへ視線をつなぎます。'}, {id:'quiet',label:'まとまりを重視',reason:'背景を広く、アクセントを小さく使い、主役が埋もれない輪郭を添えます。'}, {id:'bold',label:'印象を強くする',reason:'主役の面積を増やし、アクセントとの色相差を活かします。'}]
};
export function defaultGoal(view){return (STRATEGIES[view]||STRATEGIES.web)[0].id;}
function strategyFor(view,id){return (STRATEGIES[view]||STRATEGIES.web).find(s=>s.id===id)||(STRATEGIES[view]||STRATEGIES.web)[0];}
function blend(a,b,amount){return toHex(...rgb(a).map((n,i)=>n*(1-amount)+rgb(b)[i]*amount));}
function hueDistance(a,b){let d=Math.abs(toHsl(a)[0]-toHsl(b)[0]);return Math.min(d,360-d);}
function bestInk(bg){return ['#111111','#FFFFFF','#000000'].sort((a,b)=>contrast(b,bg)-contrast(a,bg))[0];}
// Search for the closest same-hue tone that satisfies an actual foreground/background pair.
function readable(color,bg,min=4.5){if(contrast(color,bg)>=min)return color;const [h,s,l]=toHsl(color);const fits=[];for(let i=0;i<=100;i++){const c=fromHsl(h,s,i);if(contrast(c,bg)>=min)fits.push({c,d:Math.abs(l-i)});}fits.sort((a,b)=>a.d-b.d);return fits[0]?.c||bestInk(bg);}
function check(id,label,a,b,min,standard='wcag'){const value=contrast(a,b);return {id,label,foreground:a,background:b,ratio:value,min,pass:value>=min,standard};}
function shareList(view,strategy,colors,roles){
 if(view==='illustration'){
  const values=strategy==='quiet'?[75,20,5]:strategy==='bold'?[55,30,15]:[65,25,10];
  return [{label:'背景',hex:roles.sceneBackground,percent:values[0]},{label:'主役',hex:roles.subject,percent:values[1]},{label:'アクセント',hex:roles.focal,percent:values[2]}];
 }
 const values=strategy==='reading'?[80,14,4,2]:strategy==='brand'?[68,17,11,4]:view==='app'?[78,12,8,2]:[76,12,3,9];
 return [{label:'背景',hex:roles.background,percent:values[0]},{label:'補助の面',hex:roles.surface,percent:values[1]},{label:'ブランド・装飾',hex:colors[0],percent:values[2]},{label:'主要な操作',hex:roles.action,percent:values[3]}];
}
export function designPalette(palette,{view='web',mode='light',goal,legibility='normal',focus='subject'}={}){
 if(!isUsage(view))view='web';
 const strategy=strategyFor(view,goal||palette.strategy||defaultGoal(view));
 const colors=palette.colors.map(normalizeHex),p=colors[0],s=colors[1],a=colors[2]||s;
 const dark=mode==='dark'&&view!=='illustration',background=dark?'#111111':'#FFFFFF',text=dark?'#FFFFFF':'#111111',min=legibility==='high'?7:4.5;
 const surface=blend(s,background,dark?.88:.94);
 let action=view==='lp'||(view==='web'&&strategy.id==='action')|| (view==='app'&&strategy.id==='brand')?a:p;
 // High readability can require a tone change even with black/white button text. Keep the original theme color separately.
 if(contrast(action,bestInk(action))<min)action=readable(action,dark?'#111111':'#FFFFFF',min);
 const roles={background,text,surface,muted:readable(dark?'#B0B0B0':'#666666',background,min),brand:p,secondary:s,accent:a,action,onAction:bestInk(action),onBrand:bestInk(p),onSecondary:bestInk(s),link:readable(p,background,min),border:readable('#888888',surface,3)};
 roles.brandSurface=contrast(p,bestInk(p))>=min?p:readable(p,dark?'#111111':'#FFFFFF',min);roles.onBrand=bestInk(roles.brandSurface);
 roles.actionBorder=readable(action,background,3);roles.focus=readable(p,background,3);roles.selected=roles.link;roles.selectedSurface=blend(p,background,.92);roles.selectedText=readable(p,roles.selectedSurface,min);
 roles.error=readable(dark?'#FF8080':'#B91C1C',background,min);roles.success=readable(dark?'#69DB9D':'#166534',background,min);
 const subject=focus==='accent'?a:p,focal=focus==='accent'?p:a;
 let sceneBackground=blend(s,'#FFFFFF',strategy.id==='bold'?.66:.9);
 if(contrast(subject,sceneBackground)<1.8)sceneBackground=blend(s,'#111111',.72);
 roles.subject=subject;roles.focal=focal;roles.sceneBackground=sceneBackground;roles.sceneLine=readable(subject,sceneBackground,3);roles.onScene=bestInk(sceneBackground);
 roles.badSurface=s;roles.badAction=a;roles.badText=p;
 const checks=view==='illustration'?
 [check('subject','主役と背景の明暗',subject,sceneBackground,1.8,'heuristic'),check('silhouette','輪郭と背景',roles.sceneLine,sceneBackground,3,'heuristic')]:
 [check('body','本文／背景',text,background,min),check('card','本文／カード',text,surface,min),check('muted','補助文字／背景',roles.muted,background,min),check('link','リンク／背景',roles.link,background,min),check('button','ボタン文字／ボタン',roles.onAction,action,min),check('brand','ブランド面の文字／背景',roles.onBrand,roles.brandSurface,min),check('boundary','操作の境界／背景',roles.actionBorder,background,3),check('focus','フォーカス枠／背景',roles.focus,background,3)];
 if(view==='app')checks.push(check('selected','選択中の文字／選択面',roles.selectedText,roles.selectedSurface,min),check('error','エラー文字／背景',roles.error,background,min),check('input','入力枠／入力面',roles.border,surface,3));
 const warnings=[...(palette.warnings||[])];
 if(view==='illustration'&&contrast(focal,sceneBackground)<1.8)warnings.push('アクセントと背景の明暗差は小さめです。小物に輪郭を付けて、実際の構図でも確認してください。');
 if(view!=='illustration'&&roles.link!==p)warnings.push(`メイン色 ${p} はそのまま小さい文字に使わず、文字用の同系色 ${roles.link} を使います。`);
 if(view!=='illustration'&&action!==(view==='lp'||(view==='web'&&strategy.id==='action')||(view==='app'&&strategy.id==='brand')?a:p))warnings.push(`読みやすさのため、ボタン用に ${action} を補助色として用意しています。元のテーマ色は保持しています。`);
 if(colors.length>4)warnings.push('色数が多いため、4色目以降は図や分類の補助に限定します。同じ画面で全部を強く使わないでください。');
 if(view==='app'&&(hueDistance(action,roles.error)<28))warnings.push('操作色とエラー色が近いため、エラーは「!」と説明文、操作はボタンの形で区別してください。');
 const instructions=view==='illustration'?
 [`主役は ${roles.subject}、背景は ${roles.sceneBackground}、小物は ${roles.focal}。`,`輪郭は ${roles.sceneLine}。グレースケールでも主役と背景を確認する。`]:
 [`背景 ${background}、本文 ${text}、カードの面 ${surface}。`,`主要ボタンは ${action}、その上の文字は ${roles.onAction}。`,`リンクは ${roles.link} と下線をセットにする。`];
 if(view==='app')instructions.push(`選択中は ${roles.selectedSurface} の面＋${roles.selectedText} の文字＋下線と「選択中」。`,`エラーは ${roles.error} と「!」＋原因の説明。破壊的な操作には明確な動詞を付ける。`);
 const avoid=view==='illustration'?'すべてのモチーフを同じ明るさ・同じ面積で強調しない。背景の派手さで主役を埋もれさせない。':view==='lp'?'申込みボタンと同じ強調色を見出し・囲み・装飾に大量に使わない。この配色だけで売上向上を保証するものではありません。':view==='app'?'未選択・選択中・エラーを色だけで区別しない。装飾をボタンと同じ形・色にしない。':'本文全体をテーマ色にしない。リンクとただの強調を色だけで区別しない。';
 const composition=compositionNotes(colors);
 const themeRoles=themeAssignments(colors,roles,{view,strategy:strategy.id,focus});
 const reason=[...(palette.intent?[palette.intent]:[]),...composition.notes,strategy.reason,view==='illustration'?'主役と背景の明暗差を確認し、区別しにくい輪郭を補います。':`文字と背景の組み合わせを${min}:1以上、必要な操作境界を3:1以上に調整します。`];
 return {view,mode:dark?'dark':'light',goal:strategy.id,legibility,focus,strategy:strategy.id,strategyLabel:strategy.label,roles,checks,warnings:[...new Set(warnings)],instructions,avoid,reason,themeRoles,harmony:composition.relationship,allocation:shareList(view,strategy.id,colors,roles),pass:checks.every(c=>c.pass),ruleIds:view==='illustration'?['hierarchy']:['text','controls','meaning','hierarchy']};
}
// Describe original theme colors separately from adjusted colors used on screen.
function themeAssignments(colors,r,{view,strategy,focus}){
 const actionIndex=view==='lp'||(view==='web'&&strategy==='action')||(view==='app'&&strategy==='brand')?(colors.length>2?2:1):0;
 return colors.map((hex,i)=>{
  let uses=[],note='';
  if(view==='illustration'){
   const subjectIndex=focus==='accent'?(colors.length>2?2:1):0,focalIndex=focus==='accent'?0:colors.length>2?2:1;
   if(i===subjectIndex)uses.push('主役のモチーフ');if(i===focalIndex)uses.push('注目させる小物');
   if(i===1){uses.push('背景の元色');note=`背景には明暗を調整した ${r.sceneBackground} を使います。`;}
  }else{
   if(i===0){uses.push('ブランド・見出しの装飾','リンクの元色');note=`リンク文字は ${r.link}。`;if(view==='app'){uses.push('選択状態の元色');note+=` 選択面 ${r.selectedSurface}、文字 ${r.selectedText}。`;}}
   if(i===1){uses.push('カード・補助面の元色');note=`広い面には ${r.surface} を使い、元の色は図や小さな装飾に。`;}
   if(i===actionIndex){uses.push(view==='lp'?'申込みボタン':'主要ボタン');note+=` ボタン ${r.action}、上の文字 ${r.onAction}。`;}
   if(i===2&&i!==actionIndex){uses.push('小さな強調・図のポイント');note='強調したい一箇所に少量使います。通常の本文には使いません。';}
  }
  if(i>=3){uses=['図・イラストの補助'];note='テーマ色の濃淡を補うための色。文字・ボタンの役割は増やさず、必要な箇所だけに使います。';}
  return {role:ROLE_NAMES[i],hex,usage:uses.join('／'),note};
 });
}
export function recommend(options={}){
 const view=isUsage(options.view)?options.view:'web',result=composePool(options),pool=result.palettes;
 const strategies=[...STRATEGIES[view]].sort((a,b)=>(a.id===options.goal?-1:b.id===options.goal?1:0)),palettes=[];let rejected=0,similar=0;
 for(const strategy of strategies){
  const ranked=pool.map((p,index)=>{const design=designPalette(p,{...options,view,goal:strategy.id});return {...p,strategy:strategy.id,design,cost:index*.35+design.warnings.length*.25+(strategy.id==='reading'||strategy.id==='quiet'?Math.max(0,oklab(p.colors[0])[0]-.7):0)};});
  const eligible=ranked.filter(p=>p.design.pass&&!p.constraintFailure);rejected+=ranked.length-eligible.length;
  eligible.sort((a,b)=>a.cost-b.cost);
  const chosen=eligible.find(p=>{const distinct=palettes.every(q=>visiblyDifferent(p.colors,q.colors));if(!distinct)similar++;return distinct;});
  if(chosen){delete chosen.cost;palettes.push(chosen);}
 }
 // A fully constrained palette is one answer, never three relabelled copies.
 if(!palettes.length){const p=pool[0];palettes.push({...p,strategy:strategies[0].id,design:designPalette(p,{...options,view,goal:strategies[0].id})});}
 const shortage=palettes.length<3?(palettes[0].constraintFailure?'除外条件に合う候補がありません。条件を見直してください。':`見た目に十分な差がある配色は${palettes.length}案です。似た案は省きました。色の固定や条件を減らすと候補を広げられます。`):'';
 return {palettes,parsed:result.parsed,evaluated:pool.length,rejected,similar,shortage,usage:view};
}
export function exportDesign(palette,options={},comment=''){
 const design=designPalette(palette,{...options,goal:palette.strategy||options.goal});
 const roleKeys=design.view==='illustration'?['background','text','sceneBackground','subject','focal','sceneLine']:['background','text','surface','muted','brand','brandSurface','onBrand','secondary','accent','action','onAction','actionBorder','link','border','focus',...(design.view==='app'?['selected','selectedSurface','selectedText','error','success']:[])];
 const exportedRoles=Object.fromEntries(roleKeys.map(k=>[k,design.roles[k]]));
 return {name:palette.name,usage:USAGES[design.view],themeColorCount:palette.colors.length,themeColors:palette.colors.map((hex,i)=>({role:ROLE_NAMES[i],hex,rgb:rgb(hex)})),...design,roles:exportedRoles,request:comment,allocationNote:'面積比率は背景を含む設計目安です。実作品の面積を測定した値ではありません。',scope:'検査対象はこの見本で指定した色の組み合わせです。実際の文字サイズ・写真・構図・操作性や全体のWCAG適合を保証するものではありません。'};
}
export function promptDesign(palette,options={},comment=''){
 const d=exportDesign(palette,options,comment);
 return `制作中の${d.usage}の配色を、次の設計に変更してください。\n方針：${d.strategyLabel}／${d.mode==='dark'?'ダーク':'ライト'}\n\n【テーマカラー ${d.themeColorCount}色】\n${d.themeRoles.map(c=>`${c.role}：${c.hex} → ${c.usage}\n${c.note}`).join('\n')}\n\n【使う場所と色】\n${d.instructions.join('\n')}\n\n【用途別の色指定（背景・文字・同系の補助色はテーマ色数の別枠）】\n${Object.entries(d.roles).filter(([k])=>!k.startsWith('bad')).map(([k,v])=>`${k}: ${v}`).join('\n')}\n\n【面積の目安】\n${d.allocation.map(x=>`${x.label} ${x.hex}：${x.percent}%`).join('\n')}\n${d.allocationNote}\n\n【この案の理由】\n${d.reason.join('\n')}\n\n【避ける使い方】\n${d.avoid}\n\n【確認した組み合わせ】\n${d.checks.map(c=>`${c.label}：${c.ratio.toFixed(2)}:1／目標${c.min}:1 ${c.pass?'通過':'要調整'}${c.standard==='heuristic'?'（構図確認の目安。WCAG基準ではない）':''}`).join('\n')}\n${d.warnings.length?'\n【注意】\n'+d.warnings.join('\n')+'\n':''}\n${d.scope}\n配色以外のレイアウト・文言・機能・人物・モチーフは維持してください。元のテーマ色を別の色に置換せず、指定した補助色を用途ごとに使ってください。\n${comment?'\n【追加の要望（原文）】\n'+comment+'\n色指定と矛盾する要望がある場合は、勝手に変更せず矛盾点を伝えてください。':''}`;
}
export function cssDesign(palette,options={}){const d=exportDesign(palette,options);return `/* ${d.usage} / ${d.strategyLabel} / ${d.mode} */\n:root {\n${palette.colors.map((c,i)=>`  --theme-${i+1}: ${c}; /* ${d.themeRoles[i].role}: ${d.themeRoles[i].usage} */`).join('\n')}\n\n${Object.entries(d.roles).filter(([k])=>!k.startsWith('bad')).map(([k,v])=>`  --color-${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}: ${v};`).join('\n')}\n}\n/* 選択状態・エラーは色だけに頼らず、文字と形でも示す。 */`;}
