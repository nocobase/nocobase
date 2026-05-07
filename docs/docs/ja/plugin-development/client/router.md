---
title: "Router ルーティング"
description: "NocoBase クライアントルーティング：this.router.add によるページルート登録、pluginSettingsManager によるプラグイン設定ページ登録（addMenuItem + addPageTabItem）。"
keywords: "Router,ルーティング,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,ページ登録,NocoBase"
---

# Router ルーティング

NocoBase では、プラグインはルーティングを通じてページを登録します。よく使われる 2 つの方法があります：

- `this.router.add()` -- 通常のページルートを登録します
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` -- プラグイン設定ページを登録します

ルーティングの登録は通常、プラグインの `load()` メソッド内で行います。詳細は [Plugin プラグイン](./plugin) をご覧ください。

:::warning 注意

NocoBase v2 のプラグインでは、ルート登録後にデフォルトで `/v2` プレフィックスが付与されます。アクセス時にはこのプレフィックスを含める必要があります。

:::

## デフォルトルート

NocoBase には以下のデフォルトルートが登録されています：

| 名前           | パス                  | コンポーネント        | 説明               |
| -------------- | --------------------- | ------------------- | ------------------ |
| admin          | /v2/admin/\*          | AdminLayout         | 管理画面ページ     |
| admin.page     | /v2/admin/:name       | AdminDynamicPage    | 動的に作成されるページ |
| admin.settings | /v2/admin/settings/\* | AdminSettingsLayout | プラグイン設定ページ |

## ページルート

`this.router.add()` でページルートを登録します。ページコンポーネントには `componentLoader` を使用してオンデマンドロードすることを推奨します。これにより、実際にアクセスした時にのみページコードがロードされます。

:::warning 注意

ページファイルは `export default` でコンポーネントをエクスポートする必要があります。

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

プラグインの `load()` で登録します：

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // オンデマンドロード、/v2/hello にアクセスした時にのみモジュールをロード
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

`router.add()` の第 1 引数はルート名で、ドット `.` で親子関係を表現できます。例えば `root.home` は `root` の子ルートを意味します。

コンポーネント内では、`ctx.router.navigate('/hello')` でこのルートにナビゲートできます。

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { Button } from 'antd';

export default function SomeComponent() {
  const ctx = useFlowContext();
  return (
    <Button onClick={() => ctx.router.navigate('/hello')}>
      Go to Hello Page
    </Button>
  );
}
```

詳細は [Component コンポーネント開発](./component/index.md) のルーティングセクションをご覧ください。

### ネストされたルート

ドット記法による命名でネストを実現し、親ルートは `<Outlet />` で子ルートの内容をレンダリングします：

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // 親ルート、element で直接レイアウトを記述
    this.router.add('root', {
      element: (
        <div>
          <nav>ナビゲーションバー</nav>
          <Outlet />
        </div>
      ),
    });

    // 子ルート、componentLoader でオンデマンドロード
    this.router.add('root.home', {
      path: '/', // -> /v2/
      componentLoader: () => import('./pages/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about', // -> /v2/about
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}
```

### 動的パラメータ

ルートパスは動的パラメータに対応しています：

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v2/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

コンポーネント内では、`ctx.route.params` で動的パラメータを取得できます：

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // 動的パラメータ id を取得
  return <h1>User ID: {id}</h1>;
}
```

詳細は [Component コンポーネント開発](./component/index.md) のルーティングセクションをご覧ください。

### componentLoader と element の違い

- **`componentLoader`**（推奨）：オンデマンドロード。ページコンポーネントに適しており、ページファイルは `export default` が必要です
- **`element`**：JSX を直接渡します。レイアウトコンポーネントや非常に軽量なインラインページに適しています

ページ自体の依存関係が重い場合は、`componentLoader` を優先して使用することを推奨します。

## プラグイン設定ページ

`this.pluginSettingsManager` でプラグイン設定ページを登録します。登録は 2 ステップで行います -- まず `addMenuItem()` でメニューエントリを登録し、次に `addPageTabItem()` で実際のページを登録します。設定ページは NocoBase の「プラグイン設定」メニューに表示されます。

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // メニューエントリを登録
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello 設定'),
      icon: 'ApiOutlined', // Ant Design アイコン名、参考：https://5x.ant.design/components/icon
    });

    // ページを登録（key が 'index' の場合、メニューのルートパスにマッピング）
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello 設定'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

登録後、アクセスパスは `/admin/settings/hello` となります。メニューにページが 1 つしかない場合、上部のタブバーは自動的に非表示になります。

### 複数タブの設定ページ

設定ページに複数のサブページが必要な場合、同じ `menuKey` で複数の `addPageTabItem` を登録します -- 上部にタブバーが自動的に表示されます：

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // メニューエントリを登録
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // タブ 1：基本設定（key が 'index'、/admin/settings/hello にマッピング）
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('基本設定'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // タブ 2：詳細設定（/admin/settings/hello/advanced にマッピング）
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('詳細設定'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

### addMenuItem パラメータ

| フィールド | 型                    | 必須 | 説明                                           |
| ---------- | --------------------- | ---- | ---------------------------------------------- |
| `key`      | `string`              | はい | メニューの一意識別子。`.` を含めることはできません |
| `title`    | `ReactNode`           | いいえ | メニュータイトル                               |
| `icon`     | `string \| ReactNode` | いいえ | メニューアイコン。文字列の場合は組み込みの `Icon` でレンダリングされます |
| `sort`     | `number`              | いいえ | ソート値。小さいほど前に表示されます。デフォルトは `0` |
| `showTabs` | `boolean`             | いいえ | 上部タブバーを表示するかどうか。デフォルトではページ数に応じて自動判定 |
| `hidden`   | `boolean`             | いいえ | ナビゲーションエントリを非表示にするかどうか   |

### addPageTabItem パラメータ

| フィールド        | 型          | 必須 | 説明                                                        |
| ----------------- | ----------- | ---- | ----------------------------------------------------------- |
| `menuKey`         | `string`    | はい | 所属メニューの `key`。`addMenuItem` の `key` に対応します   |
| `key`             | `string`    | はい | ページの一意識別子。`'index'` はデフォルトページを意味し、メニューのルートパスにマッピングされます |
| `title`           | `ReactNode` | いいえ | ページタイトル（タブに表示されます）                       |
| `componentLoader` | `Function`  | いいえ | 遅延ロードページコンポーネント（推奨）                     |
| `Component`       | `Component` | いいえ | コンポーネントを直接渡します（`componentLoader` と択一）   |
| `sort`            | `number`    | いいえ | ソート値。小さいほど前に表示されます                       |
| `hidden`          | `boolean`   | いいえ | タブで非表示にするかどうか                                 |
| `link`            | `string`    | いいえ | 外部リンク。設定するとタブクリック時に外部アドレスに遷移します |

## 関連リンク

- [Plugin プラグイン](./plugin) -- ルーティングは `load()` 内で登録します
- [Component コンポーネント開発](./component/index.md) -- ルートにマウントするページコンポーネントの書き方
- [プラグイン実践例：プラグイン設定ページを作成する](./examples/settings-page) -- 完全な設定ページの例
