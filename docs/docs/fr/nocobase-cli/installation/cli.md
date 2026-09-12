# Installer à l'aide de CLI (recommandé)

Après NocoBase 2.1.0, la méthode officielle d'installation et de gestion basée sur la CLI est fournie. Vous pouvez l'utiliser pour effectuer l'installation, la connexion, la mise à niveau et la maintenance quotidienne, et vous pouvez également préparer un environnement connectable et exploitable pour AI Agent.

## Installer la CLI NocoBase

Exécuté uniquement lors de l'installation de la CLI pour la première fois.

Installez d'abord la CLI globalement :

```bash
npm install -g @nocobase/cli
nb --version
```

:::tip Il est recommandé d'activer d'abord le mode session

Si vous ouvrez plusieurs terminaux ou shells en même temps, ou si vous souhaitez que l'agent AI fonctionne en parallèle avec vous-même, il est recommandé par défaut d'exécuter [`nb session setup`](../../api/cli/session/setup.md) en premier. De cette façon, chaque session peut conserver son propre `current env` et ne s'influencera pas facilement les unes les autres.

```bash
nb session setup
```

:::

La CLI vérifie les mises à jour automatiques par défaut. Vous pouvez ajuster la stratégie de mise à jour selon vos propres habitudes :

- `prompt` : invite lorsqu'une nouvelle version est trouvée
- `auto` : mise à jour automatique
- `off` : désactivez les mises à jour automatiques

```bash
nb config set update.policy prompt
nb config set update.policy auto
nb config set update.policy off
```

La mise à jour automatique n'est prise en charge que lorsque la CLI est gérée par une installation globale standard npm, pnpm ou yarn. Si elle s'exécute depuis les sources ou depuis l'arbre de dépendances d'un projet local, utilise [`nb self check`](../../api/cli/self/check.md) pour voir la méthode d'installation détectée, puis mets plutôt à jour ce projet parent.

Si vous envisagez de déployer NocoBase sur le serveur et souhaitez ouvrir l'assistant `nb init --ui` à partir d'un navigateur distant, il est recommandé de d'abord remplacer l'hôte par défaut de la CLI par l'adresse IP actuelle du serveur :

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

Remplacez `<server-ip>` par l'adresse IP réelle du serveur actuel qui vous est accessible.

`nb config` est la configuration globale de la CLI. Habituellement, il ne doit être défini qu'une seule fois, et ces valeurs par défaut seront automatiquement utilisées lors de l'exécution ultérieure de `nb init --ui`, il n'est donc pas nécessaire de répéter la configuration à chaque fois.

En général:

- `default-ui-host` sert à générer l'URL accessible depuis le navigateur pour l'assistant `nb init --ui`; le service de l'assistant écoute toujours sur `0.0.0.0`
- `default-api-host` pour l'adresse API générée par défaut sur les nouvelles installations

Si elles sont déployées sur un serveur, les deux valeurs doivent généralement être remplacées par des adresses IP accessibles au serveur actuel, plutôt que de continuer à utiliser l'adresse locale par défaut.

:::warning Il s'agit uniquement d'un assistant d'installation ou d'une méthode d'accès temporaire, et non d'une entrée recommandée pour les environnements de production.

Définissez `default-ui-host` / `default-api-host` sur l'adresse IP du serveur, principalement pour pouvoir ouvrir `nb init --ui` à partir d'un navigateur distant, ou vérifier temporairement si le service est accessible une fois l'installation terminée.

Cela ne signifie pas que l'environnement de production doit utiliser `IP + port` pour fournir des services externes pendant une longue période. Lors du déploiement formel, il est toujours recommandé d'utiliser un nom de domaine et de fournir un accès unifié via un proxy inverse tel que Nginx ou Caddy, puis d'activer HTTPS.

:::

## Installer NocoBase

### Méthode 1 : Installer via l'assistant de l'interface utilisateur

Il s'agit de l'entrée recommandée par défaut. Il vous suffit d'exécuter :

```bash
nb init --ui
```

