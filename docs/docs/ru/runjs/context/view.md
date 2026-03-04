:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/view).
:::

# ctx.view

Текущий активный контроллер представления (диалоговое окно, боковая панель, всплывающее окно, встроенная область и т. д.), используемый для доступа к информации и операциям на уровне представления. Предоставляется `FlowViewContext` и доступен только внутри контента представления, открытого через `ctx.viewer` или `ctx.openView`.

## Сценарии применения

| Сценарий | Описание |
|------|------|
| **Контент диалога/боковой панели** | Используйте `ctx.view.close()` внутри `content`, чтобы закрыть текущее представление, или используйте `Header` и `Footer` для рендеринга заголовков и подвалов. |
| **После отправки формы** | Вызовите `ctx.view.close(result)` после успешной отправки, чтобы закрыть представление и вернуть результат. |
| **JS-блок / Действие (Action)** | Определите тип текущего представления через `ctx.view.type` или прочитайте параметры открытия из `ctx.view.inputArgs`. |
| **Выбор связи, подтаблицы** | Читайте `collectionName`, `filterByTk`, `parentId` и т. д. из `inputArgs` для загрузки данных. |

> Примечание: `ctx.view` доступен только в средах RunJS с контекстом представления (например, внутри `content` в `ctx.viewer.dialog()`, в формах диалоговых окон или внутри селекторов связей). На обычных страницах или в контекстах бэкенда он имеет значение `undefined`. При использовании рекомендуется применять опциональную цепочку (`ctx.view?.close?.()`).

## Определение типа

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

## Общие свойства и методы

| Свойство/Метод | Тип | Описание |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Тип текущего представления |
| `inputArgs` | `Record<string, any>` | Параметры, переданные при открытии представления (см. ниже) |
| `Header` | `React.FC \| null` | Компонент заголовка, используется для рендеринга названия и области действий |
| `Footer` | `React.FC \| null` | Компонент подвала, используется для рендеринга кнопок и т. д. |
| `close(result?, force?)` | `void` | Закрывает текущее представление; `result` может быть передан обратно вызывающей стороне |
| `update(newConfig)` | `void` | Обновляет конфигурацию представления (например, ширину, заголовок) |
| `navigation` | `ViewNavigation \| undefined` | Навигация по представлениям внутри страницы, включая переключение вкладок и т. д. |

> В настоящее время только `dialog` и `drawer` поддерживают `Header` и `Footer`.

## Общие поля inputArgs

Поля в `inputArgs` различаются в зависимости от сценария открытия. Общие поля включают:

| Поле | Описание |
|------|------|
| `viewUid` | UID представления |
| `collectionName` | Имя коллекции |
| `filterByTk` | Фильтр по первичному ключу (для деталей одной записи) |
| `parentId` | ID родителя (для сценариев связей) |
| `sourceId` | ID исходной записи |
| `parentItem` | Данные родительского элемента |
| `scene` | Сценарий (например, `create`, `edit`, `select`) |
| `onChange` | Обратный вызов после выбора или изменения |
| `tabUid` | UID текущей вкладки (внутри страницы) |

Доступ к ним осуществляется через `ctx.getVar('ctx.view.inputArgs.xxx')` или `ctx.view.inputArgs.xxx`.

## Примеры

### Закрытие текущего представления

```ts
// Закрыть диалоговое окно после успешной отправки
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Закрыть и вернуть результаты
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Использование Header / Footer в контенте

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Редактировать" extra={<Button size="small">Помощь</Button>} />
      <div>Контент формы...</div>
      <Footer>
        <Button onClick={() => close()}>Отмена</Button>
        <Button type="primary" onClick={handleSubmit}>Отправить</Button>
      </Footer>
    </div>
  );
}
```

### Ветвление логики на основе типа представления или inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Скрыть заголовок во встроенных представлениях
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Сценарий селектора пользователей
}
```

## Связь с ctx.viewer и ctx.openView

| Назначение | Рекомендуемое использование |
|------|----------|
| **Открыть новое представление** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` или `ctx.openView()` |
| **Управление текущим представлением** | `ctx.view.close()`, `ctx.view.update()` |
| **Получение параметров открытия** | `ctx.view.inputArgs` |

`ctx.viewer` отвечает за «открытие» представления, в то время как `ctx.view` представляет «текущий» экземпляр представления; `ctx.openView` используется для открытия предварительно настроенных представлений рабочего процесса.

## Примечания

- `ctx.view` доступен только внутри представления; на обычных страницах он равен `undefined`.
- Используйте опциональную цепочку: `ctx.view?.close?.()`, чтобы избежать ошибок при отсутствии контекста представления.
- `result` из `close(result)` передается в Promise, возвращаемый `ctx.viewer.open()`.

## Связанные разделы

- [ctx.openView()](./open-view.md): Открытие предварительно настроенного представления рабочего процесса
- [ctx.modal](./modal.md): Легковесные всплывающие окна (информация, подтверждение и т. д.)

> `ctx.viewer` предоставляет такие методы, как `dialog()`, `drawer()`, `popover()` и `embed()` для открытия представлений. Контент (`content`), открытый этими методами, имеет доступ к `ctx.view`.