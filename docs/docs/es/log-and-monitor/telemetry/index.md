---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/log-and-monitor/telemetry/index).
:::

# Telemetría

## Descripción general

El módulo de telemetría (Telemetry) de NocoBase está basado en [OpenTelemetry](https://opentelemetry.io/), proporcionando capacidades de observabilidad unificadas y extensibles para las aplicaciones de NocoBase. Este módulo permite la recopilación y exportación de diversas métricas de la aplicación, incluyendo solicitudes HTTP y el uso de recursos del sistema.

## Configuración de variables de entorno

Para habilitar el módulo de telemetría, debe configurar las [variables de entorno](/get-started/installation/env#how-to-set-environment-variables) correspondientes.

### TELEMETRY_ENABLED

Establézcalo en `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Nombre del servicio.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Exportadores de métricas. Se admiten varios exportadores separados por comas. Consulte la documentación de los exportadores existentes para conocer los valores disponibles.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Métricas a exportar, separadas por comas. Los valores disponibles se pueden consultar en [Métricas](#métricas).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Umbral para el registro de la duración de las solicitudes HTTP (`http_request_cost`), en milisegundos. El valor predeterminado es `0`, lo que significa que se registran todas las solicitudes. Cuando se establece en un valor superior a `0`, solo se registrarán las solicitudes cuya duración supere dicho umbral.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Métricas

Las métricas registradas actualmente por la aplicación se enumeran a continuación. Si necesita más, puede consultar la [documentación de desarrollo](/plugin-development/server/telemetry) para realizar extensiones o ponerse en contacto con nosotros.

| Nombre de la métrica  | Tipo de métrica   | Descripción                                                                                             |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Porcentaje de uso de CPU del proceso                                                                    |
| `process_memory_mb`   | `ObservableGauge` | Uso de memoria del proceso en MB                                                                        |
| `process_heap_mb`     | `ObservableGauge` | Uso de memoria heap del proceso en MB                                                                   |
| `http_request_cost`   | `Histogram`       | Duración de la solicitud HTTP en ms                                                                     |
| `http_request_count`  | `Counter`         | Número de solicitudes HTTP                                                                              |
| `http_request_active` | `UpDownCounter`   | Número actual de solicitudes HTTP activas                                                               |
| `sub_app_status`      | `ObservableGauge` | Estadísticas del recuento de sub-aplicaciones por estado, reportadas por el plugin `plugin-multi-app-manager` |