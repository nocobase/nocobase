العربية | [English](./README.md) | [中文](./README.zh-CN.md) | [日本語](./README.ja-JP.md)

https://github.com/user-attachments/assets/a50c100a-4561-4e06-b2d2-d48098659ec0

## نود دعمكم!

<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - منصة بدون كود مفتوحة المصدر وقابلة للتوسع | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

## ملاحظات الإصدارات

يتم تحديث [مدونتنا](https://www.nocobase.com/en/blog/tags/release-notes) بانتظام بملاحظات الإصدارات وتوفر ملخصًا أسبوعيًا.

## ما هو NocoBase

NocoBase هي منصة تطوير بدون كود مفتوحة المصدر، تركز على قابلية التوسع.  
بدلاً من استثمار سنوات من الوقت وملايين الدولارات في البحث والتطوير، يمكنك نشر NocoBase في بضع دقائق وستحصل على منصة تطوير بدون كود خاصة، قابلة للتحكم، وقابلة للتوسع بشكل كبير!

الصفحة الرئيسية:  
https://www.nocobase.com/

عرض تجريبي مباشر:  
https://demo.nocobase.com/new

المستندات:  
https://docs.nocobase.com/

المنتدى:  
https://forum.nocobase.com/

## ميزات مميزة

### 1. تعتمد على نموذج البيانات

تقوم معظم منتجات بدون كود المعتمدة على النماذج أو الجداول أو العمليات بإنشاء الهياكل البيانية مباشرة من واجهة المستخدم، مثل Airtable، حيث تعني إضافة عمود جديد إلى جدول إضافة حقل جديد. وهذا يسهل الاستخدام، ولكنه يحد من الوظائف والمرونة لتلبية احتياجات السيناريوهات المعقدة.

يعتمد NocoBase على فكرة تصميم تفصل بين هيكل البيانات وواجهة المستخدم، مما يتيح لك إنشاء عدد غير محدود من الكتل (واجهات عرض البيانات) للمجموعات البيانية، بأنواع وأنماط ومحتويات وإجراءات مختلفة في كل كتلة. هذا يوفر توازناً بين بساطة التشغيل بدون كود ومرونة التطوير الأصلي.

![model](https://static-docs.nocobase.com/model.png)

### 2. ما تراه هو ما تحصل عليه

يمكنك NocoBase من تطوير أنظمة أعمال معقدة ومتميزة، ولكن هذا لا يعني الحاجة إلى عمليات معقدة ومتخصصة. بنقرة واحدة، يتم عرض خيارات التكوين في واجهة الاستخدام، ويمكن للمسؤولين الذين لديهم صلاحيات التكوين تعديل واجهة المستخدم بطريقة WYSIWYG (ما تراه هو ما تحصل عليه).

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

### 3. كل شيء يتم تنفيذه كمكونات إضافية (Plugins)

يعتمد NocoBase على بنية المكونات الإضافية، حيث يمكن تحقيق جميع الوظائف الجديدة من خلال تطوير وتثبيت المكونات الإضافية، كما أن توسيع الوظائف سهل مثل تثبيت تطبيق على هاتفك.

![plugins](https://static-docs.nocobase.com/plugins.png)

## التثبيت

يدعم NocoBase ثلاث طرق للتثبيت:

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/docker-compose">التثبيت باستخدام Docker (👍 موصى به)</a>  
  مناسب لسيناريوهات بدون كود، لا حاجة لكتابة كود. عند التحديث، فقط قم بتنزيل الصورة الأحدث وأعد التشغيل.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/create-nocobase-app">التثبيت باستخدام CLI (create-nocobase-app)</a>  
  كود المشروع التجاري مستقل تماماً ويدعم تطوير منخفض الكود.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/git-clone">التثبيت من خلال كود المصدر عبر Git</a>  
  إذا كنت ترغب في تجربة أحدث إصدار غير مُطلق، أو المساهمة في تطويره، وتحتاج إلى إجراء تغييرات وتصحيح أخطاء في كود المصدر، يوصى باختيار هذه الطريقة، لكنها تتطلب مستوى عالٍ من مهارات التطوير. عند تحديث الكود، يمكنك استخدام `git pull` لجلب أحدث إصدار.
