---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/log-and-monitor/telemetry/index).
:::

# Telemetry

## Tổng quan

Module Telemetry của NocoBase được xây dựng dựa trên [OpenTelemetry](https://opentelemetry.io/), cung cấp khả năng quan sát (observability) thống nhất và có thể mở rộng cho các ứng dụng NocoBase. Module này hỗ trợ thu thập và xuất nhiều loại chỉ số ứng dụng, bao gồm các yêu cầu HTTP, tình trạng sử dụng tài nguyên hệ thống, v.v.

## Cấu hình biến môi trường

Để kích hoạt module telemetry, bạn cần cấu hình các [biến môi trường](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) liên quan.

### TELEMETRY_ENABLED

Cấu hình là `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Tên dịch vụ.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Bộ xuất chỉ số (Metric exporter), hỗ trợ nhiều bộ xuất và được phân tách bằng dấu phẩy. Các giá trị tùy chọn có thể tham khảo tài liệu về các bộ xuất hiện có.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Các chỉ số cần xuất, phân tách bằng dấu phẩy. Các giá trị tùy chọn tham khảo tại phần [Chỉ số](#chỉ-số).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Ngưỡng ghi lại thời gian phản hồi yêu cầu HTTP (`http_request_cost`), đơn vị tính bằng mili giây (ms). Giá trị mặc định là `0`, nghĩa là ghi lại tất cả các yêu cầu. Khi được thiết lập giá trị lớn hơn `0`, chỉ những yêu cầu có thời gian phản hồi vượt quá ngưỡng này mới được ghi lại.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Chỉ số

Các chỉ số hiện đang được ghi lại trong ứng dụng như sau. Nếu bạn có nhu cầu khác, có thể tham khảo [tài liệu phát triển](/plugin-development/server/telemetry) để mở rộng, hoặc liên hệ với chúng tôi.

| Tên chỉ số            | Loại chỉ số       | Mô tả                                                                 |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Tỷ lệ phần trăm sử dụng CPU của tiến trình                           |
| `process_memory_mb`   | `ObservableGauge` | Lượng bộ nhớ tiến trình sử dụng, đơn vị MB                           |
| `process_heap_mb`     | `ObservableGauge` | Lượng bộ nhớ heap của tiến trình sử dụng, đơn vị MB                  |
| `http_request_cost`   | `Histogram`       | Thời gian phản hồi yêu cầu HTTP, đơn vị ms                           |
| `http_request_count`  | `Counter`         | Số lượng yêu cầu HTTP                                                |
| `http_request_active` | `UpDownCounter`   | Số lượng yêu cầu HTTP đang hoạt động hiện tại                        |
| `sub_app_status`      | `ObservableGauge` | Thống kê số lượng ứng dụng con theo các trạng thái khác nhau, được báo cáo bởi plugin `plugin-multi-app-manager` |