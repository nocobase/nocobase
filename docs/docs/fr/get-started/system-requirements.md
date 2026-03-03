:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/get-started/system-requirements).
:::

# Configuration requise

Les exigences système décrites dans ce document concernent uniquement le **service d'application NocoBase lui-même** et couvrent les ressources de calcul et de mémoire nécessaires aux processus de l'application. Elles **n'incluent pas les services tiers dépendants**, y compris, mais sans s'y limiter :

- Passerelles API / Proxys inverses
- Services de base de données (par exemple, MySQL ou PostgreSQL)
- Services de cache (par exemple, Redis)
- Middleware tels que les files d'attente de messages ou le stockage d'objets

À l'exception de la validation de fonctionnalités ou de scénarios purement expérimentaux, **il est fortement recommandé de déployer les services tiers susmentionnés séparément** sur des serveurs ou des conteneurs dédiés, ou d'utiliser directement les services cloud correspondants.

La configuration du système et la planification de la capacité de ces services doivent être évaluées et ajustées séparément en fonction du **volume de données réel, de la charge de travail et du niveau de simultanéité**.

## Mode de déploiement à nœud unique

Le mode de déploiement à nœud unique signifie que le service d'application NocoBase s'exécute sur un seul serveur ou une seule instance de conteneur.

### Configuration matérielle minimale

| Ressource | Exigence |
|---|---|
| CPU | 1 cœur |
| Mémoire | 2 Go |

**Scénarios applicables :**

- Micro-entreprises
- Preuve de concept (POC)
- Environnements de développement / test
- Scénarios avec presque aucun accès simultané

:::info{title=Conseils}

- Cette configuration garantit seulement que le système peut fonctionner ; elle ne garantit pas les performances.
- À mesure que le volume de données ou les requêtes simultanées augmentent, les ressources système peuvent rapidement devenir un goulot d'étranglement.
- Pour le **développement du code source, le développement de plugins ou la construction et le déploiement à partir des sources**, prévoyez **au moins 4 Go de mémoire libre** pour garantir que l'installation des dépendances, la compilation et les étapes de construction se terminent avec succès.

:::

### Configuration matérielle recommandée

| Ressource | Spécifications recommandées |
|---|---|
| CPU | 2 cœurs |
| Mémoire | ≥ 4 Go |

**Scénarios applicables :**

Convient aux charges de travail de petite à moyenne taille avec une simultanéité limitée dans les environnements de production.

:::info{title=Conseils}

- Avec cette configuration, le système peut gérer les opérations d'administration courantes et les charges de travail métier légères.
- Lorsque la complexité métier, les accès simultanés ou les tâches en arrière-plan augmentent, envisagez de mettre à niveau les spécifications matérielles ou de passer au mode cluster.

:::

## Mode Cluster

Le mode cluster est conçu pour les charges de travail de moyenne à grande envergure avec une simultanéité élevée. Vous pouvez effectuer une mise à l'échelle horizontale pour améliorer la disponibilité et le débit du système (voir [Mode Cluster](/cluster-mode) pour plus de détails).

### Configuration matérielle des nœuds

En mode cluster, la configuration matérielle recommandée pour chaque nœud d'application (Pod / instance) est identique à celle du mode de déploiement à nœud unique.

**Configuration minimale par nœud :**

- CPU : 1 cœur
- Mémoire : 2 Go

**Configuration recommandée par nœud :**

- CPU : 2 cœurs
- Mémoire : 4 Go

### Planification du nombre de nœuds

- Le nombre de nœuds dans le cluster peut être étendu selon les besoins (2–N).
- Le nombre réel de nœuds dépend de :
  - Trafic simultané
  - Complexité de la logique métier
  - Tâches en arrière-plan et charges de travail asynchrones
  - Réactivité des dépendances externes

Recommandations pour les environnements de production :

- Ajustez dynamiquement le nombre de nœuds en fonction des indicateurs de surveillance (CPU, mémoire, latence des requêtes, etc.).
- Prévoyez une marge de ressources pour gérer les pics de trafic.