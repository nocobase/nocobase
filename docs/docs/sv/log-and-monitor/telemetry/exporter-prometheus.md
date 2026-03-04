---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Telemetri-exportör: Prometheus

## Miljövariabler

### TELEMETRY_METRIC_READER

Typ av exportör för telemetrimätvärden.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Huruvida en fristående server ska startas.

- `off`. Slutpunkten för insamling (scrape) är `/api/prometheus:metrics`.
- `on`. Slutpunkten för insamling (scrape) är `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Port för den fristående servern, standardvärdet är `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus-konfiguration

Användning av NocoBase interna API:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Användning av den fristående servern:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```