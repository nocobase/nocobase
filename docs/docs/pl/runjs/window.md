:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/window).
:::

# window

Następujące właściwości są dostępne bezpośrednio poprzez obiekt `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Dozwolone są wyłącznie `http:`, `https:` lub `about:blank`)
* `location` (Tylko do odczytu, obsługuje bezpieczną nawigację)
* `navigator`

Obsługiwane są wyłącznie podstawowe i bezpieczne funkcje zapytań oraz tworzenia elementów DOM:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`