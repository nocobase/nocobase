---
title: "Multi-portail"
description: "Découvrez le concept, les cas d'usage, la configuration et la relation entre Multi-portail, Multi-app et Multi-space dans NocoBase."
keywords: "espace de travail, portail, multi-portail, NocoBase"
pkg: "@nocobase/plugin-multi-portal"
---

# Multi-portail

## Qu'est-ce qu'un portail

Un portail sert à fournir plusieurs points d'entrée au sein d'une même application.

Chaque portail peut disposer indépendamment de :

- Pages
- Menus
- Structure de navigation
- Mise en page
- Configuration des permissions

Le plugin Multi-portail fournit les capacités suivantes :

- Gestion des portails
- Changement de portail
- Contrôle des permissions des portails

Grâce à ces capacités, il est possible d'offrir des expériences différentes selon les rôles tout en partageant les mêmes données et capacités métier.

## Pourquoi utiliser des portails

Dans les scénarios métier réels, différents rôles ont souvent besoin d'interfaces différentes.

Par exemple, dans un système de gestion de vente au détail :

```text
Système de gestion de vente au détail

├─ Portail du siège
├─ Portail du magasin
├─ Portail du distributeur
└─ Portail mobile
```

Le personnel du siège se concentre sur :

- La gestion des produits
- La gestion des stocks
- L'analyse de données

Le personnel du magasin se concentre sur :

- L'encaissement
- L'inventaire
- Le traitement des commandes

Les distributeurs se concentrent sur :

- Les achats
- Le rapprochement
- Le statut des expéditions

Même s'ils utilisent le même système, les différents rôles n'ont pas besoin de voir les mêmes menus et pages.

C'est précisément le problème que les portails permettent de résoudre.

## Relation entre portails et menus

Chaque portail possède son propre arbre de menus.

Les menus de différents portails n'interfèrent pas entre eux.

Par exemple :

```text
Portail du siège
├─ Gestion des produits
├─ Gestion de la chaîne logistique
└─ Analyse de données

Portail du magasin
├─ Encaissement
├─ Gestion des commandes
└─ Inventaire
```

## Relation entre portails et pages

Les pages appartiennent à leur portail respectif.

Une même page peut aussi n'être affichée que dans certains portails spécifiques.

Cela permet de concevoir des parcours complètement différents pour différents rôles.

## Relation entre portails et permissions

Les portails eux-mêmes peuvent être configurés avec des permissions d'accès.

Seuls les utilisateurs autorisés peuvent accéder au portail correspondant.

Les portails non autorisés :

- n'apparaissent pas dans la liste du sélecteur
- ne peuvent pas être accessibles directement

## Gestion des portails

Après activation du plugin Multi-portail, le système fournit par défaut deux portails intégrés :

| Portail | Chemin | Usage |
|----------|----------|----------|
| Desktop | `/v/admin` | Entrée bureau |
| Mobile | `/v/mobile` | Entrée mobile |

### Portails intégrés

![2026-07-10-08-01-50](https://static-docs.nocobase.com/2026-07-10-08-01-50.png)

### Portail bureau

Chemin d'accès :

```text
/v/admin
```

![2026-07-10-08-03-12](https://static-docs.nocobase.com/2026-07-10-08-03-12.png)

### Portail mobile

Chemin d'accès :

```text
/v/mobile
```

![2026-07-10-08-04-59](https://static-docs.nocobase.com/2026-07-10-08-04-59.png)

## Créer un portail

En plus des portails intégrés, vous pouvez créer d'autres portails selon vos besoins métier.

Par exemple :

- Portail du magasin
- Portail du distributeur
- Portail du service client
- Portail d'analyse de données

Après création, vous pouvez configurer :

- Les pages
- Les menus
- Les permissions
- La navigation

![2026-07-10-08-06-15](https://static-docs.nocobase.com/2026-07-10-08-06-15.png)

## Changer de portail

Les utilisateurs peuvent passer rapidement d'un portail à un autre grâce au sélecteur de portails.

### Changer de portail dans une seule application

Ajouter dans le panneau du sélecteur de portail en haut à gauche

![2026-07-10-08-20-41](https://static-docs.nocobase.com/2026-07-10-08-20-41.png)

Ajouter dans le bloc du panneau d'actions

![2026-07-10-08-21-15](https://static-docs.nocobase.com/2026-07-10-08-21-15.png)

### Changer de portail entre plusieurs applications

Après avoir activé Multi-app et configuré le SSO, les utilisateurs peuvent également passer d'un portail à un autre entre différentes applications grâce au sélecteur de portails.

Ajouter dans le panneau du sélecteur de portail en haut à gauche

![2026-07-10-08-25-19](https://static-docs.nocobase.com/2026-07-10-08-25-19.png)

Ajouter dans le bloc du panneau d'actions

![2026-07-10-08-25-50](https://static-docs.nocobase.com/2026-07-10-08-25-50.png)

## Permissions des portails

Vous pouvez contrôler quels portails un utilisateur peut consulter via les permissions de rôle.

Les portails non autorisés n'apparaissent pas dans la liste du sélecteur de portails, et les utilisateurs ne peuvent pas accéder directement à ces entrées.

![2026-07-10-08-29-22](https://static-docs.nocobase.com/2026-07-10-08-29-22.png)

## Liens associés

Pour les différences et les façons de combiner Multi-portail, Multi-app et Multi-space, voir : [Multi-app vs Multi-portail vs Multi-space](../multi-app-vs-multi-portal-vs-multi-space.md).
