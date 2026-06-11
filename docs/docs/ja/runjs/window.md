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