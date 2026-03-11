:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/render).
:::

# Rendering all'interno del contenitore

Utilizzi `ctx.render()` per renderizzare i contenuti nel contenitore corrente (`ctx.element`). Supporta le seguenti tre modalità:

## `ctx.render()`

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

## Descrizione di JSX

RunJS può renderizzare direttamente JSX. È possibile utilizzare le librerie React/componenti integrate oppure caricare dipendenze esterne su richiesta.

### Utilizzo di React e delle librerie di componenti integrate

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Utilizzo di React e librerie di componenti esterne

Carichi versioni specifiche su richiesta tramite `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Ideale per scenari che richiedono versioni specifiche o componenti di terze parti.

## ctx.element

Utilizzo non raccomandato (deprecato):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Modalità raccomandata:

```js
ctx.render(<h1>Hello World</h1>);
```