---
pkg: "@nocobase/plugin-block-list"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# كتلة القائمة

## مقدمة

تعرض كتلة القائمة البيانات بتنسيق قائمة، وهي مناسبة لسيناريوهات عرض البيانات مثل قوائم المهام، الأخبار، ومعلومات المنتج.

## إعدادات الكتلة

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### تحديد نطاق البيانات

كما هو موضح: تصفية الطلبات ذات الحالة "ملغاة".

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

لمزيد من التفاصيل، راجع [تحديد نطاق البيانات](/interface-builder/blocks/block-settings/data-scope)

### تحديد قواعد الفرز

كما هو موضح: الفرز حسب مبلغ الطلب بترتيب تنازلي.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

لمزيد من التفاصيل، راجع [تحديد قواعد الفرز](/interface-builder/blocks/block-settings/sorting-rule)

## تهيئة الحقول

### حقول من هذه المجموعة

> **ملاحظة**: يتم دمج الحقول من المجموعات الموروثة (أي حقول المجموعة الأصلية) تلقائيًا وعرضها في قائمة الحقول الحالية.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### حقول من المجموعات المرتبطة

> **ملاحظة**: يمكن عرض الحقول من المجموعات المرتبطة (حاليًا، يتم دعم العلاقات من نوع "واحد إلى واحد" فقط).

![20251023203611](https://docs.nocobase.com/20251023203611.png)

لتهيئة حقول القائمة، راجع [حقل التفاصيل](/interface-builder/fields/generic/detail-form-item)

## تهيئة الإجراءات

### الإجراءات العامة

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [تصفية](/interface-builder/actions/types/filter)
- [إضافة](/interface-builder/actions/types/add-new)
- [حذف](/interface-builder/actions/types/delete)
- [تحديث](/interface-builder/actions/types/refresh)
- [استيراد](/interface-builder/actions/types/import)
- [تصدير](/interface-builder/actions/types/export)
- [طباعة القالب](/template-print/index)
- [تحديث مجمع](/interface-builder/actions/types/bulk-update)
- [تصدير المرفقات](/interface-builder/actions/types/export-attachments)
- [تشغيل سير العمل](/interface-builder/actions/types/trigger-workflow)
- [إجراء JS](/interface-builder/actions/types/js-action)
- [موظف الذكاء الاصطناعي](/interface-builder/actions/types/ai-employee)

### إجراءات الصف

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [تعديل](/interface-builder/actions/types/edit)
- [حذف](/interface-builder/actions/types/delete)
- [ربط](/interface-builder/actions/types/link)
- [نافذة منبثقة](/interface-builder/actions/types/pop-up)
- [تحديث السجل](/interface-builder/actions/types/update-record)
- [طباعة القالب](/template-print/index)
- [تشغيل سير العمل](/interface-builder/actions/types/trigger-workflow)
- [إجراء JS](/interface-builder/actions/types/js-action)
- [موظف الذكاء الاصطناعي](/interface-builder/actions/types/ai-employee)