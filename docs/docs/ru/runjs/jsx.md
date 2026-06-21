# JSX

RunJS поддерживает JSX: вы можете писать код как React-компоненты, а JSX компилируется перед выполнением.

## Компиляция

- JSX преобразуется с помощью [sucrase](https://github.com/alangpierce/sucrase)
- JSX компилируется в `ctx.libs.React.createElement` и `ctx.libs.React.Fragment`
- **React импортировать не нужно**: пишите JSX напрямую, компилятор использует `ctx.libs.React`
- При загрузке внешнего React через `ctx.importAsync('react@x.x.x')` JSX использует `createElement` этого экземпляра

## Использование встроенного React и компонентов

RunJS включает React и распространенные UI-библиотеки; используйте их через `ctx.libs` без `import`:

- **ctx.libs.React** — ядро React
- **ctx.libs.ReactDOM** — ReactDOM (например, для createRoot)
- **ctx.libs.antd** — компоненты Ant Design
- **ctx.libs.antdIcons** — иконки Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

Для обычного JSX не нужно деструктурировать React; берите его из `ctx.libs` только при использовании **хуков** (например, `useState`, `useEffect`) или **фрагмента** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Примечание**: встроенный React и React, загруженный через `ctx.importAsync()`, **нельзя смешивать**. Если используете внешнюю UI-библиотеку, импортируйте React из того же внешнего источника.

## Использование внешнего React и компонентов

Когда вы загружаете React и UI-библиотеку через `ctx.importAsync()`, JSX использует именно этот экземпляр React:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Если antd зависит от react/react-dom, используйте `deps`, чтобы зафиксировать одинаковую версию и избежать нескольких экземпляров:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Примечание**: при внешнем React загружайте antd и другие UI-библиотеки через `ctx.importAsync()`; не смешивайте с `ctx.libs.antd`.

## Основы JSX

- **Компоненты и свойства**: `<Button type="primary">Text</Button>`
- **Фрагмент**: `<>...</>` или `<React.Fragment>...</React.Fragment>` (деструктурируйте `const { React } = ctx.libs` при использовании фрагмента)
- **Выражения**: используйте `{выражение}` в JSX для переменных и выражений, например `{ctx.user.name}`, `{count + 1}`; не используйте шаблонный синтаксис `{{ }}`
- **Условный рендер**: `{flag && <span>Content</span>}` или `{flag ? <A /> : <B />}`
- **Рендер списка**: используйте `array.map()` и задавайте каждому элементу стабильный `key`

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