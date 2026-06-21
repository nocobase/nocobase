# ctx.logger

Логирование на базе [pino](https://github.com/pinojs/pino); выводит структурированный JSON. Для сбора и анализа логов предпочтительно использовать `ctx.logger`, а не `console`.

## Сценарии использования

Доступен во всех контекстах RunJS для отладки, отслеживания ошибок и анализа производительности.

## Тип

```ts
logger: pino.Logger;
```

`ctx.logger` — это `engine.logger.child({ module: 'flow-engine' })`, то есть дочерний pino-логгер с контекстом `module`.

## Уровни логирования

От самого критичного к менее критичному:

| Уровень | Метод | Описание |
|---------|-------|----------|
| `fatal` | `ctx.logger.fatal()` | Критическая ошибка; обычно завершение процесса |
| `error` | `ctx.logger.error()` | Ошибка; сбой запроса или операции |
| `warn` | `ctx.logger.warn()` | Предупреждение; потенциальная проблема |
| `info` | `ctx.logger.info()` | Общая информация о выполнении |
| `debug` | `ctx.logger.debug()` | Отладочная информация; для разработки |
| `trace` | `ctx.logger.trace()` | Подробная диагностика |

## Рекомендуемый стиль

Используйте формат `level(msg, meta)`: сначала сообщение, затем (опционально) объект метаданных.

```ts
ctx.logger.info('Block loaded');
ctx.logger.info('Success', { recordId: 456 });
ctx.logger.warn('Slow', { duration: 5000 });
ctx.logger.error('Failed', { userId: 123, action: 'create' });
ctx.logger.error('Request failed', { err });
```

При необходимости pino также поддерживает `level(meta, msg)` и `level({ msg, ...meta })`.

## Примеры

### Базовое использование

```ts
ctx.logger.info('Блок загружен');
ctx.logger.warn('Запрос не выполнен, используется кэш', { err });
ctx.logger.debug('Сохранение', { recordId: ctx.record?.id });
```

### Дочерний логгер

```ts
// Создание дочернего логгера с контекстом для текущей логики
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Step 1');
log.debug('Step 2', { step: 2 });
```

### Сравнение с console

Для структурированного JSON-логирования используйте `ctx.logger`. Примерное соответствие: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Формат вывода

pino выводит JSON с полями:

- `level`: числовой уровень логирования
- `time`: временная метка (мс)
- `msg`: сообщение
- `module`: `flow-engine`
- любые пользовательские поля из переданного объекта

## Примечания

- JSON-формат удобен для централизованного сбора и запросов по логам.
- Дочерние логгеры из `child()` также хорошо работают с формой `level(msg, meta)`.
- В некоторых окружениях (например, рабочий процесс) обработка логов может отличаться.

## Связанные материалы

- [pino](https://github.com/pinojs/pino) — базовая библиотека логирования