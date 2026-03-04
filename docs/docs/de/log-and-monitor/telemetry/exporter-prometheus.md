---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Telemetrie-Exporter: Prometheus

## Konfiguration der Umgebungsvariablen

### TELEMETRY_METRIC_READER

Typ des Telemetrie-Metrik-Exporters.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Gibt an, ob ein separater Dienst gestartet werden soll.

- `off`. Der Scrape-Endpunkt ist `/api/prometheus:metrics`.
- `on`. Der Scrape-Endpunkt ist `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Dienst-Port beim Starten eines separaten Dienstes, Standardwert ist `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus-Konfiguration

Verwendung der internen NocoBase-API.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Starten eines separaten Dienstes.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```