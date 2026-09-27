import {recolorPixels} from './recolor-core.mjs?v=20260928-knowledge1';
let source=null,thumbnail=null;
self.onmessage=({data:job})=>{
 try{
  if(job.type==='init'){source=job.source;thumbnail=job.thumbnail;return;}
  if(!source)throw new Error('画像が読み込まれていません');
  const result=recolorPixels(source.data,source.width,source.height,job.variants[job.selected],{...job.options,patches:job.localVariants?.[job.selected]||[]});
  const thumbs=job.variants.map((m,i)=>recolorPixels(thumbnail.data,thumbnail.width,thumbnail.height,m,{...job.options,patches:job.localVariants?.[i]||[]}).data);
  self.postMessage({id:job.id,result:result.data,changed:result.changed,thumbs},[result.data.buffer,...thumbs.map(x=>x.buffer)]);
 }catch(error){self.postMessage({id:job.id,error:error.message});}
};
