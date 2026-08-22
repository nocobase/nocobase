# ctx.view

Контроллер текущего активного представления (диалоговое окно, выдвижной блок, всплывающая панель, встраивание и т. д.); используется для доступа к информации и действиям уровня представления. Предоставляется через `FlowViewContext` и доступен только внутри контента, открытого через `ctx.viewer` или `ctx.openView`.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Содержимое диалога или выдвижного блока** | В `content` используйте `ctx.view.close()` для закрытия либо `Header`/`Footer` для заголовка и действий |
| **После отправки формы** | Вызов `ctx.view.close(result)` для закрытия с передачей результата назад |
| **JS-блок / Действие** | Проверка `ctx.view.type` для типа представления или чтение `ctx.view.inputArgs` для параметров открытия |
| **Выбор ассоциации, подтаблица** | Чтение `inputArgs` (`collectionName`, `filterByTk`, `parentId` и т. д.) для загрузки данных |

> `ctx.view` доступен только в контексте RunJS с представлением (например, внутри `content` в `ctx.viewer.dialog()`, формы в диалоге, селекторе ассоциации). На обычной странице или в серверном контексте это `undefined`; используйте опциональную цепочку: `ctx.view?.close?.()`.

## Тип

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
  submit?: () => Promise<any>;  // Доступно в представлениях конфигурации рабочего процесса
};
```

## Основные свойства и методы

| Свойство/метод | Тип | Описание |
|----------------|-----|----------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Тип текущего представления |
| `inputArgs` | `Record<string, any>` | Параметры, переданные при открытии представления |
| `Header` | `React.FC \| null` | Компонент `Header` для заголовка и действий |
| `Footer` | `React.FC \| null` | Нижняя панель для кнопок и т. д. |
| `close(result?, force?)` | `void` | Закрыть текущее представление; можно передать `result` вызывающей стороне |
| `update(newConfig)` | `void` | Обновить конфигурацию представления (например, ширины, заголовка) |
| `navigation` | `ViewNavigation \| undefined` | Навигация внутри представления (вкладки и т. д.) |

> Сейчас только `dialog` и `drawer` поддерживают `Header` и `Footer`.

## Поля inputArgs (частые)

Набор полей в `inputArgs` зависит от способа открытия представления; наиболее частые:

| Поле | Описание |
|------|----------|
| `viewUid` | UID представления |
| `collectionName` | Имя коллекции |
| `filterByTk` | Фильтр по первичному ключу (одна запись) |
| `parentId` | ID родительской записи (ассоциации) |
| `sourceId` | ID исходной записи |
| `parentItem` | Данные родительского элемента |
| `scene` | Сценарий (`create`, `edit`, `select`) |
| `onChange` | Обратный вызов после выбора или изменения |
| `tabUid` | UID текущей вкладки (на странице) |

Доступ: `ctx.getVar('ctx.view.inputArgs.xxx')` или `ctx.view.inputArgs.xxx`.

## Примеры

### Закрыть текущее представление

```ts
// Закрыть диалоговое окно после успешной отправки
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Закрыть и вернуть результаты
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Header и Footer внутри `content`

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Edit" extra={<Button size="small">Help</Button>} />
      <div>Form content...</div>
      <Footer>
        <Button onClick={() => close()}>Cancel</Button>
        <Button type="primary" onClick={handleSubmit}>OK</Button>
      </Footer>
    </div>
  );
}
```

### Ветвление по типу представления и inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Скрыть заголовок во встроенных представлениях
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Селектор пользователей
}
```

## Связь с ctx.viewer и ctx.openView

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Открыть новое представление** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` или `ctx.openView()` |
| **Управлять текущим представлением** | `ctx.view.close()`, `ctx.view.update()` |
| **Получить параметры открытия** | `ctx.view.inputArgs` |

`ctx.viewer` открывает представление; `ctx.view` — экземпляр текущего представления; `ctx.openView` открывает сконфигурированные представления потока.

## Примечания

- `ctx.view` доступен только внутри представления; на обычной странице это `undefined`.
- Используйте опциональную цепочку: `ctx.view?.close?.()`, чтобы избежать ошибок при отсутствии контекста представления.
- `close(result)` передаёт `result` в Promise, который вернул `ctx.viewer.open()`.

## Связанные материалы

- [ctx.openView()](./open-view.md): открытие сконфигурированного представления потока
- [ctx.modal](./modal.md): лёгкие модальные окна (информация, подтверждение и т. д.)

> `ctx.viewer` предоставляет `dialog()`, `drawer()`, `popover()`, `embed()`; внутри их `content` доступен `ctx.view`.