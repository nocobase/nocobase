---
title: "Mise en page bureau"
description: "Découvrez la navigation, la construction des pages, la gestion des routes et le comportement responsive de la mise en page bureau NocoBase sur les écrans étroits."
keywords: "mise en page bureau,mise en page de l'interface,écran étroit,mise en page responsive,construction de pages,gestion des routes,UI Editor,NocoBase"
---

# Mise en page bureau

Dans NocoBase, la **mise en page bureau** est l'interface par défaut de l'application. Elle convient à la gestion des données, à la saisie de formulaires, à la configuration des processus et aux opérations quotidiennes sur ordinateur. Elle peut aussi être utilisée sur les appareils mobiles.

La mise en page bureau est accessible par défaut via `/admin`. Si l'application utilise un préfixe d'accès spécifique, celui-ci est automatiquement ajouté à l'adresse réelle.

![20260715224020](https://static-docs.nocobase.com/20260715224020.png)

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

## Construire une page

### Première étape : ouvrir la mise en page bureau

Accédez à `/admin` pour ouvrir la mise en page bureau. En général, l'application ouvre aussi directement cette zone après la connexion.

![20260715225049](https://static-docs.nocobase.com/20260715225049.png)

### Deuxième étape : ouvrir UI Editor

Cliquez sur « UI Editor » en haut à droite de la page pour activer la construction de l'interface. Les menus, les pages, les blocs, les champs et les actions affichent alors leurs points d'accès à la configuration.

![20260715225155_rec_](https://static-docs.nocobase.com/20260715225155_rec_.gif)

### Troisième étape : créer des menus et des pages

Vous pouvez ajouter des groupes, des pages ou des liens dans la zone de navigation, et activer des onglets dans une page. Après avoir créé une page, ouvrez-la et ajoutez les blocs dont vous avez besoin.

La construction du contenu suit le même principe que dans les autres interfaces : ajoutez d'abord des [blocs](../blocks/index.md), puis configurez les [champs](../fields/index.md) et les [actions](../actions/index.md) selon vos besoins.

![20260715225316_rec_](https://static-docs.nocobase.com/20260715225316_rec_.gif)

### Quatrième étape : configurer le contenu de la page

Ajoutez des blocs de tableau, de formulaire, de détails, de filtre ou d'autres types. Ajustez ensuite la disposition des champs, des actions et des blocs. Toutes les modifications apparaissent directement sur la page actuelle.

![20260715225424_rec_](https://static-docs.nocobase.com/20260715225424_rec_.gif)

## Gérer les routes et les menus

Lorsque vous ajoutez une page ou un lien dans la zone de navigation, l'élément correspondant apparaît aussi dans le [Gestionnaire de routes](../../routes/index.md). Les modifications effectuées dans le Gestionnaire de routes mettent également le menu à jour.

La mise en page bureau prend en charge les types de routes courants suivants :

- **Groupe (Group)** — rassemble plusieurs pages et liens dans un même groupe de navigation.
- **Page (Page)** — ouvre une page dans laquelle vous pouvez continuer à ajouter des blocs.
- **Lien (Link)** — ouvre une adresse interne ou externe.
- **Onglet (Tab)** — organise plusieurs contenus dans des onglets au sein d'une page.

Dans le Gestionnaire de routes, vous pouvez ajouter, modifier, supprimer, afficher ou masquer des routes. Il est particulièrement pratique lorsque vous devez réorganiser toute la structure du menu depuis un seul endroit.

![20260715225711_rec_](https://static-docs.nocobase.com/20260715225711_rec_.gif)

## Adaptation aux écrans étroits

La mise en page bureau peut être utilisée directement sur un téléphone ou dans une fenêtre de navigateur étroite. Dans cet affichage, elle utilise toujours les routes et les pages d'origine du bureau et ne bascule pas automatiquement vers la mise en page mobile.

### Changements de la mise en page

Le menu de navigation est replié, et les actions de la partie supérieure sont regroupées dans un accès plus compact. Les marges de la page et les espacements entre les blocs diminuent aussi. La zone de contenu s'adapte à la hauteur visible du navigateur mobile.

UI Editor n'est pas disponible sur les écrans étroits. Pour modifier les menus ou les pages, vous devez revenir dans un navigateur sur ordinateur.

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

### Adaptation du contenu de la page

Les composants courants adaptent aussi leurs interactions aux écrans étroits afin d'être plus faciles à utiliser sur un téléphone. Les blocs à plusieurs colonnes passent ainsi à une seule colonne, les tableaux permettent de faire défiler horizontalement les colonnes qui dépassent de l'écran, et la pagination comme les actions deviennent plus compactes. Les sélections, les champs de date et d'heure, les filtres et les sous-pages utilisent également des interactions mieux adaptées aux téléphones.

:::tip Mise en page bureau responsive et mise en page mobile

Si vous accédez seulement de temps en temps depuis un téléphone, l'adaptation de la mise en page bureau aux écrans étroits suffit. Si vous avez besoin d'une navigation inférieure, de pages mobiles et de parcours dédiés, configurez aussi la [mise en page mobile](./mobile.md).

:::

## Recommandations

- Utilisez par défaut la mise en page bureau pour les processus réalisés principalement sur ordinateur.
- Terminez la construction de la page sur un écran large, puis réduisez la fenêtre pour vérifier le résultat sur un écran étroit.
- Si la page contient beaucoup de colonnes de tableau ou d'actions horizontales, conservez uniquement les éléments nécessaires afin de simplifier les opérations sur petit écran.
- Si les parcours sur ordinateur et sur mobile sont très différents, construire deux pages séparées rend la configuration plus claire.

## Liens connexes

- [Présentation de la mise en page de l'interface](./index.md) — découvrir les cas d'usage des mises en page bureau et mobile
- [Mise en page mobile](./mobile.md) — construire une navigation et des pages mobiles indépendantes
- [Blocs](../blocks/index.md) — ajouter et configurer des blocs dans une page
- [Champs](../fields/index.md) — configurer les champs de tableaux, de formulaires et de détails
- [Actions](../actions/index.md) — configurer les boutons d'action dans les pages et les blocs
- [Gestionnaire de routes](../../routes/index.md) — gérer les menus et les routes du bureau depuis un seul endroit
- [Configuration des autorisations](../../users-permissions/acl/permissions.md) — contrôler les routes bureau accessibles à chaque rôle
