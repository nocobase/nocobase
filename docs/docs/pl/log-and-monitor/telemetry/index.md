---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/log-and-monitor/telemetry/index).
:::

# Telemetria

## Przegląd

Moduł Telemetrii (Telemetry) w NocoBase jest oparty na [OpenTelemetry](https://opentelemetry.io/), zapewniając ujednolicone i rozszerzalne możliwości obserwacji (observability) dla aplikacji NocoBase. Moduł ten wspiera zbieranie i eksportowanie różnych metryk aplikacji, w tym żądań HTTP oraz wykorzystania zasobów systemowych.

## Konfiguracja zmiennych środowiskowych

Aby włączyć moduł telemetrii, należy skonfigurować odpowiednie [zmienne środowiskowe](/get-started/installation/env#how-to-set-environment-variables).

### TELEMETRY_ENABLED

Ustaw na `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Nazwa usługi.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Eksporterzy metryk. Obsługiwanych jest wielu eksporterów, oddzielonych przecinkami. Dostępne wartości można znaleźć w dokumentacji istniejących eksporterów.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Metryki do wyeksportowania, oddzielone przecinkami. Dostępne wartości znajdują się w sekcji [Metryki](#metryki).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Próg rejestrowania czasu trwania żądania HTTP (`http_request_cost`), w milisekundach. Wartość domyślna to `0`, co oznacza rejestrowanie wszystkich żądań. Gdy ustawiona jest wartość większa niż `0`, rejestrowane będą tylko te żądania, których czas trwania przekracza ten próg.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metryki

Poniżej wymieniono metryki aktualnie rejestrowane przez aplikację. Jeśli potrzebują Państwo dodatkowych metryk, mogą Państwo zapoznać się z [dokumentacją programistyczną](/plugin-development/server/telemetry) w celu ich rozszerzenia lub skontaktować się z nami.

| Nazwa metryki         | Typ metryki       | Opis                                                                                               |
| --------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Procentowe zużycie procesora przez proces                                                          |
| `process_memory_mb`   | `ObservableGauge` | Zużycie pamięci przez proces w MB                                                                  |
| `process_heap_mb`     | `ObservableGauge` | Zużycie pamięci sterty (heap) przez proces w MB                                                    |
| `http_request_cost`   | `Histogram`       | Czas trwania żądania HTTP w ms                                                                     |
| `http_request_count`  | `Counter`         | Liczba żądań HTTP                                                                                  |
| `http_request_active` | `UpDownCounter`   | Bieżąca liczba aktywnych żądań HTTP                                                                |
| `sub_app_status`      | `ObservableGauge` | Statystyki liczby pod-aplikacji według statusu, raportowane przez wtyczkę `plugin-multi-app-manager` |