:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# استخدام مفاتيح API في NocoBase

يوضح هذا الدليل كيفية استخدام مفاتيح API في NocoBase لاسترداد البيانات من خلال مثال عملي لـ"قائمة المهام". اتبع التعليمات خطوة بخطوة أدناه لفهم سير العمل الكامل.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 فهم مفاتيح API

مفتاح API هو رمز أمان يستخدم للمصادقة على طلبات API من المستخدمين المصرح لهم. يعمل كوثيقة اعتماد تتحقق من هوية طالب الخدمة عند الوصول إلى نظام NocoBase عبر تطبيقات الويب أو تطبيقات الجوال أو السكربتات الخلفية.

في ترويسة طلب HTTP، يكون التنسيق كالتالي:

```txt
Authorization: Bearer {API key}
```

تشير البادئة "Bearer" إلى أن السلسلة النصية التي تليها هي مفتاح API مصادق عليه يُستخدم للتحقق من صلاحيات طالب الخدمة.

### حالات الاستخدام الشائعة

تُستخدم مفاتيح API عادةً في السيناريوهات التالية:

1.  **وصول تطبيقات العميل**: تستخدم متصفحات الويب وتطبيقات الجوال مفاتيح API للمصادقة على هوية المستخدم، مما يضمن أن المستخدمين المصرح لهم فقط يمكنهم الوصول إلى البيانات.
2.  **تنفيذ المهام المؤتمتة**: تستخدم العمليات الخلفية والمهام المجدولة مفاتيح API لتنفيذ التحديثات ومزامنة البيانات وعمليات تسجيل السجلات بأمان.
3.  **التطوير والاختبار**: يستخدم المطورون مفاتيح API أثناء التصحيح والاختبار لمحاكاة الطلبات المصادق عليها والتحقق من استجابات API.

توفر مفاتيح API مزايا أمنية متعددة: التحقق من الهوية، ومراقبة الاستخدام، وتحديد معدل الطلبات، ومنع التهديدات، مما يضمن التشغيل المستقر والآمن لـ NocoBase.

## 2 إنشاء مفاتيح API في NocoBase

### 2.1 تفعيل إضافة المصادقة: مفاتيح API

تأكد من تفعيل إضافة [المصادقة: مفاتيح API](/plugins/@nocobase/plugin-api-keys/) المدمجة. بمجرد تفعيلها، ستظهر صفحة إعدادات مفاتيح API جديدة في إعدادات النظام.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 إنشاء مجموعة اختبار

لأغراض العرض التوضيحي، أنشئ مجموعة باسم `todos` تحتوي على الحقول التالية:

-   `id`
-   `title`
-   `completed`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

أضف بعض السجلات النموذجية إلى المجموعة:

-   تناول الطعام
-   النوم
-   ممارسة الألعاب

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 إنشاء دور وتعيينه

ترتبط مفاتيح API بأدوار المستخدمين، ويحدد النظام صلاحيات الطلبات بناءً على الدور المعين. قبل إنشاء مفتاح API، يجب عليك إنشاء دور وتكوين الصلاحيات المناسبة. أنشئ دورًا باسم "دور API للمهام" وامنحه وصولاً كاملاً إلى مجموعة `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

إذا لم يكن "دور API للمهام" متاحًا عند إنشاء مفتاح API، فتأكد من تعيين هذا الدور للمستخدم الحالي:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

بعد تعيين الدور، قم بتحديث الصفحة وانتقل إلى صفحة إدارة مفاتيح API. انقر على "إضافة مفتاح API" للتحقق من ظهور "دور API للمهام" في قائمة اختيار الأدوار.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

لتحكم أفضل في الوصول، يمكنك التفكير في إنشاء حساب مستخدم مخصص (مثل "مستخدم API للمهام") خصيصًا لإدارة واختبار مفاتيح API. قم بتعيين "دور API للمهام" لهذا المستخدم.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 إنشاء وحفظ مفتاح API

بعد إرسال النموذج، سيعرض النظام رسالة تأكيد مع مفتاح API الذي تم إنشاؤه حديثًا. **ملاحظة هامة**: انسخ هذا المفتاح وخزنه بأمان فورًا، حيث لن يتم عرضه مرة أخرى لأسباب أمنية.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

مثال على مفتاح API:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 ملاحظات هامة

-   يتم تحديد فترة صلاحية مفتاح API بواسطة إعداد انتهاء الصلاحية الذي تم تكوينه أثناء الإنشاء.
-   يعتمد إنشاء مفتاح API والتحقق منه على متغير البيئة `APP_KEY`. **لا تقم بتعديل هذا المتغير**، فسيؤدي ذلك إلى إبطال جميع مفاتيح API الموجودة في النظام.

## 3 اختبار مصادقة مفتاح API

### 3.1 استخدام إضافة توثيق API

افتح إضافة [توثيق API](/plugins/@nocobase/plugin-api-doc/) لعرض طرق الطلب وعناوين URL والمعاملات وترويسات الطلب لكل نقطة نهاية API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 فهم عمليات CRUD الأساسية

يوفر NocoBase واجهات API قياسية لعمليات CRUD (الإنشاء، القراءة، التحديث، الحذف) لمعالجة البيانات:

-   **استعلام القائمة (واجهة list API):**

    ```txt
    GET {baseURL}/{collectionName}:list
    ترويسة الطلب:
    - Authorization: Bearer <API key>

    ```
-   **إنشاء سجل (واجهة create API):**

    ```txt
    POST {baseURL}/{collectionName}:create

    ترويسة الطلب:
    - Authorization: Bearer <API key>

    نص الطلب (بصيغة JSON)، على سبيل المثال:
        {
            "title": "123"
        }
    ```
-   **تحديث سجل (واجهة update API):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    ترويسة الطلب:
    - Authorization: Bearer <API key>

    نص الطلب (بصيغة JSON)، على سبيل المثال:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **حذف سجل (واجهة delete API):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    ترويسة الطلب:
    - Authorization: Bearer <API key>
    ```

