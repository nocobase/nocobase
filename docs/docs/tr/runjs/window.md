:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/window) bakın.
:::

# window

Aşağıdaki özelliklere doğrudan `window` üzerinden erişilebilir:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Yalnızca `http:`, `https:` veya `about:blank` protokollerine izin verilir)
* `location` (Salt okunur, güvenli navigasyonu destekler)
* `navigator`

Yalnızca temel ve güvenli DOM sorgulama ve oluşturma yetenekleri desteklenir:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`