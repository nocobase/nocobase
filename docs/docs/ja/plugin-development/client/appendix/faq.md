---
title: "よくある質問 & トラブルシューティング"
description: "NocoBase クライアントプラグイン開発のよくある質問：プラグインが表示されない、ブロックが出ない、翻訳が反映されない、ルートが見つからない、ホットリロードが効かない、ビルドエラー、デプロイ後の起動失敗などの問題調査。"
keywords: "FAQ,よくある質問,トラブルシューティング,Troubleshooting,NocoBase,ビルド,デプロイ,tar,axios"
---

# よくある質問 & トラブルシューティング

クライアントプラグインの開発でハマりやすいポイントをまとめました。「ちゃんと書いたはずなのに動かない…」という時は、まずここをチェックしてみてください。

## プラグイン関連

### プラグイン作成後にプラグインマネージャーに表示されない

手動でディレクトリを作成するのではなく、`yarn pm create` を実行したか確認してください。`yarn pm create` はファイル生成だけでなく、データベースの `applicationPlugins` テーブルへの登録も行います。手動で作成してしまった場合は、`yarn nocobase upgrade` を実行して再スキャンできます。

### プラグインを有効化してもページに変化がない

以下の順番で確認してください：

1. `yarn pm enable <pluginName>` を実行したか確認
2. ブラウザをリフレッシュ（強制リフレッシュ `Ctrl+Shift+R` が必要な場合もあります）
3. ブラウザのコンソールにエラーが出ていないか確認

### コードを修正してもページが更新されない

ファイルの種類によって、ホットリロードの挙動が異なります：

| ファイルタイプ | 修正後に必要なこと |
| --- | --- |
| `src/client-v2/` 配下の tsx/ts | 自動ホットリロード、操作不要 |
| `src/locale/` 配下の翻訳ファイル | **アプリの再起動** |
| `src/server/collections/` 配下の新規・修正 collection | `yarn nocobase upgrade` を実行 |

クライアントコードを変更してもホットリロードされない場合は、まずブラウザをリフレッシュしてみてください。

## ルーティング関連

### 登録したページルートにアクセスできない

NocoBase v2 のルートにはデフォルトで `/v2` プレフィックスが付きます。例えば `path: '/hello'` で登録した場合、実際のアクセス URL は `/v2/hello` になります：

```ts
this.router.add('hello', {
  path: '/hello', // 実際のアクセス -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

詳しくは [Router ルーティング](../router)をご覧ください。

### プラグイン設定ページに入ると空白になる

設定ページのメニューは表示されるがコンテンツが空の場合、通常は以下のどちらかが原因です：

**原因1：v1 client で `componentLoader` を使っている**

`componentLoader` は client-v2 の書き方で、v1 client では `Component` でコンポーネントを直接渡す必要があります：

```ts
// ❌ v1 client は componentLoader をサポートしていない
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// ✅ v1 client は Component を使う
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**原因2：ページコンポーネントが `export default` でエクスポートされていない**

`componentLoader` はモジュールにデフォルトエクスポートが必要です。`default` が抜けているとロードできません。

## ブロック関連

### カスタムブロックが「ブロックの追加」メニューに表示されない

`load()` 内でモデルを登録しているか確認してください：

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

`registerModels`（非遅延読み込み方式）を使っている場合は、`models/index.ts` でモデルが正しくエクスポートされているか確認してください。

### ブロック追加時にデータテーブルの選択リストに自分のテーブルがない

`defineCollection` で定義したテーブルはサーバー内部テーブルであり、デフォルトでは UI のデータテーブルリストに表示されません。

**推奨方法**：NocoBase 画面の「[データソース管理](../../../data-sources/data-source-main/index.md)」で対応するデータテーブルを追加し、フィールドとインターフェースタイプを設定してください。設定後、ブロックのデータテーブル選択リストに自動的に表示されます。

プラグインコード内で登録が必要な場合（サンプルプラグインのデモシナリオなど）は、`addCollection` で手動登録できます。詳しくは[フロントエンドとバックエンドが連携するデータ管理プラグインを作る](../examples/fullstack-plugin)をご覧ください。`eventBus` パターンで登録する必要があり、`load()` 内で直接呼び出すことはできません。`ensureLoaded()` が `load()` の後にすべての collection をクリアして再設定するためです。

