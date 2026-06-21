---
pkg: '@nocobase/plugin-telemetry-prometheus'
title: "Prometheus Telemetry Exporter"
description: "Xuất metric NocoBase đến Prometheus: TELEMETRY_METRIC_READER=prometheus, scrape /api/prometheus:metrics, port server độc lập 9464, cấu hình scrape_configs."
keywords: "Prometheus,xuất Telemetry,scrape metrics,prometheus:metrics,scrape_configs,giám sát,NocoBase"
---
# Telemetry Exporter: Prometheus

## Cấu hình biến môi trường

### TELEMETRY_METRIC_READER

Loại exporter metric Telemetry.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Có khởi động dịch vụ riêng hay không.

- `off`. Interface scrape là `/api/prometheus:metrics`.
- `on`. Interface scrape là `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Port dịch vụ khi khởi động dịch vụ riêng, mặc định là `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Cấu hình Prometheus

Sử dụng API nội bộ NocoBase.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Khởi động dịch vụ riêng.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```
