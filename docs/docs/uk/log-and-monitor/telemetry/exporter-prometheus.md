---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Експортер телеметрії: Prometheus

## Конфігурація змінних оточення

### TELEMETRY_METRIC_READER

Тип експортера метрик телеметрії.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Чи запускати окремий сервер.

- `off`. Ендпоінт для збору метрик: `/api/prometheus:metrics`.
- `on`. Ендпоінт для збору метрик: `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Порт сервісу при запуску окремого сервера, за замовчуванням `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Конфігурація Prometheus

Використання внутрішнього API NocoBase.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Запуск окремого сервера.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```