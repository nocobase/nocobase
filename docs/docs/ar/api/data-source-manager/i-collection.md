:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# ICollection

`ICollection` هي واجهة نموذج البيانات، وتتضمن معلومات مثل اسم النموذج وحقوله وعلاقاته.

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## الأعضاء

### repository

مثيل `Repository` الذي ينتمي إليه `ICollection`.

## API

### updateOptions()

يُحدّث خصائص ال`مجموعة`.

#### التوقيع

- `updateOptions(options: any): void`

### setField()

يُعيّن حقلًا لل`مجموعة`.

#### التوقيع

- `setField(name: string, options: any): IField`

### removeField()

يُزيل حقلًا من ال`مجموعة`.

#### التوقيع

- `removeField(name: string): void`

### getFields()

يسترد جميع حقول ال`مجموعة`.

#### التوقيع

- `getFields(): Array<IField>`

### getField()

يسترد حقلًا من ال`مجموعة` باستخدام اسمه.

#### التوقيع

- `getField(name: string): IField`