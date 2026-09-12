---
title: Configuration du développement local
description: Préparer l’environnement local du système d’exploitation pour NocoBase CLI et les applications NocoBase, avec Windows WSL, macOS, Linux, Node.js, Yarn et Docker.
---

# Configuration du développement local

Cette page t’aide à préparer un environnement local pour NocoBase CLI et les applications NocoBase. Elle convient au développement local, à l’évaluation de fonctionnalités et aux AI Agents qui installent ou gèrent NocoBase sur ton ordinateur.

Pour un déploiement destiné à de vrais utilisateurs, consulte d’abord les [exigences système de production](../get-started/system-requirements.md).

## Windows : utiliser WSL

Pour une configuration locale sous Windows, nous recommandons de placer l’environnement principal de développement dans WSL 2 : installe Node.js, Yarn et NocoBase CLI dans la distribution Linux de WSL, puis exécute les commandes associées depuis le terminal WSL.

WSL est plus proche des environnements Linux dans lesquels NocoBase est généralement déployé. Cela apporte plusieurs avantages :

- L’installation des dépendances, la compilation, le démarrage et l’analyse des logs se rapprochent du flux réel sur serveur
- Une fois WSL integration activée dans Docker Desktop, tu peux exécuter les commandes `docker` directement dans WSL
- Tu réduis les problèmes supplémentaires liés aux chemins Windows natifs, aux permissions de fichiers, aux liens symboliques et à la compilation de dépendances natives
- Les workflows avec AI Agent sont plus simples. Quand un agent exécute `nb`, `yarn` ou `docker`, il utilise les mêmes chemins Linux, la même syntaxe shell et le même environnement d’exécution, ce qui rend le diagnostic plus direct

Si l’environnement local basé sur WSL n’est pas encore prêt, consulte [Configurer un environnement de développement local sous Windows avec WSL](./windows-wsl.md).

Configuration recommandée :

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker Desktop, si tu prévois d’installer NocoBase avec Docker

En général, Node.js, Yarn et NocoBase CLI sont installés dans WSL. Si tu utilises Docker Desktop, active WSL integration dans Docker Desktop pour permettre à WSL d’accéder à Docker.

Vérifier l’environnement :

```bash
node -v
yarn -v
docker version
```

:::tip Remarque

NocoBase peut aussi être installé sur Windows Server. WSL est recommandé ici pour le développement local et la configuration d’AI Agent sur ordinateur personnel. Cela ne signifie pas que Windows Server ne peut pas être utilisé pour un déploiement.

:::

## macOS

Sous macOS, tu peux utiliser directement le terminal local.

À préparer :

- Node.js >= 22
- Yarn 1.x
- Docker Desktop, OrbStack ou Colima, si tu prévois d’installer NocoBase avec Docker

Vérifier l’environnement :

```bash
node -v
yarn -v
docker version
```

Si tu n’utilises pas Docker, tu peux ignorer `docker version`.

## Linux

Linux peut être utilisé directement comme environnement de développement local. Ubuntu, Debian ou d’autres distributions courantes sont recommandées.

À préparer :

- Node.js >= 22
- Yarn 1.x
- Docker Engine, si tu prévois d’installer NocoBase avec Docker

Vérifier l’environnement :

```bash
node -v
yarn -v
docker version
```

Si tu n’utilises pas Docker, tu peux ignorer `docker version`.

## Étapes suivantes

- [Méthodes d’installation et comparaison des versions](../get-started/quickstart.md) — Comparer d’abord les méthodes d’installation et les canaux de version
- [Installer l’application NocoBase](./install-nocobase-app.md) — Initialiser une app locale avec NocoBase CLI
- [Guide d’intégration pour AI Agent](./quick-start.mdx) — Permettre à un AI Agent de se connecter à NocoBase et de l’utiliser
