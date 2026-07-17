---
title: "NocoBase を使用してリンク可能な運用ダッシュボードを構築する"
description: "作業指示操作ダッシュボードを例に挙げると、チャート ブロック、フィルター ブロック、JS ブロックを組み合わせて、統合されたフィルター処理、KPI、チャートのドリルダウン、カスタム スタイルを実現します。"
keywords: "NocoBase、運用ダッシュボード、データ視覚化、チャート ブロック、フィルター ブロック、JS ブロック、チャート ドリルダウン"
---

# NocoBase を使用してリンク可能な運用ダッシュボードを構築する

この記事では、「作業指示書システム」の運用ダッシュボードを例に、NocoBaseのチャートブロック、フィルターブロック、JSブロックを組み合わせて、フィルター連携やチャートのドリルダウン、カスタムスタイルをサポートするデータダッシュボードを構築する方法を紹介します。

例は作業指示書のシナリオですが、これらの方法は CRM、設備運用、プロジェクト管理、承認フロー、カスタマー サクセスなどのビジネス システムにも適用できます。

:::tip
この記事で紹介したいのは、「JS ブロックを使用して大きな画面を作成する方法」ではなく、NocoBase のネイティブ ブロック機能と JS ブロックを組み合わせる方法です。ネイティブ ブロックに標準機能を担当させ、JS ブロックでパーソナライズされたエクスペリエンスを補完させます。
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## シーンターゲット

私たちは、運用チームまたはサービス チームが現在のワークロードを迅速に判断できるように、運用ダッシュボードを構築したいと考えています。

- 現在、未処理の作業指示は何件ありますか?
- どの作業指示が SLA リスクにさらされていますか?
- 新規業務受注の傾向はどうなっているのでしょうか？
- 作業指示のステータスと優先順位はどうなっていますか?
- チャートをクリックすると、対応する詳細を表示できます

ページは大きく 4 つのレイヤーに分けることができます。

1. 上部のフィルター領域: 時間、サービス グループ、リクエスト タイプ、優先度、SLA ステータス
2. KPI 統計領域: 未処理のバックログ、未割り当て、SLA 警告など。
3. チャート分析領域: トレンド、ステータス、SLA、優先度分布
4. ドリルダウン詳細エリア: チャートをクリックして一致するレコードを表示します

## まずは構築アイデアを明確にする

多くの人がデータ ダッシュボードを作成するとき、問題を次の 2 つのオプションのいずれかとして考える傾向があります。

NocoBase のネイティブ ブロックをすべて使用するか、設定は簡単ですが、スタイルと対話が十分に柔軟ではないことを心配します。あるいは、単純に大きな JS ブロックを記述して、クエリ、グラフ、フィルタリング、ドリルダウンを自分で制御することもできますが、これではローコード構成によってもたらされる利便性が失われます。

実際、より推奨される方法は、2 つを組み合わせることです。

この運用ダッシュボードでは、ページ全体を大きな JS 画面として作成するのではなく、責任に応じて分割しました。

- 上部のフィルタリングは、NocoBase システムに付属するフィルタリング ブロックを使用します。
- 傾向グラフ、ステータス分布、および SLA 分布はネイティブ グラフ ブロックを使用します。
- KPI カードとドリルダウンの詳細には JS ブロックが使用されます。
- フィルター ブロックはチャート ブロックと JS ブロックの両方に影響します。
- チャートをクリックすると、ドリルダウン条件が下の JS 詳細ブロックに渡されます。

この利点は、標準の統計とフィルタリングが NocoBase の構成機能を維持しながら、パーソナライズされた表示と複雑な対話が JS ブロックによって完了されることです。このページは「構成のみ可能」でも「すべてのコード」でもありませんが、構成とコードはそれぞれ独自の役割を果たします。

---

## 1.チャートブロックのスタイルをカスタマイズする方法

