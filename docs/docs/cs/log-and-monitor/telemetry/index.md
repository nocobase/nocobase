---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/log-and-monitor/telemetry/index).
:::

# Telemetrie

## Přehled

Modul Telemetrie v NocoBase je postaven na základech [OpenTelemetry](https://opentelemetry.io/) a poskytuje sjednocené a rozšiřitelné možnosti pozorovatelnosti pro aplikace NocoBase. Tento modul podporuje sběr a export různých aplikačních metrik, včetně HTTP požadavků a využití systémových prostředků.

## Konfigurace proměnných prostředí

Pro povolení modulu telemetrie je nutné nakonfigurovat příslušné [proměnné prostředí](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F).

### TELEMETRY_ENABLED

Nastavte na `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Název služby.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Exportéry metrik. Je podporováno více exportérů oddělených čárkou. Dostupné hodnoty naleznete v dokumentaci stávajících exportérů.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Metriky k exportu, oddělené čárkou. Dostupné hodnoty naleznete v části [Metriky](#metriky).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Práh pro zaznamenávání doby trvání HTTP požadavků (`http_request_cost`) v milisekundách. Výchozí hodnota je `0`, což znamená, že jsou zaznamenávány všechny požadavky. Pokud je nastavena hodnota vyšší než `0`, budou zaznamenány pouze požadavky, jejichž doba trvání tento práh překročí.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metriky

Níže jsou uvedeny metriky aktuálně zaznamenávané aplikací. Pokud potřebujete další metriky, můžete se podívat do [vývojářské dokumentace](/plugin-development/server/telemetry) pro rozšíření nebo nás kontaktovat.

| Název metriky         | Typ metriky       | Popis                                                                                        |
| --------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Procentuální využití CPU procesu                                                             |
| `process_memory_mb`   | `ObservableGauge` | Využití paměti procesu v MB                                                                  |
| `process_heap_mb`     | `ObservableGauge` | Využití haldy (heap) paměti procesu v MB                                                     |
| `http_request_cost`   | `Histogram`       | Doba trvání HTTP požadavku v ms                                                              |
| `http_request_count`  | `Counter`         | Počet HTTP požadavků                                                                         |
| `http_request_active` | `UpDownCounter`   | Aktuální počet aktivních HTTP požadavků                                                     |
| `sub_app_status`      | `ObservableGauge` | Statistiky počtu podaplikací podle stavu, hlášené pluginem `plugin-multi-app-manager` |