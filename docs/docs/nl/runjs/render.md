:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/render) voor nauwkeurige informatie.
:::

# Renderen in de container

Gebruik `ctx.render()` om inhoud te renderen in de huidige container (`ctx.element`). Het ondersteunt de volgende drie vormen:

## `ctx.render()`

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

## JSX-beschrijving

RunJS kan JSX direct renderen. U kunt de ingebouwde React/componentenbibliotheken gebruiken of externe afhankelijkheden op aanvraag laden.

### Ingebouwde React en componentenbibliotheken gebruiken

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Externe React en componentenbibliotheken gebruiken

Laad specifieke versies op aanvraag via `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Geschikt voor scenario's die specifieke versies of componenten van derden vereisen.

## ctx.element

Niet aanbevolen (verouderd):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Aanbevolen manier:

```js
ctx.render(<h1>Hello World</h1>);
```