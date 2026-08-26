---
pkg: '@nocobase/plugin-telemetry'
title: "Telemetri dan Monitoring NocoBase"
description: "Telemetri berbasis OpenTelemetry: durasi/jumlah HTTP request, CPU/memori proses, status sub-app, konfigurasi variabel lingkungan TELEMETRY, ekspor Prometheus/HTTP."
keywords: "telemetri,Telemetry,OpenTelemetry,metric monitoring,Prometheus,http_request_cost,process_cpu,NocoBase"
---
# Telemetri

## Ikhtisar

Modul Telemetri NocoBase didasarkan pada [OpenTelemetry](https://opentelemetry.io/), menyediakan kemampuan observability terpadu dan extensible untuk aplikasi NocoBase. Modul ini mendukung pengumpulan dan ekspor berbagai metric aplikasi, termasuk HTTP request, penggunaan resource sistem, dan lainnya.

## Konfigurasi Variabel Lingkungan

Untuk mengaktifkan modul Telemetri, Anda perlu mengkonfigurasi [variabel lingkungan](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) terkait.

### TELEMETRY_ENABLED

Konfigurasikan sebagai `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Nama service.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Metric exporter, mendukung beberapa exporter, dipisahkan dengan koma. Untuk nilai opsional, lihat dokumen exporter yang ada.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Metric yang perlu di-export, dipisahkan dengan koma. Untuk nilai opsional, lihat [Metric](#metric).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Threshold pencatatan durasi HTTP request (`http_request_cost`), satuan milidetik. Nilai default `0`, artinya mencatat semua request. Saat diatur ke nilai lebih besar dari `0`, hanya mencatat request yang durasinya melebihi threshold tersebut.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metric

Saat ini metric yang dicatat dalam aplikasi adalah sebagai berikut. Jika Anda memiliki kebutuhan lebih, Anda dapat merujuk ke [dokumen pengembangan](/plugin-development/server/telemetry) untuk melakukan ekstensi, atau hubungi kami.

| Nama metric           | Tipe metric       | Deskripsi                                                            |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Persentase penggunaan CPU proses                                     |
| `process_memory_mb`   | `ObservableGauge` | Penggunaan memori proses, satuan MB                                  |
| `process_heap_mb`     | `ObservableGauge` | Penggunaan heap memory proses, satuan MB                             |
| `http_request_cost`   | `Histogram`       | Durasi HTTP request, satuan ms                                       |
| `http_request_count`  | `Counter`         | Jumlah HTTP request                                                  |
| `http_request_active` | `UpDownCounter`   | Jumlah HTTP request aktif saat ini                                   |
| `sub_app_status`      | `ObservableGauge` | Statistik jumlah sub-app dengan status berbeda saat ini, dilaporkan oleh Plugin `plugin-multi-app-manager` |
