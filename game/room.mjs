import {roomPlacements} from './room-layout.mjs?v=051';
import {ITEMS,GENRES} from './data.mjs?v=053';
const BOXES=[[12,63,320,225],[373,50,270,245],[736,8,120,305],[1000,4,225,306],[50,319,240,304],[416,314,220,310],[685,384,207,223],[1004,382,190,231],[14,632,296,286],[373,698,237,183],[654,665,283,241],[976,616,268,313],[3,973,330,244],[347,967,291,254],[685,924,227,302],[997,925,251,318]];
const CLIPS=[
'3% 58%,5% 41%,12% 28%,21% 17%,33% 8%,43% 4%,66% 8%,83% 18%,93% 33%,97% 53%,95% 76%,90% 93%,83% 97%,79% 93%,74% 81%,66% 76%,59% 74%,52% 74%,43% 77%,33% 80%,21% 80%,10% 78%,7% 81%,5% 76%',
'2% 49%,5% 37%,14% 29%,24% 25%,26% 14%,32% 15%,34% 5%,42% 4%,44% 9%,51% 8%,57% 13%,57% 18%,53% 23%,65% 24%,83% 33%,94% 42%,97% 53%,94% 62%,85% 69%,75% 72%,74% 86%,68% 92%,56% 97%,40% 96%,29% 91%,26% 82%,26% 72%,12% 66%,5% 58%',
'24% 1%,68% 1%,82% 10%,96% 32%,78% 36%,60% 37%,61% 82%,90% 88%,96% 94%,79% 99%,26% 99%,7% 94%,9% 89%,41% 82%,41% 37%,5% 32%,14% 10%',
'38% 0%,62% 2%,73% 15%,91% 12%,91% 24%,98% 36%,87% 51%,70% 55%,73% 65%,63% 72%,68% 81%,65% 95%,54% 99%,42% 99%,31% 94%,28% 78%,39% 73%,34% 66%,20% 61%,4% 47%,10% 25%,22% 22%,25% 9%',
'13% 27%,25% 12%,43% 3%,56% 1%,69% 5%,81% 17%,81% 76%,98% 83%,93% 86%,77% 82%,26% 98%,18% 96%,14% 90%,1% 88%,2% 84%,13% 86%',
'3% 1%,51% 9%,65% 9%,73% 19%,68% 44%,59% 51%,66% 60%,80% 74%,96% 91%,92% 94%,59% 66%,60% 98%,54% 99%,51% 66%,13% 95%,9% 93%,43% 61%,45% 50%,2% 36%',
'9% 14%,26% 5%,54% 3%,78% 10%,93% 24%,96% 66%,86% 87%,64% 97%,40% 97%,17% 88%,4% 70%,3% 33%',
'4% 10%,26% 4%,68% 4%,94% 11%,96% 82%,82% 93%,50% 96%,18% 91%,3% 83%',
'9% 12%,40% 3%,44% 0%,67% 8%,92% 16%,94% 97%,67% 88%,43% 79%,9% 91%',
'7% 23%,20% 10%,38% 4%,65% 5%,87% 18%,97% 33%,97% 65%,86% 82%,69% 97%,45% 93%,7% 77%,2% 66%',
'1% 3%,10% 2%,95% 22%,96% 27%,84% 27%,84% 82%,99% 88%,100% 94%,81% 90%,73% 98%,68% 95%,75% 86%,75% 24%,26% 14%,26% 62%,37% 68%,31% 74%,22% 70%,7% 81%,2% 76%,18% 62%,18% 12%,1% 10%',
'3% 9%,33% 1%,98% 12%,97% 95%,78% 99%,2% 77%',
'0% 30%,37% 9%,96% 27%,98% 33%,88% 38%,87% 83%,77% 99%,64% 93%,62% 49%,24% 65%,24% 79%,15% 87%,5% 77%,5% 39%,0% 38%',
'13% 8%,30% 5%,40% 12%,39% 33%,56% 20%,74% 17%,84% 25%,83% 51%,94% 63%,92% 70%,94% 90%,88% 95%,82% 73%,60% 88%,55% 99%,48% 94%,43% 72%,34% 66%,28% 84%,22% 87%,22% 65%,12% 61%,8% 84%,3% 80%,5% 54%,9% 48%',
'3% 2%,97% 15%,97% 65%,59% 58%,59% 81%,97% 90%,96% 94%,58% 89%,27% 99%,20% 95%,48% 82%,48% 56%,3% 45%',
'4% 1%,97% 15%,97% 63%,91% 65%,90% 90%,98% 93%,97% 96%,88% 95%,68% 100%,65% 97%,81% 88%,81% 67%,12% 53%,12% 78%,31% 83%,30% 88%,10% 83%,3% 87%,1% 83%,5% 78%'
];
const PHOTO_BOXES=[[36,45,379,363],[478,8,280,404],[903,4,283,390],[105,421,204,393],[457,531,343,239],[947,427,202,379],[96,838,213,384],[468,815,314,389],[882,807,321,406]];
const PHOTO_ART={photo_sofa:0,photo_dresser:1,photo_chand:2,photo_mirror:3,photo_ltable:4,photo_plight:5,photo_tripod:6,photo_hanger:7,photo_fitting:8};
export function itemArt(it,cls=''){
 if(PHOTO_ART[it.id]!==undefined){const n=PHOTO_ART[it.id];return `<span class="item-art ${cls}" role="img" data-item-id="${it.id}" aria-label="${it.name}"><span class="sprite-window" style="width:100%;height:100%;background-image:url('assets/web/photo-furniture-v040.webp');background-size:300% 300%;background-position:${n%3*50}% ${Math.floor(n/3)*50}%"></span></span>`;}
 if(!Number.isInteger(it.sprite)&&!Number.isInteger(it.equipmentArt)&&!['fridge','battery','adapter','guide','wifi','restore'].includes(it.id))return `<span class="item-wordmark ${cls}">${it.quantity||'一式'}</span>`;
 const isFurniture=Number.isInteger(it.sprite),n=isFurniture?it.sprite:it.equipmentArt??({fridge:0,battery:1,adapter:2,guide:3,wifi:3,restore:3}[it.id]??3);
 const [x,y,w,h]=isFurniture?BOXES[n]:[n%2*627,Math.floor(n/2)*627,627,627],size=1254,m=Math.max(w,h);
 const clip=isFurniture?CLIPS[n]:n===0?'polygon(17% 14%,42% 7%,75% 14%,80% 23%,80% 77%,72% 91%,35% 89%,19% 80%)':'none';
 return `<span class="item-art ${cls}" role="img" data-item-id="${it.id}" aria-label="${it.name}"><span class="sprite-window" style="width:${w/m*100}%;height:${h/m*100}%;background-image:url('assets/web/${isFurniture?'furniture-white':'equipment-v2'}.webp');background-size:${size/w*100}% ${size/h*100}%;background-position:${x/(size-w)*100}% ${y/(size-h)*100}%;--cut:${isFurniture?'polygon('+clip+')':clip}"></span></span>`;
}
function itemRatio(it){const box=PHOTO_ART[it.id]!==undefined?PHOTO_BOXES[PHOTO_ART[it.id]]:Number.isInteger(it.sprite)?BOXES[it.sprite]:[0,0,627,627];return box[2]/box[3];}
export function roomArt(genreId,owned=[],interactive=false){
 const g=GENRES.find(g=>g.id===genreId)||GENRES[0];
 const base=g.id==='dance'&&owned.includes('mirror')?'room-dance-mirror-v039':`room-${g.id}-v2`;
 return `<div class="room-art" data-genre="${g.id}"><img class="room-base" src="assets/web/${base}.webp" width="1200" height="800" decoding="async" alt="${g.concept}の部屋"><div class="placed-items">${roomPlacements(g.id,owned).map(p=>{const it=ITEMS.find(i=>i.id===p.id);if(!it)return '';const rear=p.view==='rear',light=p.id==='photo_plight',art=light?`<span class="item-art static-art" role="img" aria-label="撮影セットへ向けた照明"><img class="texture" src="assets/web/ring-light-rear-v047.webp" width="400" height="600" alt=""></span>`:rear?`<span class="item-art static-art" role="img" aria-label="テーブルに向けたチェア"><img class="texture" src="assets/web/chairs-rear-v047.webp" width="600" height="600" alt=""></span>`:itemArt(it);return `<${interactive?'button':'span'} class="placed ${p.flip?'placed-flipped':''}" data-layout-item="${p.id}" ${interactive?`data-action="item" data-id="${p.id}" title="${it.name}"`:''} style="left:${p.x}%;top:${p.y}%;width:${p.width}%;--art-ratio:${light?2/3:rear?1:itemRatio(it)}">${art}</${interactive?'button':'span'}>`;}).join('')}</div></div>`;
}
export function guestArt(id){const g=GENRES.find(g=>g.id===id)||GENRES[0];return `<div class="guest-art" role="img" aria-label="${g.audience}を楽しむお客さん" style="background-position:${g.story%2*100}% ${Math.floor(g.story/2)*100}%"></div>`;}
export function portrait(n,cls=''){if(n===3)return `<div class="portrait portrait-single ${cls}"><img src="assets/web/cleaner-yuko-v037.webp" alt="清掃外注の優子さん・46歳"></div>`;return `<div class="portrait ${cls}"><img src="assets/web/cast-chibi-v3.webp" alt="清掃外注の候補者" style="transform:translateX(-${n*100/3}%)"></div>`;}

