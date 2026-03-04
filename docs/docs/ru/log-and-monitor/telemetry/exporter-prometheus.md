---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Экспортёр телеметрии: Prometheus

## Переменные окружения

### TELEMETRY_METRIC_READER

Тип экспортёра метрик телеметрии.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Определяет, следует ли запускать отдельный сервер.

- `off`. Эндпоинт для сбора метрик: `/api/prometheus:metrics`.
- `on`. Эндпоинт для сбора метрик: `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Порт для работы отдельного сервера, по умолчанию `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Конфигурация Prometheus

Использование внутреннего API NocoBase:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Использование отдельного сервера:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```