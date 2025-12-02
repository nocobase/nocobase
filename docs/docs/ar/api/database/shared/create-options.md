:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

## النوع

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## التفاصيل

- `values`: كائن البيانات للسجل المراد إنشاؤه.
- `whitelist`: يحدد الحقول التي **يمكن الكتابة إليها** ضمن كائن بيانات السجل المراد إنشاؤه. إذا لم يتم تمرير هذا المعامل، فسيتم السماح بالكتابة إلى جميع الحقول افتراضيًا.
- `blacklist`: يحدد الحقول التي **لا يُسمح بالكتابة إليها** ضمن كائن بيانات السجل المراد إنشاؤه. إذا لم يتم تمرير هذا المعامل، فسيتم السماح بالكتابة إلى جميع الحقول افتراضيًا.
- `transaction`: كائن المعاملة. إذا لم يتم تمرير أي معاملة، فستقوم هذه الدالة بإنشاء معاملة داخلية تلقائيًا.