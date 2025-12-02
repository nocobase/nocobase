:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# الأوامر

في NocoBase، تُستخدم الأوامر لتنفيذ عمليات متعلقة بالتطبيقات أو الإضافات من خلال سطر الأوامر، مثل تشغيل مهام النظام، أو تنفيذ عمليات الترحيل (migration) أو المزامنة (sync)، أو تهيئة الإعدادات، أو التفاعل مع نُسخ التطبيق قيد التشغيل. يمكن للمطورين تعريف أوامر مخصصة للإضافات وتسجيلها عبر كائن `app`، وتنفيذها في واجهة سطر الأوامر (CLI) بصيغة `nocobase <command>`.

## أنواع الأوامر

في NocoBase، ينقسم تسجيل الأوامر إلى نوعين:

| النوع | طريقة التسجيل | هل يلزم تفعيل الإضافة؟ | السيناريوهات الشائعة |
|------|------------|------------------|-----------|
| أمر ديناميكي | `app.command()` | ✅ نعم | أوامر متعلقة بعمل الإضافة |
| أمر ثابت | `Application.registerStaticCommand()` | ❌ لا | أوامر التثبيت، التهيئة، والصيانة |

## الأوامر الديناميكية

استخدم `app.command()` لتعريف أوامر الإضافات. لا يمكن تنفيذ الأوامر إلا بعد تفعيل الإضافة. يجب وضع ملفات الأوامر في المسار `src/server/commands/*.ts` ضمن دليل الإضافة.

مثال

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

شرح

- `app.command('echo')`: يُعرّف أمراً باسم `echo`.
- `.option('-v, --version')`: يُضيف خياراً للأمر.
- `.action()`: يُعرّف منطق تنفيذ الأمر.
- `app.version.get()`: يجلب إصدار التطبيق الحالي.

تنفيذ الأمر

```bash
nocobase echo
nocobase echo -v
```

## الأوامر الثابتة

استخدم `Application.registerStaticCommand()` للتسجيل. يمكن تنفيذ الأوامر الثابتة دون الحاجة إلى تفعيل الإضافات، وهي مناسبة لمهام التثبيت أو التهيئة أو الترحيل (migration) أو التصحيح (debugging). يتم التسجيل في الدالة `staticImport()` الخاصة بفئة الإضافة.

مثال

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

تنفيذ الأمر

```bash
nocobase echo
nocobase echo --version
```

شرح

- `Application.registerStaticCommand()` يسجل الأوامر قبل إنشاء نسخة من التطبيق.
- تُستخدم الأوامر الثابتة عادةً لتنفيذ مهام عامة لا تتعلق بحالة التطبيق أو الإضافة.

## واجهة برمجة تطبيقات الأوامر (Command API)

توفر كائنات الأوامر ثلاث طرق مساعدة اختيارية للتحكم في سياق تنفيذ الأمر:

| الدالة | الغرض | مثال |
|------|------|------|
| `ipc()` | التواصل مع نُسخ التطبيق قيد التشغيل (عبر IPC) | `app.command('reload').ipc().action()` |
| `auth()` | التحقق من صحة إعدادات قاعدة البيانات | `app.command('seed').auth().action()` |
| `preload()` | تحميل إعدادات التطبيق مسبقاً (تنفيذ `app.load()`) | `app.command('sync').preload().action()` |

شرح الإعدادات

- **`ipc()`**  
  بشكل افتراضي، تُنفذ الأوامر في نسخة تطبيق جديدة.  
  بعد تفعيل `ipc()`، تتفاعل الأوامر مع نسخة التطبيق قيد التشغيل حالياً عبر الاتصال بين العمليات (IPC)، وهي مناسبة لأوامر التشغيل في الوقت الفعلي (مثل تحديث ذاكرة التخزين المؤقت، إرسال الإشعارات).

- **`auth()`**  
  تتحقق مما إذا كانت إعدادات قاعدة البيانات متاحة قبل تنفيذ الأمر.  
  إذا كانت إعدادات قاعدة البيانات غير صحيحة أو فشل الاتصال، فلن يستمر الأمر في التنفيذ. تُستخدم عادةً للمهام التي تتضمن عمليات الكتابة أو القراءة من قاعدة البيانات.

- **`preload()`**  
  تحميل إعدادات التطبيق مسبقاً قبل تنفيذ الأمر، وهو ما يعادل تنفيذ `app.load()`.  
  مناسبة للأوامر التي تعتمد على الإعدادات أو سياق الإضافة.

لمزيد من دوال واجهة برمجة التطبيقات، راجع [AppCommand](/api/server/app-command).

## أمثلة شائعة

تهيئة البيانات الافتراضية

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

إعادة تحميل ذاكرة التخزين المؤقت لنسخة قيد التشغيل (وضع IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

التسجيل الثابت لأمر التثبيت

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```