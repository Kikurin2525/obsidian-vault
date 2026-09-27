import assert from 'node:assert/strict';
import {recolorPixels,labToRgb,isNeutral,dominantImageColors} from './recolor-core.mjs';
import {oklab} from './composition.mjs';
import {rgb,toHex} from './engine.mjs';
const pixels=(...hexes)=>new Uint8ClampedArray(hexes.flatMap(c=>[...rgb(c),255]));
const colors=data=>Array.from({length:data.length/4},(_,i)=>toHex(...data.slice(i*4,i*4+3)));
for(const hex of ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#123456','#FACC15'])assert.deepEqual(labToRgb(oklab(hex)),rgb(hex));
const source=pixels('#2563EB','#FFFFFF','#111111','#888888','#DC2626');
let r=recolorPixels(source,5,1,[{from:'#2563EB',to:'#137A4A'},{from:'#FFFFFF',to:'#000000'},{from:'#DC2626',to:null}]);
assert.deepEqual(colors(r.data),['#137A4A','#FFFFFF','#111111','#888888','#DC2626']);assert.equal(r.changed,1);assert.equal(colors(source)[0],'#2563EB');
r=recolorPixels(source,5,1,[{from:'#FFFFFF',to:'#000000'}],{keepNeutrals:false});assert.equal(colors(r.data)[1],'#000000');
const rgba=new Uint8ClampedArray([...rgb('#2563EB'),0,...rgb('#2563EB'),128]);r=recolorPixels(rgba,2,1,[{from:'#2563EB',to:'#137A4A'}]);assert.deepEqual([...r.data.slice(0,4)],[...rgba.slice(0,4)]);assert.equal(r.data[7],128);assert.equal(colors(r.data)[1],'#137A4A');
const all=pixels('#2563EB','#2563EB','#2563EB','#2563EB');r=recolorPixels(all,2,2,[{from:'#2563EB',to:'#137A4A'}],{region:{x:.5,y:0,width:.5,height:.5}});assert.deepEqual(colors(r.data),['#2563EB','#137A4A','#2563EB','#2563EB']);
const shaded=pixels('#2563EB','#1F53D0','#366FF1');r=recolorPixels(shaded,3,1,[{from:'#2563EB',to:'#137A4A'}],{tolerance:.25});assert.equal(colors(r.data)[0],'#137A4A');assert.ok(oklab(colors(r.data)[1])[0]<oklab(colors(r.data)[0])[0]);assert.ok(oklab(colors(r.data)[2])[0]>oklab(colors(r.data)[0])[0]);
r=recolorPixels(shaded,3,1,[{from:'#2563EB',to:'#137A4A'}],{tolerance:.25,preserveShading:false});assert.ok(colors(r.data).every(c=>c==='#137A4A'));
const swap=pixels('#2563EB','#137A4A');r=recolorPixels(swap,2,1,[{from:'#2563EB',to:'#137A4A'},{from:'#137A4A',to:'#2563EB'}]);assert.deepEqual(colors(r.data),['#137A4A','#2563EB']);
assert.equal(isNeutral('#FFFFFF'),true);assert.equal(isNeutral('#888888'),true);assert.equal(isNeutral('#2563EB'),false);
assert.deepEqual(recolorPixels(source,5,1,[]).data,source);
assert.deepEqual(recolorPixels(source,5,1,[{from:'#2563EB',to:'#2563EB'}]).data,source);
// A preserved nearby source wins over a replacement; widening tolerance is not blanket replacement.
r=recolorPixels(pixels('#366FF1'),1,1,[{from:'#2563EB',to:'#137A4A'},{from:'#366FF1',to:null}],{tolerance:.25});assert.equal(colors(r.data)[0],'#366FF1');
console.log('PASS recoloring: known conversion references, exact colors, unchanged source, whites/blacks/grays, transparency, region isolation, shade order, flat mode, swaps, keep-color precedence, no-op.');

const dominant=pixels(...Array(1000).fill('#2563EB'),...Array(1000).fill('#FFFFFF'),'#C8D8FA');
assert.deepEqual(dominantImageColors(dominant),['#2563EB','#FFFFFF']);
console.log('PASS dominant-color extraction ignores rare edge artifacts and retains actual source colors.');
