---
pkg: '@nocobase/plugin-telemetry'
title: "HTTP 遥测导出器"
description: "NocoBase 遥测指标通过 HTTP 导出：TELEMETRY_METRIC_READER=http、TELEMETRY_HTTP_URL 配置，将指标推送到外部监控系统。"
keywords: "HTTP 导出器,遥测导出,TELEMETRY_HTTP_URL,指标推送,监控集成,NocoBase"
---
# 遥测导出器: HTTP

## 环境变量配置

### TELEMETRY_METRIC_READER

遥测指标导出器类型。

```bash
TELEMETRY_METRIC_READER=http
```

### TELEMETRY_HTTP_URL

遥测数据导出 HTTP URL.

```bash
TELEMETRY_HTTP_URL=
```
