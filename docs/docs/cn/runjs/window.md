# window

以下属性可直接通过 `window` 访问：

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open`（仅允许 `http:` / `https:` / `about:blank`）
* `location`（只读，支持安全导航）
* `navigator`

仅支持基础、安全的 DOM 查询与创建能力：

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`
