# Comment connecter l'ancienne méthode d'installation à AI et migrer vers CLI

Si vous utilisez toujours le code source Docker, `create-nocobase-app` ou Git pour installer et maintenir NocoBase selon l'ancienne documentation, vous pouvez continuer à l'utiliser de cette manière. Il n'est pas nécessaire de réinstaller immédiatement l'application pour accéder à l'IA.

Cette page vous aide principalement à déterminer l'itinéraire en premier :

- Continuez à utiliser les méthodes d'installation et de mise à niveau d'origine
- Laissez les applications existantes accéder en premier à l'agent AI
- Migrer vers une nouvelle approche basée sur CLI

Par défaut, il est recommandé de vérifier d'abord à quelle catégorie vous appartenez, puis de saisir le document correspondant. Ceci est plus stable et moins susceptible de mal gérer l’environnement de production.

## Quelle méthode dois-je choisir ?

| Si tu veux maintenant... | Que faire par défaut |
| --- | --- |
| Continuer à installer, mettre à niveau et maintenir les applications de la manière originale | Continuez simplement à utiliser l'ancienne méthode, lisez d'abord l'entrée du document pertinent ci-dessous |
| Laisser une ancienne application qui s'exécute de manière stable se connecter à l'agent AI | Par défaut, la connexion à distance est utilisée en premier, ce qui présente le risque le plus faible |
| Utilisez `nb app`, `nb env`, `nb source` pour gérer les applications à l'avenir | Créez une nouvelle application CLI et migrez-y les anciennes données |

## Continuez à utiliser la méthode d'installation d'origine

Si vous êtes habitué à la méthode d'installation précédente, vous pouvez continuer à l'utiliser. Suivez simplement les documents originaux pour l'installation, la mise à niveau et la configuration des variables d'environnement.

### Installer NocoBase

- [Installation de Docker](/get-started/installation/docker)
- [installation create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Installation du code source Git](/get-started/installation/git)
- [Variables d'environnement](/get-started/installation/env)

### Mettre à niveau NocoBase

- [Mise à niveau de l'installation de Docker](/get-started/upgrading/docker)
- [Mise à niveau de l'installation de create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Mise à niveau de l'installation du code source de Git](/get-started/upgrading/git)

## Méthode 1 : Autoriser d'abord les applications existantes à accéder à l'agent AI

Si votre ancienne application fonctionne déjà de manière stable, utilisez cette méthode par défaut.

L'objectif de cette méthode est de connecter d'abord les applications existantes à l'agent CLI et AI via une connexion à distance. Il s’agit du risque le plus faible car il ne prend pas directement en charge vos processus actuels d’installation, de démarrage, d’arrêt et de mise à niveau.

Mais il faut d’abord clarifier les limites :

- Cette méthode n'a pas de fonctionnalités liées à `nb app`
- Il ne prend pas en charge la gestion de l'exécution des anciennes applications à votre place
- Mais les capacités liées à la construction de l'IA peuvent être utilisées normalement

En d'autres termes, si ce qui vous intéresse le plus en ce moment est de « connecter d'abord l'IA » plutôt que de « basculer immédiatement l'ensemble du système de gestion des opérations vers la CLI », vous emprunterez ce chemin en premier par défaut.

Lors de la connexion à une application existante, vous pouvez initialiser un environnement CLI comme ceci :

```bash
# 默认使用 OAuth 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api

# 使用 token 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api \
  --auth-type=token \
  --access-token=<token>
```

Si une réauthentification est requise ultérieurement, vous pouvez exécuter :

```bash
nb env auth app1
```

Si vous souhaitez simplement commencer à utiliser l'IA pour développer des capacités, continuez simplement à lire [AI Build Quick Start](/ai-builder/).

## Méthode 2 : Migrer vers CLI

Si vous souhaitez utiliser `nb app`, `nb env` et `nb source` pour gérer des applications locales à l'avenir, l'approche la plus sûre n'est pas de reprendre directement l'application existante, mais de créer une nouvelle application, puis d'y migrer les données de l'ancienne application.

La raison est également très simple : la possibilité de « reprendre des applications existantes » est encore en développement.

Ainsi, pour le moment, l’itinéraire de migration recommandé par défaut est :

1. Créez d’abord une nouvelle application CLI
2. Migrez la base de données, `storage` et les variables d'environnement de l'ancienne application.
3. Après avoir vérifié que le fonctionnement, la mise à niveau et les capacités d'IA de la nouvelle application sont normaux, décidez si vous souhaitez passer à l'environnement de production.

Créez d’abord un nouvel environnement CLI :

```bash
nb init --yes --env app1
```

Avant de migrer, il est recommandé de confirmer que ces contenus sont prêts :

1. La base de données a été sauvegardée
2. Le répertoire `storage` a été sauvegardé
3. Les variables d'environnement clés de l'ancienne application ont été enregistrées, telles que `APP_KEY`, `TZ`, `DB_*`, `DB_UNDERSCORED`

Par défaut, il suffit au préalable de migrer l’environnement de test. Migrez l'environnement de production uniquement lorsque vous avez confirmé que la sauvegarde, les variables d'environnement et la configuration de la base de données sont toutes correctes.

## Où chercher ensuite

- Si vous êtes prêt à installer et gérer les applications d'une nouvelle manière, passez à [Installation à l'aide de CLI (recommandé)](./cli.md)
- Si vous continuez simplement à utiliser la méthode d'installation d'origine, revenez simplement à l'entrée du document d'installation et de mise à niveau ci-dessus.
