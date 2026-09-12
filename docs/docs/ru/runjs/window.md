# Глобальный объект window

В объекте `window` доступны следующие API:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (разрешены только `http:`, `https:` или `about:blank`)
* `location` (только чтение, безопасная навигация)
* `navigator`

Поддерживаются только базовые безопасные операции запроса и создания DOM:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`