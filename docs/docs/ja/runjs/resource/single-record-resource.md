:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/resource/single-record-resource)をご参照ください。
:::

# SingleRecordResource

**単一のレコード**を対象とした Resource です。データは単一のオブジェクトとして扱われ、主キーによる取得、作成・更新（save）、および削除をサポートします。詳細表示やフォームなどの「単一レコード」を扱うシーンに適しています。[MultiRecordResource](./multi-record-resource.md) とは異なり、SingleRecordResource の `getData()` は単一のオブジェクトを返します。`setFilterByTk(id)` で主キーを指定し、`save()` は `isNewRecord` の状態に応じて自動的に create または update を呼び出します。

**継承関係**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource。

**作成方法**: `ctx.makeResource('SingleRecordResource')` または `ctx.initResource('SingleRecordResource')`。使用前に `setResourceName('コレクション名')` を呼び出す必要があります。主キーに基づいて操作する場合は `setFilterByTk(id)` を設定します。RunJS 内では、`ctx.api` は実行環境によって注入されます。

---

## 活用シーン

| シーン | 説明 |
|------|------|
| **詳細ブロック** | 詳細ブロックではデフォルトで SingleRecordResource が使用され、主キーに基づいて単一のレコードを読み込みます。 |
| **フォームブロック** | 新規作成/編集フォームでは SingleRecordResource が使用され、`save()` によって create と update が自動的に判別されます。 |
| **JSBlock 詳細** | JSBlock 内で特定のユーザーや注文などを読み込み、カスタマイズした表示を行う場合に使用します。 |
| **関連リソース** | `users.profile` などの形式で関連する単一レコードを読み込む際に使用します。この場合、`setSourceId(親レコードID)` と組み合わせて使用する必要があります。 |

---

## データ形式

- `getData()` は**単一のレコードオブジェクト**（get インターフェースの `data` フィールド）を返します。
- `getMeta()` はメタ情報（存在する場合）を返します。

---

## リソース名と主キー

| メソッド | 説明 |
|------|------|
| `setResourceName(name)` / `getResourceName()` | リソース名。例: `'users'`、`'users.profile'`（関連リソース） |
| `setSourceId(id)` / `getSourceId()` | 関連リソースにおける親レコードの ID（例: `users.profile` の場合は users の主キーを渡す必要があります） |
| `setDataSourceKey(key)` / `getDataSourceKey()` | データソース識別子（マルチデータソース利用時に使用） |
| `setFilterByTk(tk)` / `getFilterByTk()` | 現在のレコードの主キー。これを設定すると `isNewRecord` は false になります。 |

---

## 状態

| プロパティ/メソッド | 説明 |
|----------|------|
| `isNewRecord` | 「新規作成」状態かどうか（filterByTk が未設定、または新規作成時は true） |

---

## リクエストパラメータ（フィルタ / フィールド）

| メソッド | 説明 |
|------|------|
| `setFilter(filter)` / `getFilter()` | フィルタ（新規作成時以外で使用可能） |
| `setFields(fields)` / `getFields()` | リクエストするフィールド |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | 関連の展開（アペンド） |

---

## CRUD

| メソッド | 説明 |
|------|------|
| `refresh()` | 現在の `filterByTk` に基づいて get リクエストを送り、`getData()` を更新します。新規作成状態ではリクエストを行いません。 |
| `save(data, options?)` | 新規作成時は create を、それ以外は update を呼び出します。`{ refresh: false }` を指定すると自動リフレッシュを停止できます。 |
| `destroy(options?)` | 現在の `filterByTk` に基づいて削除を実行し、ローカルデータをクリアします。 |
| `runAction(actionName, options)` | 任意のリソースアクションを呼び出します。 |

---

## 設定とイベント

| メソッド | 説明 |
|------|------|
| `setSaveActionOptions(options)` | save 実行時のリクエスト設定 |
| `on('refresh', fn)` / `on('saved', fn)` | リフレッシュ完了時、または保存完了時にトリガーされます。 |

---

## 例

### 基本的な取得と更新

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// 更新
await ctx.resource.save({ name: '李四' });
```

### レコードの新規作成

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: '王五', email: 'wangwu@example.com' });
```

### レコードの削除

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// destroy の実行後、getData() は null になります
```

### 関連の展開とフィールド指定

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### 関連リソース（例: users.profile）

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // 親レコードの主キー
res.setFilterByTk(profileId);    // profile が hasOne の場合は filterByTk を省略可能
await res.refresh();
const profile = res.getData();
```

### save 時の自動リフレッシュを無効にする

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// 保存後に refresh がトリガーされないため、getData() は古い値のままになります
```

### refresh / saved イベントのリスニング

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>ユーザー: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('保存に成功しました');
});
await ctx.resource?.refresh?.();
```

---

## 注意事項

- **setResourceName は必須**: 使用前に必ず `setResourceName('コレクション名')` を呼び出してください。そうしないとリクエスト URL を構築できません。
- **filterByTk と isNewRecord**: `setFilterByTk` を設定していない場合、`isNewRecord` は true となり、`refresh()` はリクエストを送信しません。また、`save()` は create アクションを実行します。
- **関連リソース**: リソース名が `parent.child` 形式（例: `users.profile`）の場合、先に `setSourceId(親レコードの主キー)` を設定する必要があります。
- **getData はオブジェクトを返す**: 単一レコード用インターフェースが返す `data` はレコードオブジェクトであり、`getData()` はそのオブジェクトを直接返します。`destroy()` 後は null になります。

---

## 関連情報

- [ctx.resource](../context/resource.md) - 現在のコンテキストにおける resource インスタンス
- [ctx.initResource()](../context/init-resource.md) - 初期化して ctx.resource にバインドする
- [ctx.makeResource()](../context/make-resource.md) - バインドせずに新しい resource インスタンスを作成する
- [APIResource](./api-resource.md) - URL 指定でリクエストを行う汎用 API リソース
- [MultiRecordResource](./multi-record-resource.md) - コレクション/リスト向け。CRUD やページネーションをサポート