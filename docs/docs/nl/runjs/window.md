:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/window) voor nauwkeurige informatie.
:::

# window

De volgende eigenschappen zijn direct toegankelijk via `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Alleen `http:`, `https:` of `about:blank` zijn toegestaan)
* `location` (Alleen-lezen, ondersteunt veilige navigatie)
* `navigator`

Alleen basis- en veilige mogelijkheden voor het opvragen en maken van DOM-elementen worden ondersteund:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`