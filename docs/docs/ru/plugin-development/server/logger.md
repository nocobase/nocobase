:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Логгер

Журналирование в NocoBase основано на <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. По умолчанию NocoBase разделяет логи на журналы запросов API, журналы работы системы и журналы выполнения SQL-запросов. Журналы запросов API и выполнения SQL-запросов генерируются внутри приложения. Разработчикам плагинов обычно требуется выводить только системные журналы, относящиеся к их плагинам.

В этом документе мы расскажем, как создавать и выводить логи при разработке плагинов.

## Методы вывода логов по умолчанию

NocoBase предоставляет методы для вывода системных журналов. Логи выводятся в соответствии с заданными полями и сохраняются в указанные файлы.

```ts
// Метод вывода по умолчанию
app.log.info("message");

// Использование в промежуточном ПО (middleware)
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

Все перечисленные выше методы используются следующим образом:

Первый параметр — это сообщение лога, а второй — необязательный объект метаданных. Он может содержать любые пары ключ-значение. При этом `module`, `submodule` и `method` будут извлечены как отдельные поля, а остальные поля будут помещены в поле `meta`.

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

Если вы хотите использовать системный метод вывода логов по умолчанию, но при этом сохранять их не в стандартный файл, вы можете создать собственный экземпляр системного логгера с помощью `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Выводить ли логи уровня error отдельно в файл 'xxx_error.log'
});
```

## Пользовательский логгер

Если вы предпочитаете использовать нативные методы Winston вместо системных, вы можете создавать логи следующими способами.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

Объект `options` расширяет оригинальный `winston.LoggerOptions`.

- `transports` — Используйте `'console' | 'file' | 'dailyRotateFile'`, чтобы применить предустановленные методы вывода.
- `format` — Используйте `'logfmt' | 'json' | 'delimiter'`, чтобы применить предустановленные форматы вывода.

### `app.createLogger`

В сценариях с несколькими приложениями иногда требуется настроить собственные каталоги и файлы для вывода логов, например, чтобы они сохранялись в каталог с именем текущего приложения.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Вывод в /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Сценарий использования и метод аналогичны `app.createLogger`.

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