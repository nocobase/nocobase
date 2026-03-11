:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/index) voor nauwkeurige informatie.
:::

# RunJS Overzicht

RunJS is de JavaScript-uitvoeringsomgeving die in NocoBase wordt gebruikt voor scenario's zoals **JS-blokken**, **JS-velden** en **JS-acties**. De code wordt uitgevoerd in een beperkte sandbox, biedt veilige toegang tot de `ctx` (Context API) en beschikt over de volgende mogelijkheden:

- Top-level `await`
- Externe modules importeren
- Renderen binnen containers
- Globale variabelen

## Top-level await

RunJS ondersteunt top-level `await`, waardoor het niet nodig is om code in een IIFE te wikkelen.

**Niet aanbevolen**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Aanbevolen**

```js
async function test() {}
await test();
```

## Externe modules importeren

- Gebruik `ctx.importAsync()` voor ESM-modules (aanbevolen)
- Gebruik `ctx.requireAsync()` voor UMD/AMD-modules

## Renderen binnen containers

Gebruik `ctx.render()` om inhoud te renderen in de huidige container (`ctx.element`). Het ondersteunt de volgende drie formaten:

### JSX renderen

```jsx
ctx.render(<button>Button</button>);
```

### DOM-nodes renderen

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### HTML-strings renderen

```js
ctx.render('<h1>Hello World</h1>');
```

## Globale variabelen

- `window`
- `document`
- `navigator`
- `ctx`