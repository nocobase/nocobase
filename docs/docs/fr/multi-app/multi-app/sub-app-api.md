---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Appeler les API des sous-applications'
description: 'Comment appeler les API des sous-applications : passer par l’application d’entrée et préciser la sous-application cible par préfixe de chemin, en-tête ou paramètre de requête.'
keywords: 'multi-applications,API de sous-application,AppSupervisor,application d’entrée,appel API,NocoBase'
---

# Appeler les API des sous-applications

Dans un environnement multi-applications, chaque sous-application possède ses propres API. Lors d'un appel, l'application d'entrée doit savoir vers quelle sous-application router la requête.

Par exemple, une API de l'application principale ressemble généralement à :

```bash
GET /api/users:list
```

`/api` est le préfixe API par défaut et peut être personnalisé avec la variable d'environnement `API_BASE_PATH`.

Pour appeler la même API dans une sous-application, indiquez le nom de cette sous-application.

## Utiliser un préfixe de chemin

Utilisez le préfixe `/api/__app/<appName>/` :

```bash
GET /api/__app/a_xxx/users:list
```

Où :

- `a_xxx` est le nom de la sous-application
- `users:list` est la ressource et l'action appelées
- `/api` est le chemin de base API du système courant

Les paramètres de requête peuvent être ajoutés normalement :

```bash
GET /api/__app/a_xxx/users:list?page=1&pageSize=20
```

Cette méthode est explicite et convient bien aux déploiements multi-environnements.

## Utiliser un en-tête

Si l'appelant utilise déjà une adresse `/api/...` fixe, indiquez la sous-application avec l'en-tête `X-App` :

```bash
curl \
  -H "X-App: a_xxx" \
  http://localhost:13003/api/users:list
```

Cette méthode convient aux appels backend ou aux clients frontend dont les URL d'API sont centralisées.

## Utiliser un paramètre de requête

Vous pouvez aussi utiliser le paramètre `__appName` :

```bash
GET /api/users:list?__appName=a_xxx
```

Avec d'autres paramètres :

```bash
GET /api/users:list?__appName=a_xxx&page=1&pageSize=20
```

En général, le préfixe de chemin ou l'en-tête rend la sous-application cible plus explicite.

## Adresse API en multi-environnement

En multi-environnement, il existe généralement une application d'entrée et plusieurs environnements d'exécution.

Exemple :

- Adresse de l'application d'entrée : `http://localhost:13003`
- Adresse d'un environnement d'exécution : `http://localhost:14000`

Il est recommandé d'appeler les API via l'application d'entrée :

```bash
GET http://localhost:13003/api/__app/a_xxx/users:list
```

L'application d'entrée route la requête selon la configuration. Si vous savez précisément quel environnement appeler, vous pouvez aussi utiliser son adresse :

```bash
GET http://localhost:14000/api/__app/a_xxx/users:list
```

## Domaines propres aux sous-applications

Si une sous-application possède son propre domaine, vous pouvez appeler directement ses API :

```bash
GET https://app-example.example.com/api/users:list
```

Pour passer uniformément par l'application d'entrée, utilisez toujours `/api/__app/<appName>/...`.

## Authentification

Les contrôles d'autorisation restent basés sur la sous-application cible.

Cela signifie :

- Il faut un état de connexion ou un jeton valide pour la sous-application
- La connexion à l'application principale ne donne pas automatiquement des droits API dans la sous-application

Sans informations d'authentification valides, la sous-application renvoie une erreur de non-authentification ou d'autorisation selon sa configuration.
