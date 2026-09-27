import {rgb,toHex,toHsl,fromHsl,normalizeHex,parseRequest} from './engine.mjs?v=20260928-composition1';

// Original recipes: strong identity, a supporting tone, and a deliberately limited accent.
// Names and hex combinations are authored for this tool, not copied from a palette service.
const recipes=[
 ['cobalt','コバルトとオレンジ','standard clean trust','#2458D3 #DCEBFA #ED702D','青の濃淡をつなぎ、オレンジを小さな差し色に。'],
 ['red','レッドとネイビー','standard pop','#C92C36 #F5E7D4 #17365D','赤を主役に、明るいクリームと濃い紺で明暗を分ける。'],
 ['green','グリーンとイエロー','standard natural clean','#137A4A #DCECDD #F2C744','緑のまとまりに黄色の明るさを添える。'],
 ['navy','ネイビーとゴールド','standard trust elegant','#17365D #E5EBF2 #DDAF44','紺と淡いブルーグレーをつなぎ、金色を少量だけ。'],
 ['orange','オレンジとインクブルー','standard warm pop','#E76524 #FFF0D7 #174C70','温かいオレンジを、濃い青で引き締める。'],
 ['violet','バイオレットとレモン','standard modern pop','#663BC0 #EAE3F7 #F0D64C','紫の濃淡を基調に、明るい黄色を一点に使う。'],
 ['teal','ティールとコーラル','standard clean modern','#007E80 #D6F0EB #EF735F','青緑のまとまりと、温かいコーラルの対比。'],
 ['ink','インクとブルー','standard modern trust','#24282F #E2E6EC #2864E8','無彩色で整え、青を一箇所の強調に使う。'],
 ['sea','海のブルーとサンイエロー','clean pop','#007DB8 #D7F2F5 #F1C640','青と水色の連続に、黄色の明るさを添える。'],
 ['mint','ミントとディープブルー','clean natural','#087F70 #D2F1E5 #274A91','爽やかな緑の濃淡を、深い青で引き締める。'],
 ['sky','スカイとコーラル','clean','#357BBB #DCEFFA #E98A78','広い空色と少量の温かい色で軽さを出す。'],
 ['forest','フォレストとハニー','natural elegant','#255940 #E4EBCD #DCA743','深い緑と明るい葉色に、蜂蜜色の小さな光。'],
 ['olive','オリーブとテラコッタ','natural warm muted','#65723F #F0E7CF #BD623E','黄緑と土の赤を、明るい生成りでつなぐ。'],
 ['botanical','ボタニカルとベリー','natural muted','#3B7162 #E4E7D8 #A54763','緑の広い面に、ベリーの赤を少しだけ置く。'],
 ['burgundy','バーガンディとアイボリー','elegant warm','#79283F #F1E4D2 #B68C47','深い赤とアイボリーの明暗差を主役にする。'],
 ['emerald','エメラルドとシャンパン','elegant trust','#075E51 #E2EAE4 #C9A653','深い緑の品格を、明るいニュートラルと金色で支える。'],
 ['indigo','インディゴとラベンダー','elegant modern','#3C3678 #E6E1F2 #BA7950','藍の濃淡をつなぎ、温かい銅色を少量添える。'],
 ['terracotta','テラコッタとクリーム','warm natural','#AF482D #F7E4C2 #355D57','暖かい土の赤とクリームを、青緑で落ち着かせる。'],
 ['honey','ハニーとチョコレート','warm elegant','#B77516 #FFF0CB #4D3028','黄から茶の近い色でまとめ、明るさの差で見せる。'],
 ['rose','ローズとピーチ','warm','#AD4260 #F9DECD #563A63','赤みのある色を重ね、深い紫で輪郭をつくる。'],
 ['candy','ラズベリーとソーダ','pop','#DB285C #CDEEEF #3152B8','ピンクを主役に、淡い水色と濃い青で強弱をつける。'],
 ['sun','サンイエローとロイヤルブルー','pop standard','#F2CC30 #F8EED0 #254AC6','明るい黄色を広げ、青の小さな面を強調する。'],
 ['tangerine','タンジェリンとバイオレット','pop modern','#EC6427 #FBE6D1 #6540AF','オレンジと紫の対比を、淡いオレンジの面でつなぐ。'],
 ['ocean','オーシャンとアクア','trust clean','#174C74 #DBEDF2 #008A89','青から青緑の近い色で統一し、濃淡で役割を分ける。'],
 ['slate','スレートとシグナルブルー','trust modern','#34445B #E5EAF0 #2265D8','落ち着いた紺灰色を土台に、青で操作を示す。'],
 ['sage','セージとクレイ','muted natural','#315D52 #E3E5D8 #B77860','彩度を抑えた緑と土色を、明るい面でつなぐ。'],
 ['dust','ダスティブルーとローズ','muted','#304B5D #DFE6EB #B37C86','静かな青と赤を、青みの明るい面で支える。'],
 ['taupe','プラムとペールオリーブ','muted elegant','#7D5678 #E6DFEA #BFB68A','灰みの紫を主役に、淡いオリーブを小さく添える。'],
 ['lavender','ラベンダーとバニラ','pastel','#B5A0D9 #FFF0CC #8BBDB5','淡い紫・黄・青緑を、明るさを変えながら合わせる。'],
 ['peach','ピーチとローズ','pastel','#F6C398 #FBEADD #E58B85','淡い桃色を、ローズの少し濃い色で引き締める。'],
 ['powder','パウダーブルーとバターイエロー','pastel','#75ADD8 #DFEFFB #E8CB75','青の濃淡を基調に、バターのような黄色を少し添える。'],
 ['graphite','グラファイトとオレンジ','modern','#303239 #E5E5E5 #F07832','無彩色の大きな面に、オレンジを一点だけ置く。'],
 ['mono','モノクロームとライム','modern','#202D34 #E4E8E7 #B3D750','濃い無彩色と白に近い面を、黄緑でつなぐ。']
];
export const RECIPES=recipes.map(([id,name,tags,hexes,intent])=>({id,name,tags:tags.split(' '),colors:hexes.split(' '),intent}));

