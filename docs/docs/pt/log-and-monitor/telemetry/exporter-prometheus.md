---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Exportador de Telemetria: Prometheus

## Configuração de Variáveis de Ambiente

### TELEMETRY_METRIC_READER

Tipo de exportador de métricas de telemetria.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Define se deve iniciar um servidor independente.

- `off`. O endpoint de coleta (scrape) é `/api/prometheus:metrics`.
- `on`. O endpoint de coleta (scrape) é `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Porta do serviço ao iniciar um servidor independente, o padrão é `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Configuração do Prometheus

Usando a API interna do NocoBase:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Iniciando um servidor independente:

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```