---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/log-and-monitor/telemetry/index).
:::

# Telemetri

## Översikt

NocoBase-modulen för telemetri (Telemetry) är byggd på [OpenTelemetry](https://opentelemetry.io/) och erbjuder enhetliga och utökningsbara observationsmöjligheter för NocoBase-applikationer. Denna modul stöder insamling och export av olika applikationsmätvärden, inklusive HTTP-anrop och systemresursanvändning.

## Konfiguration av miljövariabler

För att aktivera telemetrimodulen behöver ni konfigurera relevanta [miljövariabler](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F).

### TELEMETRY_ENABLED

Ställ in på `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Tjänstenamn.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Mätvärdesexportörer. Flera exportörer stöds och separeras med kommatecken. Se dokumentationen för befintliga exportörer för tillgängliga värden.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Mätvärden som ska exporteras, separerade med kommatecken. Tillgängliga värden finns under [Mätvärden](#指标).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Tröskelvärde för registrering av tidsåtgång för HTTP-anrop (`http_request_cost`), i millisekunder. Standardvärdet är `0`, vilket innebär att alla anrop registreras. När det ställs in på ett värde högre än `0` registreras endast anrop vars tidsåtgång överskrider detta tröskelvärde.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Mätvärden

De mätvärden som för närvarande registreras i applikationen listas nedan. Om ni har ytterligare behov kan ni läsa [utvecklingsdokumentationen](/plugin-development/server/telemetry) för utökning eller kontakta oss.

| Mätvärdesnamn         | Mätvärdestyp      | Beskrivning                                                                                       |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Processens CPU-användning i procent                                                               |
| `process_memory_mb`   | `ObservableGauge` | Processens minnesanvändning i MB                                                                  |
| `process_heap_mb`     | `ObservableGauge` | Processens heap-minnesanvändning i MB                                                             |
| `http_request_cost`   | `Histogram`       | Tidsåtgång för HTTP-anrop i ms                                                                    |
| `http_request_count`  | `Counter`         | Antal HTTP-anrop                                                                                  |
| `http_request_active` | `UpDownCounter`   | Nuvarande antal aktiva HTTP-anrop                                                                 |
| `sub_app_status`      | `ObservableGauge` | Statistik över antal underapplikationer per status, rapporteras av pluginet `plugin-multi-app-manager` |