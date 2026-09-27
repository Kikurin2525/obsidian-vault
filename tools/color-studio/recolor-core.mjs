import {rgb,toHex,toHsl} from './engine.mjs?v=20260928-knowledge1';
import {extractColors} from './engine.mjs?v=20260928-knowledge1';
import {oklab} from './color-math.mjs?v=20260928-knowledge1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export {labToRgb} from './color-math.mjs?v=20260928-knowledge1';
import {labToRgb} from './color-math.mjs?v=20260928-knowledge1';
export const isNeutral=hex=>{const [L,a,b]=oklab(hex);return Math.hypot(a,b)<.03||L<.12||L>.985;};
export function recolorPixels(data,width,height,mappings,{tolerance=.10,keepNeutrals=true,preserveShading=true,region=null,patches=[]}={}){
 const out=new Uint8ClampedArray(data),cache=new Map(),sources=mappings.map(m=>({...m,lab:oklab(m.from),target:m.to?oklab(m.to):null,rgb:m.to?rgb(m.to):null}));let changed=0;
 const radius=clamp(tolerance,.01,.3);
 const local=patches.filter(p=>p.region&&p.to).map(p=>({...p,lab:oklab(p.from),target:oklab(p.to),rgb:rgb(p.to)}));
 const inside=(x,y,r)=>x/width>=r.x&&x/width<r.x+r.width&&y/height>=r.y&&y/height<r.y+r.height;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;if(data[i+3]===0)continue;
  const hex=toHex(data[i],data[i+1],data[i+2]);
  let patchIndex=-1;
  // Local additions override the base mapping inside their rectangle, using
  // ORIGINAL pixels. A later matching patch wins; never recolor a prior result.
  if(local.length){const lab=oklab(hex);for(let j=local.length-1;j>=0;j--){const p=local[j];if(inside(x,y,p.region)&&Math.hypot((lab[0]-p.lab[0])*.7,lab[1]-p.lab[1],lab[2]-p.lab[2])<radius){patchIndex=j;break;}}}
  if(patchIndex<0&&region&&!inside(x,y,region))continue;
  const key=((data[i]<<16)|(data[i+1]<<8)|data[i+2])+16777216*(patchIndex+1);let result;
  if(cache.has(key))result=cache.get(key);
  else{
   const hex=toHex(data[i],data[i+1],data[i+2]),lab=oklab(hex);result=null;
   if(!(keepNeutrals&&isNeutral(hex))){
    let nearest=null,distance=Infinity;
    for(const s of (patchIndex>=0?[local[patchIndex]]:sources)){const d=Math.hypot((lab[0]-s.lab[0])*.7,lab[1]-s.lab[1],lab[2]-s.lab[2]);if(d<distance){nearest=s;distance=d;}}
    if(nearest?.target&&distance<radius&&nearest.from!==nearest.to){
     const weight=1-clamp((distance-radius*.6)/(radius*.4),0,1);
     const target=preserveShading?nearest.target.map((v,j)=>v+lab[j]-nearest.lab[j]):nearest.target;
     result=distance<1e-8?nearest.rgb:labToRgb(lab.map((v,j)=>v+(target[j]-v)*weight));
    }
   }
   // Cap cache memory for photographs; flat screenshots usually have far fewer colors.
   if(cache.size<100000)cache.set(key,result);
  }
  if(result){out[i]=result[0];out[i+1]=result[1];out[i+2]=result[2];if(out[i]!==data[i]||out[i+1]!==data[i+1]||out[i+2]!==data[i+2])changed++;}
 }
 return {data:out,changed};
}

// Favor colors that occupy a meaningful area; tiny antialiasing fringes should
// not become independent recoloring targets. Retain a real source pixel as the representative.
export function dominantImageColors(data,max=8){
 const bins=new Map();let total=0;
 for(let i=0;i<data.length;i+=4){if(data[i+3]<128)continue;total++;const r=data[i],g=data[i+1],b=data[i+2],key=[r,g,b].map(v=>Math.floor(v/24)).join(','),packed=(r<<16)|(g<<8)|b;const bin=bins.get(key)||{count:0,colors:new Map()};bin.count++;bin.colors.set(packed,(bin.colors.get(packed)||0)+1);bins.set(key,bin);}
 const chosen=[];
 for(const bin of [...bins.values()].sort((a,b)=>b.count-a.count)){
  if(bin.count<Math.max(2,total*.003))continue;
  const [c]=[...bin.colors].sort((a,b)=>b[1]-a[1])[0],hex=toHex(c>>16,(c>>8)&255,c&255),lab=oklab(hex);
  if(chosen.every(h=>Math.hypot(...oklab(h).map((v,i)=>v-lab[i]))>.06))chosen.push(hex);
  if(chosen.length>=max)break;
 }
 return chosen.length?chosen:extractColors(data,max);
}

// Input is frequency-ordered. Group related hues rather than assigning slots
// cyclically. These are editable color heuristics, not object/skin recognition.
export function initialMappings(colors,count){
 const chromatic=colors.filter(c=>!isNeutral(c));
 const quietWarm=c=>{const[h,s,l]=toHsl(c);return h>=12&&h<=52&&l>72&&s<85;};
 const main=chromatic.find(c=>!quietWarm(c))||chromatic[0];
 const gap=(a,b)=>{const d=Math.abs(toHsl(a)[0]-toHsl(b)[0]);return Math.min(d,360-d);};
 const accent=chromatic.find(c=>c!==main&&!quietWarm(c)&&gap(c,main)>48&&Math.hypot(...oklab(c).slice(1))>.06);
 let extra=3;
 return colors.map(from=>{
  if(isNeutral(from)||quietWarm(from))return {from,target:'keep'};
  if(main&&gap(from,main)<=48)return {from,target:'theme:0'};
  if(accent&&gap(from,accent)<=40)return {from,target:'theme:'+Math.min(2,count-1)};
  if(oklab(from)[0]>.8&&Math.hypot(...oklab(from).slice(1))<.10)return {from,target:'theme:1'};
  return {from,target:extra<count?'theme:'+extra++:'keep'};
 });
}