// Oklab matrices by Björn Ottosson, public-domain implementation:
// https://bottosson.github.io/posts/oklab/ (2021 matrices).
export function oklab(hex){
 const [r,g,b]=rgb(hex).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
export const colorDistance=(a,b)=>Math.hypot(...oklab(a).map((x,i)=>x-oklab(b)[i]));
const chroma=hex=>Math.hypot(...oklab(hex).slice(1));
const mix=(a,b,t)=>toHex(...rgb(a).map((x,i)=>x*(1-t)+rgb(b)[i]*t));
const hueGap=(a,b)=>{const d=Math.abs(toHsl(a)[0]-toHsl(b)[0]);return Math.min(d,360-d);};
// Deliberately much larger than a just-noticeable difference. These are product
// thresholds for offering alternatives, not a standard or an aesthetic score.
export function visiblyDifferent(a,b){
 const first=a.slice(0,3),second=b.slice(0,3),diffs=first.map((c,i)=>colorDistance(c,second[i]));
 const changed=diffs.filter(d=>d>.025);
 if(!changed.length||Math.max(...diffs)<.14||changed.reduce((s,d)=>s+d,0)/changed.length<.10)return false;
 // Swapping the same swatches must not manufacture another option.
 const novel=Math.max(...first.map(c=>Math.min(...second.map(d=>colorDistance(c,d)))),...second.map(c=>Math.min(...first.map(d=>colorDistance(c,d)))));
 return novel>=.10;
}
export function compositionNotes(colors){
 const [p,s,a]=colors,lightness=colors.slice(0,3).map(c=>oklab(c)[0]),span=Math.max(...lightness)-Math.min(...lightness);
 const relationship=chroma(p)<.035||chroma(a||s)<.035?'無彩色＋有彩色':hueGap(p,a||s)<48?'近い色相でまとめる':hueGap(p,a||s)>135?'離れた色相で対比する':'色相に変化をつける';
 const support=chroma(s)<.08?'サブ色は彩りを抑え、強い色を引き立てます。':oklab(s)[0]>.82?'サブ色の明るさで、濃い色との間に余白をつくります。':'サブ色も存在感があるため、小さな面や図に限定します。';
 return {relationship,notes:[`${relationship}構成です。${support}`,span>=.22?'明るい色と深い色を分け、形や情報のまとまりを見せます。':'テーマ色の明暗差は控えめです。白・黒の基本色や輪郭で区別を補います。',...(colors.length>3?['4色目以降は補助に使います。同系色の濃淡を中心に使うと、色相が増えすぎるのを防げます。']:[])]};
}
export function isAvoided(hex,avoids){const [h,s,l]=toHsl(hex);return avoids.some(c=>c.h===null?(c.label==='黒'?l<24:c.label==='白'?l>89:s<12):(s>12&&Math.min(Math.abs(h-c.h),360-Math.abs(h-c.h))<(c.label==='茶色'?19:23)&&(c.label!=='茶色'||l<57)));}
function modify(hex,f,i){let[h,s,l]=toHsl(hex);if(f.warm&&h>70&&h<300)h=20+i*12;if(f.cool&&(h<160||h>280))h=200+i*18;if(f.pastel){s=Math.min(s,55);l=Math.max(l,74);}if(f.muted)s=Math.min(s,28);if(f.vivid&&i!==1)s=Math.max(s,70);if(f.light)l=Math.min(94,l+10);if(f.dark)l=Math.max(16,l-14);if(f.accent&&i===2){s=Math.max(s,65);l=Math.min(60,l);}return fromHsl(h,s,l);}
function extend(colors,count){const result=[...colors];const tones=[[0,'#FFFFFF',.55],[0,'#111111',.35],[2,'#FFFFFF',.55],[1,'#111111',.30],[0,'#FFFFFF',.83]];for(const [i,b,t]of tones)result.push(mix(colors[i]||colors[0],b,t));return result.slice(0,count);}
function anchoredRecipes(base){const[h,s,l]=toHsl(base),sat=Math.max(45,Math.min(78,s));return [
 ['同系色の濃淡',fromHsl(h,35,88),fromHsl(h,sat,l>55?30:65)],
 ['暖かい差し色',fromHsl(h,28,88),fromHsl(27,85,55)],
 ['涼しい差し色',fromHsl(h,20,88),fromHsl(190,65,35)],
 ['レモンの明るさ',fromHsl(h,28,86),fromHsl(49,85,58)],
 ['深いインクで締める',fromHsl(h+20,42,76),'#253753'],
 ['近い色でつなぐ',fromHsl(h+32,36,84),fromHsl(h+45,sat,42)],
 ['反対側の色を添える',fromHsl(h,22,91),fromHsl(h+180,60,43)],
 ['明暗を逆転する',fromHsl(h,30,24),fromHsl(h+165,55,80)],
 ['ローズを小さく',fromHsl(h,20,88),'#B63864'],
 ['緑を小さく',fromHsl(h,24,86),'#19774B']
 ].map(([name,s,a],i)=>({id:'anchor-'+i,name,colors:[base,s,a],tags:[],intent:''}));}
export function composePool(options={}){
 const {source='mood',mood='standard',comment='',locks={},seed=0,imageColors=[]}=options;
 const count=Math.max(2,Math.min(8,Math.round(options.count)||3)),parsed=parseRequest(comment),chosenMood=parsed.mood||mood;
 const base=source==='color'?(normalizeHex(options.base)||'#2563EB'):null;
 const fixed={};if(base)fixed[0]=base;
 const requestedRoles=new Map();
 for(const c of parsed.prefer){
  const word=c.pattern||c.hex;
  for(const [index,role]of [[0,'メイン|主役|ブランド'],[1,'サブ'],[count>2?2:1,'アクセント|差し色']]){
   if(new RegExp(`(?:${word})(?:色)?(?:を|は|が)?(?:${role})|(?:${role})(?:色)?(?:は|を|に|[：: ]){0,2}(?:${word})`,'i').test(comment))requestedRoles.set(c,index);
  }
 }
 for(const [c,index]of requestedRoles){if(base&&index===0)continue;fixed[index]=c.hex;}
 for(const c of parsed.prefer){if(requestedRoles.has(c))continue;const slot=Array.from({length:count},(_,i)=>i).find(i=>!fixed[i]);if(slot!==undefined)fixed[slot]=c.hex;}
 for(let i=0;i<count;i++)if(normalizeHex(locks[i]))fixed[i]=normalizeHex(locks[i]);
 let pool;
 if(source==='image'&&imageColors.length){
  const image=[...new Set(imageColors.map(normalizeHex).filter(Boolean))];pool=[];
  for(let i=0;i<image.length;i++)for(let j=0;j<image.length;j++)if(i!==j||image.length===1){const p=image[i],s=image[j],a=image.find((c,k)=>k!==i&&k!==j)||mix(p,'#111111',.45);pool.push({id:`image-${i}-${j}`,name:`写真の色から ${pool.length+1}`,colors:[p,s,a],tags:[],intent:'写真から抽出した色を軸に、主役と支える色を組み替えています。'});}
 }else if(fixed[0])pool=anchoredRecipes(fixed[0]);
 else pool=RECIPES.filter(p=>p.tags.includes(chosenMood));
 if(!pool.length)pool=RECIPES.filter(p=>p.tags.includes('standard'));
 if(source==='image')pool.sort((a,b)=>{const cost=p=>Math.abs(oklab(p.colors[0])[0]-.5)+Math.max(0,.06-chroma(p.colors[0]))*4+Math.max(0,.8-oklab(p.colors[1])[0])+chroma(p.colors[1]);return cost(a)-cost(b);});
 const offset=(seed*3)%pool.length;pool=[...pool.slice(offset),...pool.slice(0,offset)];
 const palettes=[],seen=new Set();
 for(const recipe of pool){
  let colors=extend(recipe.colors,count).map((c,i)=>modify(c,parsed.flags,i));
  for(const [i,c]of Object.entries(fixed))colors[i]=c;
  const warnings=[];
  if(base&&fixed[0]!==base)warnings.push('メインの固定色が基準色より優先されています。');
  // Do not repair a curated harmony by rotating individual unwanted hues.
  if(colors.some((c,i)=>!fixed[i]&&isAvoided(c,parsed.avoid)))continue;
  if(colors.some((c,i)=>fixed[i]&&isAvoided(c,parsed.avoid)))warnings.push('固定色・指定色を優先したため、避けたい色が残っています。');
  const key=colors.join();if(seen.has(key))continue;seen.add(key);
  const edited=colors.slice(0,3).some((c,i)=>c!==recipe.colors[i]);
  palettes.push({name:edited?`指定色の配色 ${palettes.length+1}・${compositionNotes(colors).relationship}`:recipe.name,recipeId:recipe.id,colors,warnings,intent:edited?'':recipe.intent,description:compositionNotes(colors).relationship});
 }
 // Contradictory exclusions may eliminate the whole library. Preserve explicit
 // colors and say why we cannot supply three, rather than silently ignoring them.
 if(!palettes.length){const colors=extend([fixed[0]||'#2563EB',fixed[1]||'#E5E7EB',fixed[2]||'#E87732'],count);for(const [i,c]of Object.entries(fixed))colors[i]=c;palettes.push({name:'条件の見直しが必要な配色',colors,warnings:['避けたい色の条件に合う候補がありません。色の固定か除外条件を減らしてください。'],constraintFailure:true});}
 return {palettes,parsed,fixed};
}
