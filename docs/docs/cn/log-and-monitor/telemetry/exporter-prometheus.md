---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

# 遥测导出器: Prometheus

## 环境变量配置

### TELEMETRY_METRIC_READER

遥测指标导出器类型。

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

是否启动单独的服务。

- `off`. 抓取接口为 `/api/prometheus:metrics`.
- `on`. 抓取接口为 `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

启动单独服务时的服务端口，默认为 `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus 配置

使用 NocoBase 内部 API.

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

启动单独服务。

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```
