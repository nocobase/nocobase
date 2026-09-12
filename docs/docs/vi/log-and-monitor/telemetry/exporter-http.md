---
pkg: '@nocobase/plugin-telemetry'
title: "HTTP Telemetry Exporter"
description: "Xuất metric Telemetry NocoBase qua HTTP: cấu hình TELEMETRY_METRIC_READER=http, TELEMETRY_HTTP_URL, đẩy metric đến hệ thống giám sát bên ngoài."
keywords: "HTTP exporter,xuất Telemetry,TELEMETRY_HTTP_URL,đẩy metric,tích hợp giám sát,NocoBase"
---
# Telemetry Exporter: HTTP

## Cấu hình biến môi trường

### TELEMETRY_METRIC_READER

Loại exporter metric Telemetry.

```bash
TELEMETRY_METRIC_READER=http
```

### TELEMETRY_HTTP_URL

URL HTTP xuất dữ liệu Telemetry.

```bash
TELEMETRY_HTTP_URL=
```
