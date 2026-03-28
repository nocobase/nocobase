---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/log-and-monitor/telemetry/exporter-prometheus)을 참조하세요.
:::

# 텔레메트리 엑스포터: Prometheus

## 환경 변수 설정

### TELEMETRY_METRIC_READER

텔레메트리 메트릭 엑스포터 유형입니다.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

독립형 서버의 시작 여부를 설정합니다.

- `off`: 스크레이프(scrape) 엔드포인트는 `/api/prometheus:metrics`입니다.
- `on`: 스크레이프 엔드포인트는 `host:port:metrics`입니다.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

독립형 서버를 시작할 때의 서비스 포트이며, 기본값은 `9464`입니다.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Prometheus 설정

NocoBase 내부 API를 사용하는 경우:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

독립형 서버를 사용하는 경우:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```