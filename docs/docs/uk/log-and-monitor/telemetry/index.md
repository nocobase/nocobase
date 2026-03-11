---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/log-and-monitor/telemetry/index).
:::

# Телеметрія

## Огляд

Модуль телеметрії (Telemetry) у NocoBase побудований на основі [OpenTelemetry](https://opentelemetry.io/), забезпечуючи уніфіковані та розширювані можливості спостережуваності для додатків NocoBase. Цей модуль підтримує збір та експорт різних метрик додатка, включаючи HTTP-запити, використання системних ресурсів тощо.

## Конфігурація змінних оточення

Щоб увімкнути модуль телеметрії, вам потрібно налаштувати відповідні [змінні оточення](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F).

### TELEMETRY_ENABLED

Встановіть значення `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Назва сервісу.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Експортери метрик. Підтримується декілька експортерів, розділених комами. Доступні значення дивіться в документації існуючих експортерів.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Метрики для експорту, розділені комами. Доступні значення можна знайти в розділі [Метрики](#метрики).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Поріг запису тривалості HTTP-запиту (`http_request_cost`) у мілісекундах. Значення за замовчуванням — `0`, що означає запис усіх запитів. Якщо встановлено значення більше `0`, записуватимуться лише ті запити, тривалість яких перевищує цей поріг.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Метрики

Нижче наведено метрики, які наразі реєструються додатком. Якщо вам потрібні додаткові метрики, ви можете звернутися до [документації з розробки](/plugin-development/server/telemetry) для розширення або зв'язатися з нами.

| Назва метрики         | Тип метрики       | Опис                                                                                              |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Відсоток використання CPU процесом                                                                |
| `process_memory_mb`   | `ObservableGauge` | Використання пам'яті процесом у МБ                                                                |
| `process_heap_mb`     | `ObservableGauge` | Використання пам'яті купи (heap) процесом у МБ                                                    |
| `http_request_cost`   | `Histogram`       | Тривалість HTTP-запиту в мс                                                                       |
| `http_request_count`  | `Counter`         | Кількість HTTP-запитів                                                                            |
| `http_request_active` | `UpDownCounter`   | Поточна кількість активних HTTP-запитів                                                           |
| `sub_app_status`      | `ObservableGauge` | Статистика кількості піддодатків за статусом, що надається плагіном `plugin-multi-app-manager` |