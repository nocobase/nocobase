:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/window).
:::

# window

Le seguenti proprietà sono accessibili direttamente tramite `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Sono consentiti solo `http:`, `https:` o `about:blank`)
* `location` (Sola lettura, supporta la navigazione sicura)
* `navigator`

Sono supportate solo le funzionalità di base e sicure per la creazione e l'interrogazione del DOM:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`