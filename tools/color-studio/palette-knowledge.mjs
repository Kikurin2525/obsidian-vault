// Research catalog, reviewed 2026-09-28. Source principles and this product's
// numeric heuristics are distinct. This is a rule-based engine, not model training.
export const SOURCES=[
 ['difference','Oklab / Björn Ottosson','https://bottosson.github.io/posts/oklab/','知覚的な色の差を扱う。候補の除外閾値は本ツール独自。'],
 ['text','W3C / Contrast Minimum','https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html','通常文字4.5:1、大きな文字3:1。実際に接する色で検査。'],
 ['enhanced','W3C / Contrast Enhanced','https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html','強化基準は通常文字7:1、大きな文字4.5:1。'],
 ['controls','W3C / Non-text Contrast','https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html','操作を識別する必要な境界・状態は隣接色と3:1。'],
 ['meaning','W3C / Use of Color','https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html','情報を色だけで伝えず、形・文字などを併用。'],
 ['focus','W3C / Focus Appearance','https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html','AAAのフォーカス基準。色だけでなく面積と状態変化を確認。'],
 ['hierarchy','Adobe / Color Contrast','https://www.adobe.com/uk/creativecloud/design/discover/color-contrast.html','色相・明暗・彩度・面積などの対比で主役を作る。'],
 ['wheel','Adobe / Color Wheel','https://color.adobe.com/create/color-wheel','同系・類似・補色など、色相関係を組み立ての出発点にする。'],
 ['split','Adobe / Split Complementary & Gradients','https://blog.adobe.com/en/publish/2020/04/27/color-your-spring-with-adobe-color-gradients','補色の両隣へ分ける構成と、グラデーションの色選び。'],
 ['fluent','Microsoft Fluent 2 / Color','https://fluent2.microsoft.design/color','ニュートラル・ブランド・状態の色を役割で区別する。'],
 ['uswds','USWDS / Using Color','https://designsystem.digital.gov/design-tokens/color/overview/','明暗による整理を先に行い、用途に応じた限定的な色を足す。'],
 ['tokens','USWDS / Theme Color Tokens','https://designsystem.digital.gov/design-tokens/color/theme-tokens/','主色・副色・基礎色・状態色を役割で管理する。'],
 ['govuk','GOV.UK / Colour','https://design-system.service.gov.uk/styles/colour/','本文・リンク・境界・フォーカスなど、使い場所で色を選ぶ。'],
 ['buttons','GOV.UK / Button','https://design-system.service.gov.uk/components/button/','主要操作を絞り、複数の強いボタンが競合しないようにする。'],
 ['material','Material Foundation / Color Utilities','https://github.com/material-foundation/material-color-utilities','元色からトーンと用途別の色を展開する考え方。ここではHCTではなくOklabを使用。'],
 ['nng','Nielsen Norman Group / Visual Hierarchy','https://www.nngroup.com/articles/visual-hierarchy-ux-definition/','色・大きさ・まとまりの相対差で、見る順序を作る。'],
 ['atlassian','Atlassian / Color Accents','https://atlassian.design/foundations/color/accents','装飾アクセントと意味を持つ色を分け、文字と面の組み合わせを選ぶ。'],
 ['carbon','IBM Carbon / Color Overview','https://carbondesignsystem.com/elements/color/overview/','テーマが変わっても役割を保ち、明暗の異なる面を設計する。'],
 ['charts','IBM Carbon / Data Visualization Color Palettes','https://carbondesignsystem.com/data-visualization/color-palettes/','カテゴリ・連続量・両方向の値で色の並べ方を使い分ける。']
].map(([id,title,url,rule])=>({id,title,url,rule}));
// action: 実装 = generation/ranking/role calculation; 指示 = explicit advice;
// 手動確認 = cannot infer from a palette alone. Never count manual checks as passed.
const rows=[
 ['mono','調和','同じ色相を明暗で分ける','wheel','実装','落ち着いた情報画面。同じ色相でも主役と背景の明度を離す。'],
 ['analogous','調和','近い色相でつなぐ','wheel','実装','統一感を優先。色相差が小さい分、明暗で区別を補う。'],
 ['complement','調和','反対側の色を小さく添える','wheel','実装','注意を集める一点に。強い2色を同じ面積で敷き詰めない。'],
 ['split','調和','補色の両隣を使う','split','実装','直接的な補色対比を和らげ、4色目を別の差し色に展開する。'],
 ['triadic','調和','3方向の色相を組み合わせる','wheel','実装','遊び心を出す場合。全色を同じ彩度・面積で主張させない。'],
 ['neutral','調和','無彩色に差し色を置く','uswds','実装','本文と背景を静かに保ち、操作や図のポイントへ色を集める。'],
 ['perceptual','調和','知覚的な明度と彩度を扱う','difference','実装','色相を回す際はOklabから生成。sRGB範囲に入るまで彩度を下げる。'],
 ['diversity','調和','似た案・並べ替えを省く','difference','実装','見た目の色の距離で候補を比較。閾値はツール独自で美的評価ではない。'],
 ['support','階層','サブ色の主張を抑える','hierarchy','実装','広い補助面に強い彩度を置く候補を順位で抑える。'],
 ['accent','階層','主役と差し色を見分けられるように','nng','実装','色の距離と明暗の両方で候補を比較する。色相だけの差に頼らない。'],
 ['competition','階層','強い色同士の競合を避ける','nng','実装','同程度に強い主役・差し色には順位の減点。印象重視では減点を緩める。'],
 ['extra','階層','4色目は第2アクセント','atlassian','実装','第1アクセントと異なる色を用意。別の小物や図の分類に割り当てる。'],
 ['text','読みやすさ','文字と接する面で検査','text','実装','見本の本文・カード・リンク・ボタンを通常文字の基準で検査する。'],
 ['enhanced','読みやすさ','長文には強めのコントラスト','enhanced','実装','読みやすさ優先の設定で7:1へ調整。全体のAAA適合を意味しない。'],
 ['boundary','読みやすさ','必要な境界を見えるように','controls','実装','ボタンや入力枠の識別に使う線を3:1へ調整する。'],
 ['link','読みやすさ','リンクを文字の装飾と区別','meaning','実装','見本と指示文で下線を併用。色だけでクリック可能とは伝えない。'],
 ['focus','読みやすさ','キーボードの現在位置を示す','focus','手動確認','見本用の枠色は検査するが、実画面のフォーカス面積・隠れ・状態差は別途確認する。'],
 ['oncolor','読みやすさ','色の上の文字色を別に決める','text','実装','白文字を固定せず、白・黒から高いコントラストを選ぶ。'],
 ['states','操作','押す前・触れた時・押した時','fluent','実装','通常・hover・pressedの色と各文字色を出力し、それぞれ検査する。'],
 ['selected','操作','選択中には形も添える','meaning','実装','アプリ見本の選択面に下線と選択中の文字を併用する。'],
 ['error','操作','エラーを装飾色にしない','fluent','実装','エラー専用の色と説明を出力。操作色と似る場合は注意を表示する。'],
 ['roles','操作','色名より使う場所で管理','govuk','実装','background・text・actionなど、制作AIが配置できる役割で出力する。'],
 ['cta','操作','主な操作を一つに絞る','buttons','指示','LPの申込み色を見出しや装飾へ大量に流用しない。実画面のボタン数は未検査。'],
 ['area','階層','強い色の面積を限定する','hierarchy','指示','目的別の面積目安を提示する。比率は独自の設計目安で、普遍的な黄金比ではない。'],
 ['gray','階層','白黒でも見る順序を確認','uswds','指示','見本のグレースケールで主役が残るかを目視する。実作品は別途確認。'],
 ['dark','テーマ','ダーク表示を単純反転しない','carbon','実装','暗い背景に合わせて面・本文・状態色を再計算し、各ペアを検査する。'],
 ['tokens','テーマ','テーマ色と使用色を分ける','tokens','実装','元のテーマ色を残し、小さい文字や面のための補助色を別に出力する。'],
 ['tones','テーマ','元色から用途別のトーンへ','material','実装','主色の濃淡を本文・面・リンクに展開する。MaterialのHCT実装そのものではない。'],
 ['image-role','画像','頻度順だけで色を割り当てない','hierarchy','実装','広い有彩色と異なる色相の差し色を推定。明るい暖色は保留し、対応表で修正可能にする。'],
 ['image-extra','画像','同じ色の一部だけを分ける','atlassian','実装','元画像の範囲を囲み、第2アクセントなどを局所的に追加する。物体認識ではない。'],
 ['image-shade','画像','陰影と白黒の役割を保つ','hierarchy','実装','初期設定では白黒を保護し、置換する色の元の明暗差を残す。'],
 ['image-check','画像','取り込んだ画像の文字を再確認','text','手動確認','画像内の文字は認識しない。小さな数字・縁・半透明部分は変更後に目視する。'],
 ['categorical','データ','カテゴリは区別できる色に','charts','手動確認','順位のない系列は別の色相とラベルを使う。系列数と実グラフの識別は未検査。'],
 ['sequential','データ','量の大小は連続した明暗に','charts','手動確認','数値が増える方向に明暗をそろえる。順序のある値に虹色を機械的に当てない。'],
 ['diverging','データ','基準の両側を分ける','charts','手動確認','増減・正負は中立点から2方向へ。単なるカテゴリには使わない。'],
 ['context','運用','色の印象を決めつけない','uswds','手動確認','文化・対象者・周辺の色で印象は変わる。「青なら信頼」とは断定しない。'],
 ['gradient','運用','グラデーション途中も確認','split','手動確認','端点だけでなく途中の濁りと、その上の文字を確認。本ツールは途中色を検査しない。'],
 ['semantic','運用','装飾と意味を持つ色を分離','atlassian','指示','成功・警告などの意味を、同じ画面の単なる装飾に混在させない。']
];
export const KNOWLEDGE=rows.map(([id,category,title,source,action,detail])=>({id,category,title,source,action,detail}));
export const HARMONIES={auto:'おまかせ（複数の構成を比較）',mono:'同系色の濃淡',analogous:'近い色相で統一',complement:'補色でメリハリ',split:'分裂補色で変化',triadic:'3方向の色相',neutral:'無彩色＋差し色'};
export function appliedKnowledge({view,mode,legibility,count,family}){
 const ids=['perceptual','diversity','support','accent','competition','area','gray','tokens','roles','context',...(family&&family!=='curated'?[family]:[])];
 if(count>3)ids.push('extra');
 if(view==='illustration')ids.push('image-role','image-extra','image-shade','image-check');
 else ids.push('text','boundary','link','focus','oncolor','states','tones','semantic',...(legibility==='high'?['enhanced']:[]),...(mode==='dark'?['dark']:[]),...(view==='lp'?['cta']:[]),...(view==='app'?['selected','error']:[]));
 return [...new Set(ids)].map(id=>KNOWLEDGE.find(r=>r.id===id)).filter(Boolean);
}