### カスタムブロックを特定のデータテーブルにのみバインドしたい

モデル上で `static filterCollection` をオーバーライドし、`true` を返す collection だけが選択リストに表示されます：

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## フィールド関連

### カスタムフィールドコンポーネントが「フィールドコンポーネント」ドロップダウンに表示されない

以下の順番で確認してください：

1. `DisplayItemModel.bindModelToInterface('ModelName', ['input'])` を呼び出しているか確認。interface タイプが一致しているか注意してください（例：`input` は単行テキスト、`checkbox` はチェックボックス）
2. モデルが `load()` 内で登録されているか確認（`registerModels` または `registerModelLoaders`）
3. フィールドモデルで `define({ label })` を呼び出しているか確認

### フィールドコンポーネントのドロップダウンにクラス名が表示される

フィールドモデルで `define({ label })` の呼び出しが抜けています。追加すれば解決します：

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

同時に `src/locale/` 配下の翻訳ファイルに対応する key があるか確認してください。なければ日本語環境でも英語の原文が表示されます。

## 操作関連

### カスタム操作ボタンが「操作の設定」に表示されない

モデルに正しい `static scene` が設定されているか確認してください：

| 値 | 表示場所 |
| --- | --- |
| `ActionSceneEnum.collection` | ブロック上部の操作バー（「新規作成」ボタンの横など） |
| `ActionSceneEnum.record` | テーブル各行の操作列（「編集」「削除」の横など） |
| `ActionSceneEnum.both` | 両方のシーンに表示 |

### 操作ボタンをクリックしても反応がない

