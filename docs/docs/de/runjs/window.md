:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/window).
:::

# window

Auf die folgenden Eigenschaften kann direkt über `window` zugegriffen werden:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Nur `http:`, `https:` oder `about:blank` sind zulässig)
* `location` (Schreibgeschützt, unterstützt sichere Navigation)
* `navigator`

Es werden nur grundlegende und sichere Funktionen zur DOM-Abfrage und -Erstellung unterstützt:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`