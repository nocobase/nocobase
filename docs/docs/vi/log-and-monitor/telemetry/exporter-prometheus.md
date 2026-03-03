---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Telemetry Exporter: Prometheus

## Cấu hình biến môi trường

### TELEMETRY_METRIC_READER

Loại bộ xuất chỉ số đo lường (telemetry metric exporter).

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Có khởi động một máy chủ riêng biệt hay không.

- `off`: Điểm cuối thu thập (scrape endpoint) là `/api/prometheus:metrics`.
- `on`: Điểm cuối thu thập là `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Cổng dịch vụ khi khởi động máy chủ riêng biệt, mặc định là `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Cấu hình Prometheus

Sử dụng API nội bộ của NocoBase:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Sử dụng máy chủ riêng biệt:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```