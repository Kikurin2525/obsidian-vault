import assert from 'node:assert/strict';
import {KNOWLEDGE,SOURCES,HARMONIES} from './palette-knowledge.mjs';
import {composePool} from './composition.mjs';
import {recommend,exportDesign,paletteBalance} from './advisor.mjs';
import {initialMappings,recolorPixels} from './recolor-core.mjs';
import {oklch,fromOklch,colorDistance} from './color-math.mjs';
assert.equal(SOURCES.length,19);assert.equal(KNOWLEDGE.length,38);
assert.equal(new Set(KNOWLEDGE.map(r=>r.id)).size,38);
KNOWLEDGE.forEach(r=>{assert.ok(SOURCES.some(s=>s.id===r.source));assert.ok(['実装','指示','手動確認'].includes(r.action));});
assert.ok(composePool({}).palettes.length>=40,'Default library must expand beyond the previous 8');
for(const harmony of Object.keys(HARMONIES)){
 const r=recommend({harmony,count:4});assert.ok(r.palettes.length);r.palettes.forEach(p=>{assert.ok(p.design.pass);assert.equal(p.colors.length,4);if(harmony!=='auto')assert.equal(p.family,harmony);assert.ok(p.colors.slice(0,3).every(c=>colorDistance(c,p.colors[3])>.06),'Fourth color must be visibly separate from existing colors');assert.ok(p.design.appliedRules.length>=15);});
}
for(const hex of ['#2563EB','#FF0000','#00FF00','#FFFF00','#6D28D9'])assert.ok(colorDistance(hex,fromOklch(...oklch(hex)))<.01);
for(const h of [0,60,120,180,240,300])assert.ok(Math.abs(oklch(fromOklch(.6,.4,h))[0]-.6)<.005,'Gamut mapping should preserve lightness');
const bad=['#2563EB','#FF00FF','#2761EC'],good=['#2563EB','#E5E7EB','#FACC15'];assert.ok(paletteBalance(good).cost<paletteBalance(bad).cost);
const d=exportDesign(recommend({view:'app',mode:'dark',legibility:'high'}).palettes[0],{view:'app',mode:'dark',legibility:'high'});
assert.ok(d.checks.filter(c=>['hover','pressed'].includes(c.id)).every(c=>c.pass&&c.min===7));assert.equal(d.checks.filter(c=>['hover','pressed'].includes(c.id)).length,2);assert.ok(d.sources.length>=10);assert.ok(d.roles.actionPressed);
// Screenshot regression: orange figures must be accent, not the pale support.
const rows=initialMappings(['#FFFFFF','#17365D','#FF7B13','#111111','#F7DCC1'],4);
assert.equal(rows.find(r=>r.from==='#17365D').target,'theme:0');assert.equal(rows.find(r=>r.from==='#FF7B13').target,'theme:2');assert.equal(rows.find(r=>r.from==='#F7DCC1').target,'keep');
assert.equal(initialMappings(['#17365D','#FF7B13'],2)[1].target,'theme:1');
// A fourth color is placed on only one half of a shared blue region.
const source=new Uint8ClampedArray([23,54,93,255,23,54,93,255,255,123,19,255,255,255,255,255]);
const maps=[{from:'#17365D',to:'#2563EB'},{from:'#FF7B13',to:'#FACC15'}];
const patch={from:'#17365D',to:'#16A34A',region:{x:.25,y:0,width:.25,height:1}};
const r=recolorPixels(source,4,1,maps,{patches:[patch],preserveShading:false});
assert.deepEqual([...r.data],[37,99,235,255,22,163,74,255,250,204,21,255,255,255,255,255]);
assert.deepEqual([...source.slice(4,8)],[23,54,93,255],'Source remains immutable');
const later={...patch,to:'#EF4444'};
assert.deepEqual([...recolorPixels(source,4,1,maps,{patches:[patch,later]}).data.slice(4,8)],[239,68,68,255]);
const scoped=recolorPixels(source,4,1,maps,{region:{x:0,y:0,width:.25,height:1},patches:[patch]});
assert.deepEqual([...scoped.data.slice(4,8)],[22,163,74,255],'Explicit local patch works outside base region');
assert.deepEqual([...scoped.data.slice(8,12)],[255,123,19,255]);
console.log('PASS 38 sourced rules, 19 references, 6 harmony families, gamut preservation, role ranking, app state contrast, orange accent regression, local fourth color, overlap priority, immutable source and region semantics.');
