:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# ترقية تثبيت create-nocobase-app

:::warning التحضير قبل الترقية

- تأكد من عمل نسخة احتياطية لقاعدة البيانات أولاً.
- أوقف تشغيل NocoBase قيد التشغيل.

:::

## 1. إيقاف تشغيل NocoBase

إذا لم تكن عملية تعمل في الخلفية، أوقفها باستخدام `Ctrl + C`. في بيئة الإنتاج، نفّذ أمر `pm2-stop` لإيقافها.

```bash
yarn nocobase pm2-stop
```

## 2. تنفيذ أمر الترقية

ما عليك سوى تنفيذ أمر الترقية `yarn nocobase upgrade`.

```bash
# انتقل إلى الدليل المناسب
cd my-nocobase-app
# نفّذ أمر الترقية
yarn nocobase upgrade
# ابدأ التشغيل
yarn dev
```

### الترقية إلى إصدار معين

عدّل ملف `package.json` في الدليل الجذر للمشروع، وغيّر أرقام الإصدارات لكل من `@nocobase/cli` و `@nocobase/devtools` (يمكنك الترقية فقط، ولا يمكنك الرجوع إلى إصدار أقدم). على سبيل المثال:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

ثم نفّذ أمر الترقية

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```