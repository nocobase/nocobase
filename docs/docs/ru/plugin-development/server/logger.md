# Логирование

Логирование в NocoBase основано на <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. По умолчанию NocoBase разделяет журналы на журналы API-запросов, системные журналы времени выполнения и журналы выполнения SQL. Журналы API-запросов и выполнения SQL выводятся внутри приложения. Разработчикам плагинов обычно требуется выводить только системные журналы, связанные с плагинами.

В этом документе объясняется, как создавать и выводить журналы во время разработки плагинов.

## Методы вывода по умолчанию

NocoBase предоставляет методы вывода системных журналов времени выполнения. Журналы формируются по указанным полям и выводятся в заданные файлы.

```ts
// Метод вывода по умолчанию
app.log.info("message");

// Использование в Middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Использование в плагинах
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Все перечисленные выше методы используют следующий формат:

Первый параметр — это сообщение лога, а второй параметр — необязательный объект метаданных, который может представлять собой любую пару «ключ-значение». где `module`, `submodule` и `method` будут извлечены как отдельные поля, а остальные поля будут помещены в поле `meta`.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Вывод в другие файлы

Если вы хотите использовать системный метод вывода по умолчанию, но не хотите писать в файл по умолчанию, создайте собственный экземпляр системного логгера через `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Выводить ли логи уровня error отдельно в 'xxx_error.log'
});
```

## Пользовательский логгер

Если вы хотите использовать методы Winston напрямую вместо системных, можно создавать логгеры следующими способами.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // параметры
});
```

`Параметры` расширяют базовый `winston.LoggerOptions`.

- `transports` — используйте `'console' | 'file' | 'dailyRotateFile'`, чтобы применить предустановленные способы вывода.
- `format` — используйте `'logfmt' | 'json' | 'delimiter'`, чтобы применить предустановленные форматы вывода.

### `app.createLogger`

В сценариях с несколькими приложениями иногда нужны отдельные каталоги и файлы вывода. Их можно направить в каталог, названный по имени текущего приложения.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Вывод в /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Сценарий использования и способ настройки такие же, как у `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Вывод в /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```