// Build display textures from the generated white-backed atlas at runtime.
// Only edge-connected background is transparent; ivory furniture stays opaque.
const atlasCache=new Map(),textureCache=new Map();
function loadAtlas(file){if(!atlasCache.has(file))atlasCache.set(file,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=`assets/web/${file}.webp`;}));return atlasCache.get(file);}
function texture(it){const photo=PHOTO_ART[it.id];if(photo!==undefined)return photoTexture(photo);const furniture=Number.isInteger(it.sprite),n=furniture?it.sprite:it.equipmentArt??({fridge:0,battery:1,adapter:2,guide:3,wifi:3,restore:3}[it.id]??3),file=furniture?'furniture-white':'equipment-v2',key=`${file}-${n}`;
 if(!textureCache.has(key))textureCache.set(key,loadAtlas(file).then(img=>{const [x,y,w,h]=furniture?BOXES[n]:[n%2*627,Math.floor(n/2)*627,627,627],c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,x,y,w,h,0,0,w,h);const pixels=ctx.getImageData(0,0,w,h),d=pixels.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const visit=p=>{if(seen[p])return;seen[p]=1;const k=p*4,min=Math.min(d[k],d[k+1],d[k+2]),max=Math.max(d[k],d[k+1],d[k+2]);if(min>=234&&max-min<18){d[k+3]=0;queue[tail++]=p;}};
 for(let i=0;i<w;i++){visit(i);visit((h-1)*w+i);}for(let j=0;j<h;j++){visit(j*w);visit(j*w+w-1);}while(head<tail){const p=queue[head++],col=p%w;if(col>0)visit(p-1);if(col<w-1)visit(p+1);if(p>=w)visit(p-w);if(p<w*(h-1))visit(p+w);}
 ctx.putImageData(pixels,0,0);return c.toDataURL('image/png');}));return textureCache.get(key);
}
function photoTexture(n){const key=`photo-${n}`;if(!textureCache.has(key))textureCache.set(key,loadAtlas('photo-furniture-v040').then(img=>{const [x,y,bw,bh]=PHOTO_BOXES[n],c=document.createElement('canvas');c.width=bw;c.height=bh;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,x,y,bw,bh,0,0,bw,bh);const pixels=ctx.getImageData(0,0,c.width,c.height),d=pixels.data,w=c.width,h=c.height,seen=new Uint8Array(w*h),queue=[];const visit=p=>{if(seen[p])return;seen[p]=1;const k=p*4;if(Math.min(d[k],d[k+1],d[k+2])>=239&&Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2])<12){d[k+3]=0;queue.push(p);}};for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}if(n===7)visit(Math.floor(h*.6)*w+Math.floor(w*.5));for(let i=0;i<queue.length;i++){const p=queue[i];if(p%w)visit(p-1);if(p%w<w-1)visit(p+1);if(p>=w)visit(p-w);if(p<w*(h-1))visit(p+w);}ctx.putImageData(pixels,0,0);return c.toDataURL('image/png');}));return textureCache.get(key);}
export function paintArt(root=document){for(const el of root.querySelectorAll('.item-art')){const it=ITEMS.find(i=>i.id===el.dataset.itemId);if(!it)continue;texture(it).then(url=>{if(!el.isConnected)return;const img=document.createElement('img');img.src=url;img.alt='';img.className='texture';el.replaceChildren(img);}).catch(()=>{});}}
