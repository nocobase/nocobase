---
title: 'Sécurité et audit'
description: 'Comprendre les méthodes d''authentification, les stratégies de contrôle des permissions, les pratiques recommandées lorsque l''AI Agent construit NocoBase, ainsi que la traçabilité de chaque opération.'
keywords: 'construction par IA, sécurité, permissions, authentification, Token, OAuth, journal d''opérations, audit'
---

# Sécurité et audit

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).

:::

Lorsqu'un utilisateur opère NocoBase via un AI Agent en utilisant le [NocoBase CLI](../ai/quick-start.md), il faut accorder une attention particulière à l'authentification, au contrôle des permissions et à la traçabilité d'audit, afin d'assurer des limites d'opération claires et un processus traçable.

## Authentification

Pour qu'un AI Agent se connecte à NocoBase, il existe principalement deux méthodes d'authentification :

- **Authentification par API key** : générer une API Key via le plugin [API keys](/auth-verification/api-keys/index.md), la configurer dans l'environnement CLI, puis utiliser cette clé pour toutes les requêtes API ultérieures
- **Authentification OAuth** : effectuer une fois la connexion OAuth via le navigateur, puis accéder à l'API en tant qu'utilisateur courant

Les deux méthodes peuvent être utilisées avec la commande `nb`, la différence porte sur la source d'identité, les scénarios d'usage et les stratégies de contrôle des risques.

### Authentification par API key

L'API key est principalement destinée aux tâches automatisées, scriptées et de longue durée, par exemple :

- Faire synchroniser les données par un AI Agent à intervalles réguliers
- Appeler fréquemment `nb api` dans un environnement de développement
- Exécuter avec un rôle fixe une catégorie de tâches de construction claires et stables

Le flux de base est le suivant :

1. Activer le plugin API keys dans NocoBase et créer une API Key
2. Associer cette API Key à un rôle dédié, plutôt que directement aux permissions complètes de `root` ou d'administrateur
3. Utiliser `nb env add` pour enregistrer l'adresse de l'API et le Token dans l'environnement CLI

Par exemple :

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type token \
  --access-token <your-api-key>
```

Une fois la configuration terminée, l'AI Agent peut effectuer des appels API via cet environnement :

```bash
nb api resource list --env local --resource users
```

Cette méthode est stable, adaptée à l'automatisation, et ne nécessite pas que l'utilisateur se reconnecte à chaque fois. Tant que le Token n'a pas expiré, son détenteur peut accéder au système avec les permissions du rôle associé. Soyez donc particulièrement attentif :

- Le Token ne doit être lié qu'à un rôle dédié
- Le sauvegarder uniquement dans les environnements CLI nécessaires
- Effectuer des rotations régulières, ne pas utiliser «jamais expirer» comme option par défaut
- Le supprimer et le régénérer immédiatement en cas de suspicion de fuite

Pour des explications plus générales, consultez le [Guide de sécurité NocoBase](../security/guide.md).

### Authentification OAuth

OAuth est principalement destinée aux tâches qui s'exécutent au nom de l'utilisateur connecté, par exemple :

- Laisser l'IA aider l'administrateur courant à effectuer un ajustement de configuration ponctuel
- Lorsqu'il faut attribuer l'opération à un utilisateur connecté précis
- Ne pas vouloir conserver à long terme un Token à privilèges élevés

Le flux de base est le suivant :

1. Ajouter d'abord un environnement CLI en sélectionnant `oauth` comme méthode d'authentification
2. Exécuter `nb env auth`
3. Le navigateur ouvre la page d'authentification, se connecter et terminer l'authentification
4. Le CLI sauvegarde les informations d'authentification, et les requêtes `nb api` ultérieures accèdent à NocoBase au nom de l'utilisateur courant
5. Si l'utilisateur a plusieurs rôles, il peut spécifier le rôle via `--role`

Par exemple :

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type oauth

nb env auth local
```

`nb env auth` lance le flux de connexion via le navigateur. Une fois l'authentification réussie, le CLI sauvegarde les informations d'authentification dans la configuration de l'environnement courant, après quoi vous pouvez continuer à laisser l'AI Agent appeler `nb api`.

Dans l'implémentation par défaut actuelle :

