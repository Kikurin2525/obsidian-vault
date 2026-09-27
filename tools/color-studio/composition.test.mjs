import assert from 'node:assert/strict';
import {RECIPES,oklab,colorDistance,visiblyDifferent,isAvoided} from './composition.mjs';
import {MOODS} from './engine.mjs';
import {recommend,exportDesign,promptDesign} from './advisor.mjs';
// Known Oklab references (sRGB black/white/red), not a self-roundtrip.
const near=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} != ${b}`);
oklab('#000000').forEach(x=>near(x,0));oklab('#FFFFFF').forEach((x,i)=>near(x,i?0:1));
oklab('#FF0000').forEach((x,i)=>near(x,[.62795536,.22486306,.12584630][i]));
assert.ok(colorDistance('#FF0000','#0000FF')>.5);
// Regression for the screenshot: purple, lime and orange with tiny adjustments.
assert.equal(visiblyDifferent(['#5824EE','#A6F616','#DB941C'],['#5224EE','#ACF812','#D98B22']),false);
assert.equal(visiblyDifferent(['#2563EB','#FFFFFF','#FACC15'],['#FACC15','#2563EB','#FFFFFF']),false);
let cases=0;
for(const mood of MOODS)for(const view of ['web','lp','app','illustration'])for(const count of [2,3,5,8])for(const seed of [0,1,2,3]){
 const r=recommend({mood:mood.id,view,count,seed});
 assert.ok(r.palettes.length>0&&r.palettes.length<=3);
 for(const [i,p]of r.palettes.entries()){
  assert.equal(p.colors.length,count);assert.ok(p.design.pass);
  assert.ok(p.design.themeRoles.every(c=>c.usage.length));
  for(const q of r.palettes.slice(i+1))assert.ok(visiblyDifferent(p.colors,q.colors),`${mood.id} ${view} ${count} ${seed}`);
 }cases++;
}
for(const base of ['#FFFFFF','#000000','#5722EE','#FAE70A','#16A34A'])for(const locks of [{},{1:'#AA33CC'},{0:base,1:'#FACC15',2:'#DC2626'}]){
 const r=recommend({source:'color',base,locks});for(const [i,p]of r.palettes.entries()){assert.equal(p.colors[0],base);for(const [k,v]of Object.entries(locks))assert.equal(p.colors[k],v);for(const q of r.palettes.slice(i+1))assert.ok(visiblyDifferent(p.colors,q.colors));}if(Object.keys(locks).length===3)assert.equal(r.palettes.length,1);
}
for(const comment of ['赤を避けて','黄色なしで','青をメインに黄色をアクセントにしたい']){
 const r=recommend({comment});for(const p of r.palettes){assert.ok(!p.constraintFailure);assert.ok(p.colors.every(c=>!isAvoided(c,r.parsed.avoid)));if(comment.includes('アクセント')){assert.equal(p.colors[0],'#2563EB');assert.equal(p.colors[2],'#FACC15');}}
}
const a=recommend({}),b=recommend({seed:1,referenceColors:a.palettes[0].colors});assert.notDeepEqual(a.palettes.map(p=>p.colors),b.palettes.map(p=>p.colors));
assert.equal(RECIPES.length,33);assert.equal(a.palettes.length,3);
for(const view of ['web','lp','app','illustration'])for(const count of [2,3,8]){
 const p=recommend({view,count}).palettes[0],d=exportDesign(p,{view});assert.equal(d.themeRoles.length,count);d.themeRoles.forEach((c,i)=>{assert.equal(c.hex,p.colors[i]);assert.ok(promptDesign(p,{view}).includes(c.usage));});
 if(view==='lp')assert.match(d.themeRoles[count===2?1:2].usage,/申込みボタン/);
 if(view==='app')assert.match(d.themeRoles[0].usage,/選択状態/);
}
console.log(`PASS ${cases} mood/use/count/seed combinations, screenshot duplicates, swapped colors, color distance references, exact locks, exclusions, role-specific requests, distinct regeneration, per-color role exports.`);
