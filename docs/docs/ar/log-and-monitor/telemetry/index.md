---
pkg: '@nocobase/plugin-telemetry'
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::



# القياس عن بعد (Telemetry)

## نظرة عامة

تعتمد وحدة القياس عن بعد (Telemetry) في NocoBase على [OpenTelemetry](https://opentelemetry.io/)، وتوفر إمكانيات مراقبة موحدة وقابلة للتوسيع لتطبيقات NocoBase. تدعم هذه الوحدة جمع وتصدير مقاييس التطبيق المختلفة، بما في ذلك طلبات HTTP واستخدام موارد النظام.

## متغيرات البيئة

لتمكين وحدة القياس عن بعد، تحتاج إلى تهيئة [متغيرات البيئة](/get-started/installation/env#كيفية-تعيين-متغيرات-البيئة) ذات الصلة.

### TELEMETRY_ENABLED

عيّن القيمة إلى `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

اسم الخدمة.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

مصدرو المقاييس. يدعم هذا الخيار عدة مصدرين، مفصولة بفواصل. للقيم المتاحة، يرجى الرجوع إلى وثائق المصدرين الحاليين.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

المقاييس المراد تصديرها، مفصولة بفواصل. يمكن العثور على القيم المتاحة في قسم [المقاييس](#المقاييس).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

عتبة تسجيل مدة طلب HTTP (`http_request_cost`)، بالمللي ثانية. القيمة الافتراضية هي `0`، مما يعني تسجيل جميع الطلبات. عند تعيين قيمة أكبر من `0`، سيتم تسجيل الطلبات التي تتجاوز مدتها هذه العتبة فقط.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## المقاييس

فيما يلي المقاييس الحالية التي يسجلها التطبيق. إذا كنت بحاجة إلى المزيد، يمكنك الرجوع إلى [وثائق التطوير](/plugin-development/server/telemetry) للتوسع أو التواصل معنا.

| اسم المقياس                | نوع المقياس          | الوصف                                                                                             |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | نسبة استخدام وحدة المعالجة المركزية للعملية                                                |
| `process_memory_mb`   | `ObservableGauge` | استخدام ذاكرة العملية بوحدة الميغابايت                                              |
| `process_heap_mb`     | `ObservableGauge` | استخدام ذاكرة الكومة للعملية بوحدة الميغابايت                                            |
| `http_request_cost`   | `Histogram`       | مدة طلب HTTP بوحدة المللي ثانية                                               |
| `http_request_count`  | `Counter`         | عدد طلبات HTTP                                                        |
| `http_request_active` | `UpDownCounter`   | العدد الحالي لطلبات HTTP النشطة                                                 |
| `sub_app_status`      | `ObservableGauge` | إحصائيات عدد التطبيقات الفرعية حسب الحالة، يتم الإبلاغ عنها بواسطة إضافة `plugin-multi-app-manager` |