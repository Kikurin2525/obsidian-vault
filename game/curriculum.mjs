export const PREFECTURES=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
export const PORTALS=[{id:'bazaar',name:'スペースバザール',fee:.30,genres:['party','photo'],line:'写真と用途で探す予約広場。パーティー・撮影のベンチマークに。'},{id:'instaroom',name:'インスタルーム',fee:.35,genres:['dance','meeting'],line:'時間貸しの予約案内所。ダンス・会議室のベンチマークに。'}];
export const INSPECTIONS=[
 {id:'route',title:'駅から歩く・搬入経路を測る',source:'教材 第2部2-5 / 付録⑤',tip:'広告の徒歩分数だけでなく、坂・暗さ・入口・階段幅・大型家具の搬入を確認。'},
 {id:'measure',title:'有効面積・床・壁・電源を調べる',source:'教材 第2部2-5 / 付録⑤',tip:'図面の面積には水回りも含まれます。使える広さ、床の水平、契約アンペア・コンセント、回線の引込経路、鏡の設置面を確認。'},
 {id:'noise',title:'音と振動を現地で確かめる',source:'教材 第2部2-5・2-7',tip:'RC造や隣が空室というだけで判断しない。仲介担当と上下・隣の区画への伝わり方を確認。'},
 {id:'permission',title:'用途承認・原状回復・残置物を聞く',source:'教材 第2部2-6',tip:'無人運営と不特定多数の出入りまで説明。エアコンが設備か残置物か、敷金償却も確認。'},
 {id:'key',title:'鍵・予備鍵・ゴミのルールを確認',source:'教材 第2部2-5 / 第6部6-5',tip:'「入れない」を防ぐ予備鍵の置き場と、利用後のゴミ処理を契約前に考える。'}
];
export const SETUP_TASKS=[
 {id:'power',title:'電気の利用開始',service:'でんき日和',source:'教材 第4部4-6',tip:'開業日から逆算。照明・空調・機材の容量も確認。',choices:[{id:'standard',label:'既存容量で契約',cost:0,weekly:1400,days:1,quality:0,detail:'基本の照明・空調・機材を動かすプラン。'}]},
 {id:'water',title:'水道の利用開始',service:'まちの水道窓口',source:'教材 第4部4-6',tip:'トイレと流しが使えることを、掲載前に確認。',choices:[{id:'start',label:'利用開始を申し込む',cost:0,weekly:350,days:1,quality:0,detail:'水回りの通水確認を含む。'}]},
 {id:'gas',title:'ガスは使う？',service:'ガスのよりみち',source:'教材 第4部4-6＋今回の指定',tip:'必須ではありません。この候補はガスなしでもトイレ・冷暖房を使えます。',choices:[{id:'none',label:'契約しない',cost:0,weekly:0,days:0,quality:0,detail:'固定費を増やさずに始める。'},{id:'start',label:'給湯用に契約',cost:5000,weekly:500,days:2,quality:1,detail:'立ち会いが必要。週の固定費が増える。'}]},
 {id:'internet',title:'Wi-Fiの手配',service:'つながる便',source:'教材 第4部4-6',tip:'ネット回線は工事待ちがある。開通までのつなぎと、利用者向け案内も考える。',choices:[{id:'router',label:'ホームルーターで始める',cost:12000,weekly:1000,days:1,quality:0,detail:'すぐ使える。会議・配信では速度の安定性が課題。'},{id:'fiber',label:'光回線を申し込む',cost:22000,weekly:1200,days:14,quality:2,detail:'開通まで14日。作業を並行して、待ち時間を減らす。'}]},
 {id:'interior',title:'内装をどうする？',service:'つくる人ひろば',source:'教材 第4部4-3〜4-4',tip:'そのままで勝てるなら工事は不要。見た目への投資が回収を遅らせないかを比べる。',choices:[{id:'reuse',label:'既存内装を活かす',cost:0,weekly:0,days:0,quality:0,detail:'使える床・壁を残す。修繕が必要な物件には選べない。'},{id:'diy',label:'自分で塗装・床の表層を整える',cost:25000,weekly:0,days:4,quality:2,detail:'表面の傷を補修し、小物を配置。電気・構造に関わる工事は専門業者へ。'},{id:'local',label:'近所の内装店に必要な範囲を依頼',cost:75000,weekly:0,days:7,quality:4,detail:'範囲・追加費用・原状回復を含む見積りを照合。'},{id:'design',label:'世界観が得意な施工店へ依頼',cost:150000,weekly:0,days:12,quality:7,detail:'撮影・パーティーと相性が良いが、初期費用と工期は重い。'}]},
 {id:'photos',title:'掲載写真を用意',service:'フォトの助っ人',source:'教材 第5部5-4',tip:'写真は部屋の入口。設営後に、客が利用する姿を想像できる写真を撮る。',choices:[{id:'self',label:'自分で明るく撮影',cost:0,weekly:0,days:1,quality:0,detail:'水平・広さ・備品・使い方を見せる。'},{id:'pro',label:'室内撮影が得意な人に依頼',cost:30000,weekly:0,days:3,quality:5,detail:'必要なカットを先に伝える。見た目だけで売上は保証されない。'}]},
 {id:'website',title:'公式HPを用意する？',service:'セルフサイト工房',source:'教材 第5部5-6',tip:'リピーターがつく用途では直予約が育つ。HPを作っただけで予約は増えない。',choices:[{id:'none',label:'まずはポータルで始める',cost:0,weekly:0,days:0,quality:0,detail:'後から追加できる。まず利用者の反応を見る。'},{id:'simple',label:'予約付きの公式HPを作る',cost:15000,weekly:250,days:2,quality:0,detail:'決済3.5%のゲーム設定。定期客の増加に応じ直予約が育つ。'}]},
 {id:'ads',title:'広告の設定',service:'みつかる広告 / パシャ広場',source:'教材 第5部5-7',tip:'広告費も利益から引く。用途・商圏・予算を決め、費用に見合う予約か確認する。',choices:[{id:'none',label:'広告なしで反応を見る',cost:0,weekly:0,days:0,quality:0,detail:'ポータルと口コミからスタート。'},{id:'search',label:'駅名×用途の検索広告',cost:0,weekly:2500,days:0,quality:0,detail:'週2,500円。ダンス・会議室の目的検索と相性が良い。'},{id:'social',label:'写真で伝えるSNS広告',cost:0,weekly:3000,days:0,quality:0,detail:'週3,000円。撮影・パーティーの体験を伝える。'}]}
];
export const sourceFor=id=>SETUP_TASKS.find(t=>t.id===id);
export const SETUP_STEPS=['ライフライン','内装・家具','設営・撮影','掲載・集客','オープン'];
export const LESSONS={genre:'やりたいジャンルと、儲かる条件は両方見る。教材 第1部',area:'駅の規模だけで契約しない。教材 第2部2-2',research:'同条件の主役・上位店・下位店を比べる。教材 第3部3-1',forecast:'売上ではなく、手数料と費用を引いた利益で考える。教材 第3部',goal:'回収後の2店目も、1店目と同じ調査から。教材 第8部'};
