---
pkg: '@nocobase/plugin-telemetry'
---

# 遥测

## 概述

NocoBase 的遥测 (Telemetry) 模块基于 [OpenTelemetry](https://opentelemetry.io/) 封装，为 NocoBase 应用提供统一、可扩展的可观测能力。该模块支持采集和导出多种应用指标，包括 HTTP 请求、系统资源使用情况等。

## 环境变量配置

启用遥测模块，需要配置相关 [环境变量](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)。

### TELEMETRY_ENABLED

配置为 `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

服务名称。

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

指标导出器，支持多个导出器，以逗号分隔。可选值包括参考已有的导出器文档。

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

需要导出的指标，以逗号分隔。可选值参考 [指标](#指标)。

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

HTTP 请求耗时 (`http_request_cost`) 记录阈值，单位毫秒。默认值为 `0`，表示记录所有请求。设置为大于 `0` 的值时，仅记录请求耗时超过该阈值的请求。

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## 指标

目前应用中记录的指标如下，如果你有更多需要，可以参考[开发文档](/plugin-development/server/telemetry)进行扩展，或与我们联系。

| 指标名                | 指标类型          | 描述                                                                 |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | 进程 CPU 使用率百分比                                                |
| `process_memory_mb`   | `ObservableGauge` | 进程内存使用量，单位 MB                                              |
| `process_heap_mb`     | `ObservableGauge` | 进程堆内存使用量，单位 MB                                            |
| `http_request_cost`   | `Histogram`       | HTTP 请求耗时，单位 ms                                               |
| `http_request_count`  | `Counter`         | HTTP 请求数量                                                        |
| `http_request_active` | `UpDownCounter`   | 当前活跃 HTTP 请求数                                                 |
| `sub_app_status`      | `ObservableGauge` | 当前不同状态的子应用数量统计, 由 `plugin-multi-app-manager` 插件上报 |