- La durée de validité du token d'accès OAuth est de **10 minutes**
- La durée de validité du token de rafraîchissement OAuth est de **30 jours**

Le CLI utilisera prioritairement le token de rafraîchissement pour rafraîchir automatiquement la session lorsque le token d'accès est sur le point d'expirer ; si le token de rafraîchissement a expiré, est indisponible, ou si le serveur n'a pas renvoyé de token de rafraîchissement, vous devez réexécuter `nb env auth`.

La particularité d'OAuth est que les requêtes sont généralement exécutées dans le contexte de l'utilisateur connecté et de son rôle, et les enregistrements d'audit sont plus facilement attribuables à l'opérateur réel. Cette méthode est plus adaptée aux opérations impliquant une intervention humaine et nécessitant une confirmation d'identité.

### Pratiques recommandées

Il est recommandé de choisir selon les principes suivants :

- **Tâches de développement, de test, automatisées** : privilégier l'API key, en veillant à la lier à un rôle dédié
- **Production, intervention humaine, attribution d'identité forte requise** : privilégier OAuth
- **Opérations à haut risque** : même si techniquement possible avec un Token, il est recommandé d'utiliser OAuth, et de faire effectuer l'authentification par un utilisateur disposant des permissions appropriées avant exécution

En l'absence d'exigences spécifiques, vous pouvez appliquer les principes par défaut suivants :

- **Utiliser OAuth par défaut**
- **Utiliser une API key uniquement lorsque l'automatisation, l'absence de surveillance ou l'exécution en lot sont explicitement requis**

## Contrôle des permissions

Un AI Agent ne dispose pas de «privilèges supplémentaires» en lui-même. Ce qu'il peut faire dépend entièrement de l'identité et du rôle utilisés.

Autrement dit :

- Lors d'un accès via API key, les limites des permissions sont déterminées par le rôle associé à ce Token
- Lors d'un accès via OAuth, les limites des permissions sont déterminées par l'utilisateur connecté courant et son rôle courant

L'IA ne contourne pas le système ACL de NocoBase. Si un rôle ne dispose pas des permissions de configuration sur une certaine table, un certain champ, une certaine page ou un certain plugin, l'AI Agent ne pourra pas exécuter avec succès la commande correspondante, même s'il la connaît.

### Rôles et stratégies de permissions

Il est recommandé de préparer un rôle dédié pour l'AI Agent, plutôt que de réutiliser un rôle d'administrateur existant.

Ce rôle n'a généralement besoin d'autoriser que les permissions dans les domaines suivants :

- Quelles tables peuvent être manipulées
- Quelles actions peuvent être effectuées, par exemple consulter, créer, mettre à jour, supprimer
- Si l'accès à certaines pages ou menus est autorisé
- Si l'accès aux paramètres système, à la gestion des plugins, à la configuration des permissions et autres zones à haut risque est autorisé

Par exemple, vous pouvez créer un rôle `ai_builder_editor`, autorisé uniquement à :

- Gérer les tables liées au CRM
- Éditer des pages spécifiques
- Déclencher certains workflows
- Ne pas modifier les permissions des rôles
- Ne pas activer, désactiver, installer des plugins
- Ne pas supprimer les tables critiques

Si vous avez besoin que l'IA aide à configurer les permissions, vous pouvez utiliser [Configuration des permissions](./acl.md), mais il est recommandé de définir d'abord les limites de permissions manuellement.

### Principe du moindre privilège

Le principe du moindre privilège est particulièrement important dans le contexte de la construction par IA. Les pratiques suivantes peuvent être adoptées :

1. Créer d'abord un rôle dédié pour l'IA
2. N'ouvrir initialement que les permissions de consultation
3. Compléter progressivement avec les permissions nécessaires (création, édition, etc.) en fonction des tâches
4. Maintenir un contrôle humain sur les opérations à haut risque comme la suppression, la modification de permissions, la gestion de plugins

Par exemple :

- Une IA destinée à la saisie de contenu n'a besoin que des permissions de consultation et de création sur les tables cibles
- Une IA destinée à la construction de pages n'a besoin que des permissions liées aux pages concernées et à la configuration UI
- Une IA destinée à la modélisation des données ne reçoit les permissions de modification de structure de table que sur l'environnement de test, pas directement sur l'environnement de production

