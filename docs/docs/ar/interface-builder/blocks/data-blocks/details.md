:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# كتلة التفاصيل

## مقدمة

كتلة التفاصيل تُستخدم لعرض قيم الحقول لكل سجل بيانات. تدعم هذه الكتلة تخطيطات حقول مرنة، وتتضمن وظائف مدمجة للتعامل مع البيانات، مما يسهل على المستخدمين عرض المعلومات وإدارتها.

## إعدادات الكتلة

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### قواعد ربط الكتلة

يمكنك التحكم في سلوك الكتلة (مثل ما إذا كانت ستُعرض أو ستنفذ JavaScript) من خلال قواعد الربط.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
لمزيد من التفاصيل، راجع [قواعد الربط](/interface-builder/linkage-rule)

### تحديد نطاق البيانات

مثال: عرض الطلبات المدفوعة فقط.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

لمزيد من التفاصيل، راجع [تحديد نطاق البيانات](/interface-builder/blocks/block-settings/data-scope)

### قواعد ربط الحقول

تدعم قواعد الربط في كتلة التفاصيل إمكانية تعيين الحقول للعرض/الإخفاء بشكل ديناميكي.

مثال: عدم عرض المبلغ عندما تكون حالة الطلب "ملغاة".

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

لمزيد من التفاصيل، راجع [قواعد الربط](/interface-builder/linkage-rule)

## تهيئة الحقول

### حقول من هذه المجموعة

> **ملاحظة**: يتم دمج الحقول من المجموعات الموروثة (أي حقول المجموعة الأصلية) وعرضها تلقائيًا في قائمة الحقول الحالية.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### حقول من المجموعات المرتبطة

> **ملاحظة**: يتم دعم عرض الحقول من المجموعات المرتبطة (حاليًا، يتم دعم العلاقات من نوع "واحد إلى واحد" فقط).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### حقول أخرى
- JS Field
- JS Item
- فاصل
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **تلميح**: يمكنك كتابة JavaScript لتنفيذ محتوى عرض مخصص، مما يتيح لك إظهار معلومات أكثر تعقيدًا.  
> على سبيل المثال، يمكنك عرض تأثيرات عرض مختلفة بناءً على أنواع بيانات أو شروط أو منطق مختلف.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## تهيئة الإجراءات

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [تعديل](/interface-builder/actions/types/edit)
- [حذف](/interface-builder/actions/types/delete)
- [ربط](/interface-builder/actions/types/link)
- [نافذة منبثقة](/interface-builder/actions/types/pop-up)
- [تحديث سجل](/interface-builder/actions/types/update-record)
- [تشغيل سير العمل](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [موظف الذكاء الاصطناعي](/interface-builder/actions/types/ai-employee)