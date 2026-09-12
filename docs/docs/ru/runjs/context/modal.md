# Контекст: ctx.modal

Сокращённый API поверх Ant Design Modal для открытия модальных окон (.info, .confirm и т. д.) из RunJS. Реализован через `ctx.viewer` и систему представлений.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок / Поле JS** | Показ результата, ошибки или подтверждения после действия пользователя |
| **Поток событий / события действий** | Подтверждение перед отправкой; при отмене используйте `ctx.exit()` |
| **Связывание** | Показ модального окна при ошибке валидации |

> `ctx.modal` доступен в RunJS, когда есть контекст представления (например, JS-блок на странице, поток событий). В серверной части или контекстах без UI API может отсутствовать — используйте опциональную цепочку: `ctx.modal?.confirm?.()`.

## Тип

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // true = OK, false = отмена
};
```

`ModalConfig` соответствует конфигурации статических методов Ant Design Modal.

## Основные методы

| Метод | Возвращает | Описание |
|-------|------------|----------|
| `info(config)` | `Promise<void>` | Информационное окно |
| `success(config)` | `Promise<void>` | Окно успешного результата |
| `error(config)` | `Promise<void>` | Окно ошибки |
| `warning(config)` | `Promise<void>` | Предупреждение |
| `confirm(config)` | `Promise<boolean>` | Подтверждение; OK → `true`, отмена → `false` |

## Конфигурация

Та же, что у Ant Design `Modal`; часто используемые поля:

| Параметр | Тип | Описание |
|----------|-----|----------|
| `title` | `ReactNode` | Заголовок |
| `content` | `ReactNode` | Содержимое |
| `okText` | `string` | Текст кнопки OK |
| `cancelText` | `string` | Текст кнопки «Отмена» (только для `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Обработчик нажатия OK |
| `onCancel` | `() => void` | Обработчик нажатия «Отмена» |

## Связь с ctx.message и ctx.openView

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Короткое сообщение с автозакрытием** | `ctx.message` |
| **Модальное окно: информация, успех, ошибка, предупреждение** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Подтверждение (выбор пользователя)** | `ctx.modal.confirm`; для контроля потока используйте `ctx.exit()` |
| **Сложная форма, список и т. д.** | `ctx.openView` для открытия пользовательского представления (страница / выдвижной блок / диалоговое окно) |

## Примеры

### Простое информационное окно

```ts
ctx.modal.info({
  title: 'Notice',
  content: 'Operation completed',
});
```

### Подтверждение и контроль потока

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirm delete',
  content: 'Delete this record?',
  okText: 'OK',
  cancelText: 'Cancel',
});
if (!confirmed) {
  ctx.exit();
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Подтверждение с onOk

```ts
await ctx.modal.confirm({
  title: 'Confirm submit',
  content: 'Cannot be changed after submit. Continue?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Показ ошибки

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Success', content: 'Done' });
} catch (e) {
  ctx.modal.error({ title: 'Error', content: e.message });
}
```

## Связанные материалы

- [ctx.message](./message.md): короткие сообщения с автозакрытием
- [ctx.exit()](./exit.md): при отмене подтверждения используйте `if (!confirmed) ctx.exit()`
- [ctx.openView()](./open-view.md): открытие пользовательского представления для сложных сценариев