Si vous souhaitez spécifier un port fixe pour la page de l'assistant, vous pouvez ajouter directement `--ui-port`, par exemple :

```bash
nb init --ui --ui-port 3000
```

![nb init UI assistant](https://static-docs.nocobase.com/2026-06-03-20-54-01.png)

L'assistant vous guidera étape par étape pour terminer la configuration requise pour l'installation ou la connexion en fonction du scénario actuel.

### Méthode 2 : Interagir via le terminal

Si vous êtes plus à l’aise pour taper pas à pas dans le terminal, vous pouvez exécuter directement :

```bash
nb init
```

![2026-06-03-21-36-33](https://static-docs.nocobase.com/2026-06-03-21-36-33.png)

### Méthode 3 : via des commandes non interactives

Si vous exécutez dans un script, CI/CD ou tout autre environnement non interactif, utilisez simplement `--yes`. Dans ce mode, `--env` doit être passé explicitement et les paramètres non explicitement spécifiés seront traités par valeurs par défaut.

La manière par défaut la plus courte de l’écrire est :

```bash
nb init --yes --env app1
```

Spécifique aux combinaisons courantes telles que différentes sources d'installation, sélection de version, certification `basic`, connexion CI/CD aux applications existantes et dénomination de base de données, il suffit de regarder [exemple de référence de commande `nb init`] (exemple ../../api/cli/init.md#).

## Que devez-vous confirmer en premier une fois l'installation terminée ?

`--env` est le nom de l'environnement dans la CLI. De manière générale, la prochaine chose que vous faites une fois l'installation terminée tourne autour de cet environnement.

Il est généralement recommandé de confirmer d’abord ces 3 choses :

1. Si l'environnement a été créé et enregistré avec succès
2. Si l'application peut être démarrée normalement et si les journaux sont normaux
3. Si vous comptez l'ouvrir officiellement au monde extérieur, avez-vous prévu l'entrée dans l'environnement de production au lieu de continuer à utiliser directement `IP + port` ?

### Répertoire d'installation

Si vous venez d'installer une application locale à l'aide de `nb init --env app1`, vous pouvez afficher le chemin complet via `nb env info app1 --field app.appPath`.

Par défaut, la CLI organise les fichiers locaux sous `app-path` selon la convention suivante :

```text
<app-path>/
├── source/   # 应用源码或下载内容对应的默认目录
├── storage/  # 运行时数据目录
└── .env      # 可选的应用环境变量文件
```

En général:

- `source/` correspond principalement au répertoire d'application local de npm/Git env. Pour l'environnement Docker, la CLI conservera également cet ensemble de dérivation de chemin par défaut, mais la plupart du temps, vous n'avez pas besoin de vous en soucier manuellement
- `storage/` est utilisé pour stocker les données d'exécution, telles que les données de la base de données intégrée, les plug-ins, les journaux, etc.
- `.env` est un fichier de variables d'environnement d'application facultatif. Ce n'est que lorsque vous devez personnaliser les variables d'environnement que vous devez les ajouter dans `<app-path>/.env` ; si ce fichier existe, les sources d'installation Docker, npm et Git le liront par défaut.

Voir [`nb init` Command Reference](../../api/cli/init.md) pour une description plus complète.

### Rappel de déploiement de l'environnement de production

Si vous venez de terminer l'installation et que vous souhaitez d'abord vérifier les résultats de l'installation, il n'y a généralement aucun problème à ouvrir la page avec `IP + port`.

Mais si cet environnement doit officiellement fournir des services au monde extérieur, une attention particulière doit être portée :

- `nb init --ui` lui-même n'est qu'une page temporaire de l'assistant d'installation, utilisée pour terminer l'installation ou l'initialisation, et n'est pas l'entrée de service externe officielle de l'application.
- Une fois l'installation via `nb init` terminée, le `IP + port` actuellement exposé par l'application est plus adapté à la phase de débogage, à la phase de vérification ou à l'accès temporaire à l'intranet.
- Dans l'environnement de production, il n'est pas recommandé d'exposer directement le port de l'application NocoBase au réseau public pour une utilisation à long terme.
- Pour un accès externe officiel, il est recommandé d'utiliser un nom de domaine et un proxy inverse vers NocoBase via Nginx ou Caddy
- Les environnements de production doivent donner la priorité à l'activation du HTTPS plutôt qu'à l'utilisation à long terme des `http://IP:port` exposés.

En d'autres termes, `default-ui-host` et `default-api-host` servent simplement à rendre l'assistant d'installation et la génération d'adresses par défaut plus pratiques, et ne représentent pas l'entrée d'accès à l'environnement de production final.

Si cet environnement est prêt à être officiellement lancé, il est recommandé de « se connecter au proxy inverse et d'activer HTTPS » comme étape suivante une fois l'installation terminée, plutôt qu'un élément d'optimisation facultatif.

Si vous êtes prêt à procéder au déploiement formel maintenant, il est recommandé de commencer par [déploiement de l'environnement de production] (../production/index.md), puis de continuer à examiner la configuration du proxy inverse de [Nginx] (../production/reverse-proxy/nginx.md) ou de [Caddy] (../production/reverse-proxy/caddy.md) selon les besoins.

### Opérations quotidiennes

Vous pouvez d'abord confirmer si cet environnement a été enregistré avec succès :

```bash
nb env current
nb env list
nb env status
nb env info app1
nb env info app1 --json
```

Si vous souhaitez poursuivre les opérations ultérieures après l'installation, vous pouvez cliquer sur l'index suivant pour regarder vers le bas :

| Je veux... | Où chercher |
| --- | --- |
| Si vous êtes prêt à rendre cet environnement officiellement ouvert au monde extérieur, connectez-le au proxy inverse de l'environnement de production et utilisez le nom de domaine et HTTPS pour exposer le service. | [Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md). |
| Confirmez si l'environnement est enregistré avec succès, vérifiez quel environnement est actuellement utilisé et basculez entre plusieurs environnements. | [`nb env`](../../api/cli/env/index.md), [Gestion multi-environnement](../operations/multi-environment.md). |
| Démarrez, arrêtez, redémarrez l'application, affichez les journaux ou continuez la mise à niveau de l'application. | [`nb app`](../../api/cli/app/index.md), [Gérer l'application](../operations/manage-app.md). |
| Vérifiez les connexions à la base de données, affichez l'état de la base de données intégrée ou résolvez les problèmes de conteneur de base de données. | [`nb db`](../../api/cli/db/index.md). |
| Afficher les plug-ins installés, activer ou désactiver les plug-ins. | [`nb plugin`](../../api/cli/plugin/index.md). |
| Activez l'autorisation commerciale, vérifiez l'état de l'autorisation et synchronisez les plug-ins commerciaux. | [`nb license`](../../api/cli/license/index.md). |
| Gérez les projets de code source locaux, tels que le téléchargement du code source, le démarrage du mode développement, la construction ou les tests. Ceci est généralement utilisé avec npm/Git env. | [`nb source`](../../api/cli/source/index.md). |

Si vous venez d'installer une application locale, vous pouvez généralement exécuter ces commandes en premier :

```bash
nb env use app1
nb app start
nb app logs
nb plugin list
```

Si vous gérez plusieurs environnements en même temps, consultez [Gestion d'environnements multiples](../operations/multi-environment.md) pour connaître les méthodes de commutation et d'affichage de l'état ultérieures.

Si vous souhaitez mettre à niveau l'application plus tard, consultez simplement [Manage Application](../operations/manage-app.md) et [`nb app upgrade` Command Reference](../../api/cli/app/upgrade.md).

## Liens connexes

- [Référence de commande `nb init`](../../api/cli/init.md)
- [Référence de commande `nb env info`](../../api/cli/env/info.md)
- [Proxy inverse d'environnement de production : Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md)
- [Migrer de l'ancienne méthode vers CLI](./migration.md)
- [Gestion d'environnements multiples](../operations/multi-environment.md)
- [Gérer l'application](../operations/manage-app.md)
