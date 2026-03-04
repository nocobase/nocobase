:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/window).
:::

# window

Následující vlastnosti jsou přístupné přímo prostřednictvím objektu `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (povoleny jsou pouze `http:`, `https:` nebo `about:blank`)
* `location` (pouze pro čtení, podporuje bezpečnou navigaci)
* `navigator`

Podporovány jsou pouze základní a bezpečné funkce pro dotazování a vytváření DOM:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`