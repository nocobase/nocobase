:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/window)をご参照ください。
:::

# window

以下のプロパティは `window` を通じて直接アクセスできます：

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open`（`http:` / `https:` / `about:blank` のみ許可）
* `location`（読み取り専用、安全なナビゲーションをサポート）
* `navigator`

基本的かつ安全な DOM クエリおよび作成機能のみがサポートされています：

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`