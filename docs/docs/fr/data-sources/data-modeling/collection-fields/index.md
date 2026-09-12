---
title: "Champs"
description: "Découvrez le rôle des champs NocoBase, leur création et leur gestion, les cas d’utilisation des types de champs, la création de champs depuis une page, ainsi que la logique de mappage des champs des sources de données principales et externes."
keywords: "Champs,Field type,Field interface,Mappage des champs,Champ titre,Contrainte d’unicité,Champ de relation,NocoBase"
---

# Champs

## Introduction

Dans NocoBase, **Field (champ)** est une propriété métier utilisée dans une [Collection (table de données)](../collection.md) pour décrire les informations qu’un enregistrement peut contenir, ainsi que la manière dont ces informations sont saisies, affichées, filtrées et utilisées dans la logique métier.

| Définition | Description |
| --- | --- |
| Quelles données enregistrer | Par exemple du texte, des nombres, des dates, des fichiers, des statuts, des relations ou du JSON. |
| Comment les utiliser sur une page | Par exemple, les saisir et les afficher à l’aide d’un champ de saisie, d’un sélecteur de date, d’un menu déroulant, d’un téléversement de pièces jointes ou d’un sélecteur de relations. |
| Comment participer aux fonctionnalités métier | Les champs sont utilisés par les blocs de page, les filtres, le tri, les autorisations, les workflows, les API, l’importation et l’exportation de données, entre autres fonctionnalités. |

Un champ peut correspondre à :
- Une véritable colonne de base de données dans la base de données principale
- Une colonne de base de données existante dans une base de données externe
- Un champ dans une vue de base de données
- Un champ dans le résultat d’une requête SQL
- Un champ dans la réponse d’une API REST
- Un champ de relation, un champ système ou un champ virtuel dans une table de données

Considérez-le comme « une propriété d’un objet métier ». Par exemple :

| Objet métier | Field correspondant |
| --- | --- |
| Client | Nom du client, numéro de téléphone, niveau du client, responsable |
| Commande | Numéro de commande, montant de la commande, statut de la commande, client |
| Contrat | Nom du contrat, date de signature, pièce jointe du contrat, statut d’approbation |
| Tâche | Titre de la tâche, date limite, priorité, exécutant |
| Fichier | Nom du fichier, taille, type MIME, URL |

## Cas d’utilisation

Les cas d’utilisation courants sont classés ci-dessous par catégorie de champ. Cette section vous aide d’abord à déterminer la catégorie de champ à choisir ; pour connaître la configuration détaillée, le mappage des types et les points d’attention, consultez la documentation de la catégorie correspondante.

| Catégorie de champ | Cas d’utilisation |
| --- | --- |
| [Champs texte](./basic/input.md) | Conviennent à l’enregistrement de noms, numéros, descriptions, coordonnées, adresses URL et autres contenus. |
| [Champs de texte enrichi](./media/rich-text.md) | Conviennent à l’enregistrement de contenus plus complexes, tels que des textes principaux, des documents explicatifs, des solutions de traitement ou des extraits de code. |
| [Champs numériques](./basic/number.md) | Conviennent à l’enregistrement de quantités, montants, notes, pourcentages et autres valeurs numériques. |
| [Champs de date et d’heure](./datetime/index.md) | Conviennent à l’enregistrement de points dans le temps, de dates, d’heures, d’horodatages provenant de systèmes externes et autres contenus similaires. |
| [Champs de statut et d’options](./choices/select.md) | Conviennent à l’enregistrement de valeurs appartenant à un ensemble défini, comme l’activation, le statut d’une commande, le niveau d’un client ou les étiquettes d’un client. |
| [Champs de pièces jointes](./media/field-attachment.md) | Conviennent au téléversement de fichiers ou à l’enregistrement d’adresses de fichiers externes. |
| [Champs de relation](./associations/index.md) | Conviennent à la représentation des connexions entre différentes tables de données, par exemple une commande appartient à un client, un client possède des commandes ou un utilisateur est associé à des rôles. |
| [Champs d’identifiants et de codes](./advanced/uuid.md) | Conviennent à l’enregistrement de clés primaires internes, d’identifiants de synchronisation externes, d’identifiants d’accès public et de numéros métier. |
| [Champs de formes géométriques](./geometric/point.md) | Conviennent à l’enregistrement d’informations spatiales ou géographiques, comme l’emplacement d’un magasin, un itinéraire de livraison ou une zone de service. |
| [Champs système](./system-info/created-at.md) | Conviennent à l’enregistrement d’informations système gérées par NocoBase ou la base de données, comme l’ID, la date de création, le créateur ou la date de mise à jour. |
| [Autres champs](./advanced/json.md) | Conviennent aux besoins qui ne relèvent pas directement des autres catégories, comme le tri, les formules ou le JSON. |

## Types d’interface des champs

NocoBase divise les champs en plusieurs catégories du point de vue des interfaces :

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Types de données des champs

Chaque interface de champ possède un type de données par défaut. Par exemple, pour un champ dont l’interface est un nombre (Number), le type de données par défaut est double, mais il peut également être float, decimal, etc. Les types de données actuellement pris en charge sont les suivants :

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mappage des types de champs

Le processus d’ajout d’un champ dans la base de données principale est le suivant :

1. Sélectionner le type d’interface
2. Configurer les types de données disponibles pour l’interface actuelle

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Le processus de mappage des champs d’une source de données externe est le suivant :

1. Mappage automatique, selon le type de champ de la base de données externe, vers le type de données correspondant (Field type) et le type d’interface utilisateur (Field Interface).
2. Modifier si nécessaire le type de données et le type d’interface les plus appropriés

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)