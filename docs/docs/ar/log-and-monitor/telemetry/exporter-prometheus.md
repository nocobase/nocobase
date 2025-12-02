---
pkg: '@nocobase/plugin-telemetry-prometheus'
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::


# مُصدّر القياس عن بعد: Prometheus

## متغيرات البيئة

### TELEMETRY_METRIC_READER

نوع مُصدّر مقاييس القياس عن بعد.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

لتحديد ما إذا كان سيتم تشغيل خادم مستقل.

- `off`: نقطة نهاية التجميع هي `/api/prometheus:metrics`.
- `on`: نقطة نهاية التجميع هي `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

المنفذ الخاص بالخادم المستقل، والقيمة الافتراضية هي `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### إعدادات Prometheus

باستخدام واجهة برمجة تطبيقات NocoBase الداخلية:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

باستخدام الخادم المستقل:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```