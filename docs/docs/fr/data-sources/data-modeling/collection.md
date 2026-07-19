---
title: "Table de données"
description: "Découvrez le rôle des tables de données NocoBase, les types de structures de table, les différences entre la base de données principale et les tables de données externes, ainsi que les critères de choix entre table ordinaire, table héritée, table arborescente, table de fichiers, table SQL et vue de base de données."
keywords: "Table de données,Collection,Table ordinaire,Table héritée,Table arborescente,Table de fichiers,Table SQL,Vue de base de données,NocoBase"
---

# Table de données

## Présentation

Dans NocoBase, **Collection (table de données)** est le modèle de données qui décrit une catégorie de données métier. Il ne s’agit pas simplement du nom d’une table de base de données, mais d’une description unifiée par NocoBase d’un type de données.

Une Collection définit généralement trois éléments :

| Définition | Description |
| --- | --- |
| Où les données sont enregistrées | Les données peuvent provenir d’une table de la base de données principale, d’une table de base de données externe, du résultat d’une requête SQL, d’une vue de base de données, d’une ressource d’API REST ou d’une application NocoBase externe. |
| Quels sont les champs | Les champs décrivent les informations contenues dans chaque enregistrement, comme le nom du client, le numéro de téléphone, le montant de la commande, la date de création ou le responsable. |
| Comment NocoBase les utilise | Les blocs de page, les permissions, les workflows, les API et les champs de relation fonctionnent tous à partir des Collections. |

Vous pouvez considérer une Collection comme « la structure de données d’un objet métier ». Par exemple, « Client », « Commande », « Contrat » et « Tâche » peuvent chacun être une Collection.

Après avoir créé ou connecté une table de données, il faut généralement effectuer trois autres opérations :

- Configurer les champs afin que la table de données puisse stocker les informations nécessaires à l’activité
- Dans les pages, [ajouter des blocs](../../interface-builder/blocks/index.md#添加区块) pour permettre aux utilisateurs de consulter, saisir et traiter les données
- Configurer les permissions, les workflows et les API afin que les données puissent être consultées et circuler selon les règles métier

## Types de structures de table

- **Table ordinaire** — convient au stockage des données métier courantes telles que les clients, commandes, contrats, tickets, notes de frais, projets et tâches
- **Table arborescente** — convient au stockage des données hiérarchiques telles que les structures organisationnelles, les catégories de produits, les niveaux géographiques, les répertoires de services et les répertoires de bases de connaissances
- **Table calendrier** — convient au stockage des données comportant une plage horaire, telles que les réservations de salles de réunion, la planification de projets, les horaires de cours, les plannings de permanence et les agendas d’activités
- **Table de commentaires** — convient au stockage des discussions liées aux enregistrements métier, telles que les commentaires sur les tâches ou les articles, les avis d’approbation et les retours clients ; dans une table métier (table ordinaire, table arborescente ou table calendrier), créez un [champ de relation](./collection-fields/associations/index.md) pour l’associer à la table de commentaires, puis utilisez la page contextuelle de la table métier pour créer un [bloc de commentaires](../../plugins/@nocobase/plugin-comments/index.md) et commenter les données métier
- **Table de fichiers** — convient au stockage des métadonnées de fichiers tels que les pièces jointes de contrats, les factures, les images de produits et les justificatifs d’identité des employés ; les fichiers sont réellement conservés par le moteur de stockage de fichiers ; dans une table métier (table ordinaire, table arborescente ou table calendrier), créez un [champ de relation](./collection-fields/associations/index.md) pour l’associer à la table de fichiers, puis utilisez un bloc créé à partir de la table métier pour configurer le champ de relation et téléverser des fichiers ; les métadonnées des fichiers sont automatiquement enregistrées dans la table de fichiers
- **Vue de base de données** — une view déjà présente dans la base de données, comme une vue de rapports financiers, une vue filtrée des clients ou une vue agrégée issue d’une synchronisation intersystèmes
- **Table SQL** — convient à l’utilisation comme table de données des résultats de requêtes SQL, tels que les récapitulatifs des ventes, les alertes de stock, les rapports statistiques intertables et les tableaux de bord opérationnels
- **Table héritée** — permet à plusieurs types d’objets métier de partager un ensemble de champs communs, tout en disposant chacun de champs spécifiques, par exemple une table parente d’actifs dont dérivent les actifs informatiques, les véhicules et le mobilier de bureau
