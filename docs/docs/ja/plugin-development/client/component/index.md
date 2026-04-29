---
title: "Component コンポーネント開発"
description: "NocoBase クライアントコンポーネント開発：React/Antd でプラグインのページコンポーネントを開発し、observable による状態管理、useFlowContext() で NocoBase のコンテキスト機能を取得します。"
keywords: "Component,コンポーネント開発,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Component コンポーネント開発

NocoBase では、ルートにマウントするページコンポーネントは普通の React コンポーネントです。React + [Antd](https://5x.ant.design/) をそのまま使って書くことができ、普通のフロントエンド開発と変わりません。

NocoBase は追加で以下を提供しています：

- **`observable` + `observer`** — 推奨の状態管理方式。`useState` よりも NocoBase エコシステムに適しています
- **`useFlowContext()`** — NocoBase のコンテキスト機能（リクエスト送信、国際化、ルーティングナビゲーションなど）を取得します

## 基本的な書き方

最もシンプルなページコンポーネント：

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

作成したら、プラグインの `load()` 内で `this.router.add()` を使って登録します。詳しくは [Router ルーティング](../router)をご覧ください。

## 状態管理：observable

NocoBase では、React の `useState` の代わりに `observable` + `observer` を使ったコンポーネント状態管理を推奨しています。その利点は：

- オブジェクトのプロパティを直接変更するだけで更新がトリガーされ、`setState` が不要
- 自動的な依存関係収集により、使用しているプロパティが変化した時のみコンポーネントが再レンダリングされる
- NocoBase の内部（FlowModel、FlowContext など）のリアクティブ機構と一貫性がある

基本的な使い方：`observable.deep()` でリアクティブオブジェクトを作成し、`observer()` でコンポーネントをラップします。`observable` と `observer` はどちらも `@nocobase/flow-engine` からインポートします：

```tsx
import React from 'react';
import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// リアクティブな状態オブジェクトを作成
const state = observable.deep({
  text: '',
});

// observer でコンポーネントをラップすると、状態変化時に自動更新される
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="何か入力してください..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>入力内容：{state.text}</div>}
    </div>
  );
});

export default DemoPage;
```

プレビュー：

```tsx file="./_demos/observable-basic.tsx" preview
```

より詳しい使い方は [Observable リアクティブ機構](../../../flow-engine/observable)をご覧ください。

## useFlowContext の使い方

`useFlowContext()` は NocoBase の機能と接続するためのエントリポイントです。`@nocobase/flow-engine` からインポートし、`ctx` オブジェクトを返します：

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();
  // ctx.api — リクエスト送信
  // ctx.t — 国際化
  // ctx.router — ルーティングナビゲーション
  // ctx.logger — ログ
  // ...
}
```

以下は主な機能の使用例です。

### リクエスト送信

`ctx.api.request()` でバックエンド API を呼び出します。使い方は [Axios](https://axios-http.com/) と同じです：

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### 国際化

`ctx.t()` で翻訳テキストを取得します：

```tsx
const label = ctx.t('Hello');
// 名前空間を指定
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### ルーティングナビゲーション

`ctx.router.navigate()` でページ遷移します：

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

現在のルートパラメータを取得：

```tsx
// 例えばルート定義が /users/:id の場合
const { id } = ctx.route.params; // 動的パラメータの取得
```

現在のルート名を取得：

```tsx
const { name } = ctx.route; // ルート名の取得
```

<!-- ### メッセージ表示、ダイアログ、通知

NocoBase は ctx を通じて Antd のフィードバックコンポーネントをラップしており、ロジックコードから直接呼び出せます：

```tsx
// メッセージ（軽量、自動消失）
ctx.message.success('保存しました');

// ダイアログ確認（ブロッキング、ユーザー操作を待つ）
const confirmed = await ctx.modal.confirm({
  title: '削除しますか？',
  content: '削除後は元に戻せません',
});

// 通知（右側にポップアップ、長いメッセージに適する）
ctx.notification.open({
  message: 'インポート完了',
  description: '合計42件のレコードをインポートしました',
});
```

### ログ

`ctx.logger` で構造化ログを出力：

```tsx
ctx.logger.info('ページの読み込み完了', { page: 'UserList' });
ctx.logger.error('データの読み込みに失敗', { error });
``` -->

その他のログレベルと使い方は [Context → 共通機能](../ctx/common-capabilities)をご覧ください。

## 完全な例

observable、useFlowContext、Antd を組み合わせた、バックエンドからデータを取得して表示するページコンポーネント：

```tsx
// pages/PostListPage.tsx
import React, { useEffect } from 'react';
import { Button, Card, List, Spin } from 'antd';
import { observable, observer, FlowContext, useFlowContext } from '@nocobase/flow-engine';

interface Post {
  id: number;
  title: string;
}

// observable でページ状態を管理
const state = observable.deep({
  posts: [] as Post[],
  loading: true,
});

const PostListPage = observer(() => {
  const ctx = useFlowContext();

  useEffect(() => {
    loadPosts(ctx);
  }, []);

  return (
    <Card title={ctx.t('Post list')}>
      <Spin spinning={state.loading}>
        <List
          dataSource={state.posts}
          renderItem={(post: Post) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleDelete(ctx, post.id)}>
                  {ctx.t('Delete')}
                </Button>,
              ]}
            >
              {post.title}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
});

async function loadPosts(ctx: FlowContext) {
  state.loading = true;
  try {
    const response = await ctx.api.request({
      url: 'posts:list',
      method: 'get',
    });
    state.posts = response.data?.data || [];
  } catch (error) {
    ctx.logger.error('記事リストの読み込みに失敗', { error });
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ctx: FlowContext, id: number) {
  await ctx.api.request({
    url: `posts:destroy/${id}`,
    method: 'post',
  });
  loadPosts(ctx); // リストを更新
}

export default PostListPage;
```

## 次のステップ

- `useFlowContext` が提供する全機能 — [Context コンテキスト](../ctx/index.md)を参照
- コンポーネントのスタイルとテーマカスタマイズ — [Styles & Themes スタイルとテーマ](./styles-themes)を参照
- コンポーネントを NocoBase の「ブロックの追加 / フィールド / 操作」メニューに表示し、ユーザーのビジュアル設定をサポートする場合は FlowModel でラップする必要があります — [FlowEngine](../flow-engine/index.md)を参照
- Component と FlowModel のどちらを使うか迷ったら — [Component vs FlowModel](../component-vs-flow-model)を参照

## 関連リンク

- [Router ルーティング](../router) — ページルートの登録、コンポーネントの URL へのマウント
- [Context コンテキスト](../ctx/index.md) — useFlowContext の全機能の紹介
- [Styles & Themes スタイルとテーマ](./styles-themes) — createStyles、テーマ token など
- [FlowEngine](../flow-engine/index.md) — ビジュアル設定が必要な場合は FlowModel を使用
- [Observable リアクティブ機構](../../../flow-engine/observable) — FlowEngine のリアクティブ状態管理
- [Context → 共通機能](../ctx/common-capabilities) — ctx.api、ctx.t などの組み込み機能
- [Component vs FlowModel](../component-vs-flow-model) — コンポーネントか FlowModel かの選択
