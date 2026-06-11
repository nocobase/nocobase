# ctx.libs

`ctx.libs` — единое пространство имён для встроенных библиотек RunJS (React, Ant Design, dayjs, lodash и т. д.). **Без `import` и асинхронной загрузки**; используйте библиотеки напрямую через `ctx.libs.xxx`.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок / Поле JS / Элемент JS / JS-столбец таблицы** | React и Ant Design для UI, dayjs для дат, lodash для работы с данными |
| **Формулы / вычисления** | formula и math для формул в стиле Excel и математических выражений |
| **Поток событий / связывание** | lodash, dayjs, formula и т. д. в логике без UI |

## Встроенные библиотеки

| Свойство | Описание | Документация |
|----------|----------|--------------|
| `ctx.libs.React` | Ядро React для JSX и хуков | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM (например, `createRoot`) | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Компоненты Ant Design (Button, Card, Table, Form, Input, Modal и т. д.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Иконки Ant Design (PlusOutlined, UserOutlined и т. д.) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Утилиты для даты/времени | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Утилиты (get, set, debounce и т. д.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel-подобные формулы (SUM, AVERAGE, IF и т. д.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Математические выражения и вычисления | [Math.js](https://mathjs.org/docs/) |

## Алиасы верхнего уровня

Для обратной совместимости некоторые библиотеки также доступны прямо в `ctx`: `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, `ctx.dayjs`. Для единообразия и удобства документации предпочтительно использовать **`ctx.libs.xxx`**.

## Ленивая загрузка

`lodash`, `formula`, `math` загружаются **лениво**: первый доступ к `ctx.libs.lodash` запускает динамический импорт, затем результат кешируется. `React`, `antd`, `dayjs`, `antdIcons` предзагружаются в контекст.

## Примеры

### React и Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Title">
    <Button type="primary">Click</Button>
  </Card>
);
```

### Хуки

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### Иконки

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>User</Button>);
```

### dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// результат === 14
```

## Примечания

- **Смешивание с ctx.importAsync**: если вы загрузили внешний React через `ctx.importAsync('react@19')`, JSX будет использовать этот экземпляр; **не** смешивайте его с `ctx.libs.antd`. Подгружайте antd под ту же версию React (например, `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Несколько экземпляров React**: ошибка «некорректный вызов хука» или null hook dispatcher обычно означает несколько экземпляров React. Перед использованием `ctx.libs.React` и хуков убедитесь, что используется тот же React, что и на странице.

## Связанные материалы

- [ctx.importAsync()](./import-async.md): загрузка внешних ESM-модулей (например, конкретной версии React или Vue)
- [ctx.render()](./render.md): рендер в контейнер