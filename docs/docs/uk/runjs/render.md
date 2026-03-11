:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/render).
:::

# Рендеринг у контейнері

Використовуйте `ctx.render()` для рендерингу вмісту в поточний контейнер (`ctx.element`). Підтримуються наступні три форми:

## `ctx.render()`

### Рендеринг JSX

```jsx
ctx.render(<button>Button</button>);
```

### Рендеринг DOM-вузлів

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Рендеринг HTML-рядків

```js
ctx.render('<h1>Hello World</h1>');
```

## Опис JSX

RunJS може рендерити JSX безпосередньо. Ви можете використовувати як вбудовані бібліотеки React/компонентів, так і завантажувати зовнішні залежності за потреби.

### Використання вбудованого React та бібліотек компонентів

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Використання зовнішнього React та бібліотек компонентів

Завантажуйте конкретні версії за потреби за допомогою `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Підходить для сценаріїв, що потребують специфічних версій або сторонніх компонентів.

## ctx.element

Не рекомендований спосіб (застаріло):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Рекомендований спосіб:

```js
ctx.render(<h1>Hello World</h1>);
```