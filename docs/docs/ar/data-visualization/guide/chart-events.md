:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# أحداث التفاعل المخصصة

اكتب JavaScript في محرر الأحداث وسجل التفاعلات عبر مثيل ECharts `chart` لتمكين الربط، مثل الانتقال إلى صفحة جديدة أو فتح نافذة منبثقة للتحليل المتعمق.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## تسجيل الأحداث وإلغاء تسجيلها
- تسجيل: `chart.on(eventName, handler)`
- إلغاء التسجيل: `chart.off(eventName, handler)` أو `chart.off(eventName)` لمسح الأحداث بنفس الاسم.

**ملاحظة:**
لأسباب تتعلق بالسلامة، يوصى بشدة بإلغاء تسجيل الحدث قبل تسجيله مرة أخرى!

## بنية بيانات `params` لمعاملات دالة `handler`

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

تتضمن الحقول الشائعة `params.data` و `params.name` وغيرها.

## مثال: النقر لتحديد العنصر وتمييزه
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // تمييز نقطة البيانات الحالية
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // إزالة التمييز عن النقاط الأخرى
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## مثال: النقر للانتقال إلى صفحة
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // الخيار 1: التنقل الداخلي للتطبيق، لا يتطلب تحديث الصفحة بالكامل، تجربة أفضل (موصى به)، يحتاج فقط إلى مسار نسبي
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // الخيار 2: الانتقال إلى صفحة خارجية، يتطلب رابط URL كاملاً
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // الخيار 3: فتح صفحة خارجية في علامة تبويب جديدة، يتطلب رابط URL كاملاً
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## مثال: النقر لفتح نافذة منبثقة للتفاصيل (تحليل متعمق)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // تسجيل متغيرات السياق لاستخدامها في النافذة المنبثقة الجديدة
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

في النافذة المنبثقة الجديدة، استخدم متغيرات سياق المخطط عبر `ctx.view.inputArgs.XXX`.

## المعاينة والحفظ
- انقر على "معاينة" لتحميل وتنفيذ كود الحدث.
- انقر على "حفظ" لحفظ إعدادات الحدث الحالية.
- انقر على "إلغاء" للعودة إلى الحالة المحفوظة الأخيرة.

**توصيات:**
- استخدم دائمًا `chart.off('event')` قبل الربط لتجنب التنفيذ المزدوج أو زيادة استهلاك الذاكرة.
- استخدم عمليات خفيفة الوزن قدر الإمكان داخل معالجات الأحداث (مثل `dispatchAction`، `setOption`) لتجنب حظر عملية العرض.
- تحقق من توافق حقول معالجة الحدث مع البيانات الحالية من خلال التحقق من خيارات المخطط واستعلامات البيانات.