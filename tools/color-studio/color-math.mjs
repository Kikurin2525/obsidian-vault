import {rgb,toHex} from './engine.mjs?v=20260928-knowledge1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Oklab matrices by Björn Ottosson, public-domain implementation:
// https://bottosson.github.io/posts/oklab/ (2021 matrices).
export function oklab(hex){
 const [r,g,b]=rgb(hex).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
export const colorDistance=(a,b)=>Math.hypot(...oklab(a).map((x,i)=>x-oklab(b)[i]));
// Inverse of Ottosson's public-domain Oklab matrices. sRGB output is gamut-clipped.
export function labToRgb([L,a,b]){
 const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;
 return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s].map(v=>Math.round(clamp(v<=.0031308?12.92*v:1.055*Math.max(0,v)**(1/2.4)-.055,0,1)*255));
}

export function oklch(hex){const[L,a,b]=oklab(hex);return [L,Math.hypot(a,b),(Math.atan2(b,a)*180/Math.PI+360)%360];}
// Binary search chroma until the un-clipped linear sRGB components fit.
export function fromOklch(L,C,h){
 L=clamp(L,0,1);h=h*Math.PI/180;
 const linear=c=>{const a=Math.cos(h)*c,b=Math.sin(h)*c,l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];};
 let lo=0,hi=Math.max(0,C);for(let i=0;i<18;i++){const c=(lo+hi)/2;if(linear(c).every(v=>v>=0&&v<=1))lo=c;else hi=c;}
 return toHex(...labToRgb([L,lo*Math.cos(h),lo*Math.sin(h)]));
}
