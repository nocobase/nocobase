---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/log-and-monitor/telemetry/index)을 참조하세요.
:::

# 텔레메트리 (Telemetry)

## 개요

NocoBase의 텔레메트리(Telemetry) 모듈은 [OpenTelemetry](https://opentelemetry.io/)를 기반으로 캡슐화되어, NocoBase 애플리케이션에 통합되고 확장 가능한 관측성(Observability) 기능을 제공합니다. 이 모듈은 HTTP 요청, 시스템 리소스 사용 현황 등 다양한 애플리케이션 지표의 수집 및 내보내기를 지원합니다.

## 환경 변수 설정

텔레메트리 모듈을 활성화하려면 관련 [환경 변수 설정 방법](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)을 참고하여 설정해야 합니다.

### TELEMETRY_ENABLED

`on`으로 설정합니다.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

서비스 이름입니다.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

지표 내보내기 도구(Exporter)입니다. 쉼표로 구분하여 여러 개를 설정할 수 있습니다. 선택 가능한 값은 기존 내보내기 도구 문서를 참고하십시오.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

내보낼 지표를 쉼표로 구분하여 설정합니다. 선택 가능한 값은 [지표](#지표) 섹션을 참고하십시오.

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

HTTP 요청 소요 시간(`http_request_cost`) 기록 임계값이며, 단위는 밀리초(ms)입니다. 기본값은 `0`으로, 모든 요청을 기록함을 의미합니다. `0`보다 큰 값으로 설정하면 소요 시간이 해당 임계값을 초과하는 요청만 기록합니다.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## 지표

현재 애플리케이션에서 기록되는 지표는 다음과 같습니다. 추가로 필요한 지표가 있는 경우 [개발 문서](/plugin-development/server/telemetry)를 참고하여 확장하거나 당사에 문의해 주시기 바랍니다.

| 지표명 | 지표 유형 | 설명 |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | 프로세스 CPU 사용률 백분율 |
| `process_memory_mb` | `ObservableGauge` | 프로세스 메모리 사용량 (단위: MB) |
| `process_heap_mb` | `ObservableGauge` | 프로세스 힙(Heap) 메모리 사용량 (단위: MB) |
| `http_request_cost` | `Histogram` | HTTP 요청 소요 시간 (단위: ms) |
| `http_request_count` | `Counter` | HTTP 요청 수 |
| `http_request_active` | `UpDownCounter` | 현재 활성 HTTP 요청 수 |
| `sub_app_status` | `ObservableGauge` | 현재 상태별 하위 애플리케이션 수 통계, `plugin-multi-app-manager` 플러그인에서 보고함 |