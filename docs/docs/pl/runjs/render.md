:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/render).
:::

# Renderowanie wewnątrz kontenera

Należy użyć `ctx.render()`, aby wyrenderować zawartość w bieżącym kontenerze (`ctx.element`). Obsługiwane są następujące trzy formy:

## `ctx.render()`

### Renderowanie JSX

```jsx
ctx.render(<button>Button</button>);
```

### Renderowanie węzłów DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Renderowanie ciągów znaków HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Opis JSX

RunJS umożliwia bezpośrednie renderowanie JSX. Mogą Państwo korzystać z wbudowanych bibliotek React/komponentów lub ładować zewnętrzne zależności na żądanie.

### Korzystanie z wbudowanych bibliotek React i komponentów

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Korzystanie z zewnętrznych bibliotek React i komponentów

Proszę załadować określone wersje na żądanie za pomocą `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Jest to odpowiednie dla scenariuszy wymagających konkretnych wersji lub komponentów stron trzecich.

## ctx.element

Niezalecane (przestarzałe):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Zalecany sposób:

```js
ctx.render(<h1>Hello World</h1>);
```