---
title: "JSItem JS アイテム"
description: "JSItem JS アイテム：操作バーで JavaScript/JSX を使用してカスタム操作アイテムをレンダリングします。React、ctx、コレクション/レコード/フォームコンテキストの連動をサポートします。"
keywords: "JSItem,JS Item,JS アイテム,カスタム操作アイテム,JavaScript,インターフェース構築,NocoBase"
---

# JS Item

## 紹介

JS Item は操作バーに「カスタム操作アイテム」をレンダリングするために使用します。JavaScript / JSX を直接記述して、ボタン、ボタングループ、ドロップダウンメニュー、ヒントテキスト、ステータスタグ、または小規模なインタラクティブコンポーネントなど、任意の UI を出力できます。コンポーネント内部から API を呼び出したり、ポップアップを開いたり、現在のレコードを読み取ったり、ブロックデータをリフレッシュしたりすることも可能です。

フォームツールバー、テーブルツールバー（コレクションレベル）、テーブル行操作（レコードレベル）などの位置で使用でき、以下のシーンに適しています：

- ボタンにクリックイベントをバインドするだけでなく、カスタムのボタン構造が必要な場合
- 複数の操作を一つのボタングループやドロップダウンメニューにまとめたい場合
- 操作バーにリアルタイムのステータス、統計情報、または説明コンテンツを表示したい場合
- 現在のレコード、選択データ、フォーム値に基づいて動的に異なるコンテンツをレンダリングしたい場合

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## JS Action との違い

- `JS Action`：「ボタンクリック後にスクリプトを実行する」のに適しており、動作ロジックに重点を置きます。
- `JS Item`：「操作アイテムを自分でレンダリングする」のに適しており、UI とインタラクションロジックの両方を制御します。

既存のボタンにクリックロジックを追加するだけであれば、`JS Action` を優先的に使用してください。操作アイテムの UI 構造をカスタマイズしたり、複数のコントロールをレンダリングしたい場合は、`JS Item` を優先的に使用してください。

## ランタイムコンテキスト API（よく使うもの）

JS Item のランタイムでは一般的な機能が注入され、スクリプト内で直接使用できます：

- `ctx.render(vnode)`：React 要素、HTML 文字列、または DOM ノードを現在の操作アイテムコンテナにレンダリングします。
- `ctx.element`：現在の操作アイテムの DOM コンテナ（ElementProxy）。
- `ctx.api.request(options)`：HTTP リクエストを発行します。
- `ctx.openView(viewUid, options)`：設定済みのビュー（ドロワー / ダイアログ / ページ）を開きます。
- `ctx.message` / `ctx.notification`：グローバルメッセージと通知。
- `ctx.t()` / `ctx.i18n.t()`：国際化。
- `ctx.resource`：コレクションレベルのコンテキストのデータリソース。例：選択レコードの読み取り、リストのリフレッシュ。
- `ctx.record`：レコードレベルのコンテキストの現在行レコード。
- `ctx.form`：フォームレベルのコンテキストの AntD Form インスタンス。
- `ctx.blockModel` / `ctx.collection`：所属ブロックとコレクションのメタ情報。
- `ctx.requireAsync(url)`：URL で AMD / UMD ライブラリを非同期に読み込みます。
- `ctx.importAsync(url)`：URL で ESM モジュールを動的にインポートします。
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：組み込みの一般的なライブラリ。JSX レンダリング、日時処理、データ処理、数学演算に直接使用できます。

> 実際に使用可能な変数は、操作アイテムの配置場所によって異なります。例えば、テーブル行操作では通常 `ctx.record` にアクセスでき、フォームツールバーでは通常 `ctx.form` にアクセスでき、テーブルツールバーでは通常 `ctx.resource` にアクセスできます。

## エディタとスニペット

- `Snippets`：組み込みコードスニペットリストを開き、検索してワンクリックで現在のカーソル位置に挿入できます。
- `Run`：現在のコードを直接実行し、実行ログを下部の `Logs` パネルに出力します。`console.log/info/warn/error` とエラーのハイライト定位をサポートしています。

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- AI 従業員と組み合わせてスクリプトの生成/修正が可能です：[AI 従業員 - Nathan：フロントエンドエンジニア](/ai-employees/features/built-in-employee)

## 一般的な使い方（簡潔な例）

### 1) 通常のボタンをレンダリング

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) コレクション操作：ボタンとドロップダウンメニューの組み合わせ

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) レコード操作：現在の行に基づいてビューを開く

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // ドロワーとしてビューを開き、トップレベルで引数を渡す
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) カスタムステータスコンテンツのレンダリング

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## 注意事項

- 「クリック後にロジックを実行する」だけであれば、`JS Action` を優先的に使用してください。実装がより直接的です。
- API 呼び出しには `try/catch` とユーザー向けメッセージを追加し、例外がサイレントに失敗することを避けてください。
- テーブル、リスト、ポップアップの連動時には、送信成功後に `ctx.resource?.refresh?.()` またはブロックリソースを通じてデータを能動的にリフレッシュできます。
- 外部ライブラリを使用する場合は、信頼できる CDN から読み込み、読み込み失敗時のフォールバック処理を用意してください。

## 関連ドキュメント

- [変数とコンテキスト](/interface-builder/variables)
- [連動ルール](/interface-builder/linkage-rule)
- [ビューとポップアップ](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
