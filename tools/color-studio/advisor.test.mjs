import assert from 'node:assert/strict';
import {recommend,designPalette,exportDesign,promptDesign,cssDesign,USAGES,STRATEGIES} from './advisor.mjs';
import {normalizeHex} from './engine.mjs';
let cases=0;
for(const view of Object.keys(USAGES))for(const mode of ['light','dark'])for(const legibility of ['normal','high'])for(const count of [2,3,8])for(const base of ['#FFFFFF','#777777','#FACC15','#2563EB']){
 const r=recommend({view,mode,legibility,count,source:'color',base,locks:{1:'#AA33CC'}});
 assert.equal(r.palettes.length,3);
 for(const p of r.palettes){assert.equal(p.colors.length,count);assert.equal(p.colors[0],base);assert.equal(p.colors[1],'#AA33CC');assert.ok(p.design.pass,JSON.stringify({view,mode,legibility,base,checks:p.design.checks.filter(c=>!c.pass)}));assert.equal(p.design.allocation.reduce((s,x)=>s+x.percent,0),100);assert.ok(Object.values(p.design.roles).every(normalizeHex));}
 cases++;
}
const fixed=recommend({view:'app',count:3,locks:{0:'#FFFFFF',1:'#FFFFFF',2:'#FFFFFF'}});
assert.equal(fixed.palettes.length,3);assert.ok(fixed.palettes.every(p=>p.colors.every(c=>c==='#FFFFFF')));
const p=recommend({view:'app'}).palettes[0];const d=exportDesign(p,{view:'app',mode:'dark'},'<test>');
assert.equal(d.usage,'スマホアプリ');assert.equal(d.mode,'dark');assert.ok(d.checks.some(c=>c.id==='selected'));assert.ok(d.checks.some(c=>c.id==='error'));assert.match(promptDesign(p,{view:'app'},'foo'),/選択中/);assert.match(cssDesign(p,{view:'app'}),/--color-selected-text/);
const art=recommend({view:'illustration',focus:'accent'}).palettes[0];assert.equal(art.design.roles.subject,art.colors[2]);assert.ok(art.design.checks.every(c=>c.standard==='heuristic'));
assert.equal(recommend({view:'lp',goal:'brand'}).palettes[0].strategy,'brand');
assert.notDeepEqual(recommend({view:'app'}).palettes[0].design.roles,recommend({view:'lp'}).palettes[0].design.roles);
console.log(`PASS ${cases} conditions: 4 uses, both modes, 2 legibility levels, color counts, white/gray/yellow/blue locks, all fixed, all role contrast checks, exports, app state checks, illustration focus.`);
