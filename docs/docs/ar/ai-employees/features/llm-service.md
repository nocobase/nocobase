:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/ai-employees/features/llm-service).
:::

# إعداد خدمة LLM

قبل استخدام موظفي الذكاء الاصطناعي (AI Employees)، يجب أولاً إعداد خدمات LLM المتاحة.

يدعم النظام حالياً كلاً من OpenAI وGemini وClaude وDeepSeek وQwen وKimi، بالإضافة إلى نماذج Ollama المحلية.

## إنشاء خدمة جديدة

انتقل إلى `إعدادات النظام (System Settings) -> موظفو الذكاء الاصطناعي (AI Employees) -> خدمة LLM (LLM service)`.

1. انقر على `Add New` لفتح نافذة الإنشاء.
2. اختر المزود `Provider`.
3. أدخل العنوان `Title` ومفتاح الواجهة البرمجية `API Key` ورابط الأساس `Base URL` (اختياري).
4. قم بتهيئة النماذج المفعلة `Enabled Models`:
   - `Recommended models`: استخدام النماذج الموصى بها رسمياً.
   - `Select models`: الاختيار من القائمة التي يوفرها المزود.
   - `Manual input`: إدخال معرف النموذج (ID) واسم العرض يدوياً.
5. انقر على `Submit` للحفظ.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## تفعيل وترتيب الخدمات

في قائمة خدمات LLM، يمكنك القيام بما يلي مباشرة:

- استخدام مفتاح التبديل `Enabled` لتشغيل أو إيقاف الخدمة.
- سحب وإفلات الخدمات لإعادة ترتيبها (يؤثر ذلك على ترتيب عرض النماذج).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## اختبار التوفر

استخدم `Test flight` الموجود في أسفل نافذة إعداد الخدمة لاختبار مدى توفر الخدمة والنماذج.

يوصى بإجراء الاختبار قبل البدء في استخدام الخدمة فعلياً في العمل.