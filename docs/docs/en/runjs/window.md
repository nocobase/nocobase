# window

The following properties can be accessed directly via `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Only `http:`, `https:`, or `about:blank` are allowed)
* `location` (Read-only, supports secure navigation)
* `navigator`

Only basic and secure DOM query and creation capabilities are supported:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`