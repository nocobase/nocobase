:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# ترقية تثبيت Docker

:::warning قبل الترقية

- تأكد من عمل نسخة احتياطية لقاعدة البيانات أولاً.

:::

## 1. انتقل إلى الدليل الذي يحتوي على ملف `docker-compose.yml`

على سبيل المثال

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. تحديث رقم إصدار الصورة (Image Version)

:::tip حول أرقام الإصدارات

- إصدارات الأسماء المستعارة، مثل `latest` و`latest-full` و`beta` و`beta-full` و`alpha` و`alpha-full`، لا تحتاج عادةً إلى التعديل.
- أرقام الإصدارات الرقمية، مثل `1.7.14` و`1.7.14-full`، يجب تغييرها إلى رقم الإصدار المستهدف.
- الترقية فقط هي المدعومة؛ لا يتم دعم الرجوع إلى إصدار أقدم!!!
- في بيئات الإنتاج، يُنصح بتثبيت إصدار رقمي محدد لتجنب التحديثات التلقائية غير المقصودة. [عرض جميع الإصدارات](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # يوصى باستخدام صورة Alibaba Cloud (شبكة داخلية أكثر استقرارًا)
    image: nocobase/nocobase:1.7.14-full
    # يمكنك أيضًا استخدام إصدار الاسم المستعار (قد يتم الترقية تلقائيًا، استخدمه بحذر في بيئات الإنتاج)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (قد يكون بطيئًا/فاشلاً في الشبكات المحلية)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. إعادة تشغيل الحاوية (Container)

```bash
# سحب أحدث صورة
docker compose pull app

# إعادة إنشاء الحاوية
docker compose up -d app

# التحقق من حالة عملية التطبيق
docker compose logs -f app
```

## 4. ترقية الإضافات (Plugins) الخارجية

ارجع إلى [تثبيت وترقية الإضافات](../install-upgrade-plugins.mdx)

## 5. تعليمات التراجع (Rollback)

لا يدعم NocoBase الرجوع إلى إصدار أقدم. إذا كنت بحاجة إلى التراجع، يرجى استعادة نسخة قاعدة البيانات الاحتياطية التي تم إنشاؤها قبل الترقية، وتغيير إصدار الصورة (image) إلى الإصدار الأصلي.

## 6. الأسئلة الشائعة (FAQ)

**س: سحب الصورة (Image Pull) بطيء أو فاشل**

استخدم تسريع الصور (image acceleration)، أو استخدم صورة Alibaba Cloud `nocobase/nocobase:<tag>`.

**س: لم يتغير الإصدار**

تأكد من أنك قمت بتعديل `image` إلى رقم الإصدار الجديد، وأنك نفذت بنجاح الأوامر `docker compose pull app` و`up -d app`.

**س: فشل تنزيل أو تحديث إضافة (Plugin) تجارية**

بالنسبة للإضافات التجارية، يرجى التحقق من مفتاح الترخيص (license key) في النظام، ثم أعد تشغيل حاوية Docker. لمزيد من التفاصيل، راجع [دليل تفعيل ترخيص NocoBase التجاري](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).