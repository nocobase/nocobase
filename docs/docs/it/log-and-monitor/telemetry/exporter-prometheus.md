---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Esportatore di telemetria: Prometheus

## Configurazione delle variabili d'ambiente

### TELEMETRY_METRIC_READER

Tipo di esportatore di metriche di telemetria.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Indica se avviare un server standalone.

- `off`: L'endpoint di scraping è `/api/prometheus:metrics`.
- `on`: L'endpoint di scraping è `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Porta del server standalone, il valore predefinito è `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Configurazione di Prometheus

Utilizzo dell'API interna di NocoBase:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Utilizzo del server standalone:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```