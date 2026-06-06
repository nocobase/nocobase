:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# docker compose

## الأوامر الشائعة

### سحب أحدث صورة

```bash
docker compose pull app
```

### إعادة إنشاء الحاوية وتشغيلها

```bash
docker compose up -d app
```

### إيقاف الحاوية

```bash
docker compose stop app
```

### التحقق من حالة التطبيق

```bash
docker compose logs -f app
```

### تشغيل أوامر NocoBase داخل الحاوية

```bash
# التحقق من الإصدار
docker compose exec app yarn nocobase -v

# الترقية
docker compose exec app yarn nocobase upgrade

# تثبيت التبعيات
docker compose exec app yarn install
```

### إعادة البناء

```bash
docker compose up -d app --build
```

> **ملاحظة:** في بيئات الإنتاج، يُنصح بتحديد رقم إصدار ثابت في ملف `docker-compose.yml` لتجنب الترقيات التلقائية غير المقصودة.
