:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# Migration

أثناء تطوير وتحديث إضافات NocoBase، قد تحدث تغييرات غير متوافقة في بنية قاعدة بيانات الإضافة أو إعداداتها. لضمان تنفيذ ترقيات سلسة، توفر NocoBase آلية **Migration**، والتي تتعامل مع هذه التغييرات عن طريق كتابة ملفات Migration. سيرشدك هذا الدليل إلى فهم منهجي لكيفية استخدام Migration وسير عمل التطوير.

## مفهوم Migration

Migration هو نص برمجي يتم تنفيذه تلقائيًا أثناء ترقية الإضافات، ويُستخدم لحل المشكلات التالية:

-   تعديلات بنية جداول البيانات (مثل إضافة حقول جديدة، تعديل أنواع الحقول، إلخ.)
-   ترحيل البيانات (مثل التحديثات المجمعة لقيم الحقول)
-   تحديثات إعدادات الإضافة أو منطقها الداخلي

ينقسم توقيت تنفيذ Migration إلى ثلاثة أنواع:

| النوع         | توقيت التشغيل                                                                 | سيناريو التنفيذ |
| :----------- | :--------------------------------------------------------------------------- | :------------- |
| `beforeLoad` | قبل تحميل جميع إعدادات الإضافات                                              |                |
| `afterSync`  | بعد مزامنة إعدادات المجموعة مع قاعدة البيانات (بعد أن تكون بنية المجموعة قد تغيرت بالفعل) |                |
| `afterLoad`  | بعد تحميل جميع إعدادات الإضافات                                              |                |

## إنشاء ملفات Migration

يجب وضع ملفات Migration في المسار `src/server/migrations/*.ts` ضمن دليل الإضافة. توفر NocoBase الأمر `create-migration` لإنشاء ملفات Migration بسرعة.

```bash
yarn nocobase create-migration [options] <name>
```

المعلمات الاختيارية

| المعلمة        | الوصف                                                                |
| :------------- | :------------------------------------------------------------------- |
| `--pkg <pkg>`  | تحديد اسم حزمة الإضافة                                              |
| `--on [on]`    | تحديد توقيت التنفيذ، الخيارات المتاحة: `beforeLoad`، `afterSync`، `afterLoad` |

مثال

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

مسار ملف Migration الذي تم إنشاؤه هو كما يلي:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

المحتوى الأولي للملف:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // اكتب منطق الترقية هنا
  }
}
```

> ⚠️ يُستخدم `appVersion` لتحديد الإصدار المستهدف للترقية. سيتم تنفيذ هذا الـ Migration في البيئات التي يكون إصدارها أقل من الإصدار المحدد.

## كتابة Migration

في ملفات Migration، يمكنك الوصول إلى الخصائص وواجهات برمجة التطبيقات الشائعة التالية عبر `this` لتسهيل التعامل مع قاعدة البيانات والإضافات ومثيلات التطبيق:

الخصائص الشائعة

-   **`this.app`**
    مثيل تطبيق NocoBase الحالي. يمكن استخدامه للوصول إلى الخدمات العامة أو الإضافات أو الإعدادات.
    ```ts
    const config = this.app.config.get('database');
    ```

-   **`this.db`**
    مثيل خدمة قاعدة البيانات، يوفر واجهات للتعامل مع النماذج (المجموعات).
    ```ts
    const users = await this.db.getRepository('users').findAll();
    ```

-   **`this.plugin`**
    مثيل الإضافة الحالي، يمكن استخدامه للوصول إلى الطرق المخصصة للإضافة.
    ```ts
    const settings = this.plugin.customMethod();
    ```

-   **`this.sequelize`**
    مثيل Sequelize، يمكنه تنفيذ استعلامات SQL الأصلية أو عمليات المعاملات مباشرة.
    ```ts
    await this.sequelize.transaction(async (transaction) => {
      await this.sequelize.query('UPDATE users SET active = 1', { transaction });
    });
    ```

-   **`this.queryInterface`**
    واجهة QueryInterface الخاصة بـ Sequelize، تُستخدم عادةً لتعديل هياكل الجداول، مثل إضافة حقول جديدة أو حذف جداول.
    ```ts
    await this.queryInterface.addColumn('users', 'age', {
      type: this.sequelize.Sequelize.INTEGER,
      allowNull: true,
    });
    ```

مثال على كتابة Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // استخدام queryInterface لإضافة حقل
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // استخدام db للوصول إلى نماذج البيانات
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // تنفيذ طريقة مخصصة للإضافة
    await this.plugin.customMethod();
  }
}
```

بالإضافة إلى الخصائص الشائعة المذكورة أعلاه، يوفر Migration أيضًا واجهات برمجة تطبيقات غنية. للحصول على وثائق مفصلة، يرجى الرجوع إلى [Migration API](/api/server/migration).

## تشغيل Migration

يتم تشغيل تنفيذ Migration بواسطة الأمر `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

أثناء الترقية، يحدد النظام ترتيب التنفيذ بناءً على نوع Migration و`appVersion`.

## اختبار Migration

في تطوير الإضافات، يُنصح باستخدام **Mock Server** لاختبار ما إذا كان Migration يعمل بشكل صحيح، لتجنب إتلاف البيانات الحقيقية.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // اسم الإضافة
      version: '0.18.0-alpha.5', // الإصدار قبل الترقية
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // اكتب منطق التحقق، مثل التحقق مما إذا كان الحقل موجودًا، وما إذا كان ترحيل البيانات قد نجح.
  });
});
```

> نصيحة: يمكن استخدام Mock Server لمحاكاة سيناريوهات الترقية بسرعة، والتحقق من ترتيب تنفيذ Migration وتغييرات البيانات.

## توصيات ممارسات التطوير

1.  **تقسيم Migration**
    حاول إنشاء ملف Migration واحد لكل ترقية، للحفاظ على الذرية وتبسيط استكشاف الأخطاء وإصلاحها.
2.  **تحديد توقيت التنفيذ**
    اختر `beforeLoad` أو `afterSync` أو `afterLoad` بناءً على الكائنات التي يتم التعامل معها، لتجنب الاعتماد على الوحدات غير المحملة.
3.  **الانتباه إلى التحكم في الإصدارات**
    استخدم `appVersion` لتحديد الإصدار الذي ينطبق عليه Migration بوضوح، لمنع التنفيذ المتكرر.
4.  **تغطية الاختبار**
    بعد التحقق من Migration على Mock Server، قم بتنفيذ الترقية في بيئة حقيقية.