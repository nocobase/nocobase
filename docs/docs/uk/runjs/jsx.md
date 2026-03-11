:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/jsx).
:::

# JSX

RunJS підтримує синтаксис JSX, що дозволяє писати код подібно до компонентів React. JSX автоматично компілюється перед виконанням.

## Примітки щодо компіляції

- Використовує [sucrase](https://github.com/alangpierce/sucrase) для перетворення JSX.
- JSX компілюється в `ctx.libs.React.createElement` та `ctx.libs.React.Fragment`.
- **Не потрібно імпортувати React**: ви можете писати JSX безпосередньо; після компіляції він автоматично використовуватиме `ctx.libs.React`.
- При завантаженні зовнішнього React через `ctx.importAsync('react@x.x.x')`, JSX переключиться на використання методу `createElement` саме з цього екземпляра.

## Використання вбудованого React та компонентів

RunJS містить вбудований React та популярні бібліотеки UI. Ви можете отримати доступ до них безпосередньо через `ctx.libs` без використання `import`:

- **ctx.libs.React** — ядро React
- **ctx.libs.ReactDOM** — ReactDOM (можна використовувати з `createRoot`, якщо потрібно)
- **ctx.libs.antd** — компоненти Ant Design
- **ctx.libs.antdIcons** — іконки Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Натиснути</Button>);
```

При написанні JSX безпосередньо вам не потрібно деструктурувати React. Це необхідно лише при використанні **Hooks** (таких як `useState`, `useEffect`) або **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Лічильник: {count}</div>;
};

ctx.render(<Counter />);
```

**Примітка**: Вбудований React та зовнішній React, імпортований через `ctx.importAsync()`, **не можна змішувати**. Якщо ви використовуєте зовнішню бібліотеку UI, React також має бути імпортований з того ж зовнішнього джерела.

## Використання зовнішнього React та компонентів

При завантаженні конкретної версії React та бібліотек UI через `ctx.importAsync()`, JSX використовуватиме цей екземпляр React:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Натиснути</Button>);
```

Якщо antd залежить від react/react-dom, ви можете вказати ту саму версію через `deps`, щоб уникнути створення кількох екземплярів:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Кнопка</Button>);
```

**Примітка**: При використанні зовнішнього React бібліотеки UI, такі як antd, також повинні бути імпортовані через `ctx.importAsync()`. Не змішуйте їх із `ctx.libs.antd`.

## Основні моменти синтаксису JSX

- **Компоненти та пропси**: `<Button type="primary">Текст</Button>`
- **Fragment**: `<>...</>` або `<React.Fragment>...</React.Fragment>` (при використанні Fragment необхідно деструктурувати `const { React } = ctx.libs`)
- **Вирази**: використовуйте `{вираз}` у JSX для вставки змінних або операцій, наприклад `{ctx.user.name}` або `{count + 1}`. Не використовуйте синтаксис шаблонів `{{ }}`.
- **Умовний рендеринг**: `{flag && <span>Вміст</span>}` або `{flag ? <A /> : <B />}`
- **Рендеринг списків**: використовуйте `array.map()` для повернення списку елементів і переконайтеся, що кожен елемент має стабільний `key`.

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```