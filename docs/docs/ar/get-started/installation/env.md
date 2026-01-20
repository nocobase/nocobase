:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# المتغيرات البيئية

## كيفية إعداد المتغيرات البيئية؟

### طريقة التثبيت باستخدام كود مصدر Git أو `create-nocobase-app`

قم بإعداد المتغيرات البيئية في ملف `.env` الموجود في الدليل الجذر للمشروع. بعد تعديل المتغيرات البيئية، ستحتاج إلى إنهاء عملية التطبيق وإعادة تشغيله.

### طريقة التثبيت باستخدام Docker

عدّل إعدادات `docker-compose.yml` وقم بتعيين المتغيرات البيئية في المعامل `environment`. مثال:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

يمكنك أيضًا استخدام `env_file` لإعداد المتغيرات البيئية في ملف `.env`. مثال:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

بعد تعديل المتغيرات البيئية، ستحتاج إلى إعادة بناء حاوية التطبيق:

```yml
docker compose up -d app
```

## المتغيرات البيئية العامة

### TZ

يُستخدم لتعيين المنطقة الزمنية للتطبيق، والقيمة الافتراضية هي المنطقة الزمنية لنظام التشغيل.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
سيتم التعامل مع العمليات المتعلقة بالوقت وفقًا لهذه المنطقة الزمنية. قد يؤثر تغيير `TZ` على قيم التاريخ في قاعدة البيانات. لمزيد من التفاصيل، يرجى مراجعة "[نظرة عامة على التاريخ والوقت](/data-sources/data-modeling/collection-fields/datetime)".
:::

### APP_ENV

بيئة التطبيق، القيمة الافتراضية هي `development`، وتشمل الخيارات:

- `production` بيئة الإنتاج
- `development` بيئة التطوير

```bash
APP_ENV=production
```

### APP_KEY

مفتاح سر التطبيق، يُستخدم لتوليد رموز المستخدم (tokens) وغيرها. قم بتغييره إلى مفتاح التطبيق الخاص بك وتأكد من عدم تسريبه.

:::warning
إذا تم تغيير `APP_KEY`، فستصبح الرموز القديمة (tokens) غير صالحة.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

منفذ التطبيق، القيمة الافتراضية هي `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

بادئة عنوان واجهة برمجة تطبيقات NocoBase (API)، القيمة الافتراضية هي `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

وضع التشغيل متعدد النوى (الكتلة). إذا تم تكوين هذا المتغير، فسيتم تمريره إلى أمر `pm2 start` كمعامل `-i <instances>`. تتوافق الخيارات مع معامل `pm2 -i` (راجع [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/))، وتشمل:

- `max`: استخدام أقصى عدد من أنوية وحدة المعالجة المركزية (CPU)
- `-1`: استخدام أقصى عدد من أنوية وحدة المعالجة المركزية (CPU) ناقص واحد
- `<number>`: تحديد عدد الأنوية

القيمة الافتراضية فارغة، مما يعني أنه غير مُفعّل.

:::warning{title="تنبيه"}
يتطلب هذا الوضع استخدام الإضافات (plugins) المتعلقة بوضع الكتلة. وإلا، قد تواجه وظائف التطبيق مشكلات غير متوقعة.
:::

