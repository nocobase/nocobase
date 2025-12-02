:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

## النوع

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

## التفاصيل

- `values`: كائن البيانات للسجل المراد تحديثه.
- `filter`: يحدد شروط التصفية للسجلات المراد تحديثها. للاطلاع على الاستخدام المفصل لـ Filter، يرجى الرجوع إلى طريقة [`find()`](#find).
- `filterByTk`: يحدد شروط التصفية للسجلات المراد تحديثها بواسطة TargetKey.
- `whitelist`: قائمة بيضاء لحقول `values`. سيتم كتابة الحقول الموجودة في هذه القائمة فقط.
- `blacklist`: قائمة سوداء لحقول `values`. لن يتم كتابة الحقول الموجودة في هذه القائمة.
- `transaction`: كائن المعاملة. إذا لم يتم تمرير أي معاملة، فستقوم الطريقة تلقائيًا بإنشاء معاملة داخلية.

يجب تمرير إما `filterByTk` أو `filter` على الأقل.