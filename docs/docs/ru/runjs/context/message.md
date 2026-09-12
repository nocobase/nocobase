# ctx.message

Глобальный API сообщений Ant Design; показывает короткие сообщения в верхней центральной зоне. Сообщения автоматически закрываются через некоторое время или могут быть закрыты пользователем.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок / Поле JS / Элемент JS / JS-столбец таблицы** | Быстрая обратная связь: валидация, успешное копирование и т. д. |
| **Действия формы / поток событий** | Успешная отправка, ошибка сохранения, ошибка валидации |
| **Действие JS** | Обратная связь по клику и пакетным действиям |

## Тип

```ts
message: MessageInstance;
```

`MessageInstance` — API сообщений Ant Design.

## Основные методы

| Метод | Описание |
|-------|----------|
| `success(content, duration?)` | Сообщение об успехе |
| `error(content, duration?)` | Сообщение об ошибке |
| `warning(content, duration?)` | Предупреждение |
| `info(content, duration?)` | Информационное сообщение |
| `loading(content, duration?)` | Сообщение загрузки (обычно закрывается вручную) |
| `open(config)` | Открыть с пользовательской конфигурацией |
| `destroy()` | Закрыть все сообщения |

**Параметры:**

- `content`: `string` или `ConfigOptions`
- `duration`: необязательная длительность в секундах; по умолчанию 3; `0` = без автозакрытия

**ConfigOptions** (когда `content` — объект):

```ts
interface ConfigOptions {
  content: React.ReactNode;
  duration?: number;
  onClose?: () => void;
  icon?: React.ReactNode;
}
```

## Примеры

### Базовое использование

```ts
ctx.message.success('Done');
ctx.message.error('Failed');
ctx.message.warning('Please select data first');
ctx.message.info('Processing...');
```

### С использованием ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Загрузка и ручное закрытие

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Выполнение асинхронной операции
await saveData();
hide();
ctx.message.success(ctx.t('Saved'));
```

### Открытие с конфигурацией

```ts
ctx.message.open({
  type: 'success',
  content: 'Custom success',
  duration: 5,
  onClose: () => console.log('closed'),
});
```

### Закрыть все

```ts
ctx.message.destroy();
```

## Сравнение ctx.message и ctx.notification

| | ctx.message | ctx.notification |
|---|-------------|-------------------|
| **Расположение** | Верх по центру | Верх справа |
| **Назначение** | Короткие сообщения с автозакрытием | Панель с заголовком и описанием; может отображаться дольше |
| **Типичное применение** | Обратная связь по действиям, валидация, копирование | Завершение задач, системные уведомления, более длинный контент |

## Связанные материалы

- [ctx.notification](./notification.md): уведомления в правом верхнем углу
- [ctx.modal](./modal.md): модальные подтверждения
- [ctx.t()](./t.md): локализация; часто используется вместе с `message`