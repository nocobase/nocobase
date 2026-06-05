:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Déploiement en environnement de production

Lors du déploiement de NocoBase en environnement de production, l'installation des dépendances peut s'avérer complexe en raison des différentes méthodes de construction selon les systèmes et les environnements. Pour une expérience fonctionnelle complète, nous vous recommandons d'utiliser **Docker** pour le déploiement. Si votre environnement système ne permet pas l'utilisation de Docker, vous pouvez également déployer NocoBase avec **create-nocobase-app**.

:::warning

Il n'est pas recommandé de déployer directement à partir du code source en environnement de production. Le code source comporte de nombreuses dépendances, est volumineux, et une compilation complète exige des ressources CPU et mémoire élevées. Si vous devez impérativement déployer à partir du code source, nous vous suggérons de construire d'abord une image Docker personnalisée, puis de la déployer.

:::

## Processus de déploiement

Pour le déploiement en environnement de production, vous pouvez vous référer aux étapes d'installation et de mise à niveau existantes.

### Nouvelle installation

- [Installation Docker](../installation/docker.mdx)
- [Installation avec create-nocobase-app](../installation/create-nocobase-app.mdx)

### Mise à niveau de l'application

- [Mise à niveau d'une installation Docker](../installation/docker.mdx)
- [Mise à niveau d'une installation create-nocobase-app](../installation/create-nocobase-app.mdx)

### Installation et mise à niveau des plugins tiers

- [Installation et mise à niveau des plugins](../install-upgrade-plugins.mdx)

## Proxy pour les ressources statiques

En environnement de production, il est recommandé de confier la gestion des ressources statiques à un serveur proxy, par exemple :

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Commandes d'opérations courantes

Selon la méthode d'installation, vous pouvez utiliser les commandes suivantes pour gérer le processus NocoBase :

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)