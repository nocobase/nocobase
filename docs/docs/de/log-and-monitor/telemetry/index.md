---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/log-and-monitor/telemetry/index).
:::

# Telemetrie

## Übersicht

Das Telemetrie-Modul (Telemetry) von NocoBase basiert auf [OpenTelemetry](https://opentelemetry.io/) und bietet einheitliche sowie erweiterbare Beobachtbarkeitsfunktionen für NocoBase-Anwendungen. Dieses Modul unterstützt die Erfassung und den Export verschiedener Anwendungsmetriken, einschließlich HTTP-Anfragen, der Nutzung von Systemressourcen usw.

## Konfiguration der Umgebungsvariablen

Um das Telemetrie-Modul zu aktivieren, müssen Sie die entsprechenden [Umgebungsvariablen](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) konfigurieren.

### TELEMETRY_ENABLED

Auf `on` setzen.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Name des Dienstes.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Metrik-Exporter. Es werden mehrere Exporter unterstützt, die durch Kommas getrennt werden. Verfügbare Werte finden Sie in der Dokumentation der vorhandenen Exporter.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Zu exportierende Metriken, getrennt durch Kommas. Verfügbare Werte finden Sie unter [Metriken](#Metriken).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Schwellenwert für die Aufzeichnung der HTTP-Anfragedauer (`http_request_cost`) in Millisekunden. Der Standardwert ist `0`, was bedeutet, dass alle Anfragen aufgezeichnet werden. Wenn ein Wert größer als `0` eingestellt ist, werden nur Anfragen aufgezeichnet, deren Dauer diesen Schwellenwert überschreitet.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metriken

Die aktuell in der Anwendung aufgezeichneten Metriken sind unten aufgeführt. Wenn Sie weiteren Bedarf haben, können Sie die [Entwicklungsdokumentation](/plugin-development/server/telemetry) zur Erweiterung heranziehen oder uns kontaktieren.

| Metrikname            | Metriktyp         | Beschreibung                                                                                                 |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `process_cpu_percent` | `ObservableGauge` | CPU-Auslastung des Prozesses in Prozent                                                                      |
| `process_memory_mb`   | `ObservableGauge` | Speichernutzung des Prozesses in MB                                                                          |
| `process_heap_mb`     | `ObservableGauge` | Heap-Speichernutzung des Prozesses in MB                                                                     |
| `http_request_cost`   | `Histogram`       | HTTP-Anfragedauer in ms                                                                                      |
| `http_request_count`  | `Counter`         | Anzahl der HTTP-Anfragen                                                                                     |
| `http_request_active` | `UpDownCounter`   | Aktuelle Anzahl aktiver HTTP-Anfragen                                                                        |
| `sub_app_status`      | `ObservableGauge` | Statistik der Anzahl von Unteranwendungen nach Status, gemeldet durch das `plugin-multi-app-manager` Plugin |