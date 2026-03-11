---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/log-and-monitor/telemetry/index).
:::

# Телеметрия

## Обзор

Модуль телеметрии (Telemetry) NocoBase основан на [OpenTelemetry](https://opentelemetry.io/) и предоставляет унифицированные и расширяемые возможности мониторинга (observability) для приложений NocoBase. Этот модуль поддерживает сбор и экспорт различных метрик приложения, включая HTTP-запросы, использование системных ресурсов и др.

## Настройка переменных окружения

Для включения модуля телеметрии необходимо настроить соответствующие [переменные окружения](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F).

### TELEMETRY_ENABLED

Установите значение `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Имя сервиса.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Экспортеры метрик. Поддерживается несколько экспортеров, разделенных запятыми. Доступные значения см. в документации существующих экспортеров.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Метрики для экспорта, разделенные запятыми. Доступные значения см. в разделе [Метрики](#метрики).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Порог записи длительности HTTP-запроса (`http_request_cost`) в миллисекундах. Значение по умолчанию — `0`, что означает запись всех запросов. Если установлено значение больше `0`, будут записываться только те запросы, длительность которых превышает этот порог.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Метрики

Ниже перечислены метрики, записываемые приложением в данный момент. Если вам требуется больше возможностей, вы можете обратиться к [документации по разработке](/plugin-development/server/telemetry) для расширения функционала или связаться с нами.

| Название метрики      | Тип метрики       | Описание                                                                                                   |
| --------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Процент использования CPU процессом                                                                        |
| `process_memory_mb`   | `ObservableGauge` | Использование памяти процессом, в МБ                                                                       |
| `process_heap_mb`     | `ObservableGauge` | Использование кучи (heap) памяти процессом, в МБ                                                           |
| `http_request_cost`   | `Histogram`       | Длительность HTTP-запроса, в мс                                                                            |
| `http_request_count`  | `Counter`         | Количество HTTP-запросов                                                                                   |
| `http_request_active` | `UpDownCounter`   | Текущее количество активных HTTP-запросов                                                                  |
| `sub_app_status`      | `ObservableGauge` | Статистика количества суб-приложений по разным статусам, передаваемая плагином `plugin-multi-app-manager` |