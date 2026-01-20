:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# كتلة الجدول

## مقدمة

تُعد كتلة الجدول أحد مكوّنات البيانات الأساسية المدمجة في **NocoBase**، وتُستخدم بشكل أساسي لعرض وإدارة البيانات المنظمة في شكل جداول. توفر هذه الكتلة خيارات إعداد مرنة، تتيح للمستخدمين تخصيص أعمدة الجدول، وعرض الأعمدة، وقواعد الفرز، ونطاق البيانات، وغيرها، حسب احتياجاتهم، لضمان توافق البيانات المعروضة في الجدول مع متطلبات العمل المحددة.

#### الميزات الرئيسية:
- **إعداد الأعمدة المرن**: يمكنك تخصيص أعمدة الجدول وعرضها لتناسب متطلبات عرض البيانات المختلفة.
- **قواعد الفرز**: تدعم فرز بيانات الجدول، حيث يمكن للمستخدمين ترتيب البيانات تصاعديًا أو تنازليًا بناءً على حقول مختلفة.
- **تحديد نطاق البيانات**: من خلال تحديد نطاق البيانات، يمكن للمستخدمين التحكم في نطاق البيانات المعروضة لتجنب تداخل البيانات غير ذات الصلة.
- **إعداد الإجراءات**: تتضمن كتلة الجدول خيارات إجراءات متعددة مدمجة، حيث يمكن للمستخدمين بسهولة إعداد إجراءات مثل التصفية، والإضافة، والتعديل، والحذف لإدارة البيانات بسرعة.
- **التعديل السريع**: يدعم التعديل المباشر للبيانات داخل الجدول، مما يبسط سير العمل ويزيد من كفاءة العمل.

## إعدادات المكوّن

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### قواعد ربط المكوّنات

تحكم في سلوك المكوّن من خلال قواعد الربط (مثل ما إذا كان سيتم عرضه أو تنفيذ JavaScript).

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

لمزيد من التفاصيل، راجع [قواعد الربط](/interface-builder/linkage-rule)

### تحديد نطاق البيانات

مثال: تصفية الطلبات التي يكون "الحالة" فيها "مدفوعة" بشكل افتراضي.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

لمزيد من التفاصيل، راجع [تحديد نطاق البيانات](/interface-builder/blocks/block-settings/data-scope)

### تحديد قواعد الفرز

مثال: عرض الطلبات بترتيب تنازلي حسب التاريخ.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

لمزيد من التفاصيل، راجع [تحديد قواعد الفرز](/interface-builder/blocks/block-settings/sorting-rule)

### تمكين التعديل السريع

قم بتنشيط "تمكين التعديل السريع" في إعدادات المكوّن وإعدادات أعمدة الجدول لتخصيص الأعمدة التي يمكن تعديلها بسرعة.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### تمكين الجدول الشجري

عندما تكون مجموعة البيانات جدولًا هرميًا (شجريًا)، يمكن لكتلة الجدول اختيار تفعيل ميزة "تمكين الجدول الشجري". يظل هذا الخيار معطلاً بشكل افتراضي. بمجرد تفعيله، ستعرض الكتلة البيانات في هيكل شجري، وتدعم في الوقت نفسه خيارات الإعدادات والوظائف التشغيلية ذات الصلة.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### توسيع جميع الصفوف افتراضيًا

عند تمكين الجدول الشجري، تدعم الكتلة توسيع جميع البيانات الفرعية افتراضيًا عند تحميلها.

## إعداد الحقول

### حقول هذه المجموعة

> **ملاحظة**: الحقول من المجموعات الموروثة (أي حقول المجموعة الأصلية) يتم دمجها وعرضها تلقائيًا في قائمة الحقول الحالية.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### حقول المجموعات المرتبطة

> **ملاحظة**: تدعم عرض حقول المجموعات المرتبطة (تدعم حاليًا العلاقات من نوع واحد إلى واحد فقط).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### أعمدة مخصصة أخرى

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## إعداد الإجراءات

### إجراءات عامة

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [تصفية](/interface-builder/actions/types/filter)
- [إضافة جديد](/interface-builder/actions/types/add-new)
- [حذف](/interface-builder/actions/types/delete)
- [تحديث](/interface-builder/actions/types/refresh)
- [استيراد](/interface-builder/actions/types/import)
- [تصدير](/interface-builder/actions/types/export)
- [طباعة القالب](/template-print/index)
- [تحديث مجمع](/interface-builder/actions/types/bulk-update)
- [تصدير المرفقات](/interface-builder/actions/types/export-attachments)
- [تشغيل سير العمل](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [موظف الذكاء الاصطناعي](/interface-builder/actions/types/ai-employee)

### إجراءات الصفوف

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [عرض](/interface-builder/actions/types/view)
- [تعديل](/interface-builder/actions/types/edit)
- [حذف](/interface-builder/actions/types/delete)
- [نافذة منبثقة](/interface-builder/actions/types/pop-up)
- [رابط](/interface-builder/actions/types/link)
- [تحديث السجل](/interface-builder/actions/types/update-record)
- [طباعة القالب](/template-print/index)
- [تشغيل سير العمل](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [موظف الذكاء الاصطناعي](/interface-builder/actions/types/ai-employee)