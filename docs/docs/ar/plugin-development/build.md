:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# بناء

## إعدادات البناء المخصصة

إذا كنت ترغب في تخصيص إعدادات البناء، يمكنك إنشاء ملف `build.config.ts` في الدليل الجذر للإضافة بالمحتوى التالي:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // يُستخدم Vite لتجميع كود الواجهة الأمامية (client) الموجود في src/client

    // لتعديل إعدادات Vite، يمكنك الرجوع إلى: https://vite.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // يُستخدم tsup لتجميع كود الواجهة الخلفية (server) الموجود في src/server

    // لتعديل إعدادات tsup، يمكنك الرجوع إلى: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // دالة رد نداء تُنفذ قبل بدء عملية البناء، وتسمح بإجراء عمليات ما قبل البناء.
  },
  afterBuild: (log: PkgLog) => {
    // دالة رد نداء تُنفذ بعد اكتمال عملية البناء، وتسمح بإجراء عمليات ما بعد البناء.
  };
});
```