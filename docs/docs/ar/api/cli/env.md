:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# متغيرات البيئة العامة

## TZ

يُستخدم لتعيين المنطقة الزمنية للتطبيق، والقيمة الافتراضية هي المنطقة الزمنية لنظام التشغيل.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
ستتم معالجة العمليات المتعلقة بالوقت بناءً على هذه المنطقة الزمنية. قد يؤثر تعديل `TZ` على قيم التاريخ في قاعدة البيانات. لمزيد من التفاصيل، راجع "[نظرة عامة على التاريخ والوقت](#)"
:::

## APP_ENV

بيئة التطبيق، القيمة الافتراضية هي `development`. تتضمن الخيارات المتاحة:

- `production` بيئة الإنتاج
- `development` بيئة التطوير

```bash
APP_ENV=production
```

## APP_KEY

مفتاح سر التطبيق، يُستخدم لتوليد رموز المستخدم (tokens) وغيرها. قم بتغييره إلى مفتاح التطبيق الخاص بك وتأكد من عدم تسريبه.

:::warning
إذا تم تغيير `APP_KEY`، فستصبح الرموز القديمة (tokens) غير صالحة.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

منفذ التطبيق، القيمة الافتراضية هي `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

بادئة عنوان API الخاص بـ NocoBase، القيمة الافتراضية هي `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

وضع بدء التشغيل متعدد النوى (العنقودي). إذا تم تكوين هذا المتغير، فسيتم تمريره إلى أمر `pm2 start` كمعامل `-i <instances>`. تتوافق الخيارات مع معامل `pm2 -i` (راجع [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/))، وتشمل:

- `max`: استخدام أقصى عدد من نوى وحدة المعالجة المركزية (CPU)
- `-1`: استخدام أقصى عدد من نوى وحدة المعالجة المركزية (CPU) مطروحًا منه 1
- `<number>`: تحديد عدد معين من النوى

القيمة الافتراضية فارغة، مما يعني أنه غير مُفعّل.

:::warning{title="ملاحظة"}
يجب استخدام هذا الوضع مع الإضافات (plugins) المتعلقة بوضع العنقود، وإلا فقد تظهر وظائف التطبيق بشكل غير طبيعي.
:::

