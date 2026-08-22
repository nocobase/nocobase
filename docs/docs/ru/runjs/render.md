# Рендер в контейнере

Используйте `ctx.render()` для рендера содержимого в текущий контейнер (`ctx.element`) тремя способами:

## Метод `ctx.render()`

### Рендер JSX

```jsx
ctx.render(<button>Button</button>);
```

### Рендер DOM-узла

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Рендер HTML-строки

```js
ctx.render('<h1>Hello World</h1>');
```

## Примечания по JSX

RunJS может рендерить JSX напрямую, используя либо встроенную библиотеку React и компонентов, либо внешние зависимости.

### Использование встроенного React и компонентов

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Использование внешнего React и компонентов

Загрузите нужную версию через `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Используйте этот подход, когда нужна конкретная версия библиотеки или сторонние компоненты.

## Использование `ctx.element`

Не рекомендуется (устарело):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Рекомендуется:

```js
ctx.render(<h1>Hello World</h1>);
```