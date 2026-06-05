:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ACL 権限管理

ACL（Access Control List）は、リソース操作の権限を制御するために使用されます。権限をロールに付与することも、ロールの制限をスキップして直接権限を制約することも可能です。ACLシステムは、権限スニペット、ミドルウェア、条件判定など、さまざまな方法をサポートする柔軟な権限管理メカニズムを提供します。

:::tip 注意

ACLオブジェクトはデータソース（`dataSource.acl`）に属します。メインのデータソースのACLは、`app.acl` を介して簡単にアクセスできます。その他のデータソースのACLの使用方法については、「[データソース管理](./data-source-manager.md)」の章を参照してください。

:::

## 権限スニペットの登録

権限スニペットは、よく使用される権限の組み合わせを再利用可能な権限単位として登録できます。ロールがスニペットにバインドされると、対応する一連の権限が付与されます。これにより、重複する設定を減らし、権限管理の効率を向上させることができます。

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // ui.* プレフィックスは、UI上で設定可能な権限を示します
  actions: ['customRequests:*'], // 対応するリソース操作で、ワイルドカードをサポートします
});
```

## ロール制約をスキップする権限（`allow`）

`acl.allow()` は、特定のアクションがロール制約をバイパスすることを許可するために使用されます。公開API、動的な権限判定が必要なシナリオ、またはリクエストコンテキストに基づいて権限を判定する必要がある場合に適しています。

```ts
// 公開アクセス、ログイン不要
acl.allow('app', 'getLang', 'public');

// ログイン済みユーザーのみアクセス可能
acl.allow('app', 'getInfo', 'loggedIn');

// カスタム条件に基づく判定
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**`condition` パラメーターの説明：**

- `'public'`：認証されていないユーザーを含む、すべてのユーザーがアクセスできます。認証は不要です。
- `'loggedIn'`：ログイン済みのユーザーのみアクセスできます。有効なユーザーIDが必要です。
- `(ctx) => Promise<boolean>` または `(ctx) => boolean`：カスタム関数で、リクエストコンテキストに基づいてアクセスを許可するかどうかを動的に判定します。複雑な権限ロジックを実装できます。

## 権限ミドルウェアの登録（`use`）

`acl.use()` は、カスタム権限ミドルウェアを登録するために使用され、権限チェックのフローにカスタムロジックを挿入できます。通常、`ctx.permission` と組み合わせて使用され、カスタム権限ルールを定義します。公開フォームでカスタムパスワード認証が必要な場合や、リクエストパラメーターに基づく動的な権限判定など、従来の権限制御では対応できないシナリオに適しています。

**典型的な利用シナリオ：**

- 公開フォームのシナリオ：ユーザーもロールもないが、カスタムパスワードによって権限を制約する必要がある場合。
- リクエストパラメーターやIPアドレスなどの条件に基づく権限制御。
- カスタム権限ルールを定義し、デフォルトの権限チェックフローをスキップまたは変更する場合。

**`ctx.permission` を介した権限制御：**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // 例：公開フォームでパスワード認証後に権限チェックをスキップする場合
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // 認証が成功したため、権限チェックをスキップ
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // 権限チェックを実行（ACLフローを続行）
  await next();
});
```

**`ctx.permission` プロパティの説明：**

- `skip: true`：後続のACL権限チェックをスキップし、直接アクセスを許可します。
- ミドルウェア内でカスタムロジックに基づいて動的に設定でき、柔軟な権限制御を実現します。

## 特定の操作に固定データ制約を追加する（`addFixedParams`）

`addFixedParams` を使用すると、特定のリソース操作に固定のデータ範囲（フィルター）制約を追加できます。これらの制約はロールの制限をバイパスして直接適用され、通常、システムの重要なデータを保護するために使用されます。

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// ユーザーがロールを削除する権限を持っていても、root、admin、member といったシステムロールは削除できません。
```

> **ヒント：** `addFixedParams` は、システム組み込みのロールや管理者アカウントなど、機密データが誤って削除または変更されるのを防ぐために使用できます。これらの制約はロール権限と重ねて適用され、権限を持っていても保護されたデータを操作できないようにします。

## 権限の判定（`can`）

`acl.can()` は、特定のロールが指定された操作を実行する権限を持っているかどうかを判定するために使用され、権限の結果オブジェクトまたは `null` を返します。ビジネスロジック内で動的に権限を判定するためによく使用されます。例えば、ミドルウェアや操作のハンドラーで、ロールに基づいて特定のアクションの実行を許可するかどうかを決定する場合などです。

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // 単一のロールまたはロールの配列を渡すことができます
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`ロール ${result.role} は ${result.action} 操作を実行できます`);
  // result.params には、addFixedParams で設定された固定パラメーターが含まれます
  console.log('固定パラメーター:', result.params);
} else {
  console.log('この操作を実行する権限がありません');
}
```

> **ヒント：** 複数のロールが渡された場合、各ロールが順にチェックされ、権限を持つ最初のロールの結果が返されます。

**型定義：**

```ts
interface CanArgs {
  role?: string;      // 単一のロール
  roles?: string[];   // 複数のロール（順にチェックされ、権限を持つ最初のロールが返されます）
  resource: string;   // リソース名
  action: string;    // 操作名
}

interface CanResult {
  role: string;       // 権限を持つロール
  resource: string;   // リソース名
  action: string;    // 操作名
  params?: any;       // 固定パラメーター情報（addFixedParams で設定されている場合）
}
```

## 設定可能な操作の登録（`setAvailableAction`）

カスタム操作をUI上で権限設定可能にしたい場合（例えば、ロール管理ページに表示するなど）、`setAvailableAction` を使用して登録する必要があります。登録された操作は権限設定UIに表示され、管理者はUI上で異なるロールの操作権限を設定できます。

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // UI表示名、国際化対応
  type: 'new-data',               // 操作タイプ
  onNewRecord: true,              // 新規レコード作成時に有効にするかどうか
});
```

**パラメーターの説明：**

- **displayName**：権限設定UIに表示される名前で、国際化に対応しています（`{{t("key")}}` 形式を使用）。
- **type**：操作タイプで、権限設定におけるこの操作の分類を決定します。
  - `'new-data'`：新規データを作成する操作（インポート、追加など）。
  - `'existing-data'`：既存データを変更する操作（更新、削除など）。
- **onNewRecord**：新規レコード作成時に有効にするかどうか。`'new-data'` タイプにのみ有効です。

登録後、この操作は権限設定UIに表示され、管理者はロール管理ページでこの操作の権限を設定できるようになります。