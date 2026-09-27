export const MOODS = [
 {id:'standard',label:'スタンダード',title:'ブルー × イエロー',colors:['#2563EB','#FACC15','#DC2626','#16A34A','#F97316','#9333EA','#06B6D4','#DB2777']},
 {id:'natural',label:'ナチュラル',title:'森と、やわらかな光',colors:['#52796F','#B9C6AD','#DDA892','#E3D7B8','#889E81','#796A56','#DBE6D5','#B6957D']},
 {id:'clean',label:'爽やか',title:'風の通る、青',colors:['#0284C7','#22C55E','#FACC15','#2563EB','#06B6D4','#F97316','#0D9488','#7C3AED']},
 {id:'elegant',label:'上品',title:'静かな、余韻',colors:['#312E81','#D97706','#BE123C','#7C3AED','#0F766E','#1E3A8A','#DB2777','#CA8A04']},
 {id:'warm',label:'温かい',title:'日だまりの、ぬくもり',colors:['#EA580C','#FACC15','#DC2626','#16A34A','#F59E0B','#C2410C','#BE123C','#92400E']},
 {id:'pop',label:'ポップ',title:'今日は、遊び心を',colors:['#E11D48','#FACC15','#2563EB','#22C55E','#9333EA','#F97316','#DB2777','#06B6D4']},
 {id:'trust',label:'信頼感',title:'まっすぐな、信頼',colors:['#1E40AF','#0284C7','#F59E0B','#0D9488','#16A34A','#7C3AED','#DC2626','#334155']},
 {id:'muted',label:'くすみ',title:'落ち着いた、くすみカラー',colors:['#52796F','#B9C6AD','#DDA892','#E3D7B8','#889E81','#796A56','#DBE6D5','#B6957D']},
 {id:'pastel',label:'パステル',title:'ふんわり、夢の色',colors:['#C8A5BC','#BBD6D0','#E8D8A7','#B9C5E0','#E8BCB2','#C9D3AF','#DBBEDA','#A6CCD8']},
 {id:'modern',label:'モダン',title:'余白と、小さな刺激',colors:['#111111','#2563EB','#F97316','#6B7280','#16A34A','#9333EA','#DC2626','#06B6D4']}
];
const STANDARD_PALETTES = [
 {name:'ブルー × イエロー',colors:['#2563EB','#FACC15','#DC2626','#16A34A','#F97316','#9333EA','#06B6D4','#DB2777']},
 {name:'ブルー × オレンジ',colors:['#2563EB','#F97316','#16A34A','#FACC15','#DC2626','#9333EA','#06B6D4','#DB2777']},
 {name:'レッド × ネイビー',colors:['#DC2626','#1E3A8A','#FACC15','#16A34A','#F97316','#9333EA','#06B6D4','#DB2777']},
 {name:'グリーン × イエロー',colors:['#16A34A','#FACC15','#2563EB','#F97316','#DC2626','#9333EA','#06B6D4','#DB2777']},
 {name:'オレンジ × ブルー',colors:['#EA580C','#2563EB','#FACC15','#16A34A','#DC2626','#9333EA','#06B6D4','#DB2777']},
 {name:'パープル × イエロー',colors:['#9333EA','#FACC15','#06B6D4','#16A34A','#F97316','#2563EB','#DC2626','#DB2777']}
];
export const ROLE_NAMES=['メイン','サブ','アクセント','第2アクセント','深い補助色','明るい補助色','中間の補助色','淡い補助色'];
export const CSS_ROLES=['primary','secondary','accent','support-1','support-2','support-3','support-4','support-5'];
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function normalizeHex(s){let t=String(s).trim();if(/^#?[0-9a-f]{3}$/i.test(t))t='#'+t.replace('#','').split('').map(x=>x+x).join('');else if(/^[0-9a-f]{6}$/i.test(t))t='#'+t;return /^#[0-9a-f]{6}$/i.test(t)?t.toUpperCase():null;}
export function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
export function toHex(r,g,b){return '#'+[r,g,b].map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('').toUpperCase();}
export function toHsl(hex){let [r,g,b]=rgb(hex).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2,h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return [(h+360)%360,s*100,l*100];}
export function fromHsl(h,s,l){h=((h%360)+360)%360;s=clamp(s,0,100)/100;l=clamp(l,0,100)/100;let c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let q=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return toHex(...q.map(v=>(v+m)*255));}
export function luminance(hex){return rgb(hex).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
export function contrast(a,b){let l1=luminance(a),l2=luminance(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);}
export function inkFor(hex){return contrast(hex,'#111111')>=contrast(hex,'#FFFFFF')?'#111111':'#FFFFFF';}
const COLOR_WORDS=[{label:'青',pattern:'青|ブルー|blue|ネイビー|紺',h:215,hex:'#2563EB'}, {label:'赤',pattern:'赤|レッド|red',h:2,hex:'#DC2626'}, {label:'緑',pattern:'緑|グリーン|green',h:145,hex:'#16A34A'}, {label:'黄色',pattern:'黄色|黄|イエロー|yellow',h:49,hex:'#FACC15'}, {label:'ピンク',pattern:'ピンク|pink|桃色',h:337,hex:'#DB2777'}, {label:'紫',pattern:'紫|パープル|purple',h:275,hex:'#9333EA'}, {label:'オレンジ',pattern:'オレンジ|橙|orange',h:28,hex:'#F97316'}, {label:'水色',pattern:'水色|シアン|cyan',h:190,hex:'#06B6D4'}, {label:'茶色',pattern:'茶色|ブラウン|brown',h:28,hex:'#92400E'}, {label:'黒',pattern:'黒|ブラック|black',h:null,hex:'#111111'}, {label:'白',pattern:'白|ホワイト|white',h:null,hex:'#FFFFFF'}, {label:'グレー',pattern:'グレー|灰色|gray|grey',h:null,hex:'#808080'}];
const moodWords=[['standard',/スタンダード|標準|ベーシック|基本色|standard|basic/i],['muted',/くすみ|低彩度|muted/i],['natural',/ナチュラル|自然|北欧|オーガニック|森|植物|natural/i],['clean',/爽やか|さわやか|清潔|透明感|海|空|clean/i],['elegant',/上品|高級|エレガント|ラグジュアリー|大人|elegant/i],['warm',/温か|暖か|ぬくもり|カフェ|秋|warm/i],['pop',/ポップ|元気|楽しい|子ども|子供|にぎやか|カラフル|pop/i],['trust',/信頼|誠実|ビジネス|企業|知的|trust/i],['pastel',/パステル|かわいい|可愛い|可愛い|春|pastel/i],['modern',/モダン|都会|ミニマル|シンプル|スタイリッシュ|modern/i]];
export function parseRequest(text=''){
 const normalized=text.toLowerCase().replace(/\s+/g,' '),avoid=[],prefer=[],labels=[];
 for(const c of COLOR_WORDS){const word=`(?:${c.pattern})`;const neg=new RegExp(`${word}(?:色)?(?:は|を|が|系は|系を|系)?(?:あまり)?(?:使わない|使いたくない|入れない|避け|なし|無し|抜き|除外|禁止|いらない|不要|やめ|なしで)|(?:避けたい色|使わない色)[：: ]*${word}|(?:no|avoid|without) +${word}`,'i');
  const match=new RegExp(word,'i');if(neg.test(normalized)){avoid.push(c);labels.push(`${c.label}を避ける`);}else if(match.test(normalized)){prefer.push(c);labels.push(`${c.label}を取り入れる`);}}
 const flags={pastel:/淡く|淡い|薄く|薄い|パステル|やさしく|優しく|ふんわり|柔らか|やわらか|soft|pastel/i.test(text),muted:/落ち着|くすみ|控えめ|彩度を下げ|低彩度|シック|muted/i.test(text),vivid:/鮮やか|鮮やかに|ビビッド|彩度を上げ|高彩度|vivid/i.test(text),light:/明るく|明るい|明度を上げ|bright/i.test(text),dark:/暗く|暗い|深み|濃く|濃い|ダーク|明度を下げ|dark/i.test(text),warm:/暖色|温かく|暖かく/i.test(text),cool:/寒色|涼し|クール/i.test(text),accent:/アクセント.*(?:強|目立)|メリハリ|コントラスト.*(?:強|高)/i.test(text)};
 const fl={pastel:'淡い色に',muted:'彩度を抑える',vivid:'鮮やかに',light:'明るく',dark:'深い色に',warm:'暖色寄り',cool:'寒色寄り',accent:'アクセントを強く'};for(const k in flags)if(flags[k])labels.push(fl[k]);
 let mood=null;for(const [id,re]of moodWords)if(re.test(text))mood=id;
 if(mood)labels.push(`雰囲気：${MOODS.find(m=>m.id===mood).label}`);
 const hexes=[...text.matchAll(/#[0-9a-f]{6}\b/ig)].map(m=>m[0].toUpperCase());for(const hex of hexes)prefer.push({label:hex,hex,h:toHsl(hex)[0]});
 if(hexes.length)labels.push(`指定色 ${hexes.join('・')}`);
 return {avoid,prefer,flags,mood,labels:[...new Set(labels)]};
}
const distanceHue=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
function isAvoided(hex,avoids){const [h,s,l]=toHsl(hex);return avoids.some(c=>c.h===null?(c.label==='黒'?l<24:c.label==='白'?l>89:s<12):(s>12&&distanceHue(h,c.h)<(c.label==='茶色'?19:23)&&(c.label!=='茶色'||l<57)));}
function removeAvoided(hex,avoids){if(!isAvoided(hex,avoids))return hex;let[h,s,l]=toHsl(hex);for(let n=1;n<=24;n++){const candidate=fromHsl(h+n*31,Math.max(s,28),clamp(l,30,82));if(!isAvoided(candidate,avoids))return candidate;}return hex;}
export function ratios(n){const maps={2:[70,30],3:[60,30,10],4:[55,25,12,8],5:[50,25,12,8,5],6:[45,25,12,8,6,4],7:[42,24,12,8,6,5,3],8:[40,23,12,8,6,5,4,2]};return maps[n]||maps[3];}
export function generatePalettes({count=3,mood='standard',source='mood',base='#2563EB',imageColors=[],referenceColors=[],comment='',locks={},seed=0}={}){
 count=clamp(Math.round(count)||3,2,8);const parsed=parseRequest(comment),m=MOODS.find(x=>x.id===(parsed.mood||mood))||MOODS[0];const names=['基本の組み合わせ','色相を少し変える','アクセントを変える','深い色で引き締める','鮮やかな組み合わせ','別の組み合わせ'];const standard=m.id==='standard'&&source==='mood'&&!referenceColors.length;const offsets=[0,-18,25,155,70,-40],results=[];
 for(let v=0;v<6;v++){
  let colors=[];for(let i=0;i<count;i++){
   let raw=standard?STANDARD_PALETTES[v].colors[i]:m.colors[i%m.colors.length];
   if(source==='color'){const [h,s,l]=toHsl(base);const shift=i===0?0:([0,30,180,150,210,60,270,90][i]+offsets[v]);raw=i===0?base:fromHsl(h+shift+seed*13,clamp(s+(i===2?8:0),0,100),[l,52,50,40,65,58,34,60][i]);}
   else if(source==='image'&&imageColors.length){raw=imageColors[i%imageColors.length];if(i>=imageColors.length){let[h,s,l]=toHsl(raw);raw=fromHsl(h+(i+1)*25,s,clamp(l+((i%2)?16:-16),18,85));}}
   if(referenceColors.length&&referenceColors[i%referenceColors.length])raw=referenceColors[i%referenceColors.length];
   let [h,s,l]=toHsl(raw);
   if((v||seed)&&!(standard&&seed===0)){h+=offsets[v]*(i===0?.2:1)+(referenceColors.length?((seed%7)-3)*3:(seed%17)*9);s+=([0,0,6,0,10,0][v]);l+=([0,4,0,-6,0,3][v]);}
   const f=parsed.flags;if(f.warm)h=distanceHue(h,30)<90?h:30+(i*19)%55;if(f.cool)h=180+(i*27+v*9)%90;
   if(f.pastel){s=Math.min(s,45);l=Math.max(l,72)+(i%2)*4;}if(f.muted)s=Math.min(s,26);if(f.vivid)s=Math.max(s,65);if(f.light)l+=12;if(f.dark)l-=18;if(f.accent&&i===Math.min(2,count-1)){s=Math.max(s,62);l=48;}
   colors.push(fromHsl(h,clamp(s,0,100),clamp(l,0,100)));
  }
  const anchor=source==='color'?base:null;
  parsed.prefer.slice(0,count-(anchor?1:0)).forEach((c,i)=>{let index=i+(anchor?1:0);let[h,s,l]=toHsl(c.hex);if(!/^#/.test(c.label)){h+=[0,-6,8,-9,12,3][v];l+=[0,8,-5,-10,4,12][v];}if(parsed.flags.pastel&&!/^#/.test(c.label))l=Math.max(l,76);if(parsed.flags.muted&&!/^#/.test(c.label))s=Math.min(s,26);colors[index]=/^#/.test(c.label)?c.hex:fromHsl(h,s,l);});
  colors=colors.map(c=>removeAvoided(c,parsed.avoid));if(anchor)colors[0]=normalizeHex(anchor)||'#2563EB';
  const warnings=[];if(anchor&&normalizeHex(locks[0])&&normalizeHex(locks[0])!==normalizeHex(anchor))warnings.push('メインの固定色が基準色より優先されています。');for(let i=0;i<count;i++){if(normalizeHex(locks[i]))colors[i]=normalizeHex(locks[i]);if(isAvoided(colors[i],parsed.avoid))warnings.push('固定色・基準色を優先したため、避けたい色が残っています。');}
  const seen=new Set();for(let i=0;i<count;i++){if(seen.has(colors[i])&&!locks[i]&&!(anchor&&i===0)){let[h,s,l]=toHsl(colors[i]);let candidate=colors[i];for(let j=1;j<=24&&seen.has(candidate);j++)candidate=removeAvoided(fromHsl(h+j*17,s,clamp(l+(j%2?7:-9),15,89)),parsed.avoid);colors[i]=candidate;}seen.add(colors[i]);}
  results.push({name:standard&&seed===0?STANDARD_PALETTES[v].name:v===0&&seed===0?m.title:names[v],description:standard&&seed===0?'基本色を使った定番配色':['バランス重視','色相に変化','アクセントに変化','明暗に変化','印象をはっきり','新しい組み合わせ'][v],colors,warnings:[...new Set(warnings)]});
 }
 const unique=results.filter((p,i)=>results.findIndex(q=>q.colors.join()===p.colors.join())===i);return {palettes:unique,parsed};
}
export function extractColors(data,maxColors=8){
 const buckets=new Map();for(let i=0;i<data.length;i+=4){if(data[i+3]<128)continue;let r=data[i],g=data[i+1],b=data[i+2],key=[r,g,b].map(v=>Math.floor(v/24)).join(',');const prev=buckets.get(key)||{sum:[0,0,0],n:0};prev.sum[0]+=r;prev.sum[1]+=g;prev.sum[2]+=b;prev.n++;buckets.set(key,prev);}
 const sorted=[...buckets.values()].sort((a,b)=>b.n-a.n).map(x=>({color:toHex(...x.sum.map(v=>v/x.n)),n:x.n}));const chosen=[];
 for(const x of sorted){if(chosen.every(c=>Math.hypot(...rgb(c).map((v,i)=>v-rgb(x.color)[i]))>55))chosen.push(x.color);if(chosen.length>=maxColors)break;}
 return chosen;
}
export function exportData(palette,view='web',comment=''){
 const names={web:'Webサイト',lp:'LP',illustration:'イラスト'},n=palette.colors.length;
 return {name:palette.name,usage:names[view]||names.web,themeColorCount:n,themeColors:palette.colors.map((hex,i)=>({role:ROLE_NAMES[i],token:CSS_ROLES[i],hex,rgb:rgb(hex),ratio:ratios(n)[i],onColor:inkFor(hex)})),foundation:{background:'#FFFFFF',text:'#111111'},ratioNote:'比率はテーマカラー同士の目安。白い背景の面積は含みません。',request:comment};
}
export function exportPrompt(palette,view,comment){const d=exportData(palette,view,comment),illustration=view==='illustration';return `制作中の${d.usage}の配色を、以下の指定に変更してください。\n\n【テーマカラー：${d.themeColorCount}色】\n${d.themeColors.map(c=>`${c.role}：${c.hex}（RGB ${c.rgb.join(', ')}）／配色内の比率 ${c.ratio}%`).join('\n')}\n\n【基本色・使い方】\n背景：#FFFFFF ／ 本文・線：#111111\n${illustration?'メインを主役のモチーフ、サブを周囲のモチーフ、アクセントを注目させたい小物に使ってください。構図・人物・形・文字・モチーフは変更しないでください。':'メインを主要ボタン・ブランドの装飾、サブをカードや図の面、アクセントを注目させたい箇所に使ってください。通常の本文は黒のままにしてください。'}\n${d.themeColorCount===2?'2色のためアクセントはメイン色を兼用してください。\n':''}${d.ratioNote}\nテーマ色の上の文字は、${d.themeColors.map(c=>`${c.hex}上は${c.onColor}`).join('、')}。\n${illustration?'':'小さい文字は背景とのコントラスト比4.5:1以上を確保。足りない箇所は基本色で調整してください。\n'}色以外の${illustration?'描画スタイル':'レイアウト・文言・機能・画像'}は維持してください。勝手にテーマ色を追加せず、必要なら先に理由を説明してください。${comment.trim()?`\n\n【追加の要望（原文）】\n${comment.trim()}\n※色コードと要望が矛盾する場合は、色コードを優先し、矛盾点を教えてください。`:''}`;}
export function exportCss(palette){const d=exportData(palette);return `:root {\n  /* テーマカラー ${d.themeColorCount}色 */\n${d.themeColors.map(c=>`  --color-${c.token}: ${c.hex};\n  --color-on-${c.token}: ${c.onColor};`).join('\n')}\n  /* 基本色（テーマカラーの色数には含めない） */\n  --color-background: #FFFFFF;\n  --color-text: #111111;\n}\n\n/* テーマカラー内の使用比率の目安\n${d.themeColors.map(c=>`   ${c.role}: ${c.ratio}%`).join('\n')}\n   白い背景の面積は含めない。 */`;}
