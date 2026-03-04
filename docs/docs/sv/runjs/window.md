:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/window).
:::

# window

Följande egenskaper kan nås direkt via `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Endast `http:`, `https:` eller `about:blank` är tillåtna)
* `location` (Skrivskyddad, stöder säker navigering)
* `navigator`

Endast grundläggande och säkra funktioner för DOM-frågor och skapande stöds:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`