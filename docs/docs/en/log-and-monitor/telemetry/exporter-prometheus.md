---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

# Telemetry Exporter: Prometheus

## Environment Variables

### TELEMETRY_METRIC_READER

Telemetry metric exporter type.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Whether to start a standalone server.

- `off`: The scrape endpoint is `/api/prometheus:metrics`.
- `on`: The scrape endpoint is `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Port for the standalone server, default is `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus Configuration

Using the NocoBase internal API:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Using the standalone server:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```
