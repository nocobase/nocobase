# window

The following properties are available on `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (only `http:` / `https:` / `about:blank` are allowed)
* `location` (read-only, safe navigation supported)
* `navigator`

Only basic, safe DOM query/creation methods are supported:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`
