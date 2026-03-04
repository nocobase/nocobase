---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Eksportir Telemetri: Prometheus

## Konfigurasi Variabel Lingkungan

### TELEMETRY_METRIC_READER

Tipe eksportir metrik telemetri.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Menentukan apakah akan menjalankan server mandiri (standalone).

- `off`. Endpoint scrape adalah `/api/prometheus:metrics`.
- `on`. Endpoint scrape adalah `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Port layanan saat menjalankan server mandiri, default adalah `9464`.

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

Menjalankan server mandiri.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```