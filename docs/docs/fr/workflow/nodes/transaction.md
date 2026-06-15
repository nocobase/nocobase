---
pkg: '@nocobase/plugin-workflow-transaction'
title: "Nœud de flux de travail - Transaction de base de données"
description: "Nœud de transaction de base de données : exécute les opérations de données d'une même source dans une transaction, valide en cas de succès et annule en cas d'échec."
keywords: "flux de travail,transaction de base de données,Transaction,rollback,commit,opération de données,NocoBase"
---

# Transaction de base de données

## Introduction

Le nœud de transaction de base de données permet d'exécuter un ensemble d'opérations de base de données dans une même transaction. Il convient aux scénarios où plusieurs étapes de traitement doivent soit toutes réussir, soit être toutes annulées, par exemple créer une commande, déduire le stock, écrire les détails et mettre à jour le statut.

Le nœud de transaction ne prend actuellement en charge que les sources de données de type base de données. Les opérations de données de la même source à l'intérieur du nœud sont automatiquement incluses dans cette transaction ; les autres sources de données ne l'utilisent pas.

Ce nœud est pris en charge depuis 2.2.0.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus ("+") dans le flux pour ajouter un nœud "Transaction de base de données".

![20260610205146](https://static-docs.nocobase.com/20260610205146.png)

Après sa création, deux branches sont générées :

- **Exécuter** : branche principale exécutée dans la transaction. Si tous les nœuds de cette branche réussissent, la transaction est validée automatiquement. Si un nœud échoue ou déclenche une erreur, la transaction est annulée automatiquement.
- **Après rollback** : branche exécutée après l'annulation. Cette branche s'exécute hors transaction et peut servir à enregistrer des journaux, envoyer des notifications ou effectuer un traitement de compensation.

![20260610205303](https://static-docs.nocobase.com/20260610205303.png)

## Configuration du nœud

![20260610205505](https://static-docs.nocobase.com/20260610205505.png)

### Source de données

Sélectionnez la source de données de base de données contrôlée par cette transaction. Seuls les nœuds d'opération de données de la même source sont automatiquement inclus dans la transaction.

### Niveau d'isolation

Définissez le niveau d'isolation de la transaction. La valeur par défaut est `READ UNCOMMITTED`. Si votre logique métier exige une cohérence plus stricte, choisissez un autre niveau d'isolation selon les capacités de la base de données et les exigences de concurrence.

### Continuer le flux de travail après rollback

Lorsque cette option est activée, le flux de travail continue avec les nœuds situés après le nœud de transaction une fois la branche `Après rollback` terminée.

Lorsqu'elle est désactivée, le flux de travail s'arrête au nœud de transaction une fois la branche `Après rollback` terminée, et les nœuds suivants ne sont pas exécutés.

## Utilisation

### Contraintes

La branche `Exécuter` ne prend pas en charge les nœuds asynchrones qui suspendent le flux de travail, comme le traitement manuel ou le délai. La transaction doit être validée ou annulée pendant l'exécution en cours. Si la branche `Exécuter` passe en attente, le système annule la transaction et marque le flux de travail comme échoué.

La branche `Après rollback` s'exécute hors transaction et n'est donc pas soumise à cette restriction. Vous pouvez y utiliser des nœuds asynchrones si nécessaire, par exemple pour envoyer une requête, attendre une confirmation manuelle ou différer un traitement.

:::warning Remarque
Les transactions occupent des connexions à la base de données jusqu'à leur validation ou annulation. Évitez les opérations longues dans la branche `Exécuter` et n'y placez que les lectures, écritures et vérifications nécessaires.
:::

### Transactions imbriquées

Les nœuds de transaction peuvent être imbriqués, mais il faut tenir compte de la portée des sources de données :

- Si les transactions interne et externe utilisent la même source de données, la transaction interne est créée dans la portée de la transaction externe et est gérée selon les capacités de la base de données et de Sequelize.
- Si la transaction interne utilise une autre source de données, elle ne réutilise pas la transaction externe et crée une transaction indépendante pour cette source.
- Si le flux de travail est déclenché par un événement de collection synchrone, le déclencheur peut déjà fournir une transaction de premier niveau pour la même source de données. Le nœud de transaction réutilise en priorité la transaction externe de la même source de données et ne réutilise pas les transactions d'autres sources.

Les transactions imbriquées augmentent la complexité de compréhension et de diagnostic. En général, utilisez-les uniquement lorsqu'une limite locale de rollback est réellement nécessaire. Sinon, privilégiez un seul nœud de transaction autour de tout le traitement de données.

### Scénario courant

Un flux typique est le suivant :

1. Interroger ou créer les données associées dans la branche `Exécuter`.
2. Continuer à mettre à jour le stock, le statut, les détails et les autres données de la même source dans la branche `Exécuter`.
3. Si tout réussit, la transaction est validée automatiquement.
4. Si un nœud échoue ou déclenche une erreur, la transaction est annulée automatiquement et le flux entre dans la branche `Après rollback`.
5. Dans la branche `Après rollback`, enregistrer la raison de l'échec, envoyer une notification ou exécuter une logique de compensation.

Si le flux de travail doit continuer après le rollback, activez "Continuer le flux de travail après rollback".
