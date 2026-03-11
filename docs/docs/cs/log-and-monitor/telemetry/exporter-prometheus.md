---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Exportér telemetrie: Prometheus

## Konfigurace proměnných prostředí

### TELEMETRY_METRIC_READER

Typ exportéru metrik telemetrie.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Určuje, zda se má spustit samostatný server.

- `off`: Koncový bod pro sběr dat (scrape endpoint) je `/api/prometheus:metrics`.
- `on`: Koncový bod pro sběr dat je `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Port pro samostatný server, výchozí hodnota je `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Konfigurace Prometheus

Použití interního API NocoBase:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Použití samostatného serveru:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```