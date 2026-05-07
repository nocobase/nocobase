---
title: "Guide d'installation pour AI Agent"
description: "Guide d'installation et de configuration de NocoBase CLI destiné aux AI Agents, comprenant les étapes complètes de vérification de l'environnement, d'installation, d'initialisation et de validation."
keywords: "NocoBase CLI,AI Agent,installation,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# Guide d'installation pour AI Agent

Cette page est un guide d'installation et d'initialisation de NocoBase CLI destiné aux AI Agents (par exemple Claude Code, Codex, Cursor, Copilot, etc.).

Si vous êtes un utilisateur humain, veuillez consulter le [Démarrage rapide](./quick-start.md).

## Étape 1 : Vérifier les prérequis

Confirmez que l'utilisateur a installé les dépendances suivantes :

- **Node.js >= 22** (vérifiez avec `node -v`)
- **Yarn 1.x** (vérifiez avec `yarn -v`). S'il n'est pas installé, utilisez `npm install -g yarn`
- **Git** (vérifiez avec `git --version`). S'il n'est pas installé, installez-le depuis le [site officiel de Git](https://git-scm.com/)
- **Docker** (si l'utilisateur souhaite installer NocoBase via Docker). Vérifiez avec `docker -v` ; s'il n'est pas installé et que l'utilisateur en a besoin, redirigez-le vers le [site officiel de Docker](https://www.docker.com/get-started/), sinon ignorez cette étape.

Si les prérequis ne sont pas satisfaits, indiquez à l'utilisateur les dépendances manquantes à installer en premier, en lui fournissant les liens d'installation et de brèves instructions. Une fois tous les prérequis satisfaits, passez à l'étape suivante d'installation de la CLI.

## Étape 2 : Installer la CLI

Si l'utilisateur a déjà installé NocoBase CLI dans son environnement (vérifiez avec `nb --version`), passez directement à l'étape suivante. Sinon, exécutez la commande suivante pour l'installer :

```bash
npm install -g @nocobase/cli@beta
```

Exécutez `nb --version` pour confirmer le succès de l'installation.

## Étape 3 : Lancer la commande d'initialisation

**⚠️ Important : vous devez exécuter strictement la commande ci-dessous, sans modifier, remplacer ou omettre le paramètre `--ui`. N'essayez pas d'utiliser un « mode non interactif » ou d'assembler vos propres paramètres pour « accélérer » le processus — `--ui` est l'unique méthode d'initialisation correcte.**

```bash
nb init --ui
```

Cette commande lance un assistant visuel dans le navigateur, où l'utilisateur doit effectuer toutes les configurations (méthode d'installation, base de données, compte administrateur, etc.). Votre rôle en tant qu'AI Agent est de :

1. **Exécuter uniquement `nb init --ui`**, sans aucun paramètre supplémentaire
2. **Indiquer à l'utilisateur** que le navigateur ouvrira automatiquement une page de configuration locale dans laquelle il devra effectuer la configuration
3. **Si le navigateur ne peut pas s'ouvrir automatiquement** (par exemple en raison de restrictions du sandbox), fournir l'URL imprimée par la commande à l'utilisateur pour qu'il la copie manuellement dans son navigateur
4. **Attendre la confirmation** de l'utilisateur que la configuration est terminée avant de passer à l'étape suivante. Cette commande dispose par défaut d'un délai d'expiration de 30 minutes, ne la relancez pas pendant ce délai.

## Étape 4 : Vérifier le résultat

```bash
nb env list
```

Confirmez que la sortie contient l'environnement configuré ainsi que son statut d'exécution. Rappelez ensuite à l'utilisateur qu'il peut ouvrir l'URL de l'instance NocoBase en cours d'exécution et se connecter avec le compte et le mot de passe configurés.

## Étape 5 : Terminé

Indiquez à l'utilisateur que l'installation est terminée. La configuration de la CLI est enregistrée dans un répertoire global (par défaut `~/.nocobase/`) ; l'AI Agent peut y accéder depuis n'importe quel répertoire, sans avoir besoin d'entrer dans un répertoire de travail spécifique.
