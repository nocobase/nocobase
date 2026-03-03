:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/window).
:::

# window

Следующие свойства доступны напрямую через `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (разрешены только `http:`, `https:` или `about:blank`)
* `location` (только для чтения, поддерживает безопасную навигацию)
* `navigator`

Поддерживаются только базовые и безопасные возможности создания и запроса DOM:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`