---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/log-and-monitor/telemetry/index).
:::

# Telemetri

## Ringkasan

Modul Telemetri (Telemetry) NocoBase dibangun di atas [OpenTelemetry](https://opentelemetry.io/), menyediakan kemampuan observabilitas yang terpadu dan dapat diperluas untuk aplikasi NocoBase. Modul ini mendukung pengumpulan dan pengeksporan berbagai metrik aplikasi, termasuk permintaan HTTP, penggunaan sumber daya sistem, dan lainnya.

## Konfigurasi Variabel Lingkungan

Untuk mengaktifkan modul telemetri, Anda perlu mengonfigurasi [variabel lingkungan](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) yang relevan.

### TELEMETRY_ENABLED

Atur ke `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Nama layanan.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Pengekspor metrik (metric exporters). Mendukung beberapa pengekspor yang dipisahkan dengan koma. Silakan merujuk ke dokumentasi pengekspor yang tersedia untuk nilai yang dapat digunakan.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Metrik yang akan diekspor, dipisahkan dengan koma. Nilai yang tersedia dapat merujuk pada bagian [Metrik](#metrik).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Ambang batas (threshold) pencatatan durasi permintaan HTTP (`http_request_cost`), dalam milidetik. Nilai default adalah `0`, yang berarti semua permintaan akan dicatat. Jika diatur ke nilai yang lebih besar dari `0`, hanya permintaan dengan durasi yang melebihi ambang batas tersebut yang akan dicatat.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metrik

Berikut adalah metrik yang saat ini dicatat dalam aplikasi. Jika Anda membutuhkan metrik tambahan, Anda dapat merujuk ke [dokumentasi pengembangan](/plugin-development/server/telemetry) untuk perluasan atau hubungi kami.

| Nama Metrik           | Tipe Metrik       | Deskripsi                                                                                         |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Persentase penggunaan CPU proses                                                                  |
| `process_memory_mb`   | `ObservableGauge` | Penggunaan memori proses dalam MB                                                                 |
| `process_heap_mb`     | `ObservableGauge` | Penggunaan memori heap proses dalam MB                                                            |
| `http_request_cost`   | `Histogram`       | Durasi permintaan HTTP dalam ms                                                                   |
| `http_request_count`  | `Counter`         | Jumlah permintaan HTTP                                                                            |
| `http_request_active` | `UpDownCounter`   | Jumlah permintaan HTTP aktif saat ini                                                             |
| `sub_app_status`      | `ObservableGauge` | Statistik jumlah sub-aplikasi berdasarkan status, dilaporkan oleh plugin `plugin-multi-app-manager` |