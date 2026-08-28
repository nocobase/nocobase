---
pkg: '@nocobase/plugin-telemetry'
---

# Телеметрия

## Обзор

Модуль телеметрии в NocoBase построен на базе [OpenTelemetry](https://opentelemetry.io/) и предоставляет единые расширяемые возможности наблюдаемости для приложений NocoBase. Модуль поддерживает сбор и экспорт различных показателей приложения, включая HTTP-запросы и использование системных ресурсов.

## Переменные окружения

Чтобы включить модуль телеметрии, необходимо настроить соответствующие [переменные окружения](/get-started/installation/env#how-to-set-environment-variables).

### TELEMETRY_ENABLED

Установите `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Имя сервиса.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Экспортёры показателей. Поддерживается несколько экспортёров, перечисленных через запятую. Допустимые значения смотрите в документации конкретных экспортёров.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Показатели для экспорта, перечисленные через запятую. Доступные значения см. в разделе [Метрики](#Metrics).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Порог записи длительности HTTP-запроса (`http_request_cost`) в миллисекундах. Значение по умолчанию — `0`, то есть записываются все запросы. Если установить значение больше `0`, будут записываться только запросы с длительностью выше порога.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Метрики

Текущие показатели, записываемые приложением, перечислены ниже. Если нужны дополнительные показатели, см. [документацию для разработки](/plugin-development/server/telemetry) по расширению или свяжитесь с нами.

| Название показателя   | Тип показателя    | Описание                                                                                          |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Процент использования CPU процесса                                                                |
| `process_memory_mb`   | `ObservableGauge` | Использование памяти процесса в МБ                                                                |
| `process_heap_mb`     | `ObservableGauge` | Использование динамической памяти процесса в МБ                                                           |
| `http_request_cost`   | `Histogram`       | Длительность HTTP-запроса в мс                                                                    |
| `http_request_count`  | `Counter`         | Количество HTTP-запросов                                                                          |
| `http_request_active` | `UpDownCounter`   | Текущее число активных HTTP-запросов                                                              |
| `sub_app_status`      | `ObservableGauge` | Статистика количества подприложений по статусам, отправляемая плагином `plugin-multi-app-manager` |