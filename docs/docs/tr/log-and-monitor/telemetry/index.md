---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/log-and-monitor/telemetry/index) bakın.
:::

# Telemetri

## Genel Bakış

NocoBase'in Telemetri (Telemetry) modülü, [OpenTelemetry](https://opentelemetry.io/) üzerine inşa edilmiştir ve NocoBase uygulamaları için birleşik, genişletilebilir gözlemlenebilirlik yetenekleri sunar. Bu modül, HTTP istekleri ve sistem kaynak kullanımı dahil olmak üzere çeşitli uygulama metriklerinin toplanmasını ve dışa aktarılmasını destekler.

## Çevresel Değişken Yapılandırması

Telemetri modülünü etkinleştirmek için ilgili [çevresel değişkenleri](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) yapılandırmanız gerekir.

### TELEMETRY_ENABLED

`on` olarak ayarlayın.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Servis adı.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Metrik dışa aktarıcılar. Virgülle ayrılmış birden fazla dışa aktarıcı desteklenir. Mevcut değerler için mevcut dışa aktarıcı belgelerine bakın.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Dışa aktarılacak metrikler, virgülle ayrılır. Kullanılabilir değerler için [Metrikler](#metrikler) bölümüne bakabilirsiniz.

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

HTTP istek süresi (`http_request_cost`) kayıt eşiği, milisaniye cinsinden. Varsayılan değer `0`'dır, yani tüm istekler kaydedilir. `0`'dan büyük bir değere ayarlandığında, yalnızca süresi bu eşiği aşan istekler kaydedilir.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metrikler

Şu anda uygulamada kaydedilen metrikler aşağıda listelenmiştir. Daha fazla metriğe ihtiyacınız varsa, genişletme için [geliştirme belgelerine](/plugin-development/server/telemetry) başvurabilir veya bizimle iletişime geçebilirsiniz.

| Metrik Adı            | Metrik Türü       | Açıklama                                                                                           |
| --------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | İşlem CPU kullanım yüzdesi                                                                         |
| `process_memory_mb`   | `ObservableGauge` | İşlem bellek kullanımı, MB cinsinden                                                               |
| `process_heap_mb`     | `ObservableGauge` | İşlem yığın (heap) bellek kullanımı, MB cinsinden                                                  |
| `http_request_cost`   | `Histogram`       | HTTP istek süresi, ms cinsinden                                                                    |
| `http_request_count`  | `Counter`         | HTTP istek sayısı                                                                                  |
| `http_request_active` | `UpDownCounter`   | Mevcut aktif HTTP istek sayısı                                                                     |
| `sub_app_status`      | `ObservableGauge` | Duruma göre alt uygulama sayısı istatistikleri, `plugin-multi-app-manager` eklentisi tarafından raporlanır |