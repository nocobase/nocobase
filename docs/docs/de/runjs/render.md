:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/render).
:::

# Rendering im Container

Verwenden Sie `ctx.render()`, um Inhalte in den aktuellen Container (`ctx.element`) zu rendern. Es werden die folgenden drei Formen unterstützt:

## `ctx.render()`

### JSX rendern

```jsx
ctx.render(<button>Button</button>);
```

### DOM-Knoten rendern

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### HTML-Strings rendern

```js
ctx.render('<h1>Hello World</h1>');
```

## JSX-Beschreibung

RunJS kann JSX direkt rendern. Sie können entweder die integrierten React- und Komponenten-Bibliotheken verwenden oder externe Abhängigkeiten bei Bedarf laden.

### Verwendung integrierter React- und Komponenten-Bibliotheken

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Verwendung externer React- und Komponenten-Bibliotheken

Laden Sie spezifische Versionen bei Bedarf über `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Dies ist geeignet für Szenarien, die bestimmte Versionen oder Komponenten von Drittanbietern erfordern.

## ctx.element

Nicht empfohlene Verwendung (veraltet):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Empfohlene Methode:

```js
ctx.render(<h1>Hello World</h1>);
```