---
pkg: '@nocobase/plugin-telemetry'
title: "Telemetry và Giám sát NocoBase"
description: "Telemetry dựa trên OpenTelemetry: thời gian/số lượng request HTTP, CPU/memory tiến trình, trạng thái sub-app, cấu hình biến môi trường TELEMETRY, xuất Prometheus/HTTP."
keywords: "Telemetry,Telemetry,OpenTelemetry,metric giám sát,Prometheus,http_request_cost,process_cpu,NocoBase"
---
# Telemetry

## Tổng quan

Module Telemetry của NocoBase được đóng gói dựa trên [OpenTelemetry](https://opentelemetry.io/), cung cấp khả năng quan sát thống nhất, có thể mở rộng cho ứng dụng NocoBase. Module này hỗ trợ thu thập và xuất nhiều metric ứng dụng, bao gồm request HTTP, sử dụng tài nguyên hệ thống, v.v.

## Cấu hình biến môi trường

Để kích hoạt module Telemetry, cần cấu hình [biến môi trường](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) liên quan.

### TELEMETRY_ENABLED

Cấu hình thành `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Tên dịch vụ.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Exporter metric, hỗ trợ nhiều exporter, phân tách bằng dấu phẩy. Các giá trị tùy chọn tham khảo tài liệu các exporter đã có.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Các metric cần xuất, phân tách bằng dấu phẩy. Các giá trị tùy chọn tham khảo [Metric](#metric).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Ngưỡng ghi thời gian request HTTP (`http_request_cost`), đơn vị mili giây. Giá trị mặc định là `0`, nghĩa là ghi tất cả các request. Khi đặt thành giá trị lớn hơn `0`, chỉ ghi các request có thời gian vượt quá ngưỡng đó.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metric

Các metric hiện được ghi trong ứng dụng như sau, nếu bạn có nhu cầu thêm, có thể tham khảo [tài liệu phát triển](/plugin-development/server/telemetry) để mở rộng hoặc liên hệ với chúng tôi.

| Tên metric                | Loại metric          | Mô tả                                                                 |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Tỷ lệ phần trăm sử dụng CPU của tiến trình                                                |
| `process_memory_mb`   | `ObservableGauge` | Lượng bộ nhớ sử dụng của tiến trình, đơn vị MB                                              |
| `process_heap_mb`     | `ObservableGauge` | Lượng heap memory sử dụng của tiến trình, đơn vị MB                                            |
| `http_request_cost`   | `Histogram`       | Thời gian request HTTP, đơn vị ms                                               |
| `http_request_count`  | `Counter`         | Số lượng request HTTP                                                        |
| `http_request_active` | `UpDownCounter`   | Số request HTTP đang hoạt động                                                 |
| `sub_app_status`      | `ObservableGauge` | Thống kê số lượng sub-app ở các trạng thái khác nhau, được báo cáo bởi plugin `plugin-multi-app-manager` |
