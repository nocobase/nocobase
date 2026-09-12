---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

# Экспортёр телеметрии: Prometheus

## Переменные окружения

### TELEMETRY_METRIC_READER

Тип экспортёра показателей телеметрии.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Запускать ли отдельный сервер.

- `off`: конечная точка сбора — `/api/prometheus:metrics`.
- `on`: конечная точка сбора — `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Порт отдельного сервера, по умолчанию `9464`.

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