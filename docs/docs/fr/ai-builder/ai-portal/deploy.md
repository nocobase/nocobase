---
title: "Déploiement et gestion des sources"
description: "Le processus complet de développement, de push et de déploiement d'un AI Portal, ainsi que les deux modes de source storage et le déploiement multi-environnements."
keywords: "AI Portal, déploiement, source storage, Git, nb portal deploy, nb portal push, multi-environnements"
---

# Déploiement et gestion des sources

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir un premier Portal en fonctionnement en suivant le [Démarrage rapide de l'AI Portal](./index.md).

:::

Le code source d'un Portal vit à trois endroits : l'espace de travail de développement local, le source storage et les artefacts déployés. `nb portal` les maintient synchronisés.

## Le cycle de vie complet

La boucle quotidienne se présente ainsi :

```text
dev (développement local) → push (pousser le code source) → deploy (construire et déployer)
```

Où :

1. `nb portal dev <portal>` — démarrer le serveur de développement local, modifier le code et voir le résultat
2. `nb portal push <portal>` — pousser les modifications locales du code source vers le source storage
3. `nb portal deploy <portal>` — construire et déployer, pour rendre les modifications visibles aux utilisateurs

Si vous reprenez un Portal créé par un collègue, ou si vous avez changé de machine, récupérez-le d'abord en local :

```bash
nb portal list                 # Voir les Portals existants
nb portal pull customer        # Récupérer le code source en local
nb portal dev customer         # Commencer à développer
```

`pull` télécharge et décompresse le code source dans l'espace de travail de développement, `./<portal>` par défaut, ou ailleurs avec `--path`. Les dépendances sont installées automatiquement ; ajoutez `--no-install` pour l'éviter en CI ou si vous préférez les installer vous-même.

Après une récupération réussie, l'emplacement de l'espace de travail de développement est enregistré dans la configuration du CLI env, de sorte que `dev`, `push` et `deploy` y lisent tous le code source sans que vous ayez à le préciser à chaque fois.

## Ajouter un Portal

Une application peut avoir plusieurs Portals, avec des pages et des permissions distinctes mais des données partagées. Par exemple un point d'entrée pour les collaborateurs internes et un pour les clients externes :

```bash
nb portal create customer
```

La création génère `./customer` dans le répertoire courant comme espace de travail de développement à partir du modèle `@nocobase/portal-template-default`, écrit `.env` et `.env.local`, puis installe les dépendances. Utilisez `--path` pour le placer ailleurs.

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

Un nom de Portal ne peut contenir que des lettres minuscules, des chiffres, des traits de soulignement et des tirets, et doit commencer par une lettre minuscule ou un chiffre.

## source storage

Le code source d'un Portal peut être conservé à deux endroits :

| Mode | Description | Quand l'utiliser |
| --- | --- | --- |
| `nocobase` | Le mode par défaut, où le code source est géré par le source storage de NocoBase | Démarrer rapidement, développement en solo, pas de revue de code nécessaire |
| `git` | Le code source est enregistré dans un dépôt Git que vous indiquez | Collaboration en équipe, revue de code, intégration CI |

Le mode `nocobase` par défaut est le plus rapide à mettre en route, puisque vous n'avez pas besoin d'un dépôt au préalable. Il n'a toutefois pas d'historique de versions : une mauvaise modification ne peut être annulée qu'en écrasant l'ensemble. **Si ce Portal doit être maintenu sur la durée, passez-le tôt sur Git.**

### Passer à Git

`create` ne fait que générer l'espace de travail de développement ; la configuration du source storage passe par `config`. Vous pouvez basculer à tout moment après la création :

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

`config` synchronise le réglage du source storage avec l'enregistrement distant du Portal, et les appels `push` suivants passent par Git.

Avec un Portal par dépôt, la racine du dépôt par défaut convient très bien pour `--git-path`. Vous n'avez besoin d'un sous-répertoire que si vous voulez placer plusieurs Portals dans le même dépôt :

```bash
nb portal config customer --git-path portals/customer
```

### Récupérer temporairement depuis un autre dépôt

Pour essayer le code source d'un autre dépôt sans modifier la configuration du Portal, `pull` accepte une surcharge ponctuelle :

```bash
nb portal pull customer --git-repo git@github.com:nocobase/another-portal.git
```

Cela ne modifie pas l'enregistrement distant du Portal, et `--git-branch` et `--git-path` ne peuvent être utilisés qu'avec `--git-repo`. Pour passer définitivement au stockage Git, utilisez `config` comme ci-dessus.

`config` permet aussi de changer l'emplacement de l'espace de travail de développement — après avoir déplacé le code source dans un autre répertoire, indiquez à la CLI son nouvel emplacement avec `--path` :

```bash
nb portal config customer --path ./workspaces/customer
```

## Différences entre les types d'env

`nb portal` se synchronise différemment selon le type d'env :

| Type d'env | Description |
| --- | --- |
| `local` | L'application se trouve sur cette machine. `pull` récupère le code source dans l'espace de travail de développement, `deploy` construit depuis cet espace de travail et synchronise les artefacts |
| `docker` | L'application tourne dans Docker, partagée via un volume. Le comportement est identique à ci-dessus |
| `http` | Synchronisation via l'API. `pull` / `push` téléchargent ou envoient une archive du code source |

Les env de type `ssh` ne prennent pas encore en charge la gestion des Portals.

## Déploiement multi-environnements

Un même Portal peut être déployé sur différents environnements, `--env` désignant la cible :

```bash
nb portal deploy customer --env prod --yes
```

`--yes` ignore la confirmation interactive. Lorsque le `--env` que vous indiquez explicitement diffère de l'env courant, la CLI s'interrompt et demande confirmation par défaut. Pensez à inclure `--yes` dans vos scripts ou en CI, faute de quoi la commande reste bloquée sur la confirmation.

Pour la publication multi-environnements des schémas de tables et des configurations, consultez [Gestion des publications](../publish.md).

## Chemin d'accès

Une fois déployé, le chemin d'accès d'un Portal est :

```text
<appPublicPath>/x/<portal>/
```

Pour un Portal appartenant à une sous-application :

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

Le préfixe `/x/` est réservé aux AI Portals ; les Portals no-code utilisent `/v/`.

## Supprimer un Portal

```bash
nb portal destroy customer
```

Cette commande supprime l'enregistrement du Portal et ses fichiers déployés, en conservant par défaut l'espace de travail de développement local. Ajoutez `--delete-dev-path` si vous voulez également supprimer l'espace de travail de développement.

## Liens connexes

- [Démarrage rapide de l'AI Portal](./index.md) — mettre en route votre premier point d'entrée front-end écrit par l'IA
- [Construire avec un AI Agent](./agent-workflow.md) — piloter l'IA en langage naturel pour écrire les pages
- [Structure du projet et stack technique](./project-structure.md) — les commandes de build et les variables d'environnement
- [Gestion des publications](../publish.md) — publier les schémas de tables et les configurations entre environnements
- [Référence des commandes `nb portal`](../../api/cli/portal/index.md) — description complète des paramètres de toutes les commandes Portal
- [`nb portal create`](../../api/cli/portal/create.md) — tous les paramètres de création d'un Portal
- [`nb portal config`](../../api/cli/portal/config.md) — ajuster le source storage et le chemin de l'espace de travail de développement
- [`nb portal push`](../../api/cli/portal/push.md) — pousser le code source vers le source storage
- [`nb portal deploy`](../../api/cli/portal/deploy.md) — construire et déployer un Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — récupérer le code source depuis le source storage
- [`nb portal destroy`](../../api/cli/portal/destroy.md) — supprimer l'enregistrement du Portal et ses fichiers déployés
