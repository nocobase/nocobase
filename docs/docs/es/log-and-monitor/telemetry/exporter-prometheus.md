---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Exportador de telemetría: Prometheus

## Configuración de variables de entorno

### TELEMETRY_METRIC_READER

Tipo de exportador de métricas de telemetría.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Indica si se debe iniciar un servidor independiente.

- `off`. El endpoint de recolección (scrape) es `/api/prometheus:metrics`.
- `on`. El endpoint de recolección (scrape) es `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Puerto del servicio cuando se inicia un servidor independiente; el valor predeterminado es `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Configuración de Prometheus

Uso de la API interna de NocoBase:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Uso del servidor independiente:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```