لمزيد من المعلومات، راجع [وضع الكتلة](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

بادئة اسم حزمة الإضافة (Plugin)، القيمة الافتراضية هي: `@nocobase/plugin-,@nocobase/preset-`.

على سبيل المثال، لإضافة إضافة `hello` إلى مشروع `my-nocobase-app`، سيكون اسم الحزمة الكامل للإضافة هو `@my-nocobase-app/plugin-hello`.

يمكن تكوين `PLUGIN_PACKAGE_PREFIX` على النحو التالي:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

تكون العلاقة بين اسم الإضافة واسم الحزمة كما يلي:

- اسم حزمة إضافة `users` هو `@nocobase/plugin-users`
- اسم حزمة إضافة `nocobase` هو `@nocobase/preset-nocobase`
- اسم حزمة إضافة `hello` هو `@my-nocobase-app/plugin-hello`

### DB_DIALECT

نوع قاعدة البيانات، وتشمل الخيارات:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

مضيف قاعدة البيانات (يتطلب التكوين عند استخدام قواعد بيانات MySQL أو PostgreSQL).

القيمة الافتراضية هي `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

منفذ قاعدة البيانات (يتطلب التكوين عند استخدام قواعد بيانات MySQL أو PostgreSQL).

- المنفذ الافتراضي لـ MySQL و MariaDB هو 3306
- المنفذ الافتراضي لـ PostgreSQL هو 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

اسم قاعدة البيانات (يتطلب التكوين عند استخدام قواعد بيانات MySQL أو PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

مستخدم قاعدة البيانات (يتطلب التكوين عند استخدام قواعد بيانات MySQL أو PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

كلمة مرور قاعدة البيانات (يتطلب التكوين عند استخدام قواعد بيانات MySQL أو PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

بادئة جداول البيانات.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

ما إذا كان سيتم تحويل أسماء جداول وحقول قاعدة البيانات إلى نمط `snake_case`. القيمة الافتراضية هي `false`. إذا كنت تستخدم قاعدة بيانات MySQL (MariaDB) وكان `lower_case_table_names=1`، فيجب أن تكون قيمة `DB_UNDERSCORED` هي `true`.

:::warning
عندما تكون `DB_UNDERSCORED=true`، فإن أسماء الجداول والحقول الفعلية في قاعدة البيانات لن تتطابق مع ما يظهر في واجهة المستخدم. على سبيل المثال، سيتم تخزين `orderDetails` في قاعدة البيانات كـ `order_details`.
:::

### DB_LOGGING

مفتاح تشغيل سجل قاعدة البيانات، القيمة الافتراضية هي `off`، وتشمل الخيارات:

- `on` تشغيل
- `off` إيقاف

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

الحد الأقصى لعدد الاتصالات في مجمع اتصالات قاعدة البيانات، القيمة الافتراضية هي `5`.

### DB_POOL_MIN

الحد الأدنى لعدد الاتصالات في مجمع اتصالات قاعدة البيانات، القيمة الافتراضية هي `0`.

### DB_POOL_IDLE

أقصى وقت، بالمللي ثانية، يمكن أن يكون الاتصال خاملاً قبل إصداره. القيمة الافتراضية هي `10000` (10 ثوانٍ).

### DB_POOL_ACQUIRE

أقصى وقت، بالمللي ثانية، سيحاول المجمع الحصول على اتصال قبل إلقاء خطأ. القيمة الافتراضية هي `60000` (60 ثانية).

### DB_POOL_EVICT

الفاصل الزمني، بالمللي ثانية، الذي بعده سيزيل مجمع الاتصالات الاتصالات الخاملة. القيمة الافتراضية هي `1000` (ثانية واحدة).

### DB_POOL_MAX_USES

عدد المرات التي يمكن استخدام الاتصال فيها قبل التخلص منه واستبداله. القيمة الافتراضية هي `0` (غير محدود).

### LOGGER_TRANSPORT

طريقة إخراج السجل، تُفصل القيم المتعددة بفاصلة (`,`). القيمة الافتراضية في بيئة التطوير هي `console`، وفي بيئة الإنتاج هي `console,dailyRotateFile`. الخيارات المتاحة:

- `console` - `console.log`
- `file` - الإخراج إلى ملف
- `dailyRotateFile` - الإخراج إلى ملفات متناوبة يوميًا

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

مسار تخزين السجلات المستندة إلى الملفات، القيمة الافتراضية هي `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

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

### LOGGER_MAX_FILES

الحد الأقصى لعدد ملفات السجل المراد الاحتفاظ بها.

- عندما يكون `LOGGER_TRANSPORT` هو `file`: القيمة الافتراضية هي `10`.
- عندما يكون `LOGGER_TRANSPORT` هو `dailyRotateFile`: استخدم `[n]d` لتمثيل عدد الأيام. القيمة الافتراضية هي `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

تدوير السجل حسب الحجم.

- عندما يكون `LOGGER_TRANSPORT` هو `file`: الوحدة هي `byte`، والقيمة الافتراضية هي `20971520 (20 * 1024 * 1024)`.
- عندما يكون `LOGGER_TRANSPORT` هو `dailyRotateFile`: يمكن استخدام `[n]k`، `[n]m`، `[n]g`. لا يتم تكوينه افتراضيًا.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

تنسيق طباعة السجل. القيمة الافتراضية في بيئة التطوير هي `console`، وفي بيئة الإنتاج هي `json`. الخيارات المتاحة:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

المرجع: [تنسيق السجل](#)

### CACHE_DEFAULT_STORE

المعرف الفريد لطريقة التخزين المؤقت، يحدد طريقة التخزين المؤقت الافتراضية للخادم، القيمة الافتراضية هي `memory`، وتشمل الخيارات المدمجة:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

الحد الأقصى لعدد العناصر في ذاكرة التخزين المؤقت، القيمة الافتراضية هي `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

عنوان URL لاتصال Redis، اختياري. مثال: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

تمكين جمع بيانات القياس عن بعد (telemetry)، القيمة الافتراضية هي `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

جامعات مقاييس المراقبة المُمكّنة، القيمة الافتراضية هي `console`. يجب أن تشير القيم الأخرى إلى الأسماء المسجلة بواسطة إضافات الجامعات المقابلة، مثل `prometheus`. تُفصل القيم المتعددة بفاصلة (`,`).

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

معالجات بيانات التتبع المُمكّنة، القيمة الافتراضية هي `console`. يجب أن تشير القيم الأخرى إلى الأسماء المسجلة بواسطة إضافات المعالجات المقابلة. تُفصل القيم المتعددة بفاصلة (`,`).

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## المتغيرات البيئية التجريبية

### APPEND_PRESET_LOCAL_PLUGINS

تُستخدم لإلحاق الإضافات المحلية المسبقة غير النشطة. القيمة هي اسم حزمة الإضافة (معامل `name` في `package.json`)، وتُفصل الإضافات المتعددة بفاصلة إنجليزية.

:::info
1.  تأكد من تنزيل الإضافة محليًا ويمكن العثور عليها في دليل `node_modules`. لمزيد من التفاصيل، راجع [تنظيم الإضافات](/plugin-development/project-structure).
2.  بعد إضافة المتغير البيئي، ستظهر الإضافة في صفحة مدير الإضافات فقط بعد التثبيت الأولي (`nocobase install`) أو الترقية (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

تُستخدم لإلحاق الإضافات المدمجة التي يتم تثبيتها افتراضيًا. القيمة هي اسم حزمة الإضافة (معامل `name` في `package.json`)، وتُفصل الإضافات المتعددة بفاصلة إنجليزية.

:::info
1.  تأكد من تنزيل الإضافة محليًا ويمكن العثور عليها في دليل `node_modules`. لمزيد من التفاصيل، راجع [تنظيم الإضافات](/plugin-development/project-structure).
2.  بعد إضافة المتغير البيئي، سيتم تثبيت الإضافة أو ترقيتها تلقائيًا أثناء التثبيت الأولي (`nocobase install`) أو الترقية (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## المتغيرات البيئية المؤقتة

عند تثبيت NocoBase، يمكن المساعدة في عملية التثبيت عن طريق إعداد متغيرات بيئية مؤقتة، مثل:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# 等同于
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# 等同于
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

لغة التثبيت، القيمة الافتراضية هي `en-US`، وتشمل الخيارات:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

البريد الإلكتروني للمستخدم الجذر (Root).

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

كلمة مرور المستخدم الجذر (Root).

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

اسم الشهرة للمستخدم الجذر (Root).

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```