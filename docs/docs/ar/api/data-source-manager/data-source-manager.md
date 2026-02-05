:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# DataSourceManager

`DataSourceManager` هو فئة الإدارة لعدة نُسخ من `dataSource`.

## الواجهة البرمجية (API)

### `add()`
يضيف نسخة من `dataSource`.

#### التوقيع (Signature)

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### `use()`

يضيف برمجيات وسيطة (middleware) عامة إلى نسخة `dataSource`.

### `middleware()`

يسترد البرمجيات الوسيطة (middleware) لنسخة `DataSourceManager` الحالية، والتي يمكن استخدامها للاستجابة لطلبات HTTP.

### `afterAddDataSource()`

دالة ربط (hook function) تُستدعى بعد إضافة `dataSource` جديد.

#### التوقيع (Signature)

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### `registerDataSourceType()`

يسجل نوع **مصدر البيانات** وفئته.

#### التوقيع (Signature)

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### `getDataSourceType()`

يسترد فئة **مصدر البيانات**.

#### التوقيع (Signature)

- `getDataSourceType(type: string): typeof DataSource`

### `buildDataSourceByType()`

ينشئ نسخة من **مصدر البيانات** بناءً على نوع **مصدر البيانات** المسجل وخيارات النسخة.

#### التوقيع (Signature)

- `buildDataSourceByType(type: string, options: any): DataSource`