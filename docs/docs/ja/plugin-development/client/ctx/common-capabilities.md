---
title: "共通機能"
description: "NocoBase クライアントコンテキストの共通機能：ctx.api リクエスト、ctx.t 国際化、ctx.logger ログ、ctx.router ルーティング、ctx.viewer ビュー管理、ctx.acl アクセス制御。"
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# 共通機能

コンテキストオブジェクトは NocoBase の各種組み込み機能を提供します。ただし、一部の機能は Plugin でのみ利用可能、一部はコンポーネントでのみ利用可能、一部は両方で使えるが書き方が異なります。まず一覧を確認しましょう：

| 機能       | Plugin（`this.xxx`）          | Component（`ctx.xxx`）       | 説明                              |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| API リクエスト | `this.context.api`            | `ctx.api`                    | 使い方は同じ                      |
| 国際化     | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` はプラグインの namespace を自動注入 |
| ログ       | `this.context.logger`         | `ctx.logger`                 | 使い方は同じ                      |
| ルート登録 | `this.router.add()`           | -                            | Plugin のみ                       |
| ページ遷移 | -                             | `ctx.router.navigate()`      | コンポーネントのみ                |
| ルート情報 | `this.context.location`       | `ctx.route` / `ctx.location` | コンポーネント内での使用を推奨    |
| ビュー管理 | `this.context.viewer`         | `ctx.viewer`                 | ダイアログ / ドロワーを開くなど   |
| FlowEngine | `this.flowEngine`             | -                            | Plugin のみ                       |

以下、namespace ごとに紹介します。

## API リクエスト（ctx.api）

`ctx.api.request()` でバックエンド API を呼び出します。使い方は [Axios](https://axios-http.com/) と同じです。

### Plugin 内での使用

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // load() 内で直接リクエストを送信
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('アプリケーション情報', response.data);
  }
}
```

### コンポーネント内での使用

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // GET リクエスト
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // POST リクエスト
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>データを読み込む</button>;
}
```

### ahooks useRequest との併用

コンポーネント内では、[ahooks](https://ahooks.js.org/hooks/use-request/index) の `useRequest` を使ってリクエストの状態管理を簡素化できます：

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>リクエストエラー: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>更新</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### リクエストインターセプター

`ctx.api.axios` を通じてリクエスト / レスポンスのインターセプターを追加できます。通常は Plugin の `load()` 内で設定します：

```ts
async load() {
  // リクエストインターセプター：カスタムヘッダーを追加
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // レスポンスインターセプター：統一エラー処理
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('リクエストエラー', error);
      return Promise.reject(error);
    },
  );
}
```

### NocoBase カスタムリクエストヘッダー

NocoBase Server は以下のカスタムリクエストヘッダーをサポートしています。通常はインターセプターによって自動注入されるため、手動で設定する必要はありません：

| Header            | 説明                                    |
| ----------------- | --------------------------------------- |
| `X-App`           | マルチアプリシーンで現在のアプリを指定  |
| `X-Locale`        | 現在の言語（例：`zh-CN`、`en-US`）      |
| `X-Hostname`      | クライアントのホスト名                  |
| `X-Timezone`      | クライアントのタイムゾーン（例：`+08:00`）|
| `X-Role`          | 現在のロール                            |
| `X-Authenticator` | 現在のユーザー認証方式                  |

## 国際化（ctx.t / ctx.i18n）

NocoBase プラグインは `src/locale/` ディレクトリで多言語ファイルを管理し、`ctx.t()` でコード内から翻訳を使用します。

### 多言語ファイル

プラグインの `src/locale/` 配下に言語ごとの JSON ファイルを作成します：

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning 注意

初めて言語ファイルを追加した場合、アプリの再起動が必要です。

:::

### ctx.t()

コンポーネント内で `ctx.t()` を使って翻訳テキストを取得します：

```tsx
const ctx = useFlowContext();

// 基本的な使い方
ctx.t('Hello');

// 変数付き
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// 名前空間を指定（デフォルトの名前空間はプラグインのパッケージ名）
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

Plugin 内では `this.t()` がより便利です — **プラグインのパッケージ名を namespace として自動注入**するため、手動で `ns` を渡す必要がありません：

```ts
class MyPlugin extends Plugin {
  async load() {
    // 自動的に現在のプラグインのパッケージ名を ns として使用
    console.log(this.t('Hello'));

    // 以下と同等
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` は基盤となる [i18next](https://www.i18next.com/) インスタンスです。通常は `ctx.t()` だけで十分ですが、動的な言語切り替えや言語変更の監視などが必要な場合は `ctx.i18n` を使います：

```ts
// 現在の言語を取得
const currentLang = ctx.i18n.language; // 'zh-CN'

// 言語変更を監視
ctx.i18n.on('languageChanged', (lng) => {
  console.log('言語が変更されました', lng);
});
```

### tExpr()

`tExpr()` は遅延翻訳の式文字列を生成するために使います。通常は `FlowModel.define()` 内で使用します — define はモジュール読み込み時に実行されますが、この時点では i18n インスタンスがまだ存在しないためです：

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // '{{t("Hello block")}}' を生成し、ランタイムで翻訳
});
```

より完全な国際化の使い方（翻訳ファイルの書き方、useT hook、tExpr など）は [i18n 国際化](../component/i18n)をご覧ください。NocoBase がサポートする言語コードの完全なリストは[言語一覧](../../languages)をご覧ください。

## ログ（ctx.logger）

`ctx.logger` で構造化ログを出力します。[pino](https://github.com/pinojs/pino) ベースです。

### Plugin 内での使用

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('プラグインの読み込み完了', { plugin: 'my-plugin' });
    this.context.logger.error('初期化に失敗', { error });
  }
}
```

