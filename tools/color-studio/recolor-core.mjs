import {rgb,toHex} from './engine.mjs?v=20260928-recolor1';
import {extractColors} from './engine.mjs?v=20260928-recolor1';
import {oklab} from './composition.mjs?v=20260928-recolor1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Inverse of Ottosson's public-domain Oklab matrices. sRGB output is gamut-clipped.
export function labToRgb([L,a,b]){
 const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;
 return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s].map(v=>Math.round(clamp(v<=.0031308?12.92*v:1.055*Math.max(0,v)**(1/2.4)-.055,0,1)*255));
}
export const isNeutral=hex=>{const [L,a,b]=oklab(hex);return Math.hypot(a,b)<.03||L<.12||L>.985;};
export function recolorPixels(data,width,height,mappings,{tolerance=.10,keepNeutrals=true,preserveShading=true,region=null}={}){
 const out=new Uint8ClampedArray(data),cache=new Map(),sources=mappings.map(m=>({...m,lab:oklab(m.from),target:m.to?oklab(m.to):null,rgb:m.to?rgb(m.to):null}));let changed=0;
 const radius=clamp(tolerance,.01,.3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;if(data[i+3]===0)continue;
  if(region&&(x/width<region.x||x/width>=region.x+region.width||y/height<region.y||y/height>=region.y+region.height))continue;
  const key=(data[i]<<16)|(data[i+1]<<8)|data[i+2];let result;
  if(cache.has(key))result=cache.get(key);
  else{
   const hex=toHex(data[i],data[i+1],data[i+2]),lab=oklab(hex);result=null;
   if(!(keepNeutrals&&isNeutral(hex))){
    let nearest=null,distance=Infinity;
    for(const s of sources){const d=Math.hypot((lab[0]-s.lab[0])*.7,lab[1]-s.lab[1],lab[2]-s.lab[2]);if(d<distance){nearest=s;distance=d;}}
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
