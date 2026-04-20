---
pkg: '@nocobase/plugin-telemetry-prometheus'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/log-and-monitor/telemetry/exporter-prometheus).
:::

# Exportateur de télémétrie : Prometheus

## Configuration des variables d'environnement

### TELEMETRY_METRIC_READER

Type d'exportateur de métriques de télémétrie.

```bash
TELEMETRY_METRIC_READER=prometheus
```

### TELEMETRY_PROMETHEUS_SERVER

Indique s'il faut démarrer un serveur autonome.

- `off`. Le point de terminaison de collecte (scrape) est `/api/prometheus:metrics`.
- `on`. Le point de terminaison de collecte (scrape) est `host:port:metrics`.

```bash
TELEMETRY_PROMETHEUS_SERVER=off
```

### TELEMETRY_PROMETHEUS_PORT

Port du serveur autonome lors de son démarrage, la valeur par défaut est `9464`.

```bash
TELEMETRY_PROMETHEUS_PORT=9464
```

### Configuration de Prometheus

Utilisation de l'API interne de NocoBase :

```yaml
scrape_configs:
  - job_name: 'nocobase'
    metrics_path: '/api/prometheus:metrics'
    static_configs:
      - targets: ['localhost:13001']
```

Utilisation du serveur autonome :

```yaml
scrape_configs:
  - job_name: 'nocobase'
    static_configs:
      - targets: ['localhost:9464']
```