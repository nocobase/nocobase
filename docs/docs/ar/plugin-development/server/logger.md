:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# مسجل الأحداث (Logger)

تعتمد NocoBase في تسجيل الأحداث على مكتبة <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. بشكل افتراضي، تقسم NocoBase سجلات الأحداث إلى سجلات طلبات واجهة برمجة التطبيقات (API)، وسجلات تشغيل النظام، وسجلات تنفيذ SQL. تُطبع سجلات طلبات واجهة برمجة التطبيقات وسجلات تنفيذ SQL داخليًا بواسطة التطبيق. عادةً ما يحتاج مطورو الإضافات (Plugins) فقط إلى طباعة سجلات تشغيل النظام المتعلقة بالإضافة (Plugin) الخاصة بهم.

يوضح هذا المستند كيفية إنشاء وطباعة سجلات الأحداث أثناء تطوير الإضافات (Plugins).

## طرق الطباعة الافتراضية

توفر NocoBase طرقًا لطباعة سجلات تشغيل النظام. تُطبع سجلات الأحداث وفقًا لحقول محددة وتُخرج إلى ملفات معينة.

```ts
// طريقة الطباعة الافتراضية
app.log.info("message");

// للاستخدام في البرمجيات الوسيطة (middleware)
async function (ctx, next) {
  ctx.log.info("message");
}

// للاستخدام في الإضافات (plugins)
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

تتبع جميع الطرق المذكورة أعلاه الاستخدام التالي:

المعامل الأول هو رسالة سجل الأحداث، والمعامل الثاني هو كائن بيانات وصفية (metadata) اختياري، يمكن أن يكون أي أزواج من المفاتيح والقيم. حيث سيتم استخراج `module` و`submodule` و`method` كحقول منفصلة، بينما توضع الحقول المتبقية في الحقل `meta`.

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

## الإخراج إلى ملفات أخرى

إذا كنت ترغب في استخدام طريقة الطباعة الافتراضية للنظام ولكن لا تريد الإخراج إلى الملف الافتراضي، يمكنك إنشاء مثيل مسجل أحداث نظام مخصص باستخدام `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // هل يتم إخراج سجلات مستوى الخطأ (error) بشكل منفصل إلى 'xxx_error.log'
});
```

## مسجل الأحداث المخصص

إذا كنت لا ترغب في استخدام طرق الطباعة التي يوفرها النظام، وتريد استخدام طرق Winston الأصلية، يمكنك إنشاء سجلات أحداث باستخدام الطرق التالية.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // خيارات
});
```

تم توسيع `options` بناءً على `winston.LoggerOptions` الأصلية.

- `transports` - يمكنك استخدام `'console' | 'file' | 'dailyRotateFile'` لتطبيق طرق الإخراج المحددة مسبقًا.
- `format` - يمكنك استخدام `'logfmt' | 'json' | 'delimiter'` لتطبيق تنسيقات الطباعة المحددة مسبقًا.

### `app.createLogger`

في سيناريوهات التطبيقات المتعددة، قد نرغب أحيانًا في تخصيص أدلة وملفات الإخراج، بحيث يمكن إخراجها إلى دليل يحمل اسم التطبيق الحالي.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // يتم الإخراج إلى /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

حالة الاستخدام والطريقة هي نفسها لـ `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // يتم الإخراج إلى /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```