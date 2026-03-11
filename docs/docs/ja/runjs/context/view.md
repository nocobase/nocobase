:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/view)をご参照ください。
:::

# ctx.view

現在アクティブなビューコントローラー（ダイアログ、ドロワー、ポップオーバー、埋め込みエリアなど）であり、ビューレベルの情報へのアクセスや操作に使用されます。`FlowViewContext` によって提供され、`ctx.viewer` または `ctx.openView` を通じて開かれたビューのコンテンツ内でのみ利用可能です。

## 適用シーン

| シーン | 説明 |
|------|------|
| **ダイアログ/ドロワーのコンテンツ** | `content` 内で `ctx.view.close()` を呼び出して現在のビューを閉じたり、`Header` や `Footer` を使用してタイトルやフッターをレンダリングしたりします。 |
| **フォーム送信後** | 送信成功後に `ctx.view.close(result)` を呼び出してビューを閉じ、結果を返します。 |
| **JSBlock / アクション** | `ctx.view.type` に基づいて現在のビュータイプを判断したり、`ctx.view.inputArgs` から渡されたパラメータを読み取ったりします。 |
| **関連選択、子テーブル** | `inputArgs` 内の `collectionName`、`filterByTk`、`parentId` などを読み取ってデータロードを行います。 |

> 注意：`ctx.view` は、ビューコンテキストを持つ RunJS 環境（`ctx.viewer.dialog()` の content 内、ダイアログフォーム、関連セレクター内部など）でのみ利用可能です。通常のページやバックエンドのコンテキストでは `undefined` になるため、使用時にはオプショナルチェイニング（`ctx.view?.close?.()`）によるチェックを推奨します。

## 型定義

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // ワークフロー設定ビューで利用可能
};
```

## よく使われるプロパティとメソッド

| プロパティ/メソッド | 型 | 説明 |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | 現在のビュータイプ |
| `inputArgs` | `Record<string, any>` | ビューを開く際に渡されたパラメータ（詳細は後述） |
| `Header` | `React.FC \| null` | ヘッダーコンポーネント。タイトルや操作エリアのレンダリングに使用 |
| `Footer` | `React.FC \| null` | フッターコンポーネント。ボタンなどのレンダリングに使用 |
| `close(result?, force?)` | `void` | 現在のビューを閉じます。`result` を渡して呼び出し元に結果を返せます |
| `update(newConfig)` | `void` | ビューの設定（幅やタイトルなど）を更新します |
| `navigation` | `ViewNavigation \| undefined` | ページ内ビューナビゲーション（タブ切り替えなどを含む） |

> 現在、`Header` と `Footer` をサポートしているのは `dialog` と `drawer` のみです。

## inputArgs の主なフィールド

ビューを開くシーンによって `inputArgs` のフィールドは異なります。主なものは以下の通りです：

| フィールド | 説明 |
|------|------|
| `viewUid` | ビュー UID |
| `collectionName` | コレクション名 |
| `filterByTk` | 主キーフィルター（単一レコード詳細用） |
| `parentId` | 親 ID（関連シーン用） |
| `sourceId` | ソースレコード ID |
| `parentItem` | 親アイテムのデータ |
| `scene` | シーン（`create`、`edit`、`select` など） |
| `onChange` | 選択または変更後のコールバック |
| `tabUid` | 現在のタブ UID（ページ内） |

`ctx.getVar('ctx.view.inputArgs.xxx')` または `ctx.view.inputArgs.xxx` を通じてアクセスします。

## 例

### 現在のビューを閉じる

```ts
// 送信成功後にダイアログを閉じる
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// ビューを閉じて結果を返す
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### コンテンツ内で Header / Footer を使用する

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="編集" extra={<Button size="small">ヘルプ</Button>} />
      <div>フォーム内容...</div>
      <Footer>
        <Button onClick={() => close()}>キャンセル</Button>
        <Button type="primary" onClick={handleSubmit}>確定</Button>
      </Footer>
    </div>
  );
}
```

### ビュータイプや inputArgs に基づく分岐

```ts
if (ctx.view?.type === 'embed') {
  // 埋め込みビューではヘッダーを非表示にする
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // ユーザー選択シーンの場合の処理
}
```

## ctx.viewer、ctx.openView との関係

| 用途 | 推奨される使い方 |
|------|----------|
| **新しいビューを開く** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` または `ctx.openView()` |
| **現在のビューを操作する** | `ctx.view.close()`、`ctx.view.update()` |
| **開く際のパラメータを取得する** | `ctx.view.inputArgs` |

`ctx.viewer` はビューを「開く」役割を担い、`ctx.view` は「現在」のビューインスタンスを表します。`ctx.openView` は設定済みのワークフロービューを開くために使用されます。

## 注意事項

- `ctx.view` はビュー内部でのみ利用可能です。通常のページでは `undefined` になります。
- ビューコンテキストがない場合のエラーを避けるため、`ctx.view?.close?.()` のようにオプショナルチェイニングを使用してください。
- `close(result)` で渡された `result` は、`ctx.viewer.open()` が返す Promise に渡されます。

## 関連情報

- [ctx.openView()](./open-view.md)：設定済みのワークフロービューを開く
- [ctx.modal](./modal.md)：軽量なポップアップ（通知、確認など）

> `ctx.viewer` は `dialog()`、`drawer()`、`popover()`、`embed()` などのメソッドを提供してビューを開きます。これらのメソッドで開かれた `content` 内で `ctx.view` にアクセスできます。