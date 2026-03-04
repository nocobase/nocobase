:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` — це єдиний простір імен для вбудованих бібліотек у RunJS, що містить такі популярні бібліотеки, як React, Ant Design, dayjs та lodash. **Не потрібно використовувати `import` або асинхронне завантаження**; їх можна використовувати безпосередньо через `ctx.libs.xxx`.

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Використання React + Ant Design для рендерингу UI, dayjs для роботи з датами та lodash для обробки даних. |
| **Формули / Обчислення** | Використання formula або math для Excel-подібних формул та операцій з математичними виразами. |
| **Робочі процеси / Правила зв'язку** | Виклик допоміжних бібліотек, таких як lodash, dayjs та formula, у сценаріях чистої логіки. |

## Огляд вбудованих бібліотек

| Властивість | Опис | Документація |
|------|------|------|
| `ctx.libs.React` | Ядро React, використовується для JSX та Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | Клієнтський API ReactDOM (включаючи `createRoot`), використовується разом із React для рендерингу | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Бібліотека компонентів Ant Design (Button, Card, Table, Form, Input, Modal тощо) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Бібліотека іконок Ant Design (наприклад, PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Бібліотека для роботи з датами та часом | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Бібліотека утиліт (get, set, debounce тощо) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Бібліотека функцій для Excel-подібних формул (SUM, AVERAGE, IF тощо) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Бібліотека для математичних виразів та обчислень | [Math.js](https://mathjs.org/docs/) |

## Псевдоніми верхнього рівня

Для сумісності зі застарілим кодом деякі бібліотеки також доступні на верхньому рівні: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` та `ctx.dayjs`. **Рекомендується послідовно використовувати `ctx.libs.xxx`** для полегшення обслуговування та пошуку в документації.

## Ліниве завантаження

`lodash`, `formula` та `math` використовують **ліниве завантаження (lazy loading)**: динамічний імпорт запускається лише при першому зверненні до `ctx.libs.lodash`, після чого використовується кеш. `React`, `antd`, `dayjs` та `antdIcons` попередньо налаштовані контекстом і доступні відразу.

## Приклади

### Рендеринг з React та Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Заголовок">
    <Button type="primary">Натиснути</Button>
  </Card>
);
```

### Використання Hooks

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

### Використання іконок

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Користувач</Button>);
```

### Обробка дат за допомогою dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Функції утиліт lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Обчислення за допомогою formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Математичні вирази з math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Примітки

- **Змішування з ctx.importAsync**: Якщо зовнішній React завантажено через `ctx.importAsync('react@19')`, JSX використовуватиме цей екземпляр. У такому разі **не змішуйте** його з `ctx.libs.antd`. Ant Design має бути завантажений відповідно до цієї версії React (наприклад, `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Кілька екземплярів React**: Якщо виникає помилка "Invalid hook call" або hook dispatcher дорівнює null, це зазвичай спричинено наявністю кількох екземплярів React. Перед читанням `ctx.libs.React` або викликом Hooks спочатку виконайте `await ctx.importAsync('react@версія')`, щоб переконатися, що використовується той самий екземпляр React, що і на сторінці.

## Пов'язане

- [ctx.importAsync()](./import-async.md) — завантаження зовнішніх ESM-модулів за запитом (наприклад, конкретних версій React, Vue)
- [ctx.render()](./render.md) — рендеринг вмісту в контейнер