// Layout model for the illustrative 5m square room (not the selected property's measured plan).
// u follows the right wall, v the window wall. Dimensions describe occupied floor area.
// Sources and the distinction between source guidance and game assumptions: reports/layout-047/research.md.
const p=(id,u,v,w,d,options={})=>({id,u,v,w,d,...options});
export const FLOOR_SIZE=5;
export const ROOM_PLANS={
 party:{title:'会話する場所を、ひとまとまりに',tips:['ソファの正面にローテーブル。座ったまま手が届く距離に。','冷蔵庫と収納は壁際へ。入口から席までの通り道を空ける。'],clear:[{u:4.5,v:2,w:1,d:4}],items:[
  p('sofa',.65,2.25,.9,2.05,{flip:true}),p('table',1.95,2.25,.85,.85),p('lamp',.40,3.7,.32,.32),
  p('shelf',1.65,.27,1,.42),p('plant',2.7,.30,.45,.45),p('fridge',3.45,.32,.55,.55,{scale:1.35})]},
 photo:{title:'窓際の撮影セットと、準備する場所を分ける',tips:['自然光が入る窓側に撮影セット。向かいにカメラ、横に補助照明。','着替え・メイク・荷物は奥にまとめ、撮影する人の足元と入口を空ける。'],clear:[{u:4.5,v:2,w:1,d:4}],items:[
  p('photo_sofa',.65,2.1,.9,1.8),p('photo_ltable',1.95,2.1,.8,.8),p('photo_mirror',.24,3.5,.30,.6),
  p('photo_dresser',1.1,.3,1,.45),p('photo_hanger',2.05,.3,.6,.45),p('photo_fitting',2.95,.47,.85,.85),
  p('photo_fridge',.35,.7,.5,.5,{scale:1.2}),p('photo_plight',2.7,3.15,.45,.45,{scale:1.6}),p('photo_tripod',3.25,2.1,.4,.4,{scale:1.1}),
  p('photo_chand',.85,1.95,.3,.3,{ceiling:true,width:12,lift:18})]},
 dance:{title:'鏡の前と、中央の練習フロアを空ける',tips:['鏡の前を広く使えるように、収納と休憩用の備品は端へ。','移動式バーは使わないとき壁際に寄せる。入口に荷物を置かない。'],clear:[{u:2.7,v:2.3,w:3.4,d:2.8},{u:.45,v:4.2,w:.9,d:1.6}],items:[
  p('speaker',.32,.35,.35,.25),p('barre',.35,1.8,.35,1.9,{flip:true}),p('dance_monitor',.35,3.08,.42,.60),
  p('storage',1.65,4.3,.85,.5),p('dance_stool',2.6,4.3,.38,.38),p('dance_wb',3.55,4.3,.85,.4),p('plant_dance',4.45,4.3,.4,.4)]},
 meeting:{title:'机を挟んで座り、資料を一緒に見る',tips:['椅子はテーブルを向く対面配置。椅子を引く場所と後ろの通路も確保。','モニターとホワイトボードを同じ側へまとめ、入口までの通路を空ける。'],clear:[{u:4.5,v:2,w:1,d:4}],items:[
  p('monitor',2.05,.45,1,.45),p('whiteboard',3.35,.45,.85,.45),
  p('chairs',2.1,1.9,1.5,.55,{view:'front'}),p('desk',2.1,2.7,2,.85),p('chairs',2.1,3.5,1.5,.55,{view:'rear'})]}
};
export function floorBounds(item){return {left:item.u-item.w/2,right:item.u+item.w/2,top:item.v-item.d/2,bottom:item.v+item.d/2};}
export function overlaps(a,b){const A=floorBounds(a),B=floorBounds(b);return A.left<B.right-1e-6&&A.right>B.left+1e-6&&A.top<B.bottom-1e-6&&A.bottom>B.top+1e-6;}
export function projectPlacement(item){return {...item,x:50+47*(item.u-item.v)/FLOOR_SIZE,y:34+32*(item.u+item.v+(item.w+item.d)/2)/FLOOR_SIZE-(item.lift||0),width:item.width||47*(item.w+item.d)/FLOOR_SIZE*(item.scale||1),depth:item.ceiling?-100:item.u+item.v};}
export function roomPlacements(genre,owned){return (ROOM_PLANS[genre]||ROOM_PLANS.party).items.filter(i=>owned.includes(i.id)).map(projectPlacement).sort((a,b)=>a.depth-b.depth);}
export function layoutNotes(genre){const plan=ROOM_PLANS[genre]||ROOM_PLANS.party;return `<details class="layout-notes"><summary>この配置の考え方</summary><b>${plan.title}</b><ul>${plan.tips.map(t=>`<li>${t}</li>`).join('')}</ul><small>用途別の配置例です。実際の寸法・定員は物件と家具に合わせて確認します。</small></details>`;}
