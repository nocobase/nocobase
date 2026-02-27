---
pkg: '@nocobase/plugin-app-supervisor'
---

# وضع الذاكرة المشتركة

## مقدمة

هذا الوضع مناسب عندما تريد تقسيم الأعمال على مستوى التطبيقات بدون تعقيد تشغيلي كبير.

## دليل الاستخدام

### متغيرات البيئة

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### إنشاء تطبيق

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### بدء التطبيق

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### الوصول إلى التطبيق

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### إيقاف التطبيق

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### حالة التطبيق

![](https://static-docs.nocobase.com/202512291122339.png)

### حذف التطبيق

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
