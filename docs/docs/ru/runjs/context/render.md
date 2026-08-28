# ctx.render()

Рендерит React-элемент, HTML-строку или DOM-узел в контейнер. Если `container` не передан, рендер идёт в `ctx.element` и наследует контекст приложения (ConfigProvider, тема и т. д.).

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок** | Пользовательский контент блока (графики, списки, карточки и т. д.) |
| **Поле JS / Элемент JS / JS-столбец таблицы** | Пользовательское редактируемое поле или колонка таблицы |
| **Блок деталей** | Пользовательское отображение поля в блоке деталей |

> `ctx.render()` требует контейнер. Если `container` не передан и `ctx.element` отсутствует (например, логика без UI), будет выброшена ошибка.

## Тип

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Содержимое для рендера |
| `container` | `Element` \| `DocumentFragment` (необязательный) | Целевой контейнер; по умолчанию `ctx.element` |

**Возвращает:**

- для **React-элемента**: `ReactDOMClient.Root` (для последующих обновлений через `root.render()`),
- для **HTML-строки** или **DOM-узла**: `null`.

## Типы vnode

| Тип | Поведение |
|-----|-----------|
| `React.ReactElement` (JSX) | Рендер через React `createRoot`; полноценный React; наследует контекст приложения |
| `string` | Санитизируется через DOMPurify и записывается в `innerHTML` контейнера; существующий React root предварительно размонтируется |
| `Node` (Element, Text и т. д.) | Контейнер очищается, затем `appendChild`; существующий React root предварительно размонтируется |
| `DocumentFragment` | Дочерние узлы фрагмента добавляются в контейнер; существующий React root предварительно размонтируется |

## Примеры

### React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Title')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked'))}>
      {ctx.t('Button')}
    </Button>
  </Card>
);
```

### HTML-строка

```ts
ctx.render('<h1>Hello wolrd</h1>');

// Использование ctx.t для интернационализации
ctx.render('<div style="padding:16px">' + ctx.t('Content') + '</div>');

// Условный рендеринг
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### DOM-узел

```ts
const div = document.createElement('div');
div.textContent = 'Hello wolrd';
ctx.render(div);

// Сначала рендерим пустой контейнер, затем передаем его сторонней библиотеке (например, ECharts) для инициализации
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Пользовательский контейнер

```ts
// Рендеринг в конкретный DOM-элемент
const customEl = document.getElementById('my-container');
ctx.render(<div>Content</div>, customEl);
```

### Многократные вызовы заменяют содержимое

```ts
// Второй вызов заменит существующее содержимое в контейнере
ctx.render(<div>First</div>);
ctx.render(<div>Second</div>);  // Отобразится только "Second"
```

## Примечания

- **Каждый вызов заменяет контент**: содержимое перезаписывается, а не добавляется.
- **Безопасность HTML**: HTML санитизируется через DOMPurify, но всё равно избегайте конкатенации недоверенных пользовательских данных.
- **Не изменяйте ctx.element напрямую**: `ctx.element.innerHTML` устарел; используйте `ctx.render()`.
- **Нет контейнера**: если `ctx.element` равен `undefined` (например, внутри модуля, загруженного через `ctx.importAsync`), передавайте `container` явно.

## Связанные материалы

- [ctx.element](./element.md): контейнер по умолчанию, если `container` не передан
- [ctx.libs](./libs.md): React, antd и другие библиотеки для JSX
- [ctx.importAsync()](./import-async.md): загрузка внешних React/компонентов с последующим рендером через `ctx.render()`