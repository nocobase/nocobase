# Déploiement en environnement de production

Lors du déploiement de NocoBase en environnement de production, l'installation des dépendances peut s'avérer complexe en raison des différentes méthodes de construction selon les systèmes et les environnements. Pour une expérience fonctionnelle complète, nous vous recommandons d'utiliser **Docker** pour le déploiement. Si votre environnement système ne permet pas l'utilisation de Docker, vous pouvez également déployer NocoBase avec **create-nocobase-app**.

:::warning Attention

Il n'est pas recommandé de déployer directement à partir du code source en environnement de production. Le code source comporte de nombreuses dépendances, est volumineux, et une compilation complète exige des ressources CPU et mémoire élevées. Si vous devez impérativement déployer à partir du code source, nous vous suggérons de construire d'abord une image Docker personnalisée, puis de la déployer.

:::

:::warning Attention

Si vous déployez plusieurs services NocoBase indépendants, utilisez un `hostname` différent pour chaque service, par exemple des sous-domaines distincts. Ne distinguez pas les services uniquement par leur port, comme `https://example.com:13000` et `https://example.com:14000`.

NocoBase utilise des cookies pour conserver l'état de connexion et les [autorisations d'accès aux fichiers](../../file-manager/stable-url.md). Les navigateurs n'isolent pas les cookies par port. Des services exécutés sur différents ports sous le même `hostname` peuvent donc partager des cookies portant le même nom, écraser l'état de connexion ou provoquer des échecs d'autorisation lors de l'aperçu et du téléchargement de fichiers.

Les sous-applications d'un même déploiement NocoBase ne sont pas concernées par cette restriction. Les cookies de connexion sont distingués par le nom de l'application, de sorte que l'application principale et les sous-applications portant des noms différents peuvent partager un même `hostname`.

Les services indépendants doivent toutefois rester isolés. Si un autre service NocoBase s'exécute sur un autre port sous le même `hostname` et contient une application principale ou une sous-application portant le même nom, les cookies peuvent encore entrer en conflit.

Utilisez par exemple `app1.example.com` et `app2.example.com`, puis acheminez-les vers les différents services NocoBase avec Nginx ou Caddy.

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
