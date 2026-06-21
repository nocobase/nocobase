---
pkg: '@nocobase/plugin-telemetry-prometheus'
title: "Prometheus Telemetry Exporter"
description: "Ekspor metric NocoBase ke Prometheus: TELEMETRY_METRIC_READER=prometheus, scraping /api/prometheus:metrics, port server independen 9464, konfigurasi scrape_configs."
keywords: "Prometheus,ekspor telemetri,scraping metric,prometheus:metrics,scrape_configs,monitoring,NocoBase"
---
# Telemetry Exporter: Prometheus

## Konfigurasi Variabel Lingkungan

### TELEMETRY_METRIC_READER

Tipe telemetry metric exporter.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Apakah menjalankan service terpisah.

- `off`. Endpoint scraping adalah `/api/prometheus:metrics`.
- `on`. Endpoint scraping adalah `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Port service saat menjalankan service terpisah, default `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Konfigurasi Prometheus

Menggunakan API internal NocoBase.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Menjalankan service terpisah.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```
