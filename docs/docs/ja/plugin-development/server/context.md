:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# コンテキスト

NocoBase では、各リクエストで `ctx` オブジェクトが生成されます。これは `Context` のインスタンスです。`Context` には、リクエストとレスポンスの情報がカプセル化されており、データベースアクセス、キャッシュ操作、権限管理、国際化、ログ記録など、NocoBase 独自の機能も提供されています。

NocoBase の `Application` は Koa をベースにしているため、`ctx` は本質的に Koa の `Context` です。しかし、NocoBase はその上に豊富な API を拡張しており、開発者はミドルウェアやアクションでビジネスロジックを簡単に処理できます。各リクエストは独立した `ctx` を持つため、リクエスト間のデータ分離と安全性が保証されます。

## ctx.action

`ctx.action` は、現在のリクエストで実行されているアクションへのアクセスを提供します。以下が含まれます。

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // 現在のアクション名を出力
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

国際化（i18n）をサポートしています。

- `ctx.i18n` はロケール情報を提供します。
- `ctx.t()` は言語に基づいて文字列を翻訳するために使用します。

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // リクエストの言語に基づいて翻訳を返します
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` はデータベースアクセスインターフェースを提供し、モデルの操作やクエリの実行を直接行えます。

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` はキャッシュ操作を提供し、キャッシュの読み書きをサポートします。データアクセスを高速化したり、一時的な状態を保存したりする際によく使用されます。

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // 60秒間キャッシュ
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` は NocoBase アプリケーションのインスタンスで、グローバル設定、プラグイン、サービスにアクセスできます。

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app'; // コンソールでアプリを確認してください
});
```

## ctx.auth.user

`ctx.auth.user` は、現在認証されているユーザー情報を取得します。権限チェックやビジネスロジックでの使用に適しています。

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` は、ミドルウェアチェーンでデータを共有するために使用されます。

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` はログ記録機能を提供し、複数のレベルでのログ出力をサポートしています。

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` は権限管理に使用され、`ctx.can()` は現在のユーザーが特定のアクションを実行する権限を持っているかを確認するために使用されます。

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## まとめ

- 各リクエストは独立した `ctx` オブジェクトに対応します。
- `ctx` は Koa `Context` を拡張したもので、NocoBase の機能が統合されています。
- よく使われるプロパティには、`ctx.db`、`ctx.cache`、`ctx.auth`、`ctx.state`、`ctx.logger`、`ctx.can()`、`ctx.t()` などがあります。
- ミドルウェアやアクションで `ctx` を使用すると、リクエスト、レスポンス、権限、ログ、データベースを簡単に操作できます。