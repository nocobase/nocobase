:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Логер

Система логування NocoBase побудована на базі <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. За замовчуванням, NocoBase розділяє логи на логи запитів API, логи виконання системи та логи виконання SQL. Логи запитів API та логи виконання SQL генеруються всередині застосунку. Розробникам плагінів зазвичай потрібно логувати лише системні події, пов'язані з їхніми плагінами.

Цей документ пояснює, як створювати та друкувати логи під час розробки плагінів.

## Стандартні методи логування

NocoBase надає методи для логування системних подій. Логи формуються відповідно до визначених полів і виводяться у вказані файли.

```ts
// Стандартний метод логування
app.log.info("message");

// Використання в проміжному ПЗ (middleware)
async function (ctx, next) {
  ctx.log.info("message");
}

// Використання в плагінах
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Усі вищезгадані методи використовують наступний синтаксис:

Перший параметр — це повідомлення логу, а другий — необов'язковий об'єкт метаданих, який може містити будь-які пари ключ-значення. При цьому `module`, `submodule` та `method` будуть виділені як окремі поля, а решта полів поміщені в поле `meta`.

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

## Виведення в інші файли

Якщо ви бажаєте використовувати стандартний метод логування системи, але не хочете виводити логи у файл за замовчуванням, ви можете створити власний екземпляр системного логера за допомогою `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Чи виводити логи рівня error окремо у файл 'xxx_error.log'
});
```

## Власний логер

Якщо ви не бажаєте використовувати системні методи логування, а хочете застосувати нативні методи Winston, ви можете створити логи наступними способами.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` розширює оригінальний `winston.LoggerOptions`.

- `transports` — використовуйте `'console' | 'file' | 'dailyRotateFile'` для застосування попередньо налаштованих методів виведення.
- `format` — використовуйте `'logfmt' | 'json' | 'delimiter'` для застосування попередньо налаштованих форматів логування.

### `app.createLogger`

У сценаріях з кількома застосунками іноді виникає потреба у власних каталогах та файлах для виведення логів, які можуть бути розміщені в каталозі з назвою поточного застосунку.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Виводиться у /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Сценарій використання та метод ідентичні `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Виводиться у /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```