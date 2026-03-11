:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/window).
:::

# window

Las siguientes propiedades pueden ser accedidas directamente a través de `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Solo se permiten `http:`, `https:` o `about:blank`)
* `location` (Solo lectura, admite navegación segura)
* `navigator`

Solo se admiten capacidades básicas y seguras de creación y consulta de DOM:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`