### コンポーネント内での使用

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('ページの読み込み完了', { page: 'UserList' });
    ctx.logger.debug('現在のユーザー状態', { user });
  };

  // ...
}
```

ログレベルは高い順に：`fatal` > `error` > `warn` > `info` > `debug` > `trace`。現在の設定レベル以上のログのみが出力されます。

## ルーティング（ctx.router / ctx.route / ctx.location）

ルーティング関連の機能は3つの部分に分かれます：登録（Plugin のみ）、ナビゲーション、情報取得（コンポーネントのみ）。

### ルート登録（this.router / this.pluginSettingsManager）

Plugin の `load()` 内で `this.router.add()` によりページルートを登録し、`this.pluginSettingsManager` によりプラグイン設定ページを登録します：

```ts
async load() {
  // 通常のページルートを登録
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // プラグイン設定ページを登録（「プラグイン設定」メニューに表示される）
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Ant Design アイコン。参考：https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

詳しい使い方は [Router ルーティング](../router)をご覧ください。完全な設定ページの例は[プラグイン設定ページを作る](../examples/settings-page)をご覧ください。

:::warning 注意

`this.router` は RouterManager で、**ルートの登録**に使います。`this.pluginSettingsManager` は PluginSettingsManager で、**設定ページの登録**に使います。これらはコンポーネント内の `ctx.router`（React Router、**ページナビゲーション**に使用）とは別のものです。

:::

### ページナビゲーション（ctx.router）

コンポーネント内で `ctx.router.navigate()` を使ってページ遷移します：

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### ルート情報（ctx.route）

コンポーネント内で `ctx.route` から現在のルート情報を取得します：

```tsx
const ctx = useFlowContext();

// 動的パラメータの取得（例：ルート定義が /users/:id の場合）
const { id } = ctx.route.params;

// ルート名の取得
const { name } = ctx.route;
```

`ctx.route` の完全な型：

```ts
interface RouteOptions {
  name?: string;         // ルートの一意識別子
  path?: string;         // ルートテンプレート
  pathname?: string;     // ルートの完全パス
  params?: Record<string, any>; // ルートパラメータ
}
```

### 現在の URL（ctx.location）

`ctx.location` は現在の URL の詳細情報を提供します。ブラウザの `window.location` に似ています：

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

`ctx.route` と `ctx.location` は Plugin 内でも `this.context` 経由でアクセスできますが、プラグイン読み込み時の URL は不定であるため、取得した値に意味はありません。コンポーネント内での使用をお勧めします。

## ビュー管理（ctx.viewer / ctx.view）

`ctx.viewer` はダイアログやドロワーなどのビューを命令的に開く機能を提供します。Plugin とコンポーネントの両方で使用できます。

### Plugin 内での使用

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 初期化ロジック内でダイアログを開く例
    this.context.viewer.dialog({
      title: 'ようこそ',
      content: () => <div>プラグインの初期化が完了しました</div>,
    });
  }
}
```

### コンポーネント内での使用

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // ダイアログを開く
    ctx.viewer.dialog({
      title: 'ユーザー編集',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // ドロワーを開く
    ctx.viewer.drawer({
      title: '詳細',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>編集</Button>
      <Button onClick={openDrawer}>詳細を表示</Button>
    </div>
  );
}
```

### 汎用メソッド

```tsx
// type でビュータイプを指定
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: 'タイトル',
  content: () => <SomeComponent />,
});
```

### ビュー内部での操作（ctx.view）

ダイアログ / ドロワー内部のコンポーネントでは、`ctx.view` を使って現在のビューを操作できます（例：閉じる）：

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>ダイアログの内容</p>
      <Button onClick={() => ctx.view.close()}>閉じる</Button>
    </div>
  );
}
```

## FlowEngine（this.flowEngine）

`this.flowEngine` は FlowEngine インスタンスで、Plugin 内でのみ使用可能です。通常は FlowModel の登録に使います：

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // FlowModel の登録（推奨の遅延読み込み方式）
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel は NocoBase のビジュアル設定体系の中核です。コンポーネントを「ブロックの追加 / フィールド / 操作」メニューに表示する必要がある場合、FlowModel でラップします。詳しい使い方は [FlowEngine](../flow-engine/index.md)をご覧ください。

## その他の機能

以下の機能はより高度なシーンで使用する可能性があります。ここでは概要のみ記載します：

| プロパティ              | 説明                                            |
| ----------------------- | ----------------------------------------------- |
| `ctx.model`             | 現在の FlowModel インスタンス（Flow 実行コンテキスト内で利用可能） |
| `ctx.ref`               | コンポーネント参照。`ctx.onRefReady` と組み合わせて使用 |
| `ctx.exit()`            | 現在の Flow の実行を終了                        |
| `ctx.defineProperty()`  | コンテキストにカスタムプロパティを動的に追加    |
| `ctx.defineMethod()`    | コンテキストにカスタムメソッドを動的に追加      |
| `ctx.useResource()`     | データリソース操作インターフェースの取得        |
| `ctx.dataSourceManager` | データソース管理                                |

これらの機能の詳しい使い方は [FlowEngine 完全ドキュメント](../../../flow-engine/index.md)を参照してください。

## 関連リンク

- [Context コンテキスト概要](../ctx/index.md) — 2つのコンテキストエントリの違い
- [Plugin プラグイン](../plugin) — Plugin のショートカットプロパティ
- [Component コンポーネント開発](../component/index.md) — コンポーネントでの useFlowContext の使い方
- [Router ルーティング](../router) — ルート登録とナビゲーション
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — 完全な FlowEngine リファレンス
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方、tExpr、useT
- [言語一覧](../../languages) — NocoBase がサポートする言語コード
- [プラグイン設定ページを作る](../examples/settings-page) — ctx.api の完全な使用例
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方
