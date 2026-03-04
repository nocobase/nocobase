:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/router)をご参照ください。
:::

# ctx.router

React Router に基づいたルーティングインスタンスです。RunJS 内でコードを使用してナビゲーションを行うために使用されます。通常、`ctx.route` や `ctx.location` と組み合わせて使用します。

## 適用シーン

| シーン | 説明 |
|------|------|
| **JSBlock / JSField** | ボタンクリック後に詳細ページ、一覧ページ、または外部リンクへ遷移する。 |
| **連動ルール / イベントフロー** | 送信成功後に一覧や詳細へ `navigate` する、または遷移先ページに `state` を渡す。 |
| **JSAction / イベント処理** | フォーム送信やリンククリックなどのロジック内でルート遷移を実行する。 |
| **ビューナビゲーション** | 内部ビュースタックの切り替え時に `navigate` を通じて URL を更新する。 |

> 注意：`ctx.router` は、ルーティングコンテキストが存在する RunJS 環境（ページ内の JSBlock、フローページ、イベントフローなど）でのみ利用可能です。純粋なバックエンドやルーティングのないコンテキスト（ワークフローなど）では、`null` になる可能性があります。

## 型定義

```typescript
router: Router
```

`Router` は `@remix-run/router` に由来します。RunJS では、`ctx.router.navigate()` を通じて遷移、戻る、リフレッシュなどのナビゲーション操作を実現します。

## メソッド

### ctx.router.navigate()

ターゲットパスへの遷移、または「戻る」・「リフレッシュ」を実行します。

**シグネチャ：**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**パラメータ：**

- `to`：ターゲットパス（string）、履歴の相対位置（number、例：`-1` は戻る）、または `null`（現在のページをリフレッシュ）。
- `options`：オプション設定。
  - `replace?: boolean`：現在の履歴エントリを置き換えるかどうか（デフォルトは `false` で、新しいエントリを push します）。
  - `state?: any`：遷移先ルートに渡す `state`。このデータは URL には表示されず、遷移先ページで `ctx.location.state` を介してアクセスできます。機密情報、一時的なデータ、または URL に含めるのが適切でない情報に適しています。

## 実行例

### 基礎的な遷移

```ts
// ユーザー一覧へ遷移（新しい履歴を push、戻ることが可能）
ctx.router.navigate('/admin/users');

// 詳細ページへ遷移
ctx.router.navigate(`/admin/users/${recordId}`);
```

### 履歴の置換（新規エントリなし）

```ts
// ログイン後にホームページへリダイレクト。ユーザーが戻ってもログインページには戻りません
ctx.router.navigate('/admin', { replace: true });

// フォーム送信成功後、現在のページを詳細ページに置き換える
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### state の受け渡し

```ts
// 遷移時にデータを保持し、遷移先ページで ctx.location.state を使用して取得する
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### 戻るとリフレッシュ

```ts
// 1ページ戻る
ctx.router.navigate(-1);

// 2ページ戻る
ctx.router.navigate(-2);

// 現在のページをリフレッシュ
ctx.router.navigate(null);
```

## ctx.route、ctx.location との関係

| 用途 | 推奨される使い方 |
|------|----------|
| **ナビゲーション・遷移** | `ctx.router.navigate(path)` |
| **現在のパスの読み取り** | `ctx.route.pathname` または `ctx.location.pathname` |
| **遷移時に渡された state の読み取り** | `ctx.location.state` |
| **ルートパラメータの読み取り** | `ctx.route.params` |

`ctx.router` は「ナビゲーション動作」を担当し、`ctx.route` と `ctx.location` は「現在のルート状態」を担当します。

## 注意事項

- `navigate(path)` はデフォルトで新しい履歴エントリを push するため、ユーザーはブラウザの戻るボタンで戻ることができます。
- `replace: true` は新しいエントリを追加せずに現在の履歴を置き換えます。ログイン後のリダイレクトや送信成功後の遷移などに適しています。
- **state パラメータについて**：
  - `state` 経由で渡されるデータは URL に表示されないため、機密データや一時的なデータに適しています。
  - 遷移先ページでは `ctx.location.state` からアクセスできます。
  - `state` はブラウザの履歴に保存されるため、進む・戻る操作を行ってもアクセス可能です。
  - ページをリフレッシュすると `state` は失われます。

## 関連情報

- [ctx.route](./route.md)：現在のルート一致情報（pathname、params など）
- [ctx.location](./location.md)：現在の URL 位置（pathname、search、hash、state）。遷移後の `state` はこちらで読み取ります。