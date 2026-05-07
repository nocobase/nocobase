:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/render).
:::

# Рендеринг внутри контейнера

Используйте `ctx.render()` для рендеринга содержимого в текущий контейнер (`ctx.element`). Поддерживаются следующие три формы:

## `ctx.render()`

### Рендеринг JSX

```jsx
ctx.render(<button>Button</button>);
```

### Рендеринг DOM-узлов

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Рендеринг HTML-строк

```js
ctx.render('<h1>Hello World</h1>');
```

## Описание JSX

RunJS может рендерить JSX напрямую. Вы можете использовать встроенные библиотеки React/компонентов или загружать внешние зависимости по запросу.

### Использование встроенного React и библиотек компонентов

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Использование внешнего React и библиотек компонентов

Загружайте конкретные версии по запросу через `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Подходит для сценариев, требующих определенных версий или сторонних компонентов.

## ctx.element

Не рекомендуемый способ (устарело):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Рекомендуемый способ:

```js
ctx.render(<h1>Hello World</h1>);
```