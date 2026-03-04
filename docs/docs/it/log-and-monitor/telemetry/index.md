---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/log-and-monitor/telemetry/index).
:::

# Telemetria

## Panoramica

Il modulo Telemetria (Telemetry) di NocoBase è basato su [OpenTelemetry](https://opentelemetry.io/) e fornisce capacità di osservabilità unificate ed estensibili per le applicazioni NocoBase. Questo modulo supporta la raccolta e l'esportazione di vari parametri dell'applicazione, inclusi le richieste HTTP e l'utilizzo delle risorse di sistema.

## Configurazione delle variabili d'ambiente

Per abilitare il modulo di telemetria, è necessario configurare le relative [variabili d'ambiente](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F).

### TELEMETRY_ENABLED

Configurare su `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Nome del servizio.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Esportatori di metriche. Sono supportati più esportatori, separati da virgole. Consultare la documentazione degli esportatori esistenti per i valori disponibili.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Metriche da esportare, separate da virgole. I valori disponibili possono essere consultati in [Metriche](#metriche).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Soglia per la registrazione della durata delle richieste HTTP (`http_request_cost`), in millisecondi. Il valore predefinito è `0`, il che significa che tutte le richieste vengono registrate. Se impostato su un valore superiore a `0`, verranno registrate solo le richieste la cui durata supera tale soglia.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Metriche

Le metriche attualmente registrate dall'applicazione sono elencate di seguito. Se si necessita di ulteriori metriche, è possibile consultare la [documentazione di sviluppo](/plugin-development/server/telemetry) per l'estensione o contattarci.

| Nome metrica          | Tipo di metrica   | Descrizione                                                                                                   |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Percentuale di utilizzo della CPU del processo                                                                |
| `process_memory_mb`   | `ObservableGauge` | Utilizzo della memoria del processo in MB                                                                     |
| `process_heap_mb`     | `ObservableGauge` | Utilizzo della memoria heap del processo in MB                                                                |
| `http_request_cost`   | `Histogram`       | Durata della richiesta HTTP in ms                                                                             |
| `http_request_count`  | `Counter`         | Numero di richieste HTTP                                                                                      |
| `http_request_active` | `UpDownCounter`   | Numero attuale di richieste HTTP attive                                                                       |
| `sub_app_status`      | `ObservableGauge` | Statistiche del numero di sotto-applicazioni per stato, segnalate dal plugin `plugin-multi-app-manager` |