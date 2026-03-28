:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/jsx).
:::

# JSX

RunJS поддерживает синтаксис JSX, что позволяет писать код так же, как компоненты React. JSX автоматически компилируется перед выполнением.

## Примечания по компиляции

- Для преобразования JSX используется [sucrase](https://github.com/alangpierce/sucrase).
- JSX компилируется в `ctx.libs.React.createElement` и `ctx.libs.React.Fragment`.
- **Нет необходимости импортировать React**: вы можете писать JSX напрямую; после компиляции он автоматически будет использовать `ctx.libs.React`.
- При загрузке внешнего React через `ctx.importAsync('react@x.x.x')`, JSX переключится на использование метода `createElement` из этого конкретного экземпляра.

## Использование встроенного React и компонентов

RunJS содержит встроенный React и популярные библиотеки пользовательского интерфейса. Вы можете обращаться к ним напрямую через `ctx.libs` без использования `import`:

- **ctx.libs.React** — ядро React
- **ctx.libs.ReactDOM** — ReactDOM (можно использовать с `createRoot`, если необходимо)
- **ctx.libs.antd** — компоненты Ant Design
- **ctx.libs.antdIcons** — иконки Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Нажать</Button>);
```

При написании JSX напрямую вам не нужно деструктурировать React. Деструктуризация из `ctx.libs` требуется только при использовании **хуков** (таких как `useState`, `useEffect`) или **фрагментов** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Счетчик: {count}</div>;
};

ctx.render(<Counter />);
```

**Примечание**: Встроенный React и внешний React, импортированный через `ctx.importAsync()`, **нельзя смешивать**. Если вы используете внешнюю библиотеку пользовательского интерфейса, React также должен быть импортирован из того же внешнего источника.

## Использование внешнего React и компонентов

При загрузке определенной версии React и библиотек пользовательского интерфейса через `ctx.importAsync()`, JSX будет использовать этот экземпляр React:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Нажать</Button>);
```

Если antd зависит от react/react-dom, вы можете указать ту же версию через `deps`, чтобы избежать создания нескольких экземпляров:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Кнопка</Button>);
```

**Примечание**: При использовании внешнего React библиотеки пользовательского интерфейса, такие как antd, также должны быть импортированы через `ctx.importAsync()`. Не смешивайте их с `ctx.libs.antd`.

## Основные моменты синтаксиса JSX

- **Компоненты и пропсы**: `<Button type="primary">Текст</Button>`
- **Фрагмент**: `<>...</>` или `<React.Fragment>...</React.Fragment>` (при использовании фрагмента необходимо выполнить деструктуризацию `const { React } = ctx.libs`)
- **Выражения**: используйте `{выражение}` в JSX для вставки переменных или операций, например `{ctx.user.name}` или `{count + 1}`. Не используйте синтаксис шаблонов `{{ }}`.
- **Условный рендеринг**: `{flag && <span>Контент</span>}` или `{flag ? <A /> : <B />}`
- **Рендеринг списков**: используйте `array.map()` для возврата списка элементов и убедитесь, что у каждого элемента есть стабильный `key`.

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