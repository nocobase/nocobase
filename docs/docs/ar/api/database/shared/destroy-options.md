:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

**النوع**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**التفاصيل**

- `filter`: يحدد شروط التصفية للسجلات المراد حذفها. للاطلاع على الاستخدام المفصل لـ `Filter`، يرجى الرجوع إلى طريقة [`find()`](#find).
- `filterByTk`: يحدد شروط التصفية للسجلات المراد حذفها باستخدام `TargetKey`.
- `truncate`: هل يتم اقتطاع بيانات الجدول. يكون فعالاً فقط عندما لا يتم توفير المعاملات `filter` أو `filterByTk`.
- `transaction`: كائن المعاملة. إذا لم يتم تمرير معامل معاملة، فستقوم هذه الطريقة تلقائيًا بإنشاء معاملة داخلية.