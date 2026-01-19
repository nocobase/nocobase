:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# قاعدة البيانات الخارجية

## مقدمة

يمكنك استخدام قاعدة بيانات خارجية موجودة كمصدر للبيانات. تدعم NocoBase حاليًا قواعد البيانات الخارجية التالية: MySQL، MariaDB، PostgreSQL، MSSQL، و Oracle.

## تعليمات الاستخدام

### إضافة قاعدة بيانات خارجية

بعد تفعيل الإضافة، يمكنك اختيارها وإضافتها من القائمة المنسدلة "إضافة جديد" (Add new) في إدارة مصادر البيانات.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

املأ معلومات قاعدة البيانات التي ترغب في ربطها.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### مزامنة المجموعات

بعد إنشاء اتصال بقاعدة بيانات خارجية، ستقوم NocoBase تلقائيًا بقراءة جميع المجموعات الموجودة في مصدر البيانات. لا تدعم قواعد البيانات الخارجية إضافة مجموعات أو تعديل هيكل الجداول بشكل مباشر. إذا كنت بحاجة إلى إجراء تعديلات، يمكنك القيام بذلك عبر عميل قاعدة البيانات، ثم النقر على زر "تحديث" (Refresh) في الواجهة للمزامنة.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### تهيئة الحقول

ستقوم قاعدة البيانات الخارجية تلقائيًا بقراءة وعرض حقول المجموعات الموجودة. يمكنك عرض وتهيئة عنوان الحقل، ونوع البيانات (Field type)، ونوع واجهة المستخدم (UI type) بسرعة. كما يمكنك النقر على زر "تعديل" (Edit) لتعديل المزيد من الإعدادات.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

نظرًا لأن قواعد البيانات الخارجية لا تدعم تعديل هيكل الجداول، فإن النوع الوحيد المتاح عند إضافة حقل جديد هو حقل العلاقة. حقول العلاقة ليست حقولًا حقيقية، بل تُستخدم لإنشاء روابط بين المجموعات.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

لمزيد من التفاصيل، راجع فصل [حقول المجموعة/نظرة عامة](/data-sources/data-modeling/collection-fields).

### ربط أنواع الحقول

تقوم NocoBase تلقائيًا بربط أنواع الحقول من قاعدة البيانات الخارجية بأنواع البيانات (Field type) وأنواع واجهة المستخدم (Field Interface) المقابلة لها.

- نوع البيانات (Field type): يُستخدم لتحديد نوع البيانات التي يمكن للحقل تخزينها، بالإضافة إلى تنسيقها وهيكلها.
- نوع واجهة المستخدم (Field interface): يشير إلى نوع عنصر التحكم المستخدم في واجهة المستخدم لعرض قيم الحقول وإدخالها.

| PostgreSQL | MySQL/MariaDB | نوع بيانات NocoBase | نوع واجهة NocoBase |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### أنواع الحقول غير المدعومة

تُعرض أنواع الحقول غير المدعومة بشكل منفصل. تتطلب هذه الحقول تكييفًا تطويريًا قبل أن تتمكن من استخدامها.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### مفتاح تصفية الهدف

يجب أن تحتوي المجموعات التي تُعرض ككتل على مفتاح تصفية هدف (Filter target key) مهيأ. يشير مفتاح تصفية الهدف إلى تصفية البيانات بناءً على حقل معين، ويجب أن تكون قيمة الحقل فريدة. بشكل افتراضي، يكون مفتاح تصفية الهدف هو حقل المفتاح الأساسي للمجموعة. أما بالنسبة للعروض (views)، أو المجموعات التي لا تحتوي على مفتاح أساسي، أو المجموعات ذات المفتاح الأساسي المركب، فيجب عليك تحديد مفتاح تصفية هدف مخصص.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

لا يمكن إضافة المجموعات التي تم تهيئة مفتاح تصفية الهدف لها إلا إلى الصفحة.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)