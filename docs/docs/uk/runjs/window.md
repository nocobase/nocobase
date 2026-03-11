:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/window).
:::

# window

Наступні властивості доступні безпосередньо через `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (дозволені лише `http:`, `https:` або `about:blank`)
* `location` (тільки для читання, підтримує безпечну навігацію)
* `navigator`

Підтримуються лише базові та безпечні можливості створення та запитів DOM:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`