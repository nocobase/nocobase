---
pkg: '@nocobase/plugin-telemetry-prometheus'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# מייצא טלמטריה: Prometheus

## משתני סביבה

### TELEMETRY_METRIC_READER

סוג מייצא מדדי טלמטריה.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

האם להפעיל שרת עצמאי.

- `off`: נקודת הקצה לאיסוף הנתונים היא `/api/prometheus:metrics`.
- `on`: נקודת הקצה לאיסוף הנתונים היא `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

הפורט עבור השרת העצמאי, ברירת המחדל היא `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### תצורת Prometheus

שימוש ב-API הפנימי של NocoBase:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

שימוש בשרת העצמאי:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```