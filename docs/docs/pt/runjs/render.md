:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/render).
:::

# Renderização dentro do contêiner

Use `ctx.render()` para renderizar conteúdo no contêiner atual (`ctx.element`). Ele suporta as três formas a seguir:

## `ctx.render()`

### Renderizando JSX

```jsx
ctx.render(<button>Button</button>);
```

### Renderizando nós DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Renderizando strings HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Descrição do JSX

O RunJS pode renderizar JSX diretamente. Você pode usar as bibliotecas React/componentes integradas ou carregar dependências externas sob demanda.

### Usando React e bibliotecas de componentes integradas

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Usando React e bibliotecas de componentes externas

Carregue versões específicas sob demanda via `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Adequado para cenários que exigem versões específicas ou componentes de terceiros.

## ctx.element

Uso não recomendado (descontinuado):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Forma recomendada:

```js
ctx.render(<h1>Hello World</h1>);
```