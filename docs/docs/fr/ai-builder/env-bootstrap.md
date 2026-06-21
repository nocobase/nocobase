---
title: "Gestion des environnements"
description: "Le Skill de gestion des environnements gère l'installation, la mise à niveau, l'arrêt, le démarrage et la gestion multi-environnements de NocoBase (environnements de développement, de test, de production, etc.) — depuis «NocoBase n'est pas encore installé» jusqu'à «prêt à se connecter»."
keywords: "construction par IA, gestion des environnements, installation, mise à niveau, Docker"
---

# Gestion des environnements

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).

:::

## Introduction

Le Skill de gestion des environnements gère l'installation, la mise à niveau, l'arrêt, le démarrage et la gestion multi-environnements de NocoBase (environnements de développement, de test, de production, etc.) — depuis «NocoBase n'est pas encore installé» jusqu'à «prêt à se connecter».


## Périmètre fonctionnel

- Consulter les environnements et l'état de NocoBase
- Ajouter, supprimer, basculer entre les environnements d'instance NocoBase
- Installer, mettre à niveau, arrêter, démarrer une instance NocoBase


## Exemples de prompts

### Scénario A : Consulter l'état de l'environnement
Mode prompt
```
Quelles sont les instances NocoBase actuelles ? Dans quel environnement suis-je actuellement ?
```
Mode ligne de commande
```
nb env list
```

### Scénario B : Ajouter un environnement existant
:::tip Prérequis

Une instance NocoBase existante est requise, qu'elle soit locale ou distante

:::

Mode prompt
```
Aide-moi à ajouter l'environnement dev http://localhost:13000
```
Mode ligne de commande
```
nb env add <dev> --base-url http://localhost:13000/api
```
### Scénario C : Installer une nouvelle instance NocoBase
:::tip Prérequis

Le moyen le plus rapide d'installer NocoBase est d'utiliser le mode Docker. Avant l'exécution, assurez-vous que Node, Docker et Yarn sont installés sur votre machine.

:::

Mode prompt
```
Aide-moi à installer NocoBase
```
Mode ligne de commande
```
nb init --ui
```

### Scénario D : Mise à niveau de l'instance

Mode prompt
```
Aide-moi à mettre à niveau l'instance actuelle vers la dernière version
```
Mode ligne de commande
```
nb upgrade
```

### Scénario E : Arrêter l'instance

Mode prompt
```
Aide-moi à arrêter l'instance actuelle
```
Mode ligne de commande
```
nb app stop
```

### Scénario E : Démarrer l'instance

Mode prompt
```
Aide-moi à démarrer l'instance actuelle
```
Mode ligne de commande
```
nb app start
```

## Questions fréquentes

**Après l'installation, je ne peux pas tester les fonctionnalités liées à la construction par IA, que faire ?**

Pour le moment, toutes les fonctionnalités de construction par IA sont dans l'image alpha. Vérifiez que vous avez bien utilisé cette image lors de l'installation, sinon mettez à niveau vers cette image.

**Que faire si Docker signale un conflit de port au démarrage ?**

Changez de port (par exemple `port=14000`), ou arrêtez d'abord le processus qui occupe le port 13000. La phase de pré-vérification du Skill signale activement les conflits de port.

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et installation de tous les Skills de construction par IA
- [NocoBase CLI](../ai/quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
