:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# نظرة عامة

يتكون سير العمل عادةً من عدة خطوات تشغيلية متصلة. يمثل كل عقدة خطوة من هذه الخطوات، وتعتبر الوحدة المنطقية الأساسية في العملية. تمامًا كما هو الحال في لغات البرمجة، تمثل الأنواع المختلفة من العقد تعليمات مختلفة تحدد سلوك العقدة. عندما يتم تشغيل سير العمل، يدخل النظام كل عقدة بالتسلسل وينفذ تعليماتها.

:::info{title=ملاحظة}
مشغل سير العمل لا يعتبر عقدة. يتم عرضه فقط كنقطة دخول في مخطط سير العمل، لكنه مفهوم مختلف عن العقدة. لمزيد من التفاصيل، يرجى الرجوع إلى محتوى [المشغلات](../triggers/index.md).
:::

من منظور وظيفي، يمكن تقسيم العقد المطبقة حاليًا إلى عدة فئات رئيسية (إجمالي 29 نوعًا من العقد):

- الذكاء الاصطناعي
  - [نموذج اللغة الكبير](../../ai-employees/workflow/nodes/llm/chat.md) (توفرها إضافة `@nocobase/plugin-workflow-llm`)
- التحكم في سير العمل
  - [الشرط](./condition.md)
  - [الشروط المتعددة](./multi-conditions.md)
  - [التكرار](./loop.md) (توفرها إضافة `@nocobase/plugin-workflow-loop`)
  - [المتغير](./variable.md) (توفرها إضافة `@nocobase/plugin-workflow-variable`)
  - [الفرع المتوازي](./parallel.md) (توفرها إضافة `@nocobase/plugin-workflow-parallel`)
  - [استدعاء سير العمل](./subflow.md) (توفرها إضافة `@nocobase/plugin-workflow-subflow`)
  - [مخرجات سير العمل](./output.md) (توفرها إضافة `@nocobase/plugin-workflow-subflow`)
  - [ربط متغيرات JSON](./json-variable-mapping.md) (توفرها إضافة `@nocobase/plugin-workflow-json-variable-mapping`)
  - [التأخير](./delay.md) (توفرها إضافة `@nocobase/plugin-workflow-delay`)
  - [إنهاء سير العمل](./end.md)
- العمليات الحسابية
  - [الحساب](./calculation.md)
  - [حساب التاريخ](./date-calculation.md) (توفرها إضافة `@nocobase/plugin-workflow-date-calculation`)
  - [حساب JSON](./json-query.md) (توفرها إضافة `@nocobase/plugin-workflow-json-query`)
- إجراءات المجموعة
  - [إنشاء بيانات](./create.md)
  - [تحديث بيانات](./update.md)
  - [حذف بيانات](./destroy.md)
  - [استعلام بيانات](./query.md)
  - [استعلام تجميعي](./aggregate.md) (توفرها إضافة `@nocobase/plugin-workflow-aggregate`)
  - [إجراء SQL](./sql.md) (توفرها إضافة `@nocobase/plugin-workflow-sql`)
- المعالجة اليدوية
  - [المعالجة اليدوية](./manual.md) (توفرها إضافة `@nocobase/plugin-workflow-manual`)
  - [الموافقة](./approval.md) (توفرها إضافة `@nocobase/plugin-workflow-approval`)
  - [نسخة كربونية (CC)](./cc.md) (توفرها إضافة `@nocobase/plugin-workflow-cc`)
- إضافات أخرى
  - [طلب HTTP](./request.md) (توفرها إضافة `@nocobase/plugin-workflow-request`)
  - [جافاسكريبت](./javascript.md) (توفرها إضافة `@nocobase/plugin-workflow-javascript`)
  - [إرسال بريد إلكتروني](./mailer.md) (توفرها إضافة `@nocobase/plugin-workflow-mailer`)
  - [الإشعار](../../notification-manager/index.md#工作流通知节点) (توفرها إضافة `@nocobase/plugin-workflow-notification`)
  - [الاستجابة](./response.md) (توفرها إضافة `@nocobase/plugin-workflow-webhook`)
  - [رسالة الاستجابة](./response-message.md) (توفرها إضافة `@nocobase/plugin-workflow-response-message`)