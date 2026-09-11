// Monthly rent per tsubo for fictional small, upper-floor commercial units.
// Public office reports are reference points, not observations of every station.
export const RENT_MODEL='regional-20260911';
export const RENT_SOURCES=[
 {label:'新宿の募集オフィス相場（2026年9月）',url:'https://growth-office.com/market/tokyo/shinjuku'},
 {label:'東京のオフィス市況（2026年8月）',url:'https://www.e-miki.com/rent/tokyo.html'},
 {label:'札幌のオフィス市況（2026年8月）',url:'https://www.e-miki.com/rent/sapporo.html'},
 {label:'仙台のオフィス市況（2026年8月）',url:'https://www.e-miki.com/rent/sendai.html'},
 {label:'鳥取県西部の事業用募集物件',url:'https://www.homemate-yonago.co.jp/tenant/'}
];
const hubs=[
 ['東京都',24000,['新宿','西新宿','新宿三丁目']],
 ['東京都',28000,['渋谷','表参道','原宿','東京','大手町']],
 ['東京都',30000,['銀座','銀座一丁目']],
 ['東京都',20000,['池袋','恵比寿','六本木','品川','新橋']],
 ['東京都',16000,['新宿御苑前','東新宿','高田馬場','大久保','新大久保','秋葉原','上野','吉祥寺']],
 ['東京都',12000,['立川','町田','八王子','調布']],
 ['神奈川県',16000,['横浜','みなとみらい']],['神奈川県',12500,['川崎','武蔵小杉','新横浜']],
 ['埼玉県',13000,['大宮']],['埼玉県',11000,['浦和']],['埼玉県',10000,['川口','和光市']],
 ['千葉県',11000,['船橋','西船橋','柏','千葉','海浜幕張']],
 ['大阪府',17000,['大阪','梅田','大阪梅田','東梅田','西梅田']],['大阪府',15000,['なんば','難波','大阪難波','心斎橋']],
 ['大阪府',12000,['本町','新大阪','天王寺']],['京都府',14000,['京都','烏丸','四条','京都河原町']],
 ['兵庫県',12000,['三ノ宮','三宮','神戸三宮','元町']],
 ['愛知県',14000,['名古屋','名鉄名古屋','近鉄名古屋','栄']],
 ['福岡県',14000,['博多','天神','西鉄福岡（天神）']],
 ['北海道',11000,['札幌','さっぽろ','大通','すすきの']],
 ['宮城県',10000,['仙台','広瀬通','青葉通一番町']],
 ['広島県',11000,['広島','紙屋町東','紙屋町西','八丁堀']],
 ['沖縄県',10000,['県庁前','おもろまち','牧志']],
 ['鳥取県',6500,['鳥取','米子']]
];
const cityBases=[
 ['大阪府',10500,['大阪市']],['神奈川県',9500,['横浜市','川崎市']],
 ['愛知県',9000,['名古屋市']],['京都府',9000,['京都市']],['兵庫県',8500,['神戸市']],
 ['福岡県',8500,['福岡市']],['北海道',8000,['札幌市']],['宮城県',7500,['仙台市']],
 ['広島県',8000,['広島市']],['埼玉県',8500,['さいたま市','川口市','和光市']],
 ['千葉県',8500,['千葉市','船橋市','市川市','浦安市']],['沖縄県',8000,['那覇市']]
];
const capitals=['青森市','盛岡市','秋田市','山形市','福島市','水戸市','宇都宮市','前橋市','新潟市','富山市','金沢市','福井市','甲府市','長野市','岐阜市','静岡市','津市','大津市','奈良市','和歌山市','鳥取市','松江市','岡山市','山口市','徳島市','高松市','松山市','高知市','佐賀市','長崎市','熊本市','大分市','宮崎市','鹿児島市'];
const regional={東京都:7500,神奈川県:7000,埼玉県:6500,千葉県:6500,大阪府:6500,京都府:6000,兵庫県:6000,愛知県:6000,福岡県:5500,沖縄県:5500};
const round=n=>Math.round(n/100)*100;
export function rentMarket(location){
 const l=location||{},pref=l.pref||'',city=l.city||'',name=l.name||'';
 let base=regional[pref]||4800,label='地方・郊外';
 const hub=hubs.find(([p,,names])=>p===pref&&names.includes(name));
 const urban=cityBases.find(([p,,names])=>p===pref&&names.some(n=>city.startsWith(n)));
 if(hub){base=hub[1];label=base>=20000?'都心の主要商圏':'都市の中心・主要駅';}
 else if(pref==='東京都'&&city.endsWith('区')){
  base=['千代田区','中央区','港区','新宿区','渋谷区'].includes(city)?18000:12500;label='東京23区';
 }else if(urban){base=urban[1];label='大都市の生活・業務エリア';}
 else if(capitals.some(n=>city.startsWith(n))){base=6500;label='地方都市';}
 else if(Number.isFinite(l.pop1km)&&l.pop1km<5000){base=pref==='東京都'?4500:Math.min(base,4200);label='人口の少ない郊外';}
 // Ridership is only a bounded secondary adjustment, and never substitutes missing data with zero.
 const riders=Number.isFinite(l.riders)&&!l.partial?l.riders:null;
 const stationFactor=hub?1:riders===null?1:riders>=100000?1.1:riders>=30000?1.04:riders<3000?.92:1;
 base=round(base*stationFactor);
 return {model:RENT_MODEL,label,base,low:round(base*.65),high:round(base*1.3),estimated:true};
}
export function quoteRent(location,area,walk,kind,variation,building=null){
 const market=rentMarket(location),age=[30,18,40][kind],floor=building?.floor??[3,2,5][kind];
 const walkFactor=walk<=3?1.16:walk<=5?1:walk<=8?.91:.82;
 const ageFactor=[.90,1.05,.78][kind],floorFactor=building?.floorFactor??[.97,1,.70][kind];
 const unit=market.base*walkFactor*ageFactor*floorFactor*(.94+variation*.12);
 const rentMonthly=Math.round(area*.3025*unit/1000)*1000;
 return {rentMonthly,rentModel:RENT_MODEL,rentMarket:market,buildingAge:age,floor,elevator:building?.elevator??(kind!==2),
  rentFactors:{walk:walkFactor,age:ageFactor,floor:floorFactor,variation:.94+variation*.12}};
}
