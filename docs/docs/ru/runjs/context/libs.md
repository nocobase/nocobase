:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` — это единое пространство имен для встроенных библиотек в RunJS, включающее такие популярные библиотеки, как React, Ant Design, dayjs и lodash. **Не требуется использовать `import` или асинхронную загрузку**; их можно использовать напрямую через `ctx.libs.xxx`.

## Сценарии использования

| Сценарий | Описание |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Использование React + Ant Design для рендеринга UI, dayjs для работы с датами и lodash для обработки данных. |
| **Формулы / Вычисления** | Использование formula или math для создания формул в стиле Excel и выполнения математических операций. |
| **Рабочий процесс / Правила связей** | Вызов вспомогательных библиотек, таких как lodash, dayjs и formula, в сценариях с чистой логикой. |

## Обзор встроенных библиотек

| Свойство | Описание | Документация |
|------|------|------|
| `ctx.libs.React` | Ядро React, используется для JSX и хуков | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | Клиентский API ReactDOM (включая `createRoot`), используется вместе с React для рендеринга | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Библиотека компонентов Ant Design (Button, Card, Table, Form, Input, Modal и др.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Библиотека иконок Ant Design (например, PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Библиотека для работы с датой и временем | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Вспомогательная библиотека (get, set, debounce и др.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Библиотека функций для формул в стиле Excel (SUM, AVERAGE, IF и др.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Библиотека для математических выражений и вычислений | [Math.js](https://mathjs.org/docs/) |

## Псевдонимы верхнего уровня

Для совместимости с устаревшим кодом некоторые библиотеки также доступны на верхнем уровне: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` и `ctx.dayjs`. **Рекомендуется единообразно использовать `ctx.libs.xxx`** для упрощения обслуживания и поиска в документации.

## Ленивая загрузка

`lodash`, `formula` и `math` используют **ленивую загрузку**: динамический импорт запускается только при первом обращении к `ctx.libs.lodash`, после чего используется кэш. `React`, `antd`, `dayjs` и `antdIcons` предварительно настроены в контексте и доступны сразу.

## Примеры

### Рендеринг с React и Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Заголовок">
    <Button type="primary">Нажать</Button>
  </Card>
);
```

### Использование хуков

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

### Использование иконок

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Пользователь</Button>);
```

### Обработка дат с dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Вспомогательные функции lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Вычисления по формулам

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Математические выражения с math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Примечания

- **Смешивание с ctx.importAsync**: Если внешний React загружен через `ctx.importAsync('react@19')`, JSX будет использовать этот экземпляр. В этом случае **не смешивайте** его с `ctx.libs.antd`. Ant Design должен быть загружен в версии, соответствующей этому React (например, `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Несколько экземпляров React**: Если возникает ошибка "Invalid hook call" или диспетчер хуков равен null, обычно это вызвано наличием нескольких экземпляров React. Перед чтением `ctx.libs.React` или вызовом хуков сначала выполните `await ctx.importAsync('react@версия')`, чтобы убедиться, что используется тот же экземпляр React, что и на странице.

## Связанные разделы

- [ctx.importAsync()](./import-async.md) — загрузка внешних ESM-модулей по требованию (например, конкретных версий React, Vue)
- [ctx.render()](./render.md) — рендеринг контента в контейнер