لمزيد من المعلومات، راجع: [وضع العنقود](#).

## PLUGIN_PACKAGE_PREFIX

بادئة اسم حزمة الإضافة، القيمة الافتراضية هي: `@nocobase/plugin-,@nocobase/preset-`.

على سبيل المثال، لإضافة إضافة `hello` إلى مشروع `my-nocobase-app`، سيكون اسم الحزمة الكامل للإضافة هو `@my-nocobase-app/plugin-hello`.

يمكن تكوين `PLUGIN_PACKAGE_PREFIX` على النحو التالي:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

عندئذٍ، تكون العلاقة بين أسماء الإضافات وأسماء الحزم كما يلي:

- اسم حزمة إضافة `users` هو `@nocobase/plugin-users`
- اسم حزمة إضافة `nocobase` هو `@nocobase/preset-nocobase`
- اسم حزمة إضافة `hello` هو `@my-nocobase-app/plugin-hello`

## DB_DIALECT

نوع قاعدة البيانات، تتضمن الخيارات المتاحة:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

مضيف قاعدة البيانات (يتطلب التكوين عند استخدام قاعدة بيانات MySQL أو PostgreSQL).

القيمة الافتراضية هي `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

منفذ قاعدة البيانات (يتطلب التكوين عند استخدام قاعدة بيانات MySQL أو PostgreSQL).

- منفذ MySQL و MariaDB الافتراضي هو 3306
- منفذ PostgreSQL الافتراضي هو 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

اسم قاعدة البيانات (يتطلب التكوين عند استخدام قاعدة بيانات MySQL أو PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

مستخدم قاعدة البيانات (يتطلب التكوين عند استخدام قاعدة بيانات MySQL أو PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

كلمة مرور قاعدة البيانات (يتطلب التكوين عند استخدام قاعدة بيانات MySQL أو PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

بادئة جداول البيانات.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

ما إذا كان سيتم تحويل أسماء جداول وقواعد البيانات إلى نمط `snake_case`، القيمة الافتراضية هي `false`. إذا كنت تستخدم قاعدة بيانات MySQL (MariaDB) وكانت `lower_case_table_names=1`، فيجب أن تكون `DB_UNDERSCORED` بقيمة `true`.

:::warning
عندما تكون `DB_UNDERSCORED=true`، فإن أسماء الجداول والحقول الفعلية في قاعدة البيانات لن تتطابق مع ما يظهر في الواجهة. على سبيل المثال، `orderDetails` في قاعدة البيانات ستكون `order_details`.
:::

## DB_LOGGING

مفتاح تشغيل/إيقاف تسجيل قاعدة البيانات، القيمة الافتراضية هي `off`. تتضمن الخيارات المتاحة:

- `on` تفعيل
- `off` تعطيل

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

طريقة إخراج السجل (log)، تُفصل القيم المتعددة بفاصلة `,`. القيمة الافتراضية في بيئة التطوير هي `console`، وفي بيئة الإنتاج هي `console,dailyRotateFile`. الخيارات المتاحة:

- `console` - `console.log`
- `file` - `ملف`
- `dailyRotateFile` - `ملف متجدد يومياً`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

مسار تخزين السجلات المستندة إلى الملفات، القيمة الافتراضية هي `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

مستوى إخراج السجل. القيمة الافتراضية في بيئة التطوير هي `debug`، وفي بيئة الإنتاج هي `info`. الخيارات المتاحة:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

مستوى إخراج سجل قاعدة البيانات هو `debug`، ويتم التحكم في إخراجه بواسطة `DB_LOGGING`، ولا يتأثر بـ `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

الحد الأقصى لعدد ملفات السجل التي يتم الاحتفاظ بها.

- عندما يكون `LOGGER_TRANSPORT` هو `file`، تكون القيمة الافتراضية `10`.
- عندما يكون `LOGGER_TRANSPORT` هو `dailyRotateFile`، استخدم `[n]d` لتمثيل عدد الأيام. القيمة الافتراضية هي `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

تدوير السجلات حسب الحجم.

- عندما يكون `LOGGER_TRANSPORT` هو `file`، تكون الوحدة `byte`، والقيمة الافتراضية هي `20971520 (20 * 1024 * 1024)`.
- عندما يكون `LOGGER_TRANSPORT` هو `dailyRotateFile`، يمكنك استخدام `[n]k`, `[n]m`, `[n]g`. لا يتم تكوينه افتراضيًا.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

تنسيق طباعة السجل. الافتراضي في بيئة التطوير هو `console`، وفي بيئة الإنتاج هو `json`. الخيارات المتاحة:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

راجع: [تنسيق السجل](#)

## CACHE_DEFAULT_STORE

المعرف الفريد لطريقة التخزين المؤقت (cache) المستخدمة، يحدد طريقة التخزين المؤقت الافتراضية من جانب الخادم. القيمة الافتراضية هي `memory`. الخيارات المضمنة:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

الحد الأقصى لعدد العناصر في ذاكرة التخزين المؤقت (memory cache)، القيمة الافتراضية هي `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

اتصال Redis، اختياري. مثال: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

تفعيل جمع بيانات القياس عن بعد (telemetry)، القيمة الافتراضية هي `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

قارئات مقاييس المراقبة المُمكّنة، القيمة الافتراضية هي `console`. يجب أن تشير القيم الأخرى إلى الأسماء المسجلة لإضافات القارئ المقابلة، مثل `prometheus`. تُفصل القيم المتعددة بفاصلة `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

معالجات بيانات التتبع (trace) المُمكّنة، القيمة الافتراضية هي `console`. يجب أن تشير القيم الأخرى إلى الأسماء المسجلة لإضافات المعالج المقابلة. تُفصل القيم المتعددة بفاصلة `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```