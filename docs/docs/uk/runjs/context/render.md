:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/render).
:::

# ctx.render()

Відмальовує (рендерить) React-елементи, HTML-рядки або DOM-вузли у вказаний контейнер. Якщо `container` не вказано, за замовчуванням рендеринг відбувається в `ctx.element`, автоматично успадковуючи контекст додатка, такий як ConfigProvider, теми тощо.

## Сценарії використання

| Сценарій | Опис |
|------|------|
| **JSBlock** | Рендеринг користувацького вмісту блоків (діаграми, списки, картки тощо) |
| **JSField / JSItem / JSColumn** | Рендеринг користувацького відображення для полів, що редагуються, або стовпців таблиць |
| **Блок деталей** | Налаштування формату відображення полів на сторінках деталей |

> Примітка: `ctx.render()` потребує контейнера для рендерингу. Якщо `container` не передано і `ctx.element` не існує (наприклад, у сценаріях чистої логіки без UI), буде видано помилку.

## Визначення типів

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Параметр | Тип | Опис |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Вміст для рендерингу |
| `container` | `Element` \| `DocumentFragment` (опціонально) | Цільовий контейнер для рендерингу, за замовчуванням `ctx.element` |

**Значення, що повертається**:

- При рендерингу **React-елемента**: Повертає `ReactDOMClient.Root`, що дозволяє викликати `root.render()` для подальших оновлень.
- При рендерингу **HTML-рядка** або **DOM-вузла**: Повертає `null`.

## Опис типів vnode

| Тип | Поведінка |
|------|------|
| `React.ReactElement` (JSX) | Рендериться за допомогою React `createRoot`, надаючи повні можливості React та автоматично успадковуючи контекст додатка. |
| `string` | Встановлює `innerHTML` контейнера після очищення за допомогою DOMPurify; будь-який існуючий корінь React буде спочатку розмонтовано. |
| `Node` (Element, Text тощо) | Додає через `appendChild` після очищення контейнера; будь-який існуючий корінь React буде спочатку розмонтовано. |
| `DocumentFragment` | Додає дочірні вузли фрагмента до контейнера; будь-який існуючий корінь React буде спочатку розмонтовано. |

## Приклади

### Рендеринг React-елементів (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Заголовок')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Натиснуто'))}>
      {ctx.t('Кнопка')}
    </Button>
  </Card>
);
```

### Рендеринг HTML-рядків

```ts
ctx.render('<h1>Hello World</h1>');

// Поєднання з ctx.t для інтернаціоналізації
ctx.render('<div style="padding:16px">' + ctx.t('Вміст') + '</div>');

// Умовний рендеринг
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### Рендеринг DOM-вузлів

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Спочатку рендеримо порожній контейнер, потім передаємо його сторонній бібліотеці (наприклад, ECharts) для ініціалізації
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Вказання власного контейнера

```ts
// Рендеринг у конкретний DOM-елемент
const customEl = document.getElementById('my-container');
ctx.render(<div>Вміст</div>, customEl);
```

### Повторні виклики замінюють вміст

```ts
// Другий виклик замінить існуючий вміст у контейнері
ctx.render(<div>Перший раз</div>);
ctx.render(<div>Другий раз</div>);  // Буде відображено лише "Другий раз"
```

## Примітки

- **Повторні виклики замінюють вміст**: Кожен виклик `ctx.render()` замінює існуючий вміст у контейнері, а не додає до нього.
- **Безпека HTML-рядків**: Переданий HTML очищується через DOMPurify для зниження ризиків XSS, проте все одно рекомендується уникати конкатенації ненадійних даних користувача.
- **Не маніпулюйте ctx.element безпосередньо**: `ctx.element.innerHTML` застаріло; замість цього слід послідовно використовувати `ctx.render()`.
- **Передавайте контейнер, якщо він не існує за замовчуванням**: У сценаріях, де `ctx.element` має значення `undefined` (наприклад, у модулях, завантажених через `ctx.importAsync`), необхідно явно передати `container`.

## Пов'язане

- [ctx.element](./element.md) — контейнер для рендерингу за замовчуванням, використовується, коли `container` не передано в `ctx.render()`.
- [ctx.libs](./libs.md) — вбудовані бібліотеки, такі як React та Ant Design, що використовуються для JSX-рендерингу.
- [ctx.importAsync()](./import-async.md) — використовується разом із `ctx.render()` після завантаження зовнішніх бібліотек React/компонентів за запитом.