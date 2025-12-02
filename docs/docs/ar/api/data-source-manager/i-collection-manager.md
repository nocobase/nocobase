:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# ICollectionManager

واجهة `ICollectionManager` تُستخدم لإدارة نُسخ `مجموعة` لمصدر البيانات.

## API

### registerFieldTypes()

تُسجل أنواع الحقول في `مجموعة`.

#### التوقيع

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

تُسجل واجهة `مجموعة`.

#### التوقيع

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

تُسجل قالب `مجموعة`.

#### التوقيع

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

تُسجل نموذجًا.

#### التوقيع

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

تُسجل مستودعًا.

#### التوقيع

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

تسترجع نسخة مستودع مسجلة.

#### التوقيع

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

تُعرف `مجموعة`.

#### التوقيع

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

تُعدّل خصائص `مجموعة` موجودة.

#### التوقيع

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

تتحقق مما إذا كانت `مجموعة` موجودة.

#### التوقيع

- `hasCollection(name: string): boolean`

### getCollection()

تسترجع نسخة `مجموعة`.

#### التوقيع

- `getCollection(name: string): ICollection`

### getCollections()

تسترجع جميع نُسخ `مجموعة`.

#### التوقيع

- `getCollections(): Array<ICollection>`

### getRepository()

تسترجع نسخة `مستودع`.

#### التوقيع

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

تُزامن مصدر البيانات. يتم تطبيق المنطق بواسطة الفئات الفرعية.

#### التوقيع

- `sync(): Promise<void>`