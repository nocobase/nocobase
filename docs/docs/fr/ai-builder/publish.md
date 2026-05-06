---
title: "Gestion des publications"
description: "Le Skill de gestion des publications permet d'effectuer des opérations de publication auditables entre plusieurs environnements, avec restauration de sauvegarde et migration."
keywords: "construction par IA,gestion des publications,publication multi-environnements,restauration de sauvegarde,migration"
---

# Gestion des publications

:::tip Prérequis

- Avant de lire cette page, installez NocoBase CLI et terminez l'initialisation en suivant le [Démarrage rapide de la construction par IA](./index.md)
- Une licence de l'édition Professional ou supérieure est nécessaire. Voir [NocoBase Édition commerciale](https://www.nocobase.com/cn/commercial)
- Activez les plugins « Gestion des sauvegardes » et « Gestion des migrations », puis mettez-les à jour vers la dernière version

:::

## Introduction

Le Skill de gestion des publications permet d'effectuer des opérations de publication entre plusieurs environnements NocoBase. Il prend en charge deux méthodes : la restauration de sauvegarde et la migration.

Si vous voulez simplement écraser complètement un environnement avec un autre, la restauration de sauvegarde suffit généralement. Si vous devez contrôler par règles les contenus synchronisés, par exemple synchroniser uniquement la structure sans les données métier, la migration est plus adaptée.

## Périmètre fonctionnel

- Restauration de sauvegarde dans un seul environnement : restaure l'environnement actuel avec un paquet de sauvegarde existant
- Restauration immédiate dans un seul environnement : crée d'abord une sauvegarde de l'environnement actuel, puis restaure l'environnement actuel avec cette sauvegarde
- Restauration de sauvegarde entre environnements : restaure le paquet de sauvegarde de l'environnement source dans l'environnement cible
- Migration entre environnements : met à jour l'environnement cible de façon différentielle avec un paquet de migration

## Exemples de prompts

### Scénario A : restauration dans un seul environnement avec fichier spécifié

:::tip Prérequis

Un fichier de sauvegarde portant le même nom doit déjà exister dans l'environnement actuel.

:::

```text
Restaurer avec la sauvegarde <file-name.nbdata>
```

Le Skill utilise le fichier de sauvegarde portant le même nom déjà présent sur le serveur de l'environnement actuel pour effectuer la restauration.

### Scénario B : restauration dans un seul environnement sans spécifier de fichier

```text
Sauvegarder et restaurer l'environnement actuel
```

Le Skill crée d'abord une sauvegarde de l'environnement actuel, puis restaure l'environnement actuel avec cette sauvegarde.

### Scénario C : restauration de sauvegarde entre environnements

:::tip Prérequis

Préparez deux environnements, par exemple un environnement dev local et un environnement test distant, ou deux environnements locaux. Vous pouvez spécifier un fichier de sauvegarde précis ou ne pas en spécifier.

:::

```text
Restaurer dev vers test
```

Le Skill crée un paquet de sauvegarde dans l'environnement dev, puis restaure ce paquet dans l'environnement test.

### Scénario D : migration entre environnements

:::tip Prérequis

Comme pour le scénario C, préparez deux environnements. Vous pouvez spécifier un fichier de migration précis ou ne pas en spécifier.

:::

```text
Migrer dev vers test
```

Le Skill crée un paquet de migration dans l'environnement dev, puis utilise ce paquet pour mettre à jour l'environnement test.

## Questions fréquentes

**Faut-il choisir la restauration de sauvegarde ou la migration ?**

Par défaut, la restauration de sauvegarde suffit, surtout si vous disposez déjà d'un paquet de sauvegarde utilisable ou si vous voulez que l'environnement cible soit entièrement écrasé par l'état de l'environnement source. Utilisez la migration uniquement lorsque vous devez contrôler le périmètre de synchronisation par règles, par exemple synchroniser uniquement la structure sans les données.

**Que signifie l'absence du plugin de migration ?**

Le plugin de gestion des migrations nécessite une licence de l'édition Professional ou supérieure. Voir [NocoBase Édition commerciale](https://www.nocobase.com/cn/commercial) pour plus de détails.

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et méthode d'installation de tous les Skills de construction par IA
- [Gestion des environnements](./env-bootstrap) — vérification de l'environnement, installation, déploiement et diagnostic des problèmes