حيث:
-   `{baseURL}`: عنوان URL لنظام NocoBase الخاص بك
-   `{collectionName}`: اسم المجموعة

مثال: لنسخة محلية على `localhost:13000` مع مجموعة باسم `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 الاختبار باستخدام Postman

أنشئ طلب GET في Postman بالتكوين التالي:
-   **URL**: نقطة نهاية الطلب (على سبيل المثال، `http://localhost:13000/api/todos:list`)
-   **Headers**: أضف ترويسة `Authorization` بالقيمة التالية:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**استجابة ناجحة:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**استجابة خطأ (مفتاح API غير صالح/منتهي الصلاحية):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**استكشاف الأخطاء وإصلاحها**: إذا فشلت المصادقة، تحقق من صلاحيات الدور، وربط مفتاح API، وتنسيق الرمز المميز.

### 3.4 تصدير رمز الطلب

يتيح لك Postman تصدير الطلب بتنسيقات مختلفة. مثال على أمر cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 استخدام مفاتيح API في كتلة JS

يدعم NocoBase 2.0 كتابة شيفرة JavaScript الأصلية مباشرة في الصفحات باستخدام كتل JS. يوضح هذا المثال كيفية جلب بيانات API خارجية باستخدام مفاتيح API.

### إنشاء كتلة JS

في صفحة NocoBase الخاصة بك، أضف كتلة JS واستخدم الشيفرة التالية لجلب بيانات قائمة المهام:

```javascript
// جلب بيانات قائمة المهام باستخدام مفتاح API
async function fetchTodos() {
  try {
    // عرض رسالة التحميل
    ctx.message.loading('جارٍ جلب البيانات...');

    // تحميل مكتبة axios لطلبات HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('فشل تحميل مكتبة HTTP');
      return;
    }

    // مفتاح API (استبدله بمفتاح API الفعلي الخاص بك)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // إرسال طلب API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // عرض النتائج
    console.log('قائمة المهام:', response.data);
    ctx.message.success(`تم جلب ${response.data.data.length} عنصر بنجاح`);

    // يمكنك معالجة البيانات هنا
    // على سبيل المثال: عرضها في جدول، تحديث حقول النموذج، إلخ.

  } catch (error) {
    console.error('حدث خطأ أثناء جلب البيانات:', error);
    ctx.message.error('فشل جلب البيانات: ' + error.message);
  }
}

// تنفيذ الدالة
fetchTodos();
```

### نقاط رئيسية

-   **ctx.requireAsync()**: يقوم بتحميل المكتبات الخارجية ديناميكيًا (مثل axios) لطلبات HTTP.
-   **ctx.message**: يعرض إشعارات المستخدم (جارٍ التحميل، نجاح، رسائل خطأ).
-   **مصادقة مفتاح API**: تمرير مفتاح API في ترويسة الطلب `Authorization` مع البادئة `Bearer`.
-   **معالجة الاستجابة**: معالجة البيانات المسترجعة حسب الحاجة (عرض، تحويل، إلخ).

## 5 ملخص

غطى هذا الدليل سير العمل الكامل لاستخدام مفاتيح API في NocoBase:

1.  **الإعداد**: تفعيل إضافة مفاتيح API وإنشاء مجموعة اختبار.
2.  **التكوين**: إنشاء أدوار بصلاحيات مناسبة وإنشاء مفاتيح API.
3.  **الاختبار**: التحقق من مصادقة مفتاح API باستخدام Postman وإضافة توثيق API.
4.  **التكامل**: استخدام مفاتيح API في كتل JS.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**مصادر إضافية:**
-   [توثيق إضافة مفاتيح API](/plugins/@nocobase/plugin-api-keys/)
-   [إضافة توثيق API](/plugins/@nocobase/plugin-api-doc/)