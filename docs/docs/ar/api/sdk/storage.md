:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# التخزين

## نظرة عامة

تُستخدم فئة `Storage` لتخزين معلومات جانب العميل، وتستخدم `localStorage` افتراضيًا.

### الاستخدام الأساسي

```ts
export abstract class Storage {
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;
}

export class CustomStorage extends Storage {
  // ...
}
```

## توابع الفئة

### `setItem()`

تخزن المحتوى.

#### التوقيع

- `setItem(key: string, value: string): void`

### `getItem()`

تسترجع المحتوى.

#### التوقيع

- `getItem(key: string): string | null`

### `removeItem()`

تحذف المحتوى.

#### التوقيع

- `removeItem(key: string): void`

### `clear()`

تمسح كل المحتوى.

#### التوقيع

- `clear(): void`