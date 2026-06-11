# window

Les propriétés suivantes sont accessibles directement via `window` :

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Seuls `http:`, `https:` ou `about:blank` sont autorisés)
* `location` (Lecture seule, prend en charge la navigation sécurisée)
* `navigator`

Seules les capacités de création et de requête DOM de base et sécurisées sont prises en charge :

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`