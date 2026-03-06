:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/render).
:::

# Renderizado en el contenedor

Utilice `ctx.render()` para renderizar contenido en el contenedor actual (`ctx.element`). Soporta las siguientes tres formas:

## `ctx.render()`

### Renderizado de JSX

```jsx
ctx.render(<button>Button</button>);
```

### Renderizado de nodos DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Renderizado de cadenas HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Descripción de JSX

RunJS puede renderizar JSX directamente. Puede utilizar las librerías de componentes o React integradas, o cargar dependencias externas bajo demanda.

### Uso de React y librerías de componentes integradas

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Uso de React y librerías de componentes externas

Cargue versiones específicas bajo demanda a través de `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Adecuado para escenarios que requieren versiones específicas o componentes de terceros.

## ctx.element

Uso no recomendado (obsoleto):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Forma recomendada:

```js
ctx.render(<h1>Hello World</h1>);
```