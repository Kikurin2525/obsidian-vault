import {BOOK_ITEMS} from './equipment-catalog.mjs?v=053';
export const GENRES=[
 {id:'party',name:'パーティー',concept:'木漏れ日のカフェパーティー',audience:'誕生日会・友人との集まり',line:'丸い家具と、あたたかな明かり。会話が弾むカフェのような一室。',needs:['sofa','table'],rates:[1400,1800,2200],rent:92000,area:25,work:130000,basic:80000,demand:25,visits:3,wear:24,utility:2500,story:0,first:'この部屋、かわいい！ 今日はここでゆっくりしよう。',returnLine:'次の誕生日も、ここにしようよ。',care:'飲食後のテーブル・床・ゴミまわりを確認',difficulty:'雰囲気 × 週末需要。清掃は多め'},
 {id:'photo',name:'撮影',concept:'白とピンクの推し活アトリエ',audience:'推し活撮影・商品撮影',line:'白いアーチとくすみピンク。撮りたい世界を、光と背景でつくる。',needs:['backdrop','softbox'],rates:[1800,2200,2600],rent:95000,area:26,work:160000,basic:80000,demand:19,visits:1,wear:17,utility:2300,story:1,first:'この背景で撮りたかった！ 光もやわらかいね。',returnLine:'次の撮影も、ここを予約しよう。',care:'背景の汚れ・小物の復元・ライトを点検',difficulty:'背景 × 光。予約の波が大きい'},
 {id:'dance',name:'ダンス',concept:'繰り返し通える練習スタジオ',audience:'少人数の練習・個人レッスン',line:'大きな鏡、踊りやすい床、扱いやすい音響。練習に集中できる場所。',needs:['mirror','speaker'],rates:[1100,1500,1900],rent:88000,area:32,work:100000,basic:65000,demand:29,visits:1,wear:20,utility:2800,story:2,first:'動きがよく見える！ ここなら集中して練習できそう。',returnLine:'来週の練習も、同じ時間で取ろう。',care:'床・鏡・音響と忘れ物を点検',difficulty:'鏡への初期投資 × 定期利用'},
 {id:'meeting',name:'会議室',concept:'集中できる小さなワークルーム',audience:'打ち合わせ・講座・共同作業',line:'しっかりした机と椅子、つながる通信。仕事が気持ちよく進む一室。',needs:['desk','chairs'],rates:[800,1100,1400],rent:58000,area:18,work:30000,basic:50000,demand:30,visits:1,wear:12,utility:2000,story:3,first:'机も椅子も、ちょうどいい。すぐ始められるね。',returnLine:'次の打ち合わせも、ここでいいね。',care:'机・椅子・ホワイトボード・配線を確認',difficulty:'少額で開業 × 平日の稼働'}
];
// sprite is the tile in the 4 x 4 illustrated furniture atlas, never a vector icon.
const LEGACY_ITEMS=[
 {id:'sofa',name:'カーブソファ',genre:['party'],category:'furniture',price:45000,appeal:4,sprite:0,desc:'背もたれから座面まで曲線のソファ。カフェのように向き合って話せます。',quote:'この丸いソファ、包まれる感じで落ち着くね。'},
 {id:'table',name:'丸いカフェテーブル',genre:['party'],category:'furniture',price:12000,appeal:2,sprite:1,desc:'みんなで囲める丸いローテーブル。ケーキと飲み物を置けます。',quote:'丸いテーブルだと、みんなの顔が見えるね。'},
 {id:'lamp',name:'木のフロアライト',genre:['party'],category:'furniture',price:8000,appeal:3,sprite:2,desc:'電球色の間接照明。白い天井灯は基本設備に含まれています。',quote:'この明かり、写真もかわいく撮れるね。'},
 {id:'plant',name:'大きなフェイクグリーン',genre:['party','photo'],category:'furniture',price:5000,appeal:1,sprite:3,desc:'コンセプトを崩さず、背景に緑を添えます。',quote:'緑があると、写真の雰囲気もいいね。'},
 {id:'backdrop',name:'白いアーチ背景',genre:['photo'],category:'furniture',price:30000,appeal:4,sprite:4,desc:'人物や推しグッズが映える白いアーチ。撮影の主役になる背景です。',quote:'このアーチ、推しの色が映える！'},
 {id:'softbox',name:'LEDソフトボックス',genre:['photo'],category:'equipment',price:20000,appeal:3,sprite:5,desc:'直射光をやわらかくして、商品や顔の影を整えます。',quote:'ライトがあるから、曇りでもきれいに撮れた。'},
 {id:'stool',name:'ピンクの丸いスツール',genre:['photo'],category:'furniture',price:8000,appeal:2,sprite:6,desc:'白い背景になじむ、くすみピンクの撮影小物。',quote:'このピンク、世界観にぴったり。'},
 {id:'plinth',name:'白いディスプレイ台',genre:['photo'],category:'furniture',price:12000,appeal:2,sprite:7,desc:'グッズや花を立体的に飾る、円柱の撮影台。',quote:'高さが変えられて、グッズを飾りやすい！'},
 {id:'mirror',name:'練習用の連結ミラー',genre:['dance'],category:'furniture',price:280000,appeal:4,sprite:8,desc:'小さな練習室向けの連結鏡と安全な設置。全壁面の鏡施工とは別の仕様です。',quote:'足元まで見えるから、動きを合わせやすい。'},
 {id:'speaker',name:'Bluetoothスピーカー',genre:['dance'],category:'equipment',price:8000,appeal:2,sprite:9,desc:'再生の手順もそばに。音量は近隣に配慮して使います。',quote:'スマホにつなぐだけで、すぐ練習できた。'},
 {id:'barre',name:'移動式レッスンバー',genre:['dance'],category:'equipment',price:18000,appeal:2,sprite:10,desc:'基礎練習やストレッチの幅を広げる備品。使わないときは壁際へ。',quote:'基礎練習もできるの、うれしい。'},
 {id:'storage',name:'荷物用の収納棚',genre:['dance','meeting'],category:'furniture',price:6000,appeal:1,sprite:11,desc:'練習する床や会議の机に、バッグを置かずに済みます。',quote:'荷物の置き場があるから、広く使えるね。'},
 {id:'desk',name:'オークの会議テーブル',genre:['meeting'],category:'furniture',price:15000,appeal:3,sprite:12,desc:'資料とPCを並べられる、ぐらつかない会議机。',quote:'資料を広げても、机に余裕がある。'},
 {id:'chairs',name:'座りやすい会議チェア',genre:['meeting'],category:'furniture',price:15000,appeal:3,sprite:13,desc:'人数分の椅子一式。長い打ち合わせの快適さを支えます。',quote:'長く座っても、疲れにくい椅子だね。'},
 {id:'monitor',name:'共有用モニター',genre:['meeting'],category:'equipment',price:30000,appeal:3,sprite:14,desc:'画面を共有しながら、全員で資料を確認。HDMIケーブル込み。',quote:'同じ画面を見ながら話せるから、進みが早い！'},
 {id:'whiteboard',name:'キャスター付きホワイトボード',genre:['meeting'],category:'equipment',price:10000,appeal:2,sprite:15,desc:'マーカーとイレイザーも一緒に。講座や議論に。',quote:'書いて整理したら、話がすっきりまとまった。'},
 {id:'shelf',name:'バッグの置き場所',genre:['party','photo'],category:'care',price:6000,appeal:1,sprite:11,desc:'床にバッグを置かないための小さな心遣い。',quote:'荷物置き、助かる。考えてくれてるね。'},
 {id:'guide',name:'写真つき入室案内',genre:['all'],category:'care',price:1000,appeal:0,mark:'入室',desc:'鍵の場所と開け方を、最初の1枚に。',quote:'写真のとおりに来たら、迷わなかった！'},
 {id:'wifi',name:'Wi-FiのQR案内',genre:['all'],category:'care',price:500,appeal:0,mark:'Wi-Fi',desc:'開通済みの回線につながる手順を、見つけやすく。',quote:'Wi-Fi、読み込むだけなんだ。便利。'},
 {id:'restore',name:'片付けの見本写真',genre:['all'],category:'care',price:800,appeal:0,mark:'復元',desc:'家具と備品の戻し方を写真に。お客さんにも清掃の外注さんにも伝わります。',quote:'戻し方の写真がある。これなら安心。'},
 {id:'battery',name:'予備の電池と置き場案内',genre:['all'],category:'equipment',price:1000,appeal:0,mark:'予備',desc:'リモコンが動かないときに、お客さん自身で交換できる備え。',quote:'予備の電池まである！ 助かった。'},
 {id:'fridge',name:'ケーキの入る冷蔵庫',genre:['party','photo'],category:'equipment',price:22000,appeal:2,mark:'冷蔵',desc:'ケーキ箱をしまえる棚の高さ。誕生日会や生誕祭の持ち物から考えます。',quote:'ケーキが箱ごと入る。ここにしてよかった！'},
 {id:'adapter',name:'HDMI・USB-C変換セット',genre:['meeting'],category:'equipment',price:3000,appeal:1,mark:'接続',desc:'持ち込みPCの端子の違いをカバーします。',quote:'変換アダプタもあって、すぐ始められた。'}
];
export const ITEMS=[...BOOK_ITEMS,...LEGACY_ITEMS.filter(i=>!BOOK_ITEMS.some(b=>b.id===i.id)).map(i=>({...i,legacy:!['guide','wifi','restore','battery'].includes(i.id)}))];
ITEMS.find(i=>i.id==='photo_fridge').equipmentArt=0;
for(const g of GENRES)g.needs=BOOK_ITEMS.filter(i=>i.required&&(i.genre.includes('all')||i.genre.includes(g.id))).map(i=>i.id);
export const STAFF=[
 {id:'haruka',name:'はるか',age:28,skill:4,idea:5,diligence:3,visitFee:1500,portrait:0,line:'使う人の気持ちで、お掃除と改善を。',strength:'気づきと改善提案',ideaItem:'shelf'},
 {id:'mio',name:'美緒',age:34,skill:5,idea:2,diligence:4,visitFee:1800,portrait:1,line:'次の利用までに、気持ちよく整えます。',strength:'丁寧な清掃と復元',ideaItem:'restore'},
 {id:'kenta',name:'健太',age:31,skill:3,idea:3,diligence:5,visitFee:1300,portrait:2,line:'点検したところを、写真でお伝えします。',strength:'点検と写真報告',ideaItem:'battery'},
 {id:'yuko',name:'優子',age:46,skill:5,idea:3,diligence:4,visitFee:1900,portrait:3,line:'汚れに合う道具と手順で、次の方を迎えます。',strength:'水回りの清掃と仕上げ',ideaItem:'restore'}
];
