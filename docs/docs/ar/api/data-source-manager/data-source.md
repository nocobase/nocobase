:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# DataSource (تجريدي)

`DataSource` هو صنف تجريدي يُستخدم لتمثيل نوع من مصدر البيانات، يمكن أن يكون قاعدة بيانات، واجهة برمجة تطبيقات (API)، أو غير ذلك.

## الأعضاء

### collectionManager

مثيل CollectionManager الخاص بمصدر البيانات، والذي يجب أن يُطبق واجهة [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

مثيل resourceManager الخاص بمصدر البيانات.

### acl

مثيل ACL الخاص بمصدر البيانات.

## API

### constructor()

دالة البناء، تُنشئ مثيلاً من `DataSource`.

#### التوقيع

- `constructor(options: DataSourceOptions)`

### init()

دالة التهيئة، تُستدعى مباشرة بعد دالة البناء `constructor`.

#### التوقيع

- `init(options: DataSourceOptions)`

### name

#### التوقيع

- `get name()`

تُرجع اسم مثيل مصدر البيانات.

### middleware()

تُرجع البرمجيات الوسيطة (middleware) الخاصة بـ DataSource، والتي تُستخدم لتثبيتها على الخادم (Server) لاستقبال الطلبات.

### testConnection()

دالة ثابتة تُستدعى أثناء عملية اختبار الاتصال. يمكن استخدامها للتحقق من صحة المعلمات، ويتم تطبيق المنطق المحدد بواسطة الصنف الفرعي.

#### التوقيع

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### التوقيع

- `async load(options: any = {})`

عملية تحميل مصدر البيانات. يتم تطبيق المنطق بواسطة الصنف الفرعي.

### createCollectionManager()

#### التوقيع
- `abstract createCollectionManager(options?: any): ICollectionManager`

تُنشئ مثيلاً من CollectionManager لمصدر البيانات. يتم تطبيق المنطق بواسطة الصنف الفرعي.

### createResourceManager()

تُنشئ مثيلاً من ResourceManager لمصدر البيانات. يمكن للأصناف الفرعية تجاوز هذا التطبيق. بشكل افتراضي، تُنشئ `ResourceManager` من `@nocobase/resourcer`.

### createACL()

- تُنشئ مثيلاً من ACL لـ DataSource. يمكن للأصناف الفرعية تجاوز هذا التطبيق. بشكل افتراضي، تُنشئ `ACL` من `@nocobase/acl`.