![](https://static-docs.nocobase.com/202607121920941.png)

NocoBase のグラフ ブロックは、最初にクエリ ビルダーを使用して統計的基準を定義し、次にカスタム ECharts オプションを使用してスタイルを調整できます。

「作業指示ステータス統計」を例に挙げると、クエリ ビルダーは次のように構成できます。

- データシート: チケット
- メトリック: ID 数、エイリアス ticketCount
- 寸法：状態

重要なのは、スタイルをカスタマイズするときにクエリを書き直す必要がなく、`ctx.data.objects` に基づいてグラフ表示を処理するだけでよいということです。

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

このコード行は、チャートのクエリ結果を読み取ります。次に、ステータスのラベルと色を定義します。

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

その後の多言語サポートを容易にするために、表示されるすべてのコピーライティングで `ctx.t()` を使用することをお勧めします。

グラフ データを生成するときに、各グラフ データ ポイントにドリルダウン情報を添付できます。

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

ここで最も重要なのは、`ticketingDrilldown` です。これは ECharts の標準フィールドではなく、私たちが独自に組み込んだビジネス コンテキストであり、後でチャートをクリックするときに使用されます。

最後に ECharts オプションに戻ります。

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

この部分の中心となるアイデアは次のとおりです。

- クエリ ビルダーは統計を担当します。
- カスタム オプションは視覚的な表現を担当します。
- カスタム フィールドは、ドリルダウン コンテキストを伝達する役割を果たします。

---

## 2. システムフィルターブロックをページ全体の監視範囲にする

![](https://static-docs.nocobase.com/202607121920687.png)

運用ダッシュボードのフィルター領域は、単なる孤立した形式であってはなりません。ページ全体の現在の観測直径を表します。

たとえば、ユーザーがサービス グループ、リクエスト タイプ、および作成時間を選択した場合、KPI、傾向グラフ、ステータス分布、およびドリルダウンの詳細がすべて同じ条件セットに基づいて表示される必要があります。そうしないと、ページ上の異なるブロックの数値が競合し、ユーザーが現在の範囲内でどのデータが結果であるかを判断することが困難になります。

ここでは、フィルタリング コンポーネントを自分で作成する代わりに、NocoBase システムに付属するフィルタリング ブロックを直接使用します。ネイティブ フィルター ブロックは自然にチャート ブロックにバインドできるため、チャート ブロックはクエリ ビルダー、権限、更新およびフィルターのメカニズムを引き続き使用できます。

上位 `Dashboard scope` は次のフィルター項目を構成できます。

- Created at
- Service group
- Request type
- Priority
- SLA status

JS ブロックの場合、コード内で同じフィルター条件のセットを読み取り、それらをクエリ フィルターに変換するだけで済みます。このようにして、KPI とドリルダウンの詳細もネイティブ チャートと一致させることができます。

フィルター条件の組み合わせは、小さな関数にカプセル化できます。

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

フィルターによるカウント:

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

ここでの重要なポイントは次のとおりです。

```javascript
resource.setFilter(filter);
await resource.refresh();
```

JS ブロックは、SQL を直接記述するのではなく、リソースを通じてビジネス データをクエリします。これにより、NocoBase の権限、データ ソース、ページ ランタイムとの一貫性を維持しやすくなります。

---

## 3. JS ブロックを使用して KPI カードを表示する

![](https://static-docs.nocobase.com/202607121920374.png)

KPI は JS ブロックを使用するのに適しています。通常、KPI は単一のクエリではなく、複数のビジネス基準 (未完了、未割り当て、SLA 警告、SLA 違反、新規、解決済みなど) の組み合わせであるためです。

JS ブロックは、現在のフィルタリング範囲に基づいてデータを再クエリし、それを統計カードにレンダリングできます。

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

JS ブロックの重要なポイントは次のとおりです。

- データをクエリするには、`ctx.makeResource()` を使用します。
- `ctx.libs.antd` を使用してインターフェイスをレンダリングします。
- コンテンツを出力するには、`ctx.render()` を使用します。
- 変更をフィルタリングした後、JS チャンクを再レンダリングします。

実際のページでは、フィルター ボタンとリセット ボタンを使用して、ネイティブ フィルター アクションの完了後に KPI JS ブロックとドリルダウン JS ブロックを同時に更新するようにイベント フローを構成できます。この方法では、ユーザーが 1 回クリックしてフィルタリングを行うと、グラフとカスタム コンテンツの両方が同じ範囲に基づいて更新されます。

---

## 4. ドリルダウン用チャート連携JSブロック

![](https://static-docs.nocobase.com/202607121921577.png)

グラフをクリックしてドリルダウンすることは、ダッシュボードでの非常に実用的な操作です。

作業指示書のシナリオでは、ユーザーが「ステータス: オープン」列をクリックすると、すべてのオープンな作業指示書が下の詳細領域に表示されます。ユーザーが「SLA 違反」をクリックすると、すべての時間外労働命令が下に表示されます。

実装のアイデアは次のとおりです。

1. チャートのデータ ポイントには `ticketingDrilldown` が含まれます。
2. チャート イベントは、このドリルダウン情報を読み取ります。
3. ターゲットの JS ブロック コンテキストにドリルダウン情報を書き込みます。
4. ターゲットの JS ブロックをトリガーして再レンダリングします。

チャートイベントのキーコードは以下の通りです。まず、ドリルダウン JS ブロックを見つけます。

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

次に、チャートをクリックして取得したドリルダウン条件をターゲット ブロックに書き込みます。

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

最も重要なのは次の 2 行です。

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

最初の行はドリルダウン条件を JS ブロックに渡し、2 行目は JS ブロックの更新をトリガーします。

最後に、チャートのクリック イベントをバインドします。

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

ここでは、クリーンアップを返す必要があることをお勧めします。

```javascript
return () => chart.off('click', clickHandler);
```

このようにして、チャートが再構成または再レンダリングされるときに、古いイベントをクリーンアップしてバインドの繰り返しを回避できます。

上記のクリック イベント関連のコードは、[v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) 以降のバージョンに適用されます。古いバージョンのコードへの参照:

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 5. ドリルダウンJSブロックの詳細表示方法

![](https://static-docs.nocobase.com/202607121921601.png)

JS ブロックにドリルダウンして、書き込まれたばかりの `ticketingDashboardDrilldown` を読み取り、その中のフィルターに従ってデータをクエリします。

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

ユーザーがグラフをクリックしていない場合は、プロンプトが表示されます。クリックした後、`drilldown.filter` に基づいて作業指示書をクエリします。

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

次に、テーブルをレンダリングします。

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

ドリルダウン条件をクリアする必要がある場合は、以下を参照してください。

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

この部分の重要なポイントは次のとおりです。

- チャートはフィルターを通過することだけを担当します。
- JS ブロックは、詳細のクエリと表示を担当します。
- 同じドリルダウン ブロックを共有するには、別のグラフをクリックします。

---

## 実践的な提案

### 1. 複雑なページ全体を急いでコーディングしないでください。

このページから得られる最も重要な教訓は、ネイティブ機能と JS 機能を争わせないことです。

フィルタリング、グラフ クエリ、テーブル表示、権限制御などの機能がすでに NocoBase のネイティブ機能である場合は、ネイティブ ブロックが最初に使用されます。このようにして、フィールド、フィルター条件、チャートの口径を後で調整する場合でも、インターフェイス上で設定することができます。

JS ブロックは、複数の指標を KPI セットに結合したり、特別なカード スタイルを組み合わせたり、チャートをクリックした後にカスタム詳細を表示したり、異なるブロック間でビジネス コンテキストを渡したりするなど、ネイティブ ブロックが苦手な部分の処理に適しています。

言い換えれば、ネイティブ ブロックは「構成可能な標準機能」を担当し、JS ブロックは「ビジネス指向のパーソナライズされたエクスペリエンス」を担当します。これは、このダッシュボードの最も再利用可能な構築アイデアでもあります。

### 2. 単純な統計の場合は、最初にチャート ブロックのクエリ ビルダーを使用します。

これにより、NocoBase の標準クエリ、権限、フィルタリング、更新機能が保持されます。デフォルトのグラフ スタイルではビジネスの焦点を表現できない場合にのみ、視覚的な最適化のためにカスタマイズされた ECharts オプションを使用します。

### 3. KPI カードは JS ブロックの使用を優先します

KPI には複数のクエリ、条件の組み合わせ、カスタム レイアウトが必要になることがよくありますが、JS ブロックはより柔軟です。特に、KPI が同じシステム フィルター条件のセットに応答する必要がある場合、JS ブロックを使用してそれらを均一に処理する方が明確になります。

### 4. チャート イベントはクリーンアップを返す必要があります

推奨される書き込み方法:

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

`chart.off('click')` を直接使用してすべてのクリック イベントをクリアしないでください。これにより、誤ってチャート ブロックが削除されたり、パネル自体のモニタリングが構成されたりする可能性があります。

---

## AI に構築を手伝ってもらう

このタイプのダッシュボードは、データ モデル、統計的キャリバー、グラフ スタイル、ページ インタラクションを同時に含むため、AI 支援による生成に非常に適しています。この記事の内容を渡して、以下の質問を入力して質問することができます。

次のような質問をすることができます。

```markdown
NocoBase を使用して、作業指示システムの運用ダッシュボードを構築しています。
作業指示書のシナリオを例として取り上げ、運用ダッシュボードの設計を手伝ってください。

データ テーブル チケットには次のものが含まれます。
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

このページには次のものが必要です。

1. 上部フィルター: 作成日、サービス グループ、リクエスト タイプ、優先度、SLA ステータス。
2. KPI カード: 未処理のバックログ、未割り当て、SLA 警告、SLA 違反、新しいチケット、解決されたチケット。
3. グラフ: 作成されたチケットの傾向、チケットのステータス、SLA ステータス、優先順位の組み合わせ。
4. チャートをクリックすると、下の JS ブロックに一致するチケットのドリルダウン テーブルが表示されます。
5. チャートのスタイルは、明確な色とコンパクトなレイアウトで、運用市場に適している必要があります。
6. すべての JS コピーに ctx.t() を使用します。
7. チャート イベントは chart.on を使用し、クリーンアップ関数を返します。
8. NocoBase のネイティブ フィルター ブロックとチャート ブロックの使用を優先します。 JS ブロックは、KPI、ドリルダウンの詳細、特別なスタイル、およびブロック間の相互作用にのみ使用してください。ページ全体を 1 つの大きな JS ブロックとして書き込まないでください。

各ブロックの構成アイデアを示し、主要な JS コードにマークを付けてください。
```

すでにページをお持ちの場合は、AI にページの最適化を手伝ってもらうこともできます。

```markdown
これが私の現在の NocoBase ダッシュボードのデザインです。
上部にはフィルター領域、中央には 4 つのチャート、そしてその下にはドリルダウン JS ブロックがあります。
オペレーターエクスペリエンスの観点から最適化にご協力ください:

1. KPI にはどのような指標を表示する必要がありますか?
2. チャート間の連携の必要性の有無。
3. ドリルダウンの詳細にどの列を表示するか。
4. JS ブロックおよびチャート イベントをどのように編成する必要があります。
5. どのコードをチャートのカスタム オプションに配置する必要があり、どのコードを JS ブロックに配置する必要があります。
```

このようにして、AI によって生成されたコンテンツは、単に孤立したコードを与えるのではなく、実際のビジネスに近づきます。

:::warning
AI による構築を選択した場合は、開始する前にバックアップ マネージャーを使用してプロジェクトをバックアップしてください。
:::

## 参考資料

- [チャート構成 ](/data-visualization/guide/chart-options)
- [フロントエンド RunJS](/runjs/)
- [フィルタフォーム ](/interface-builder/blocks/filter-blocks/form)
- [AI構築 - インターフェース構築 ](/ai-builder/ui-builder)]
- [ECharts Options](https://echarts.apache.org/en/option.html)
