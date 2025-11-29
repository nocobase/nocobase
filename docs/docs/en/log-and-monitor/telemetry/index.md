---
pkg: '@nocobase/plugin-telemetry'
---

# Telemetry

## Overview

The Telemetry module in NocoBase is built on top of [OpenTelemetry](https://opentelemetry.io/), providing unified and extensible observability capabilities for NocoBase applications. This module supports collecting and exporting various application metrics, including HTTP requests and system resource usage.

## Environment Variables

To enable the telemetry module, you need to configure the relevant [environment variables](/get-started/installation/env#how-to-set-environment-variables).

### TELEMETRY_ENABLED

Set to `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Service name.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Metric exporters. Multiple exporters are supported and separated by commas. Refer to the documentation of existing exporters for available values.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Metrics to export, separated by commas. Available values can be found in [Metrics](#Metrics).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Threshold for recording HTTP request duration (`http_request_cost`), in milliseconds. The default value is `0`, meaning all requests are recorded. When set to a value greater than `0`, only requests whose duration exceeds this threshold will be recorded.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metrics

The current metrics recorded by the application are listed below. If you need additional metrics, you can refer to the [development documentation](/plugin-development/server/telemetry) for extension or contact us.

| Metric Name           | Metric Type       | Description                                                                                       |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Process CPU usage percentage                                                                      |
| `process_memory_mb`   | `ObservableGauge` | Process memory usage in MB                                                                        |
| `process_heap_mb`     | `ObservableGauge` | Process heap memory usage in MB                                                                   |
| `http_request_cost`   | `Histogram`       | HTTP request duration in ms                                                                       |
| `http_request_count`  | `Counter`         | Number of HTTP requests                                                                           |
| `http_request_active` | `UpDownCounter`   | Current number of active HTTP requests                                                            |
| `sub_app_status`      | `ObservableGauge` | Statistics of sub-application counts by status, reported by the `plugin-multi-app-manager` plugin |
