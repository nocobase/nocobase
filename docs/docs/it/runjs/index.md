:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/index).
:::

# Panoramica di RunJS

RunJS è l'ambiente di esecuzione JavaScript utilizzato in NocoBase per scenari come **blocchi JS**, **campi JS** e **azioni JS**. Il codice viene eseguito in una sandbox limitata, fornendo un accesso sicuro alle `ctx` (Context API) e include le seguenti funzionalità:

- `await` di primo livello (Top-level `await`)
- Importazione di moduli esterni
- Rendering all'interno dei contenitori
- Variabili globali

## `await` di primo livello (Top-level `await`)

RunJS supporta l'istruzione `await` di primo livello, eliminando la necessità di avvolgere il codice in una IIFE.

**Non raccomandato**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Raccomandato**

```js
async function test() {}
await test();
```

## Importazione di moduli esterni

- Utilizzi `ctx.importAsync()` per i moduli ESM (Raccomandato)
- Utilizzi `ctx.requireAsync()` per i moduli UMD/AMD

## Rendering all'interno dei contenitori

Utilizzi `ctx.render()` per renderizzare il contenuto nel contenitore corrente (`ctx.element`). Supporta i seguenti tre formati:

### Rendering di JSX

```jsx
ctx.render(<button>Button</button>);
```

### Rendering di nodi DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Rendering di stringhe HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Variabili globali

- `window`
- `document`
- `navigator`
- `ctx`