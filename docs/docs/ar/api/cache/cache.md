:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# التخزين المؤقت

## الأساليب الأساسية

يمكنك الرجوع إلى وثائق <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## أساليب أخرى

### `wrapWithCondition()`

مشابهة لدالة `wrap()`، ولكنها تتيح لك تحديد ما إذا كنت تريد استخدام التخزين المؤقت بناءً على شرط.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // معلمة خارجية للتحكم في ما إذا كان سيتم استخدام النتيجة المخزنة مؤقتًا
    useCache?: boolean;
    // تحديد ما إذا كان سيتم التخزين المؤقت بناءً على نتيجة البيانات
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

عندما يكون المحتوى المخزن مؤقتًا كائنًا، تقوم بتغيير قيمة مفتاح معين فيه.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

عندما يكون المحتوى المخزن مؤقتًا كائنًا، تقوم بالحصول على قيمة مفتاح معين منه.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

عندما يكون المحتوى المخزن مؤقتًا كائنًا، تقوم بحذف مفتاح معين منه.

```ts
async delValueInObject(key: string, objectKey: string)
```