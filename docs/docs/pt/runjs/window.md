:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/window).
:::

# window

As seguintes propriedades podem ser acessadas diretamente via `window`:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (Apenas `http:`, `https:` ou `about:blank` são permitidos)
* `location` (Somente leitura, suporta navegação segura)
* `navigator`

Apenas recursos básicos e seguros de consulta e criação de DOM são suportados:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`