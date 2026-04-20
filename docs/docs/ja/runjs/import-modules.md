:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/import-modules)をご参照ください。
:::

# モジュールのインポート

RunJS では、**組み込みモジュール**（`ctx.libs` を通じて直接使用、import 不要）と**外部モジュール**（`ctx.importAsync()` または `ctx.requireAsync()` を使用してオンデマンドで読み込み）の 2 種類のモジュールを使用できます。

---

## 組み込みモジュール - ctx.libs（import 不要）

RunJS には一般的に使用されるライブラリが組み込まれており、`ctx.libs` を通じて直接アクセスできます。`import` や非同期読み込みは**不要**です。

| プロパティ | 説明 |
|------|------|
| **ctx.libs.React** | React 本体。JSX や Hooks で使用します。 |
| **ctx.libs.ReactDOM** | ReactDOM（createRoot などが必要な場合に使用します） |
| **ctx.libs.antd** | Ant Design コンポーネントライブラリ |
| **ctx.libs.antdIcons** | Ant Design アイコン |
| **ctx.libs.math** | [Math.js](https://mathjs.org/)：数学式、行列演算など |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/)：Excel ライクな関数（SUM、AVERAGE など） |

### 例：React と antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>クリック</Button>);
```

### 例：ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### 例：ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## 外部モジュール

サードパーティライブラリが必要な場合は、モジュールの形式に応じて読み込み方法を選択します：

- **ESM モジュール** → `ctx.importAsync()` を使用
- **UMD/AMD モジュール** → `ctx.requireAsync()` を使用

---

### ESM モジュールのインポート

**`ctx.importAsync()`** を使用して、URL 指定で ESM モジュールを動的に読み込みます。JS ブロック、JS フィールド、JS アクションなどのシーンに適しています。

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**：ESM モジュールのパス。短縮形式 `<パッケージ名>@<バージョン>` またはサブパスを含む形式 `<パッケージ名>@<バージョン>/<ファイルパス>`（例：`vue@3.4.0`、`lodash@4/lodash.js`）をサポートしており、設定された CDN プレフィックスが付与されます。フル URL もサポートしています。
- **戻り値**：解決されたモジュールの名前空間オブジェクト。

#### デフォルトは https://esm.sh

設定されていない場合、短縮形式は **https://esm.sh** を CDN プレフィックスとして使用します。例：

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// https://esm.sh/vue@3.4.0 からの読み込みと同等
```

#### esm.sh サービスの自前構築

社内ネットワークや独自の CDN が必要な場合は、esm.sh プロトコルと互換性のあるサービスをデプロイし、環境変数で指定できます：

- **ESM_CDN_BASE_URL**：ESM CDN のベース URL（デフォルトは `https://esm.sh`）
- **ESM_CDN_SUFFIX**：オプションのサフィックス（例：jsDelivr の `/+esm`）

自前構築については以下を参照してください：[https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### UMD/AMD モジュールのインポート

**`ctx.requireAsync()`** を使用して、UMD/AMD モジュールまたはグローバルオブジェクトにアタッチされるスクリプトを非同期で読み込みます。

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**：以下の 2 つの形式をサポートしています：
  - **短縮パス**：`<パッケージ名>@<バージョン>/<ファイルパス>`。`ctx.importAsync()` と同様に現在の ESM CDN 設定に従って解決されます。解決時に `?raw` が付与され、そのパスのソースファイルを直接リクエストします（主に UMD ビルド用）。例えば、`echarts@5/dist/echarts.min.js` は実際には `https://esm.sh/echarts@5/dist/echarts.min.js?raw` をリクエストします（デフォルトの esm.sh 使用時）。
  - **フル URL**：任意の CDN のフルアドレス（例：`https://cdn.jsdelivr.net/npm/xxx`）。
- **戻り値**：読み込まれたライブラリのオブジェクト（具体的な形式はライブラリのエクスポート方法に依存します）。

読み込み後、多くの UMD ライブラリはグローバルオブジェクト（`window.xxx` など）に展開されます。使用方法は各ライブラリのドキュメントに従ってください。

**例**

```ts
// 短縮パス（esm.sh を経由して ...?raw として解決）
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// フル URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**注意**：ライブラリが ESM バージョンも提供している場合は、より優れたモジュールセマンティクスと Tree-shaking を活用するために `ctx.importAsync()` を優先して使用してください。