---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/log-and-monitor/telemetry/exporter-prometheus) bakın.
:::

# Telemetri Dışa Aktarıcı: Prometheus

## Ortam Değişkenleri Yapılandırması

### TELEMETRY_METRIC_READER

Telemetri metrik dışa aktarıcı türü.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Bağımsız bir sunucu başlatılıp başlatılmayacağı.

- `off`: Kazıma (scrape) uç noktası `/api/prometheus:metrics` şeklindedir.
- `on`: Kazıma (scrape) uç noktası `host:port:metrics` şeklindedir.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Bağımsız sunucu başlatıldığında kullanılacak servis portu, varsayılan değer `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus Yapılandırması

NocoBase dahili API'sini kullanarak:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Bağımsız sunucuyu kullanarak:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```