---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



pkg: "@nocobase/plugin-block-iframe"
---

# Iframe ブロック

## 概要

「Iframe ブロック」を使うと、外部のウェブページやコンテンツを現在のページに埋め込むことができます。URLを設定するか、HTMLコードを直接挿入するだけで、外部アプリケーションをページに簡単に統合できます。HTMLページを使用すれば、コンテンツを柔軟にカスタマイズして特定の表示要件を満たすことができます。この方法は、カスタマイズされた表示が必要なシナリオに特に適しており、ページ遷移なしで外部リソースを読み込むことで、ユーザーエクスペリエンスとページのインタラクティブ性を向上させます。

## インストール

これは組み込みの**プラグイン**なので、インストールは不要です。

## ブロックの追加

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

URLまたはHTMLを設定して、外部アプリケーションを直接埋め込みます。

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## テンプレートエンジン

### 文字列テンプレート

デフォルトのテンプレートエンジンです。

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

詳細はHandlebarsテンプレートエンジンのドキュメントをご参照ください。

## 変数の受け渡し

### HTMLでの変数解析のサポート

#### 現在のブロックコンテキストで変数セレクターから変数を選択するサポート

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### コードによるアプリケーションへの変数注入と利用のサポート

コードを使ってカスタム変数をアプリケーションに注入し、HTML内で利用することもできます。例えば、Vue 3とElement Plusを使用して動的なカレンダーアプリケーションを作成する例です。

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/3.5.9/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/element-plus/dist/index.css"
    />
  </head>
  <body>
    <div id="app">
      <el-container>
        <el-main>
          <el-calendar v-model="month">
            <div class="header-container">
              <div class="action-group">
                <span class="month-display">{{ month }}</span>
                <el-button-group>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(-1)"
                    >Last month</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button
                  >
                </el-button-group>
              </div>
            </div>
          </el-calendar>
        </el-main>
      </el-container>
    </div>
    <script>
      const { createApp, ref, provide } = Vue;
      const app = createApp({
        setup() {
          const month = ref(new Date().toISOString().slice(0, 7));
          const loading = ref(false);

          const changeMonth = (offset) => {
            const date = new Date(month.value + '-01');
            date.setMonth(date.getMonth() + offset);
            month.value = date.toISOString().slice(0, 7);
          };
          provide('month', month);
          provide('changeMonth', changeMonth);
          return { month, loading, changeMonth };
        },
      });
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>
```

![20250320163250](https://static-docs.nocobase.com/20250320163250.png)

例：ReactとAnt Design (antd) を使用して作成されたシンプルなカレンダーコンポーネントで、dayjsを組み合わせて日付を処理します。

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Example</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css"
    />
    <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        const { useState } = React;
        const { Calendar, Button, Space, Typography } = window.antd;
        const { Title } = Typography;
        const CalendarComponent = () => {
          const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
          const [loading, setLoading] = useState(false);
          const changeMonth = (offset) => {
            const newMonth = dayjs(month)
              .add(offset, 'month')
              .format('YYYY-MM');
            setMonth(newMonth);
          };
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
              },
              React.createElement(Title, { level: 4 }, month),
              React.createElement(
                Space,
                null,
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(-1) },
                  'Last month',
                ),
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(1) },
                  'Next month',
                ),
              ),
            ),
            React.createElement(Calendar, {
              fullscreen: false,
              value: dayjs(month),
            }),
          );
        };
        ReactDOM.createRoot(document.getElementById('app')).render(
          React.createElement(CalendarComponent),
        );
      });
    </script>
  </body>
</html>
```

![20250320164537](https://static-docs.nocobase.com/20250320164537.png)

### URLでの変数サポート

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

変数に関する詳細は、変数ドキュメントをご参照ください。

## JSブロックでIframeを作成する (NocoBase 2.0)

NocoBase 2.0では、JSブロックを使ってiframeを動的に作成し、より詳細な制御を行うことができます。このアプローチにより、iframeの動作やスタイルをカスタマイズする際の柔軟性が向上します。

### 基本的な例

JSブロックを作成し、以下のコードを使ってiframeを作成します。

```javascript
// 現在のブロックコンテナを埋めるiframeを作成します
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// 既存の子要素を置き換え、iframeを唯一のコンテンツにします
ctx.element.replaceChildren(iframe);
```

### 主要なポイント

- **ctx.element**: 現在のJSブロックコンテナのDOM要素
- **sandbox属性**: iframeコンテンツのセキュリティ制限を制御します。
  - `allow-scripts`: iframeがスクリプトを実行することを許可します。
  - `allow-same-origin`: iframeが自身のオリジンにアクセスすることを許可します。
- **replaceChildren()**: コンテナのすべての子要素をiframeで置き換えます。

### ロード状態を伴う高度な例

ロード状態とエラー処理を追加することで、iframeの作成を強化できます。

```javascript
// ロードメッセージを表示
ctx.message.loading('外部コンテンツを読み込み中...');

try {
  // iframeを作成
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // ロードイベントリスナーを追加
  iframe.addEventListener('load', () => {
    ctx.message.success('コンテンツの読み込みに成功しました');
  });

  // エラーイベントリスナーを追加
  iframe.addEventListener('error', () => {
    ctx.message.error('コンテンツの読み込みに失敗しました');
  });

  // iframeをコンテナに挿入
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('iframeの作成中にエラーが発生しました: ' + error.message);
}
```

### セキュリティに関する考慮事項

iframeを使用する際は、以下のセキュリティに関するベストプラクティスを考慮してください。

1. **HTTPSの使用**: 可能な限り常にHTTPS経由でiframeコンテンツを読み込みます。
2. **Sandbox権限の制限**: 必要なsandbox権限のみを有効にします。
3. **コンテンツセキュリティポリシー**: 適切なCSPヘッダーを設定します。
4. **同一オリジンポリシー**: クロスオリジン制限に注意してください。
5. **信頼できるソース**: 信頼できるドメインからのみコンテンツを読み込みます。