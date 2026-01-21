---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::



pkg: "@nocobase/plugin-data-source-rest-api"
---

# مصدر بيانات REST API

## مقدمة

تتيح لك هذه الإضافة دمج البيانات من مصادر REST API بسلاسة.

## التثبيت

بصفتها إضافة تجارية، تتطلب هذه الإضافة رفعها وتفعيلها عبر مدير الإضافات.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## إضافة مصدر REST API

بعد تفعيل الإضافة، يمكنك إضافة مصدر REST API باختياره من القائمة المنسدلة "إضافة جديد" في قسم إدارة مصادر البيانات.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

قم بتكوين مصدر REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## إضافة مجموعة

في NocoBase، يتم ربط مورد RESTful بمجموعة، مثل مورد المستخدمين (Users).

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

يتم ربط نقاط نهاية API هذه في NocoBase على النحو التالي:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

للحصول على دليل شامل حول مواصفات تصميم NocoBase API، يرجى الرجوع إلى وثائق API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

راجع فصل "NocoBase API - Core" للحصول على معلومات مفصلة.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

يتضمن تكوين المجموعة (Collection) لمصدر بيانات REST API ما يلي:

### List (قائمة)

ربط الواجهة لعرض قائمة الموارد.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get (الحصول على)

ربط الواجهة لعرض تفاصيل المورد.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create (إنشاء)

ربط الواجهة لإنشاء مورد.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update (تحديث)

ربط الواجهة لتحديث مورد.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy (حذف)

ربط الواجهة لحذف مورد.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

يجب تكوين واجهتي List و Get إلزامياً.

## تصحيح أخطاء API

### دمج معلمات الطلب

مثال: قم بتكوين معلمات الترحيل (pagination) لواجهة List. إذا كانت واجهة برمجة التطبيقات (API) للطرف الثالث لا تدعم الترحيل بشكل أساسي، فستقوم NocoBase بالترحيل بناءً على بيانات القائمة المسترجعة.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

يرجى ملاحظة أن المتغيرات المضافة في الواجهة فقط هي التي ستصبح سارية المفعول.

| اسم معلمة API للطرف الثالث | معلمة NocoBase             |
| --------------------------- | --------------------------- |
| page                        | {{request.params.page}}     |
| limit                       | {{request.params.pageSize}} |

يمكنك النقر على "Try it out" لتصحيح الأخطاء وعرض الاستجابة.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### تحويل تنسيق الاستجابة

قد لا يكون تنسيق استجابة API للطرف الثالث متوافقًا مع معيار NocoBase، ويجب تحويله قبل أن يتم عرضه بشكل صحيح في الواجهة الأمامية.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

اضبط قواعد التحويل بناءً على تنسيق استجابة API للطرف الثالث لضمان توافق المخرجات مع معيار NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

وصف عملية تصحيح الأخطاء

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## المتغيرات

يدعم مصدر بيانات REST API ثلاثة أنواع من المتغيرات لدمج API:

- متغيرات مصدر البيانات المخصصة
- متغيرات طلب NocoBase
- متغيرات استجابة الطرف الثالث

### متغيرات مصدر البيانات المخصصة

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### طلب NocoBase

- Params: معلمات استعلام URL (Search Params)، والتي تختلف حسب الواجهة.
- Headers: رؤوس الطلب المخصصة، والتي توفر بشكل أساسي معلومات X- محددة من NocoBase.
- Body: نص الطلب.
- Token: رمز API الخاص بطلب NocoBase الحالي.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### استجابات الطرف الثالث

حاليًا، يتوفر فقط نص الاستجابة (response body).

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

فيما يلي المتغيرات المتاحة لكل واجهة:

### List (قائمة)

| المعلمة                    | الوصف                                                |
| ----------------------- | ---------------------------------------------------------- |
| `request.params.page`     | رقم الصفحة الحالي                                     |
| `request.params.pageSize` | عدد العناصر في الصفحة                                   |
| `request.params.filter`   | معايير التصفية (يجب أن تتوافق مع تنسيق تصفية NocoBase)         |
| `request.params.sort`     | معايير الفرز (يجب أن تتوافق مع تنسيق فرز NocoBase)          |
| `request.params.appends`  | الحقول التي يتم تحميلها عند الطلب، وتستخدم عادةً لحقول الارتباط |
| `request.params.fields`   | الحقول المراد تضمينها (القائمة البيضاء)                              |
| `request.params.except`   | الحقول المراد استبعادها (القائمة السوداء)                              |

### Get (الحصول على)

| المعلمة                      | الوصف                                                |
| ------------------------- | ---------------------------------------------------------- |
| `request.params.filterByTk` | مطلوب، وعادةً ما يكون معرف السجل الحالي                  |
| `request.params.filter`     | معايير التصفية (يجب أن تتوافق مع تنسيق تصفية NocoBase)         |
| `request.params.appends`    | الحقول التي يتم تحميلها عند الطلب، وتستخدم عادةً لحقول الارتباط |
| `request.params.fields`     | الحقول المراد تضمينها (القائمة البيضاء)                              |
| `request.params.except`     | الحقول المراد استبعادها (القائمة السوداء)                              |

### Create (إنشاء)

| المعلمة                     | الوصف               |
| ------------------------ | ------------------------- |
| `request.params.whiteList` | القائمة البيضاء           |
| `request.params.blacklist` | القائمة السوداء           |
| `request.body`             | البيانات الأولية للإنشاء |

### Update (تحديث)

| المعلمة                      | الوصف                                        |
| ------------------------- | -------------------------------------------------- |
| `request.params.filterByTk` | مطلوب، وعادةً ما يكون معرف السجل الحالي          |
| `request.params.filter`     | معايير التصفية (يجب أن تتوافق مع تنسيق تصفية NocoBase) |
| `request.params.whiteList`  | القائمة البيضاء                                          |
| `request.params.blacklist`  | القائمة السوداء                                          |
| `request.body`              | بيانات التحديث                                   |

### Destroy (حذف)

| المعلمة                      | الوصف                                        |
| ------------------------- | -------------------------------------------------- |
| `request.params.filterByTk` | مطلوب، وعادةً ما يكون معرف السجل الحالي          |
| `request.params.filter`     | معايير التصفية (يجب أن تتوافق مع تنسيق تصفية NocoBase) |

## تكوين الحقول

يتم استخراج البيانات الوصفية للحقول (Fields) من بيانات واجهة CRUD للمورد المتكيف لتكون بمثابة حقول للمجموعة.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

استخراج البيانات الوصفية للحقول.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

الحقول والمعاينة.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

تعديل الحقول (على غرار مصادر البيانات الأخرى).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## إضافة كتل مصدر بيانات REST API

بمجرد تكوين المجموعة، يمكنك إضافة كتل إلى الواجهة.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)