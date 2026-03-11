:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/render).
:::

# Rendering i behållare

Använd `ctx.render()` för att rendera innehåll i den aktuella behållaren (`ctx.element`). Följande tre former stöds:

## `ctx.render()`

### Rendera JSX

```jsx
ctx.render(<button>Button</button>);
```

### Rendera DOM-noder

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Rendera HTML-strängar

```js
ctx.render('<h1>Hello World</h1>');
```

## JSX-beskrivning

RunJS kan rendera JSX direkt. Ni kan använda de inbyggda React- och komponentbiblioteken eller ladda externa beroenden vid behov.

### Använda inbyggd React och komponentbibliotek

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Använda externa React- och komponentbibliotek

Ladda specifika versioner vid behov via `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Lämpligt för scenarier som kräver specifika versioner eller tredjepartskomponenter.

## ctx.element

Rekommenderas inte (föråldrat):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Rekommenderat sätt:

```js
ctx.render(<h1>Hello World</h1>);
```