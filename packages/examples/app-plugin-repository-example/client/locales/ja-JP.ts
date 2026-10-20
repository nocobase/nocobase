import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  closeDialog: '閉じる',
  sortTitle: 'ソート例',
  sortIntro:
    'リポジトリ HTTP クライアントを使用して、読み取り専用の並べ替えサンプルを実行します。ビルダー スニペットは、実際のシリアル化されたリクエストに付随します。テーブルはサーバーの応答順序を保持します。クエリは最大 10 個のルートを返し、既存の CRM および関係シードを再利用します。',
  sortLimits:
    '論理フィールド名を使用します。対多のパスには集約が必要です。 to-one インクルードはローカル ソートを受け入れません。カーソルには、null 非許容の直接スカラー軸と固有のタイブレークが必要です。 unique は、一意のタイブレークを使用した直接スカラー ソートのみを受け入れます。テキストとJSONはソートできません。',
  sortRequest: '実際のリクエスト · JSON AST',
  sortResultHint:
    '行はサーバーの順序を保持します。関係値は明示的に選択されます。レコードのプレビューは集計数よりも短い場合があります。',
  sortExpectedError: '予期される検証エラー',
  sortUnexpectedSuccess: 'この無効なクエリは予期せず成功しました。',
  sort_default_title: 'デフォルトの主キーの順序',
  sort_default_description: 'ソートを省略: 顧客は主キーの昇順で返されます。',
  sort_asc_title: '商品価格が上がる',
  sort_asc_description:
    'UnitPriceCents の単一の昇順式を返します。価格は整数セントです。',
  sort_desc_title: '商品価格が下がる',
  sort_desc_description:
    'UnitPriceCents の単一の降順式を返します。価格は整数セントです。',
  sort_multi_title: '複数のフィールドと自動タイブレーク',
  sort_multi_description:
    '数量が降順、その後スナップショット価格が上昇します。等しいペアでは、追加された ID が昇順で使用されます。デモアイテム 3 とデモアイテム 7 は、同点の例を示します。',
  'sort_nulls-first_title': 'NULL値が最初',
  'sort_nulls-first_description':
    'NULL 許容の assigneeId は最初に NULL で昇順になります。割り当てられていないタスクは表示されたままになり、ID によって関係が解消されます。',
  'sort_nulls-last_title': 'NULL値は最後まで',
  'sort_nulls-last_description':
    'NULL 許容の assigneeId の昇順で最後に NULL が続きます。明示的な配置により、データベース固有の NULL デフォルトが回避されます。',
  'sort_to-one_title': '1 対 1 の関係による並べ替え',
  'sort_to-one_description':
    '譲受人名は降順で、欠けている譲受人が最後になります。別のインクルードは、並べ替えに使用される名前を返します。',
  sort_count_title: 'リレーション数とフィルタリングされた選択',
  sort_count_description:
    'カウント 0 を含むすべての注文によるランク付け。paidCount は支払い済みの注文のみを選択します。そのフィルターはルートの並べ替えには影響しません。',
  sort_include_title: '独立したインクルード順序',
  sort_include_description:
    '顧客は ID によって昇順になり、各顧客の注文は番号によって降順になります。顧客ごとに 2 レコードの制限が適用されます。',
  sort_duplicate_title: '拒否されました: ソート対象が重複しています',
  sort_duplicate_description:
    '同じフィールドは、異なる方向であっても 2 回出現することはできません。 INVALID_SORT を検査するために実行します。',
  'sort_to-many_title': '拒否されました: 直接多フィールド パス',
  'sort_to-many_description':
    'items.quantity には製品ごとに複数の値があります。代わりに、明示的なリレーション集計を使用してください。',
  sort_sum_title: '関係SUMランキング',
  sort_sum_description:
    '商品数量の合計により、NULL の降順で商品をランク付けします。選択された SUM が NULL であっても、空のリレーションは 0 としてソートされます。メトリクスと項目行は明示的に選択されます。',
  sort_avg_title: 'リレーションの AVG による順位',
  sort_avg_description:
    '商品数量の AVG によって商品をランク付けし、NULL を最初に降順にします。空のリレーションは NULL としてソートされます。メトリクスと項目行は明示的に選択されます。',
  sort_min_title: '関係MINランキング',
  sort_min_description:
    '製品を品目数量の最小値でランク付けし、NULL を先頭に降順にします。空のリレーションは NULL としてソートされます。メトリクスと項目行は明示的に選択されます。',
  sort_max_title: '関係MAXランキング',
  sort_max_description:
    '製品をアイテム数量の MAX でランク付けし、NULL を最初に降順にします。空のリレーションは NULL としてソートされます。メトリクスと項目行は明示的に選択されます。',
  selectCombineTitle: '結合を選択',
  selectCombineIntro:
    'select.combine と同じリレーションから名前付きレコードリストとスカラー集合体を返します。各例では、読み取り専用のリポジトリ findMany リクエストを 1 つ実行します。',
  combineScopeHint:
    '最初の 10 個のルート レコードを ID 別に表示します。リレーション制限は親ごとおよびブランチごとに適用されます。サンプル レコードが存在しない場合は、アプリケーションの移行とシードを実行します。',
  combineRequest: 'リクエスト・ASTの選択',
  combineTable: 'データテーブル',
  combineJson: '生JSON',
  combineNoRelated: '関連記録なし',
  combineTableHint:
    '列は応答フィールドのパスを使用します。レコードのブランチはネストされたテーブルとして表示されます。 NULL はゼロや空のリストとは異なります。',
  combineRun: 'クエリの実行',
  combineResult: 'クエリ結果',
  combineResultHint:
    '実際の応答: 名前付きブランチは各リレーション オブジェクト内に存在します。',
  combineEmpty:
    'ルートレコードがありません。アプリケーションの移行とシードを実行するか、サンプル レコードを作成します。',
  combine_preview_title: '注文プレビューと独立したブランチ',
  combine_preview_description:
    'プレビュー中の 1 つの注文、全注文数、支払い済み数、およびキャンセルされたレコード。プレビュー制限は兄弟ブランチを制限しません。注文のない顧客は空のリストを保持し、カウントはゼロになります。',
  combine_statistics_title: '項目レコードと複数の集計',
  combine_statistics_description:
    'COUNT、SUM 数量、AVG/MIN/MAX スナップショット単価 (セント単位) と並ぶ 2 つの項目行。 AVG は重み付けされていません。空のリレーションはカウント 0 を返し、他の集計に対しては null を返します。',
  combine_nested_title: 'ネストされた注文、品目、製品',
  combine_nested_description:
    '各顧客は注文のプレビューとカウントを取得します。プレビューされた各注文は、品目のプレビュー、カウント、および数量の合計を組み合わせます。品目レコードには製品名も含まれます。',
  combine_scoped_title: '共有フィルターとブランチローカルフィルター',
  combine_scoped_description:
    'ドラフトタスクフィルターはすべてのブランチに適用されます。 COUNT(assigneeId) は、null 以外の担当者をカウントします。 unassigned は assigneeId = null を追加します。 1 行のプレビューではどちらの数も変わりません。',
  combine_tags_title: '多対多のタグの組み合わせ',
  combine_tags_description:
    '各プロジェクトのリンクされたタグ、合計数、ドキュメント数を返します。ブランチ フィルターはそのプロジェクトのリレーション内に留まります。リンクされていないタグは除外されます。',
  apiExamples: 'リポジトリの例',
  labIntro:
    '一度に 1 つの関係演算を調べます。リレーションを選択し、独立した例を準備して、その形式とテーブルを使用します。各カードはそのプロジェクトとターゲットを所有します。このページをロードしても何も書き込まれません。',
  labOperations: '関係演算',
  labBoth: '対 1 / 対多',
  labManyOnly: '複数への関連のみ',
  labRelation: '関係タイプ',
  labPrepare: '準備例',
  labPrepareAgain: '新しいサンプルを準備する',
  labRefresh: 'テーブルをリフレッシュ',
  labPrepareHint:
    '準備では、プロジェクトと 4 つのプライベート ターゲットを作成します。新しい準備では以前の例が保存されます。準備には複数のリクエストが使用されます。個々の書き込みはトランザクションです。',
  labProject: 'プロジェクト例',
  labDefaultContent: '{{operation}} 例 {{id}}',
  labSummary: 'プロフィール概要',
  labLabel: 'タグラベル',
  labTitle: 'タスクのタイトル',
  labPoints: 'ポイント',
  labTarget: '対象レコード',
  labChoose: 'レコードを選択してください',
  labNewTarget: '最初の実行時に新しいターゲットを作成する',
  labNoEligible:
    '対象となる対象はありません。新しいサンプルを準備して再試行してください。',
  labSetTargets: 'これらのターゲットをリンクしたままにする',
  labSetEmpty:
    'セットを送信するには、すべてのチェックを外します: []。削除されたターゲットはターゲット テーブルに残ります。',
  labThroughRole: 'このリンク上の役割 (through.role)',
  labCurrentProfile: '現在のプロフィール',
  labNoProfile: '現在リンクされているプロフィールはありません。',
  labDeleteHint:
    '選択した例の対象レコードが削除されます。それは切断ではありません。削除結果として下の行が残ります。',
  labUpsertHint:
    '最初の実行でターゲットを作成できます。同じターゲットで後続の実行を行うと、それが更新されます。この関係の外にあるターゲットは対象外です。',
  labExecute: '{{operation}}を実行',
  labRequest: 'このオペレーションのリクエストをプレビューする',
  labSaved: '{{operation}} 書き込みに成功しました。',
  labRefreshFailed:
    '書き込みは成功しましたが、テーブルのリフレッシュに失敗しました。別の書き込みの前にテーブルのリフレッシュを使用します。',
  labTargets: 'ターゲットと関係の状態',
  labTableHint:
    '各ターゲットは独立して読み取られます。ターゲットを切断/設定して保持し、削除ではターゲットを削除します。このカードの対象のみを記載しています。',
  labRecord: 'レコード',
  labLinked: 'このプロジェクトにリンクされています',
  labExists: 'ターゲットが存在します',
  labDeleted: 'ターゲットを削除しました',
  labYes: 'はい',
  labNo: 'いいえ',
  labLastCall: '最後に実行されたリクエストとレスポンス',
  lab_create_title: '作成してリンクする',
  lab_create_description:
    'リレーションを通じてターゲットを作成します。リポジトリは関係キーを埋めます。この例では、hasOne create には空のリレーションが必要です。',
  lab_connect_title: '既存のターゲットをリンクする',
  lab_connect_description:
    'このカード用に用意された未接続の対象を選択します。connect で対象が新規作成されることはありません。hasOne の対象は接続可能な状態である必要があります。',
  lab_disconnect_title: 'リンクを解除してターゲットを保持する',
  lab_disconnect_description:
    'null 許容の hasOne リンクをクリアするか、hasMany ターゲットを切り離すか、結合テーブル リンクを削除します。目標は残る。',
  lab_set_title: 'リレーションシップセットを置き換えます',
  lab_set_description:
    '選択した既存のターゲットを正確に保持します。対多の関係のみがセットをサポートします。 nullable hasMany キーは削除を許可します。',
  lab_update_title: 'リンクされたターゲットを編集する',
  lab_update_description:
    '現在の関係内の 1 つのターゲットを編集します。 1 対 1 更新では、セレクターなしで現在のターゲットが使用されます。',
  lab_upsert_title: 'リレーションスコープで更新または作成',
  lab_upsert_description:
    '一致するターゲットがリンクされていない場合に作成され、それ以外の場合は更新されます。対多では、検索と作成の両方に安定した一意の ID が使用されます。',
  lab_delete_title: '対象レコードを削除します',
  lab_delete_description:
    '制約に従って、リンクされたターゲットを削除します。このカードのために用意された専用ターゲットのみを使用してください。共有ターゲットは他の関係に影響を与える可能性があります。',
  relationMutationsTitle: '関係書き込み',
  relationMutationsIntro:
    '完全なリポジトリ HTTP 関係ワークフローを、belongsTo、hasOne、hasMany、belongsToMany にわたって実行します。すべてのボタンは api.repository(name) を使用します。例固有の突然変異エンドポイントは関係しません。',
  relationBaselineTitle: 'シードされた関係ベースライン',
  relationBaselineDescription:
    '決定的レコードは、プラグイン接頭辞付きのコレクション名を使用しながら、リポジトリ関係書き込みドキュメントを反映します。',
  relationSeedHint:
    'アプリケーションの移行とシードを実行して、関係サンプル レコードを作成します。',
  relationRunTitle: '完全な突然変異ウォークスルー',
  relationRunDescription:
    '分離されたプロジェクト グラフを作成し、増分関係操作を適用して、そのタグ セットを置き換えます。各ルートの突然変異はトランザクション対応です。',
  relationRunButton: '完全な関係書き込みを実行します',
  relationRunIsolation:
    '各実行では新しい ID が使用されるため、以前の例は引き続き検査に利用できます。',
  relationResultTitle: '最終的な関係状態',
  relationResultDescription:
    '所有者とプロファイルが更新され、タスク操作が関係スコープに適用され、セットは選択されたタグのみを保持しました。',
  relationLifetimeTitle: 'ターゲットライフタイムチェック',
  relationLifetimeDescription:
    'リンクを切断して設定を削除しますが、ターゲットは保持します。 delete は対象のレコードを削除します。',
  relationTraceHint:
    '実際のリポジトリ名、createOne/updateOne ペイロード、およびこの実行によって発行された応答。',
  relationOwnerLabel: '所属・所有者',
  relationProfileLabel: 'hasOne · プロフィール',
  relationTasksLabel: 'たくさんのタスクがあります',
  relationTagsLabel: '所属者多数・タグ',
  relationTasks: '関連タスク',
  relationPoints: 'ポイント',
  relationAssignee: '担当者',
  relationDisconnectCheck:
    '切断: タスクが存在します = {{exists}}、プロジェクト ID = {{projectId}}',
  relationDeleteCheck: '削除: タスクが存在します={{exists}}',
  relationSetCheck: '集合: 削除したタグの存在={{exists}}',
  findManyTitle: 'findMany：配列とストリーム',
  findManyIntro:
    '同じリポジトリ クエリを 2 つの消費モードで実行します。 Await は完全な配列で 1 回解決されます。非同期反復は、フレーム化された NDJSON レコードを到着時に読み取ります。データベースのクエリ、フィルター、並べ替え、および制限は変わりません。',
  findManyArrayTitle: '配列を待つ',
  findManyArrayDescription:
    'findMany を待機すると、通常の JSON リクエストが送信され、一致するすべてのレコードで解決されます。',
  findManyStreamTitle: 'ストリームを反復処理する',
  findManyStreamDescription:
    'for await を使用すると、NDJSON リクエストが送信され、デコードされた各レコードが結果テーブルに追加されます。',
  findManyProtocol: 'HTTP 応答',
  findManyRunArray: '配列クエリを実行する',
  findManyRunStream: 'ストリームクエリの実行',
  findManyReceived: '受信したレコード',
  findManyReceivedCount: '{{count}} レコードを受信しました',
  findManyResults: '結果',
  findManyRecordTitle: 'タイトル',
  findManyCategory: 'カテゴリー',
  findManyDescription: '説明',
  findManyEmpty:
    'このクエリを実行して、シードされたサンプル レコードをロードします。',
  atomicTitle: 'アトミック数値更新',
  atomicIntro:
    'インクリメント、デクリメント、乗算を使用してデータベース内の数値を直接更新します。リクエストは操作を送信するものではなく、古い可能性のあるブラウザーのスナップショットから計算された値を送信することはありません。サインインしているすべてのユーザーがこれらのサンプル カウンターを共有します。',
  atomicStock: '倉庫在庫',
  atomicStockHint:
    '単位を受け取るか減算します。控除により、同じ更新で利用可能な在庫がチェックされ、在庫がマイナスになるのを防ぎます。',
  atomicWallet: '口座残高（セント）',
  atomicWalletHint:
    '整数セントを補充または使用します。バランス条件と減算はデータベースで一緒に評価されます。',
  atomicPoints: '特典ポイント',
  atomicPointsHint:
    '乗算を使用してポイントを追加するか、現在のポイントを 2 倍にします。 2. 2 倍には、現在のデータベース値が使用されます。',
  atomicVisits: '来店カウンター',
  atomicVisitsHint:
    '1 回インクリメントするか、10 個の同時インクリメント: 1 リクエストを送信します。他のユーザーもこの共有カウンターを変更できます。',
  atomicAmount: '金額',
  atomic_increment: '増加',
  atomic_decrement: '減少(ガード)',
  atomic_multiply: 'ダブル×2',
  atomic_concurrent: '10同時+1',
  atomicSeedHint:
    'アプリケーションの移行とシードを実行して、この例のカウンターを作成します。',
  atomicInsufficient:
    'カウンタが削除されたか、現在の値が不十分です。何も差し引かれませんでした。',
  atomicUpdated: 'データベースは新しい値 {{value}} を返しました。',
  atomicConcurrentResult:
    '10 個の同時インクリメントの {{count}} が成功しました。表示された値はデータベースから再度読み取られます。',
  atomicPartial:
    '一部のインクリメントが失敗しました。成功したリクエストはコミットされたままになります。再試行する前に結果を検査してください。',
  atomicTraceHint:
    '実際の updateOne 入力と応答 (拒否された更新を含む)。自動再試行は実行されません。',
  groupByExamples: 'その他の groupBy の例',
  groupByMinimumCount: 'グループあたりの最小行数 (新しい例)',
  groupByEmpty:
    'これらのフィルターに一致するグループはありません。最小数を減らすか、ステータスを変更してください。',
  groupBy_customerRanking: '顧客注文ランキング',
  groupBy_customerRankingHint:
    'GROUP BY customerId · COUNT(*) · HAVING count ≥ minimum · count DESC、customerId ASC。一致する注文がない顧客はグループを形成しません。',
  groupBy_customerStatus: 'お客様×注文状況',
  groupBy_customerStatusHint:
    'GROUP BY customerId、ステータス。同じ顧客が複数のステータス グループに表示される場合があります。 HAVING は顧客の合計ではなく、各組み合わせに適用されます。 Enum グループは正確な値を保持します。並べ替えでは count と customerId を使用します。',
  groupBy_productPrice: '商品×商品単価',
  groupBy_productPriceHint:
    'productId、unitPriceCents · COUNT(*) および SUM(数量) でグループ化します。同じ製品であっても、異なるアイテムのスナップショット価格は別々のままです。数量 DESC、productId ASC、価格 ASC で並べ替えます。価格はセントです。 COUNT は単位ではなく項目の行を測定します。',
  aggregateApply: '適用',
  aggregateTitle: '集計クエリ',
  aggregateIntro:
    '既存の注文と商品に関するデータベース側の統計: 集計、HAVING を使用した groupBy、および顧客ごとの関係数。ステータス フィルターはすべてのパネルに適用されます。最小数量は製品グループにのみ適用されます。最小行数は、追加の 3 つの groupBy 例に適用されます。',
  aggregateAll: '全ステータス',
  aggregateHaving: 'グループ化された最小数量 (HAVING)',
  aggregateMetrics: 'アイテム集合体',
  aggregate_count: 'COUNT · 項目行',
  aggregate_quantity: 'SUM・数量',
  aggregate_averagePrice: 'AVG · 単価 (セント)',
  aggregate_minimumPrice: 'MIN・単価（セント）',
  aggregate_maximumPrice: 'MAX・単価(セント)',
  aggregateSemantics:
    '平均価格は、注文合計や数量で加重された価格ではなく、商品単価の加重されていない平均です。空のセットは、SUM/AVG/MIN/MAX に対してカウント 0 と NULL を返します。パネルは個別のクエリを実行し、同時編集を観察する場合があります。',
  aggregateStatuses: 'ステータスごとにグループ化された注文 · groupBy',
  aggregateCustomers: '顧客関係の集計',
  aggregateCustomerHint:
    'ID 別の最初の {{count}} 顧客 (一致する注文がゼロの顧客を含む)。カウントには選択したステータスが使用されます。',
  aggregateProducts: '製品ごとにまとめた項目',
  aggregateTraceHint:
    'JSON AST を使用して、構成されたリポジトリ HTTP 集約/groupBy アクションを呼び出します。顧客数では、findMany リレーション選択が使用されます。リクエストを展開して実際の式を検査します。',
  crm: 'CRMの例',
  ordersTitle: '注文例',
  subtitle: 'リポジトリ API を利用した顧客、関係、注文。',
  customer: '顧客',
  contact: 'お問い合わせ',
  product: '製品',
  order: '注文',
  orderItem: '受注生産品',
  customers: 'お客様',
  contacts: '連絡先',
  products: '製品',
  orders: '注文',
  items: '注文品',
  name: '名前',
  company: '会社',
  email: 'メール',
  phone: '電話',
  status: '状態',
  sku: 'SKU',
  unitPriceCents: '単価（セント）',
  number: '注文番号',
  customerId: '顧客',
  orderId: '注文',
  productId: '製品',
  quantity: '数量',
  lead: '見込み顧客',
  active: 'アクティブ',
  inactive: '非アクティブ',
  draft: '下書き',
  confirmed: '確認しました',
  paid: '有料',
  cancelled: 'キャンセル済み',
  new: '新記録',
  edit: '編集',
  view: '詳細を見る',
  delete: '削除',
  save: '保存',
  cancel: 'キャンセル',
  search: '名前/番号/IDで検索',
  apply: '検索',
  refresh: '更新',
  previous: '前へ',
  next: '次へ',
  page: 'ページ {{page}}',
  count: '{{count}} レコード',
  empty: 'レコードはまだありません。最初のレコードを作成して始めましょう。',
  loading: '読み込み中…',
  select: 'レコードを選択してください',
  createTitle: '{{entity}} を作成する',
  editTitle: '{{entity}}を編集',
  details: 'レコード詳細',
  relations: '関連レコード',
  none: 'なし',
  lookup: 'IDで探す',
  check: '確認して開く',
  notFound: 'この ID のレコードはありません。',
  found: 'レコードが存在します。',
  saved: '記録が保存されました。',
  deleted: 'レコードが削除されました。',
  confirmDelete:
    'このレコードを削除しますか?関連する連絡先や注文アイテムも削除されます。オーダー品をお持ちのお客様およびオーダー品で使用されている商品は削除できません。',
  confirm: '削除の確認',
  trace: 'リポジトリ呼び出し',
  traceHint:
    '最新のリクエストと結果には、この画面で使用されている API が表示されます。',
  error: '操作は失敗しました。',
  loadError: 'レコードをロードできません。更新して再試行してください。',
  conflict:
    'この順序は、オープンしてから変更されました。編集する前に更新して再度開きます。',
  choicesHint: '最初に顧客と製品を作成し、次に注文とそのアイテムを作成します。',
  moneyHint:
    '価格は整数セントです。ライン合計 = 数量 × 単価;浮動小数点通貨の計算はありません。',
  version: 'バージョン',
  addItem: '項目の追加',
  removeItem: 'アイテムを削除する',
  orderTotal: '注文合計 (セント)',
  noItems: 'オーダー品はありません。',
  itemRow: 'アイテム {{number}}',
  lineTotal: 'ライン合計 (セント)',
  id: 'ID',
  back: 'リストに戻る',
  close: '詳細を閉じる',
  request: 'リクエスト',
  response: '応答',
  loadingChoices: '関連レコードを読み込み中…',
};

export default jaJP;
