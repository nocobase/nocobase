# ctx.notification

Глобальный API уведомлений на базе Ant Design Notification; показывает уведомления в **правом верхнем углу**. В отличие от `ctx.message`, уведомления могут содержать заголовок и описание и отображаться дольше.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок / события действий** | Завершение задачи, результат пакетной операции, завершение экспорта |
| **Поток событий** | Системное уведомление после завершения асинхронного потока |
| **Подробное содержимое** | Полноценное уведомление с заголовком, описанием и действиями |

## Тип

```ts
notification: NotificationInstance;
```

`NotificationInstance` — API уведомлений Ant Design.

## Основные методы

| Метод | Описание |
|-------|----------|
| `open(config)` | Открыть с пользовательской конфигурацией |
| `success(config)` | Успешное уведомление |
| `info(config)` | Информационное уведомление |
| `warning(config)` | Предупреждение |
| `error(config)` | Уведомление об ошибке |
| `destroy(key?)` | Закрыть уведомление по ключу key; без ключа — закрыть все |

**Конфигурация** (как в [Ant Design notification](https://ant.design/components/notification)):

| Параметр | Тип | Описание |
|----------|-----|----------|
| `message` | `ReactNode` | Заголовок |
| `description` | `ReactNode` | Описание |
| `duration` | `number` | Время автозакрытия в секундах; по умолчанию 4.5; `0` = без автозакрытия |
| `key` | `string` | Уникальный идентификатор для `destroy(key)` |
| `onClose` | `() => void` | Обработчик закрытия |
| `placement` | `string` | `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Примеры

### Базовое уведомление

```ts
ctx.notification.open({
  message: 'Success',
  description: 'Data saved.',
});
```

### По типам

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Check console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Пользовательская длительность и ключ

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,
});

// Ручное закрытие после завершения задачи
ctx.notification.destroy('task-123');
```

### Закрыть все

```ts
ctx.notification.destroy();
```

## Сравнение ctx.message и ctx.notification

| | ctx.message | ctx.notification |
|---|-------------|-------------------|
| **Расположение** | Верх по центру | Верх справа (настраивается) |
| **Структура** | Одна строка | Заголовок и описание |
| **Назначение** | Короткие сообщения с автозакрытием | Дольше отображаются |
| **Типичное применение** | Успех, валидация, копирование | Завершение задачи, системное уведомление |

## Связанные материалы

- [ctx.message](./message.md): короткие сообщения в верхней центральной зоне
- [ctx.modal](./modal.md): модальные подтверждения
- [ctx.t()](./t.md): локализация; часто используется вместе с `notification`