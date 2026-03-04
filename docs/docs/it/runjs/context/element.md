:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/element).
:::

# ctx.element

Un'istanza di `ElementProxy` che punta al contenitore DOM della sandbox, fungendo da destinazione di rendering predefinita per `ctx.render()`. È disponibile in scenari in cui esiste un contenitore di rendering, come `JSBlock`, `JSField`, `JSItem` e `JSColumn`.

## Scenari applicabili

| Scenario | Descrizione |
|------|------|
| **JSBlock** | Il contenitore DOM per il blocco, utilizzato per renderizzare contenuti personalizzati del blocco. |
| **JSField / JSItem / FormJSFieldItem** | Il contenitore di rendering per un campo o un elemento del modulo (solitamente uno `<span>`). |
| **JSColumn** | Il contenitore DOM per una cella di tabella, utilizzato per renderizzare contenuti personalizzati della colonna. |

> Nota: `ctx.element` è disponibile solo nei contesti RunJS che dispongono di un contenitore di rendering. In contesti senza interfaccia utente (come la logica puramente backend), potrebbe essere `undefined`. Si consiglia di eseguire un controllo di valore nullo prima dell'uso.

## Definizione del tipo

```typescript
element: ElementProxy | undefined;

// ElementProxy è un proxy per l'elemento HTMLElement originale, che espone un'API sicura
class ElementProxy {
  __el: HTMLElement;  // L'elemento DOM nativo interno (accessibile solo in scenari specifici)
  innerHTML: string;  // Sanificato tramite DOMPurify durante la lettura/scrittura
  outerHTML: string; // Come sopra
  appendChild(child: HTMLElement | string): void;
  // Altri metodi HTMLElement vengono passati direttamente (l'uso diretto non è raccomandato)
}
```

## Requisiti di sicurezza

**Raccomandazione: Tutti i rendering dovrebbero essere eseguiti tramite `ctx.render()`.** Eviti di utilizzare direttamente le API DOM di `ctx.element` (es. `innerHTML`, `appendChild`, `querySelector`, ecc.).

### Perché ctx.render() è raccomandato

| Vantaggio | Descrizione |
|------|------|
| **Sicurezza** | Controllo di sicurezza centralizzato per prevenire XSS e operazioni DOM improprie. |
| **Supporto React** | Supporto completo per JSX, componenti React e cicli di vita. |
| **Ereditarietà del contesto** | Eredita automaticamente il `ConfigProvider` dell'applicazione, i temi, ecc. |
| **Gestione dei conflitti** | Gestisce automaticamente la creazione/smontaggio della radice React per evitare conflitti tra più istanze. |

### ❌ Non raccomandato: Manipolazione diretta di ctx.element

```ts
// ❌ Non raccomandato: Utilizzo diretto delle API di ctx.element
ctx.element.innerHTML = '<div>Contenuto</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` è deprecato. Utilizzi `ctx.render()` al suo posto.

### ✅ Raccomandato: Utilizzo di ctx.render()

```ts
// ✅ Rendering di un componente React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Benvenuto')}>
    <Button type="primary">Clicca</Button>
  </Card>
);

// ✅ Rendering di una stringa HTML
ctx.render('<div style="padding:16px;">' + ctx.t('Contenuto') + '</div>');

// ✅ Rendering di un nodo DOM
const div = document.createElement('div');
div.textContent = ctx.t('Ciao');
ctx.render(div);
```

## Caso speciale: Come ancora per un Popover

Quando è necessario aprire un Popover utilizzando l'elemento corrente come ancora, è possibile accedere a `ctx.element?.__el` per ottenere il DOM nativo come `target`:

```ts
// ctx.viewer.popover richiede un DOM nativo come target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Contenuto popup</div>,
});
```

> Utilizzi `__el` solo in scenari come "utilizzare il contenitore corrente come ancora"; non manipoli il DOM direttamente in altri casi.

## Relazione con ctx.render

- Se `ctx.render(vnode)` viene chiamato senza un argomento `container`, il rendering avviene per impostazione predefinita nel contenitore `ctx.element`.
- Se mancano sia `ctx.element` sia il `container`, verrà generato un errore.
- È possibile specificare esplicitamente un contenitore: `ctx.render(vnode, customContainer)`.

## Note

- `ctx.element` è destinato all'uso interno da parte di `ctx.render()`. L'accesso diretto o la modifica delle sue proprietà/metodi non è raccomandato.
- Nei contesti senza un contenitore di rendering, `ctx.element` sarà `undefined`. Si assicuri che il contenitore sia disponibile o passi manualmente un `container` prima di chiamare `ctx.render()`.
- Sebbene `innerHTML`/`outerHTML` in `ElementProxy` siano sanificati tramite DOMPurify, si raccomanda comunque di utilizzare `ctx.render()` per una gestione unificata del rendering.

## Correlati

- [ctx.render](./render.md): Rendering dei contenuti in un contenitore
- [ctx.view](./view.md): Controller della vista corrente
- [ctx.modal](./modal.md): API rapida per le finestre modali