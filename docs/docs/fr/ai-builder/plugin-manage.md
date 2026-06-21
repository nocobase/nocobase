---
title: "Gestion des plugins"
description: "Le Skill de gestion des plugins permet de consulter, activer et désactiver les plugins NocoBase."
keywords: "construction par IA, gestion des plugins, activation de plugin, désactivation de plugin"
---

# Gestion des plugins

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).

:::

## Introduction

Le Skill de gestion des plugins permet de consulter, activer et désactiver les plugins NocoBase — il identifie automatiquement l'environnement local ou distant, choisit le backend d'exécution approprié et garantit le succès de l'opération via une vérification par relecture.


## Périmètre fonctionnel

- Consulter le catalogue des plugins et leur état d'activation.
- Activer les plugins.
- Désactiver les plugins.

## Exemples de prompts

### Scénario A : Consulter l'état des plugins

Mode prompt
```
Quels sont les plugins de l'environnement actuel
```
Mode ligne de commande
```
nb plugin list
```

Liste tous les plugins ainsi que leur état d'activation et leur version.

![Consulter l'état des plugins](https://static-docs.nocobase.com/20260417150510.png)

### Scénario B : Activer un plugin

Mode prompt
```
Aide-moi à activer le plugin de localisation
```
Mode ligne de commande
```
nb plugin enable <localisation>
```

Le Skill active les plugins dans l'ordre, et après chaque activation, vérifie par relecture que `enabled=true`.

![Activer un plugin](https://static-docs.nocobase.com/20260417153023.png)

### Scénario C : Désactiver un plugin

Mode prompt
```
Aide-moi à désactiver le plugin de localisation
```
Mode ligne de commande
```
nb plugin disable  <localisation>
```

![Désactiver un plugin](https://static-docs.nocobase.com/20260417173442.png)

## Questions fréquentes

**Le plugin est activé mais ne prend pas effet, que faire ?**

Certains plugins nécessitent un redémarrage de l'application pour prendre effet après activation. Le Skill indique dans le résultat si un redémarrage est nécessaire.

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et installation de tous les Skills de construction par IA
- [NocoBase CLI](../ai/quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
