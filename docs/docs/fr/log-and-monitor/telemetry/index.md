---
pkg: '@nocobase/plugin-telemetry'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/log-and-monitor/telemetry/index).
:::

# Télémétrie

## Aperçu

Le module de télémétrie (Telemetry) de NocoBase est basé sur [OpenTelemetry](https://opentelemetry.io/), offrant des capacités d'observabilité unifiées et extensibles pour les applications NocoBase. Ce module prend en charge la collecte et l'exportation de diverses métriques d'application, y compris les requêtes HTTP et l'utilisation des ressources système.

## Configuration des variables d'environnement

Pour activer le module de télémétrie, vous devez configurer les [variables d'environnement](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) correspondantes.

### TELEMETRY_ENABLED

Configurez sur `on`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

Nom du service.

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

Exportateurs de métriques. Plusieurs exportateurs sont pris en charge, séparés par des virgules. Les valeurs possibles incluent celles des exportateurs documentés.

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

Métriques à exporter, séparées par des virgules. Les valeurs disponibles peuvent être consultées dans la section [Métriques](#métriques).

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

Seuil d'enregistrement de la durée des requêtes HTTP (`http_request_cost`), en millisecondes. La valeur par défaut est `0`, ce qui signifie que toutes les requêtes sont enregistrées. Lorsqu'elle est définie sur une valeur supérieure à `0`, seules les requêtes dont la durée dépasse ce seuil seront enregistrées.

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## Métriques

Les métriques actuellement enregistrées dans l'application sont listées ci-dessous. Si vous avez des besoins supplémentaires, vous pouvez vous référer à la [documentation de développement](/plugin-development/server/telemetry) pour effectuer une extension, ou nous contacter.

| Nom de la métrique    | Type de métrique  | Description                                                                                         |
| --------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `process_cpu_percent` | `ObservableGauge` | Pourcentage d'utilisation du processeur (CPU) par le processus                                      |
| `process_memory_mb`   | `ObservableGauge` | Utilisation de la mémoire par le processus, en Mo                                                   |
| `process_heap_mb`     | `ObservableGauge` | Utilisation de la mémoire tas (heap) par le processus, en Mo                                        |
| `http_request_cost`   | `Histogram`       | Durée de la requête HTTP, en ms                                                                     |
| `http_request_count`  | `Counter`         | Nombre de requêtes HTTP                                                                             |
| `http_request_active` | `UpDownCounter`   | Nombre actuel de requêtes HTTP actives                                                              |
| `sub_app_status`      | `ObservableGauge` | Statistiques du nombre de sous-applications par statut, rapportées par le plugin `plugin-multi-app-manager` |