Il est déconseillé d'attribuer directement à l'AI Agent les rôles `root`, `admin` ou tout rôle disposant de capacités de configuration système globale. Cette pratique simplifie le déploiement, mais étend considérablement la surface d'exposition des permissions.

## Journaux

Dans le contexte de la construction par IA, les journaux servent à la traçabilité des opérations et à la localisation des problèmes.

Concentrez-vous sur les deux types de journaux suivants :

- **Journaux de requêtes** : enregistrent le chemin, la méthode, le code de statut, la durée et la source des requêtes API
- **Journaux d'audit** : enregistrent l'auteur de l'opération, l'objet manipulé, le résultat et les métadonnées associées pour les opérations sur les ressources clés

Lorsqu'une requête est lancée via `nb api`, le CLI ajoute automatiquement l'en-tête `x-request-source: cli`, ce qui permet au serveur d'identifier que la requête provient du CLI.

### Journaux de requêtes

Les journaux de requêtes enregistrent les informations d'appel API, y compris le chemin de la requête, le statut de la réponse, la durée et le marqueur de source.

Les fichiers de journaux sont généralement situés à :

```bash
storage/logs/<appName>/request_YYYY-MM-DD.log
```

Dans le contexte d'un appel `nb api`, les journaux de requêtes incluront :

- `req.header.x-request-source`

Cela permet de distinguer les requêtes CLI des requêtes navigateur ordinaires.

Pour des explications sur le répertoire et les champs des journaux de requêtes, consultez [Journaux serveur NocoBase](../log-and-monitor/logger/index.md).

### Journaux d'audit

Les journaux d'audit enregistrent l'auteur, la ressource cible, le résultat de l'exécution et les informations de requête associées pour les opérations clés.

Pour les opérations incluses dans le périmètre d'audit, les journaux enregistrent :

- `resource`
- `action`
- `userId`
- `roleName`
- `status`
- `metadata.request.headers.x-request-source`

Par exemple, lorsque l'IA appelle `collections:apply`, `fields:apply` ou d'autres opérations d'écriture auditées via le CLI, les journaux d'audit enregistrent `x-request-source: cli`, ce qui facilite la distinction entre les opérations effectuées via l'interface et celles lancées via le CLI.

Pour une description détaillée des journaux d'audit, consultez [Journaux d'audit](../security/audit-logger/index.md).

## Recommandations de sécurité

Voici quelques recommandations pratiques mieux adaptées au contexte de la construction par IA :

- Ne pas associer directement à l'AI Agent les rôles `root`, `admin` ou les rôles de configuration système globale
- Créer un rôle dédié pour l'AI Agent et découper les limites de permissions par tâche
- Faire tourner régulièrement les API keys, éviter de réutiliser à long terme un même Token à privilèges élevés
- Valider les changements de modélisation, de structure de page et de workflow d'abord en environnement de test, avant de les synchroniser en production
- Activer et vérifier régulièrement les journaux de requêtes et d'audit, pour assurer la traçabilité des opérations clés
- Pour les opérations à haut risque comme la suppression de données, la modification de permissions, l'activation/désactivation de plugins, l'ajustement de la configuration système, il est recommandé de demander une confirmation humaine avant exécution
- Si l'IA doit fonctionner sur le long terme, privilégier la séparation en plusieurs environnements à privilèges réduits, plutôt que de concentrer l'utilisation dans un environnement unique à privilèges élevés

## Liens connexes

- [Démarrage rapide de la construction par IA](./index.md) — installation et préparation de l'environnement
- [Gestion des environnements](./env-bootstrap) — vérification d'environnement, ajout d'environnement et diagnostic
- [Configuration des permissions](./acl.md) — configurer les rôles, les stratégies de permissions et l'évaluation des risques
- [NocoBase CLI](../ai/quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [Guide de sécurité NocoBase](../security/guide.md) — recommandations de configuration de sécurité plus complètes
- [Journaux serveur NocoBase](../log-and-monitor/logger/index.md) — répertoire et champs des journaux de requêtes
- [Journaux d'audit](../security/audit-logger/index.md) — champs et utilisation des enregistrements d'audit
- [NocoBase MCP](../ai/mcp/index.md) — connecter l'AI Agent via le protocole MCP
