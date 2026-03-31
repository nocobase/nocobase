:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ミドルウェア

NocoBase Serverのミドルウェアは、本質的に**Koaのミドルウェア**です。Koaと同様に`ctx`オブジェクトを操作して、リクエストとレスポンスを処理できます。しかし、NocoBaseは異なるビジネス層のロジックを管理する必要があるため、すべてのミドルウェアをまとめてしまうと、保守や管理が非常に困難になります。

このため、NocoBaseではミドルウェアを**4つの階層**に分けています。

1.  **データソースレベルのミドルウェア**：`app.dataSourceManager.use()`  
    **特定のデータソース**へのリクエストにのみ作用します。そのデータソースのデータベース接続、フィールド検証、トランザクション処理などのロジックによく使われます。

2.  **リソースレベルのミドルウェア**：`app.resourceManager.use()`  
    定義済みのリソース（Resource）にのみ適用され、データ権限やフォーマットなどのリソースレベルのロジック処理に適しています。

3.  **権限レベルのミドルウェア**：`app.acl.use()`  
    権限チェックの前に実行され、ユーザーの権限やロールの検証に使われます。

4.  **アプリケーションレベルのミドルウェア**：`app.use()`  
    すべてのリクエストで実行され、ログ記録、一般的なエラー処理、レスポンス処理などに適しています。

## ミドルウェアの登録

ミドルウェアは通常、プラグインの`load`メソッド内で登録されます。例えば次のようになります。

```ts
export class MyPlugin extends Plugin {
  load() {
    // アプリケーションレベルのミドルウェア
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // データソースレベルのミドルウェア
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // 権限レベルのミドルウェア
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // リソースレベルのミドルウェア
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### 実行順序

ミドルウェアの実行順序は次のとおりです。

1.  まず、`acl.use()`で追加された権限ミドルウェアが実行されます。
2.  次に、`resourceManager.use()`で追加されたリソースミドルウェアが実行されます。
3.  その後、`dataSourceManager.use()`で追加されたデータソースミドルウェアが実行されます。
4.  最後に、`app.use()`で追加されたアプリケーションミドルウェアが実行されます。

## before / after / tag 挿入の仕組み

ミドルウェアの実行順序をより柔軟に制御するために、NocoBaseでは`before`、`after`、`tag`の各パラメーターを提供しています。

-   **tag**：ミドルウェアにタグを付け、後続のミドルウェアから参照できるようにします。
-   **before**：指定されたタグを持つミドルウェアの前に挿入します。
-   **after**：指定されたタグを持つミドルウェアの後に挿入します。

例：

```ts
// 通常のミドルウェア
app.use(m1, { tag: 'restApi' });
app.resourcer.use(m2, { tag: 'parseToken' });
app.resourcer.use(m3, { tag: 'checkRole' });

// m4はm1の前に配置されます
app.use(m4, { before: 'restApi' });

// m5はm2とm3の間に挿入されます
app.resourcer.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

位置が指定されていない場合、新しく追加されたミドルウェアのデフォルトの実行順序は次のとおりです。  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## オニオンモデルの例

ミドルウェアの実行順序は、Koaの**オニオンモデル**に従います。これは、ミドルウェアスタックに最初に入り、最後に終了するというものです。

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourcer.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourcer.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

異なるインターフェースへのアクセスにおける出力順序の例：

-   **通常のHTTPリクエスト**：`/api/hello`  
    出力：`[1,2]` （リソースが定義されていないため、`resourceManager`と`acl`ミドルウェアは実行されません）  

-   **リソースリクエスト**：`/api/test:list`  
    出力：`[5,3,7,1,2,8,4,6]`  
    ミドルウェアは階層順序とオニオンモデルに従って実行されます。

## まとめ

-   NocoBaseのミドルウェアはKoaミドルウェアの拡張です。
-   4つの階層：アプリケーション -> データソース -> リソース -> 権限
-   `before` / `after` / `tag` を使用して、実行順序を柔軟に制御できます。
-   Koaのオニオンモデルに従い、ミドルウェアの組み合わせとネストを保証します。
-   データソースレベルのミドルウェアは指定されたデータソースリクエストにのみ作用し、リソースレベルのミドルウェアは定義済みのリソースリクエストにのみ作用します。