`registerFlow` の `on` が `'click'` に設定されているか確認してください：

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // ボタンクリックをリッスン
  steps: {
    doSomething: {
      async handler(ctx) {
        // ロジックを記述
      },
    },
  },
});
```

:::warning 注意

`registerFlow` 内の `uiSchema` は設定パネル（設定モード）の UI であり、ランタイムのダイアログではありません。ボタンクリック後にフォームダイアログを表示したい場合は、`handler` 内で `ctx.viewer.dialog()` を使用してダイアログを開いてください。

:::

## 国際化関連

### 翻訳が反映されない

最もよくある原因：

- **初めて** `src/locale/` ディレクトリやファイルを追加した場合 — アプリの再起動が必要
- **翻訳の key が一致していない** — key がコード内の文字列と完全に一致しているか確認（スペースや大文字・小文字に注意）
- **コンポーネント内で `ctx.t()` を直接使っている** — `ctx.t()` はプラグインの namespace を自動注入しません。コンポーネント内では `useT()` hook（`locale.ts` からインポート）を使ってください

### `tExpr()` と `useT()` と `this.t()` のシーンを間違えている

この3つの翻訳メソッドは使用シーンが異なります。間違えるとエラーになるか翻訳が反映されません：

| メソッド | 使う場所 | 説明 |
| --- | --- | --- |
| `tExpr()` | `define()`、`registerFlow()` などの静的定義 | モジュール読み込み時は i18n が未初期化のため、遅延翻訳を使用 |
| `useT()` | React コンポーネント内部 | プラグインの namespace がバインドされた翻訳関数を返す |
| `this.t()` | Plugin の `load()` 内 | プラグインのパッケージ名を namespace として自動注入 |

詳しくは [i18n 国際化](../component/i18n)をご覧ください。

## API リクエスト関連

### リクエストが 403 Forbidden を返す

通常はサーバーサイドの ACL が設定されていません。例えば collection 名が `todoItems` の場合、サーバープラグインの `load()` で対応する操作を許可する必要があります：

```ts
// 参照のみ許可
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// 完全な CRUD を許可
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` はログイン済みユーザーがアクセス可能であることを意味します。`acl.allow` を設定しない場合、デフォルトでは管理者のみが操作できます。

### リクエストが 404 Not Found を返す

以下の順番で確認してください：

- `defineCollection` を使っている場合、collection 名のスペルが正しいか確認
- `resourceManager.define` を使っている場合、resource 名と action 名が正しいか確認
- リクエスト URL のフォーマットを確認 — NocoBase の API フォーマットは `resourceName:actionName`（例：`todoItems:list`、`externalApi:get`）

## ビルドとデプロイ関連

### `yarn build --tar` で "no paths specified to add to archive" エラー

`yarn build <pluginName> --tar` 実行時のエラー：

```bash
TypeError: no paths specified to add to archive
```

ただし `yarn build <pluginName>`（`--tar` なし）だけなら正常に動きます。

この問題は通常、プラグインの `.npmignore` で**否定構文**（npm の `!` プレフィックス）を使っていることが原因です。`--tar` パッケージング時、NocoBase は `.npmignore` の各行の先頭に `!` を付けて `fast-glob` の除外パターンに変換します。もし `.npmignore` で既に否定構文を使っている場合、例えば：

```
*
!dist
!package.json
```

処理後は `['!*', '!!dist', '!!package.json', '**/*']` になります。`!*` がすべてのルートレベルファイル（`package.json` を含む）を除外し、`!!dist` は `fast-glob` では「dist を再包含する」とは認識されず、否定が無効になります。`dist/` ディレクトリが空の場合やビルドの出力ファイルがない場合、最終的に収集されるファイルリストが空になり、`tar` がこのエラーをスローします。

**解決方法：** `.npmignore` で否定構文を使わず、除外するディレクトリだけをリストアップしてください：

```
/node_modules
/src
```

パッケージングロジックがこれらを除外パターン（`!./node_modules`、`!./src`）に変換し、`**/*` で他のすべてのファイルにマッチさせます。この書き方はシンプルで、否定処理の問題に遭遇しません。

### プラグインを本番環境にアップロードすると有効化に失敗する（ローカルでは正常）

プラグインがローカル開発では正常に動作するが、「プラグインマネージャー」経由で本番環境にアップロードすると有効化に失敗し、ログに以下のようなエラーが出る場合：

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

この問題は通常、**プラグインが NocoBase 組み込みの依存パッケージを自身の `node_modules/` にバンドルしている**ことが原因です。NocoBase のビルドシステムは [external リスト](../../dependency-management)を管理しており、そこに含まれるパッケージ（`react`、`antd`、`axios`、`lodash` など）は NocoBase ホストが提供するため、プラグインにバンドルすべきではありません。プラグインがプライベートコピーを持っていると、ランタイムでホスト側のバージョンと競合し、さまざまな不可解なエラーが発生します。

**ローカルで問題が起きない理由：** ローカル開発ではプラグインは `packages/plugins/` ディレクトリ配下にあり、プライベートな `node_modules/` を持ちません。依存関係はプロジェクトルートディレクトリの既にロードされたバージョンに解決されるため、競合が発生しません。

**解決方法：** プラグインの `package.json` 内の `dependencies` をすべて `devDependencies` に移動してください。NocoBase のビルドシステムがプラグインの依存関係を自動的に処理します：

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

その後、再ビルドしてパッケージングしてください。これによりプラグインの `dist/node_modules/` にこれらのパッケージが含まれなくなり、ランタイムでは NocoBase ホストが提供するバージョンが使用されます。

:::tip 一般原則

NocoBase のビルドシステムは [external リスト](../../dependency-management)を管理しており、そこに含まれるパッケージ（`react`、`antd`、`axios`、`lodash` など）は NocoBase ホストが提供するため、プラグインは自身でバンドルすべきではありません。プラグインのすべての依存は `devDependencies` に配置し、ビルドシステムが `dist/node_modules/` にバンドルすべきものとホストが提供するものを自動判断します。

:::

## 関連リンク

- [Plugin プラグイン](../plugin) — プラグインエントリとライフサイクル
- [Router ルーティング](../router) — ルート登録と `/v2` プレフィックス
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方
- [FlowEngine → ブロック拡張](../flow-engine/block) — BlockModel、TableBlockModel、filterCollection
- [FlowEngine → フィールド拡張](../flow-engine/field) — FieldModel、bindModelToInterface
- [FlowEngine → 操作拡張](../flow-engine/action) — ActionModel、ActionSceneEnum
- [i18n 国際化](../component/i18n) — 翻訳ファイル、useT、tExpr の使い方
- [Context → 共通機能](../ctx/common-capabilities) — ctx.api、ctx.viewer など
- [サーバーサイド → Collections データテーブル](../../server/collections) — defineCollection と addCollection
- [サーバーサイド → ACL アクセス制御](../../server/acl) — API 権限設定
- [プラグインビルド](../../build) — ビルド設定、external リスト、パッケージングフロー
