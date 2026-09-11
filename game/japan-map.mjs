import {JAPAN_SHAPES} from './japan-map-data.mjs?v=052';
export const MAP_REGIONS=[
 {id:'hokkaido',name:'北海道',color:'#a5d5f6',prefs:['北海道']},
 {id:'tohoku',name:'東北',color:'#abc8f1',prefs:['青森県','岩手県','宮城県','秋田県','山形県','福島県']},
 {id:'kanto',name:'関東',color:'#f3b4cb',prefs:['茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県']},
 {id:'chubu',name:'中部',color:'#f4d68e',prefs:['新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県']},
 {id:'kinki',name:'近畿',color:'#bada9d',prefs:['三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県']},
 {id:'chugoku',name:'中国',color:'#a4d9c7',prefs:['鳥取県','島根県','岡山県','広島県','山口県']},
 {id:'shikoku',name:'四国',color:'#d4b7e7',prefs:['徳島県','香川県','愛媛県','高知県']},
 {id:'kyushu',name:'九州',color:'#f4b894',prefs:['福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県']},
 {id:'okinawa',name:'沖縄',color:'#7fd2cf',prefs:['沖縄県']}
];
export const regionFor=pref=>MAP_REGIONS.find(r=>r.prefs.includes(pref));
export function selectMapPrefecture(filter,pref){if(!regionFor(pref))return filter;return {...filter,pref,query:'',minimum:'all',page:0,mapRegion:regionFor(pref).id};}
export function mapViewBox(id){
 const region=MAP_REGIONS.find(r=>r.id===id);if(!region)return '0 0 820 790';
 const shapes=JAPAN_SHAPES.filter(p=>region.prefs.includes(p.name));
 const x=Math.min(...shapes.map(p=>p.focusBounds[0]))-22,y=Math.min(...shapes.map(p=>p.focusBounds[1]))-22;
 return [x,y,Math.max(120,Math.max(...shapes.map(p=>p.focusBounds[2]))-x+22),Math.max(120,Math.max(...shapes.map(p=>p.focusBounds[3]))-y+22)].join(' ');
}
export function japanMap(geo,f){
 const selected=JAPAN_SHAPES.find(p=>p.name===f.pref)||JAPAN_SHAPES[12];
 const region=MAP_REGIONS.find(r=>r.id===f.mapRegion)||regionFor(selected.name);
 const counts=new Map();for(const s of geo.stations)counts.set(s.pref,(counts.get(s.pref)||0)+1);
 const ready=geo.stations.length>0,total=geo.stations.length.toLocaleString('ja-JP');
 const marker=selected.center,markerScale=Math.min(1,Number(mapViewBox(f.mapZoom).split(' ')[2])/500);
 const active=!f.mapZoom||f.mapZoom==='all'||regionFor(selected.name).id===f.mapZoom;
 return `<section class="japan-picker" aria-label="日本地図から都道府県を選ぶ">
 <div class="map-heading"><div><span class="eyebrow">さあ、全国へ出店！</span><h2>あなたの一室は、どの街に？</h2></div><span class="map-total">47都道府県${ready?`<b>${total}駅</b>`:''}</span></div>
 <p class="map-help">地図をタップして都道府県を選ぼう。地方ボタンで拡大できます。</p>
 <div class="map-region-tabs" role="group" aria-label="地方を拡大"><button data-action="map-region" data-id="all" aria-pressed="${!f.mapZoom||f.mapZoom==='all'}">全国</button>${MAP_REGIONS.map(r=>`<button data-action="map-region" data-id="${r.id}" aria-pressed="${f.mapZoom===r.id}" style="--region-color:${r.color}">${r.name}</button>`).join('')}</div>
 <div class="map-layout"><div class="map-ocean">
 <span class="map-ocean-caption">${f.mapZoom&&f.mapZoom!=='all'?MAP_REGIONS.find(r=>r.id===f.mapZoom)?.name||'全国':'JAPAN / 全国が、あなたの舞台。'}</span>
 <svg class="japan-map" viewBox="${mapViewBox(f.mapZoom)}" role="group" aria-label="都道府県をタップして選択"><title>日本全国の出店エリア</title>
 ${!f.mapZoom||f.mapZoom==='all'?'<rect class="okinawa-inset" x="80" y="115" width="265" height="150" rx="18"/><text class="inset-label" x="96" y="141">沖縄（別枠）</text>':''}
 ${JAPAN_SHAPES.filter(p=>!f.mapZoom||f.mapZoom==='all'||MAP_REGIONS.find(r=>r.id===f.mapZoom)?.prefs.includes(p.name)).map(p=>`<path d="${p.d}" class="map-pref ${p.name===f.pref?'is-selected':''}" style="--pref-color:${regionFor(p.name).color}" role="button" tabindex="-1" aria-label="地図で${p.name}を選ぶ" aria-pressed="${p.name===f.pref}" data-action="map-pref" data-id="${p.name}"><title>${p.name}</title></path>`).join('')}
 ${active?`<g class="map-marker" transform="translate(${marker[0]},${marker[1]}) scale(${markerScale})" aria-hidden="true"><circle r="8"/><path d="M0,-11 L-12,-26 Q-19,-49 0,-49 Q19,-49 12,-26 Z"/><text y="-29" text-anchor="middle">★</text><rect x="-45" y="12" width="90" height="27" rx="12"/><text class="map-marker-name" y="31" text-anchor="middle">${selected.name}</text></g>`:''}
 </svg></div>
 <aside class="map-choice"><span class="eyebrow">都道府県を選ぶ</span><h3>${region.name}</h3><div class="map-pref-buttons" role="group" aria-label="${region.name}の都道府県">${region.prefs.map(p=>`<button data-action="map-pref" data-id="${p}" aria-pressed="${f.pref===p}">${p}</button>`).join('')}</div>
 <div class="map-destination" role="status">${active?`<small>いま選んでいるエリア</small><strong>${selected.name}</strong><p>${geo.error?'駅データを読み込めませんでした。':ready?`${(counts.get(selected.name)||0).toLocaleString('ja-JP')}駅から出店先を探せます`:'駅データを読み込み中…'}</p>`:`<strong>${region.name}のどこにする？</strong><p>地図か上の県名をタップしてください。</p>`}</div>
 ${geo.error?'<button class="secondary" data-action="reload-geography">駅データを再読み込み</button>':''}
 <button class="primary map-next" data-action="map-stations" ${!ready||!active?'disabled':''}>${active?selected.name+'の駅を見る →':'都道府県を選ぼう'}</button><p class="map-next-note">次に、駅と周辺の物件を選びます。</p>
 </aside></div>
 <details class="map-source"><summary>地図について</summary><p>出典：<a href="https://www.gsi.go.jp/kankyochiri/gm_jpn.html" target="_blank" rel="noopener noreferrer">国土地理院「地球地図日本」</a> / <a href="https://github.com/dataofjapan/land" target="_blank" rel="noopener noreferrer">dataofjapan</a> を加工。選択用に形を簡略化し、一部の島を省略。沖縄は別枠で表示しています。</p></details>
 </section>`;
}
