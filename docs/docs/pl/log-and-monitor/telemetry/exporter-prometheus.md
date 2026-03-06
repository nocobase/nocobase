---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Eksporter telemetrii: Prometheus

## Konfiguracja zmiennych środowiskowych

### TELEMETRY_METRIC_READER

Typ eksportera metryk telemetrii.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Określa, czy uruchomić oddzielny serwer.

- `off`. Punkt końcowy pobierania danych (scrape endpoint) to `/api/prometheus:metrics`.
- `on`. Punkt końcowy pobierania danych to `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Port dla oddzielnego serwera, domyślnie `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Konfiguracja Prometheus

Użycie wewnętrznego API NocoBase.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Uruchomienie oddzielnego serwera.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```