:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/runjs/context/view).
:::

# ctx.view

Поточний активний контролер представлення (діалогове вікно, бічна панель, спливаюче вікно, вбудована область тощо), що використовується для доступу до інформації та операцій на рівні представлення. Надається `FlowViewContext` і доступний лише у вмісті представлення, відкритому через `ctx.viewer` або `ctx.openView`.

## Сценарії застосування

| Сценарій | Опис |
|------|------|
| **Вміст діалогового вікна/бічної панелі** | Використовуйте `ctx.view.close()` у `content`, щоб закрити поточне представлення, або використовуйте `Header` та `Footer` для рендерингу заголовка та підвалу. |
| **Після відправки форми** | Викличте `ctx.view.close(result)` після успішної відправки, щоб закрити представлення та повернути результат. |
| **JSBlock / Дія** | Визначте тип поточного представлення за допомогою `ctx.view.type` або зчитайте параметри відкриття з `ctx.view.inputArgs`. |
| **Вибір зв'язків, підтаблиці** | Зчитуйте `collectionName`, `filterByTk`, `parentId` тощо з `inputArgs` для завантаження даних. |

> Примітка: `ctx.view` доступний лише в середовищах RunJS із контекстом представлення (наприклад, всередині `content` у `ctx.viewer.dialog()`, у формах діалогових вікон або всередині селекторів зв'язків). У звичайних сторінках або бекенд-контекстах він має значення `undefined`. Рекомендується використовувати опціональний ланцюжок (`ctx.view?.close?.()`).

## Визначення типу

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Доступно у представленнях конфігурації робочого процесу
};
```

## Загальні властивості та методи

| Властивість/Метод | Тип | Опис |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Тип поточного представлення |
| `inputArgs` | `Record<string, any>` | Параметри, передані при відкритті представлення (див. нижче) |
| `Header` | `React.FC \| null` | Компонент заголовка, використовується для рендерингу назви та області дій |
| `Footer` | `React.FC \| null` | Компонент підвалу, використовується для рендерингу кнопок тощо |
| `close(result?, force?)` | `void` | Закриває поточне представлення; `result` можна повернути тому, хто викликав |
| `update(newConfig)` | `void` | Оновлює конфігурацію представлення (наприклад, ширину, заголовок) |
| `navigation` | `ViewNavigation \| undefined` | Навігація всередині сторінки, включаючи перемикання вкладок тощо |

> Наразі лише `dialog` та `drawer` підтримують `Header` та `Footer`.

## Поширені поля inputArgs

Поля в `inputArgs` відрізняються залежно від сценарію відкриття. Поширені поля включають:

| Поле | Опис |
|------|------|
| `viewUid` | UID представлення |
| `collectionName` | Назва колекції |
| `filterByTk` | Фільтр за первинним ключем (для деталей одного запису) |
| `parentId` | ID батьківського запису (для сценаріїв зв'язків) |
| `sourceId` | ID вихідного запису |
| `parentItem` | Дані батьківського елемента |
| `scene` | Сценарій (наприклад, `create`, `edit`, `select`) |
| `onChange` | Зворотний виклик після вибору або зміни |
| `tabUid` | UID поточної вкладки (всередині сторінки) |

Доступ до них здійснюється через `ctx.getVar('ctx.view.inputArgs.xxx')` або `ctx.view.inputArgs.xxx`.

## Приклади

### Закриття поточного представлення

```ts
// Закрити діалогове вікно після успішної відправки
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Закрити та повернути результати
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Використання Header / Footer у вмісті

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Редагувати" extra={<Button size="small">Допомога</Button>} />
      <div>Вміст форми...</div>
      <Footer>
        <Button onClick={() => close()}>Скасувати</Button>
        <Button type="primary" onClick={handleSubmit}>Підтвердити</Button>
      </Footer>
    </div>
  );
}
```

### Розгалуження на основі типу представлення або inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Приховати заголовок у вбудованих представленнях
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Сценарій селектора користувачів
}
```

## Зв'язок із ctx.viewer та ctx.openView

| Призначення | Рекомендоване використання |
|------|----------|
| **Відкрити нове представлення** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` або `ctx.openView()` |
| **Операції з поточним представленням** | `ctx.view.close()`, `ctx.view.update()` |
| **Отримання параметрів відкриття** | `ctx.view.inputArgs` |

`ctx.viewer` відповідає за «відкриття» представлення, тоді як `ctx.view` представляє «поточний» екземпляр представлення; `ctx.openView` використовується для відкриття попередньо налаштованих представлень робочого процесу.

## Примітки

- `ctx.view` доступний лише всередині представлення; на звичайних сторінках він має значення `undefined`.
- Використовуйте опціональний ланцюжок: `ctx.view?.close?.()`, щоб уникнути помилок, коли контекст представлення відсутній.
- `result` з `close(result)` передається в Promise, повернутий методом `ctx.viewer.open()`.

## Пов'язане

- [ctx.openView()](./open-view.md): Відкрити попередньо налаштоване представлення робочого процесу
- [ctx.modal](./modal.md): Легкі спливаючі вікна (інформація, підтвердження тощо)

> `ctx.viewer` надає такі методи, як `dialog()`, `drawer()`, `popover()` та `embed()` для відкриття представлень. У `content`, відкритому цими методами, можна отримати доступ до `ctx.view`.