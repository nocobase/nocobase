---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/log-and-monitor/telemetry/exporter-prometheus) voor nauwkeurige informatie.
:::

# Telemetrie-exporter: Prometheus

## Configuratie van omgevingsvariabelen

### TELEMETRY_METRIC_READER

Type telemetrie-metriek-exporter.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Of er een afzonderlijke server moet worden gestart.

- `off`. Het scrape-eindpunt is `/api/prometheus:metrics`.
- `on`. Het scrape-eindpunt is `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

De poort voor de afzonderlijke server wanneer deze wordt gestart, standaard is `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus-configuratie

Gebruik van de interne API van NocoBase:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Gebruik van de afzonderlijke server:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```