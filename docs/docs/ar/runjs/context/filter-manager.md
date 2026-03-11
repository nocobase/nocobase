:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/runjs/context/filter-manager).
:::

# ctx.filterManager

مدير اتصالات التصفية (Filter Connection Manager)، يُستخدم لإدارة ارتباطات التصفية بين نماذج التصفية (FilterForm) وكتل البيانات (الجداول، القوائم، الرسوم البيانية، إلخ). يتم توفيره بواسطة `BlockGridModel` وهو متاح فقط ضمن سياقه (مثل كتل نماذج التصفية، وكتل البيانات).

## حالات الاستخدام

| السيناريو | الوصف |
|------|------|
| **كتلة نموذج التصفية** | إدارة تكوينات الاتصال بين عناصر التصفية والكتل المستهدفة؛ وتحديث البيانات المستهدفة عند تغيير التصفية. |
| **كتلة البيانات (جدول/قائمة)** | تعمل كهدف للتصفية، حيث تربط شروط التصفية عبر `bindToTarget`. |
| **قواعد الربط / FilterModel مخصص** | استدعاء `refreshTargetsByFilter` داخل `doFilter` أو `doReset` لتشغيل تحديث الأهداف. |
| **تكوين حقول الاتصال** | استخدام `getConnectFieldsConfig` و `saveConnectFieldsConfig` لصيانة تعيينات الحقول بين المصفيات والأهداف. |

> ملاحظة: `ctx.filterManager` متاح فقط في سياقات RunJS التي تحتوي على `BlockGridModel` (على سبيل المثال، داخل صفحة تحتوي على نموذج تصفية)؛ ويكون `undefined` في كتل JSBlock العادية أو الصفحات المستقلة. يُنصح باستخدام التسلسل الاختياري (optional chaining) قبل الوصول إليه.

## تعريفات الأنواع

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // معرف UID لنموذج التصفية
  targetId: string;   // معرف UID لنموذج كتلة البيانات المستهدفة
  filterPaths?: string[];  // مسارات الحقول للكتلة المستهدفة
  operator?: string;  // عامل التصفية
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## الطرق الشائعة

| الطريقة | الوصف |
|------|------|
| `getFilterConfigs()` | الحصول على جميع تكوينات اتصال التصفية الحالية. |
| `getConnectFieldsConfig(filterId)` | الحصول على تكوين حقول الاتصال لمصفي معين. |
| `saveConnectFieldsConfig(filterId, config)` | حفظ تكوين حقول الاتصال للمصفي. |
| `addFilterConfig(config)` | إضافة تكوين تصفية (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | إزالة تكوينات التصفية بواسطة filterId أو targetId أو كليهما. |
| `bindToTarget(targetId)` | ربط تكوين التصفية بكتلة مستهدفة، مما يؤدي إلى تطبيق التصفية على موردها (resource). |
| `unbindFromTarget(targetId)` | فك ارتباط التصفية عن الكتلة المستهدفة. |
| `refreshTargetsByFilter(filterId | filterId[])` | تحديث بيانات الكتل المستهدفة المرتبطة بناءً على المصفي (أو المصفيات). |

## المفاهيم الأساسية

- **FilterModel**: نموذج يوفر شروط التصفية (مثل FilterFormItemModel)، ويجب أن ينفذ `getFilterValue()` لإرجاع قيمة التصفية الحالية.
- **TargetModel**: كتلة البيانات التي يتم تصفيتها؛ يجب أن يدعم موردها (`resource`) العمليات `addFilterGroup` و `removeFilterGroup` و `refresh`.

## أمثلة

### إضافة تكوين تصفية

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### تحديث الكتل المستهدفة

```ts
// في doFilter / doReset لنموذج التصفية
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// تحديث الأهداف المرتبطة بمصفيات متعددة
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### تكوين حقول الاتصال

```ts
// الحصول على تكوين الاتصال
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// حفظ تكوين الاتصال
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### إزالة التكوين

```ts
// حذف جميع التكوينات لمصفي معين
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// حذف جميع تكوينات التصفية لهدف معين
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## روابط ذات صلة

- [ctx.resource](./resource.md): يجب أن يدعم مورد الكتلة المستهدفة واجهة التصفية.
- [ctx.model](./model.md): يُستخدم للحصول على UID النموذج الحالي لاستخدامه كـ filterId / targetId.