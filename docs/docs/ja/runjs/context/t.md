:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/t)をご参照ください。
:::

# ctx.t()

RunJSにおいて、現在のコンテキストの言語設定に基づいてテキストを翻訳するためのi18nショートカット関数です。ボタン、タイトル、ヒントなどのインラインテキストの国際化に適しています。

## 利用シーン

すべてのRunJS実行環境で `ctx.t()` を使用できます。

## 型定義

```ts
t(key: string, options?: Record<string, any>): string
```

## 引数

| 引数 | 型 | 説明 |
|------|------|------|
| `key` | `string` | 翻訳キー、またはプレースホルダーを含むテンプレート（例：`Hello {{name}}`、`{{count}} rows`）。 |
| `options` | `object` | オプション。補間変数（例：`{ name: '田中', count: 5 }`）、またはi18nオプション（例：`defaultValue`、`ns`）。 |

## 戻り値

- 翻訳後の文字列を返します。キーに対応する翻訳がなく、`defaultValue` も指定されていない場合は、キー自体または補間後の文字列が返されることがあります。

## ネームスペース (ns)

RunJS環境の**デフォルトのネームスペースは `runjs`** です。`ns` を指定しない場合、`ctx.t(key)` は `runjs` ネームスペースからキーを検索します。

```ts
// デフォルトで runjs ネームスペースからキーを取得
ctx.t('Submit'); // ctx.t('Submit', { ns: 'runjs' }) と等価

// 指定したネームスペースからキーを取得
ctx.t('Submit', { ns: 'myModule' });

// 複数のネームスペースを順次検索（まず runjs、次に common）
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## 例

### シンプルなキー

```ts
ctx.t('Submit');
ctx.t('No data');
```

### 補間変数を含む

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### 相対時間などの動的なテキスト

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### ネームスペースの指定

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## 注意事項

- **ロカライゼーションプラグイン**：テキストを翻訳するには、まずロカライゼーションプラグインを有効にする必要があります。翻訳が不足している項目は、一括管理と翻訳のためにロカライゼーション管理リストに自動的に抽出されます。
- i18nextスタイルの補間をサポートしています。キー内で `{{変数名}}` を使用し、`options` に同名の変数を渡すことで置換できます。
- 言語は現在のコンテキスト（`ctx.i18n.language` やユーザーのロケールなど）によって決定されます。

## 関連情報

- [ctx.i18n](./i18n.md)：言語の取得または切り替え