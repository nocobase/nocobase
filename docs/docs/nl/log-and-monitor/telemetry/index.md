---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/log-and-monitor/telemetry/index) voor nauwkeurige informatie.
:::

# Telemetrie

## Overzicht

De Telemetrie-module (Telemetry) in NocoBase is gebouwd op basis van [OpenTelemetry](https://opentelemetry.io/) en biedt uniforme en uitbreidbare observatiemogelijkheden voor NocoBase-applicaties. Deze module ondersteunt het verzamelen en exporteren van verschillende applicatiemetrics, waaronder HTTP-verzoeken en het gebruik van systeembronnen.

## Configuratie van omgevingsvariabelen

Om de telemetrie-module in te schakelen, moet u de relevante [omgevingsvariabelen](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) configureren.

### TELEMETRY_ENABLED

Stel in op `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

De naam van de service.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Metric-exporters. Meerdere exporters worden ondersteund, gescheiden door komma's. Raadpleeg de documentatie van bestaande exporters voor de beschikbare waarden.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

De te exporteren metrics, gescheiden door komma's. Beschikbare waarden vindt u onder [Metrics](#Metrics).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Drempelwaarde voor het vastleggen van de duur van HTTP-verzoeken (`http_request_cost`), in milliseconden. De standaardwaarde is `0`, wat betekent dat alle verzoeken worden vastgelegd. Wanneer ingesteld op een waarde groter dan `0`, worden alleen verzoeken vastgelegd waarvan de duur deze drempelwaarde overschrijdt.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metrics

De metrics die momenteel door de applicatie worden geregistreerd, staan hieronder vermeld. Als u meer nodig heeft, kunt u de [ontwikkelingsdocumentatie](/plugin-development/server/telemetry) raadplegen voor uitbreidingen of contact met ons opnemen.

| Metric-naam           | Metric-type       | Beschrijving                                                                                       |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Percentage CPU-gebruik van het proces                                                             |
| `process_memory_mb`   | `ObservableGauge` | Geheugengebruik van het proces in MB                                                              |
| `process_heap_mb`     | `ObservableGauge` | Heap-geheugengebruik van het proces in MB                                                         |
| `http_request_cost`   | `Histogram`       | Duur van HTTP-verzoek in ms                                                                       |
| `http_request_count`  | `Counter`         | Aantal HTTP-verzoeken                                                                             |
| `http_request_active` | `UpDownCounter`   | Huidig aantal actieve HTTP-verzoeken                                                              |
| `sub_app_status`      | `ObservableGauge` | Statistieken van het aantal sub-applicaties per status, gerapporteerd door de `plugin-multi-app-manager` plugin |