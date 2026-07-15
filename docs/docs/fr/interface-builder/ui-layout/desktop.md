---
title: "Mise en page bureau"
description: "Découvrez la navigation, la construction des pages, la gestion des routes et le comportement responsive de la mise en page bureau NocoBase sur les écrans étroits."
keywords: "mise en page bureau,mise en page de l'interface,écran étroit,mise en page responsive,construction de pages,gestion des routes,UI Editor,NocoBase"
---

# Mise en page bureau

Dans NocoBase, la **mise en page bureau** est l'interface par défaut de l'application. Elle convient à la gestion des données, à la saisie de formulaires, à la configuration des processus et aux opérations quotidiennes sur ordinateur. Elle peut aussi adapter la navigation et le contenu des pages aux écrans étroits.

La mise en page bureau est accessible par défaut via `/admin`. Si l'application utilise un préfixe d'accès spécifique, celui-ci est automatiquement ajouté à l'adresse réelle.

<!-- Une capture d'écran d'une page complète avec la navigation supérieure, la navigation latérale et la zone de contenu est nécessaire -->

## Caractéristiques de la mise en page

La mise en page bureau comprend principalement les zones suivantes :

- **Navigation supérieure** — affiche le changement d'application et les actions globales.
- **Navigation latérale** — affiche les pages et les liens du groupe actuel.
- **Zone de contenu de la page** — affiche les onglets, les blocs, les champs et les actions.
- **UI Editor** — active la construction de l'interface pour ajuster les menus et le contenu des pages.

La navigation supérieure et la navigation latérale conservent la route actuelle sélectionnée. Lorsque vous changez de page, le contenu s'affiche dans la zone de droite. L'état des pages déjà ouvertes est généralement conservé.

## Construire une page

### Première étape : ouvrir la mise en page bureau

Accédez à `/admin` pour ouvrir la mise en page bureau. En général, l'application ouvre aussi directement cette zone après la connexion.

<!-- Une capture d'écran de la page affichée après l'ouverture de la mise en page bureau est nécessaire -->

### Deuxième étape : ouvrir UI Editor

Cliquez sur « UI Editor » en haut à droite de la page pour activer la construction de l'interface. Les menus, les pages, les blocs, les champs et les actions affichent alors leurs points d'accès à la configuration.

<!-- Une capture d'écran montrant l'emplacement du bouton « UI Editor » et la page après son activation est nécessaire -->

### Troisième étape : créer des menus et des pages

Vous pouvez ajouter des groupes, des pages ou des liens dans la zone de navigation, et activer des onglets dans une page. Après avoir créé une page, ouvrez-la et ajoutez les blocs dont vous avez besoin.

La construction du contenu suit le même principe que dans les autres interfaces : ajoutez d'abord des [blocs](../blocks/index.md), puis configurez les [champs](../fields/index.md) et les [actions](../actions/index.md) selon vos besoins.

<!-- Une vidéo montrant l'ajout d'un menu, la création d'une page et l'ouverture de cette page est nécessaire -->

### Quatrième étape : configurer le contenu de la page

Ajoutez des blocs de tableau, de formulaire, de détails, de filtre ou d'autres types. Ajustez ensuite la disposition des champs, des actions et des blocs. Toutes les modifications apparaissent directement sur la page actuelle.

<!-- Une capture d'écran d'une page bureau en mode construction, avec les points d'accès à la configuration des blocs, champs et actions, est nécessaire -->

## Gérer les routes et les menus

Le menu et les routes du bureau utilisent la même configuration. Lorsque vous ajoutez une page ou un lien dans la zone de navigation, l'élément correspondant apparaît aussi dans le [Gestionnaire de routes](../../routes/index.md). Les modifications effectuées dans le Gestionnaire de routes mettent également le menu à jour.

La mise en page bureau prend en charge les types de routes courants suivants :

- **Groupe (Group)** — rassemble plusieurs pages et liens dans un même groupe de navigation.
- **Page (Page)** — ouvre une page dans laquelle vous pouvez continuer à ajouter des blocs.
- **Lien (Link)** — ouvre une adresse interne ou externe.
- **Onglet (Tab)** — organise plusieurs contenus dans des onglets au sein d'une page.

Dans le Gestionnaire de routes, vous pouvez ajouter, modifier, supprimer, afficher ou masquer des routes. Il est particulièrement pratique lorsque vous devez réorganiser toute la structure du menu depuis un seul endroit.

<!-- Une capture d'écran de la page « Centre de configuration / Routes / Routes bureau » est nécessaire -->

## Adaptation aux écrans étroits

La mise en page bureau peut être utilisée directement sur un téléphone ou dans une fenêtre de navigateur étroite. Dans cet affichage, elle continue d'utiliser les routes et les pages du bureau et ne bascule pas automatiquement vers la mise en page mobile.

### Changements de la mise en page

Le menu de navigation est replié, et les actions de la partie supérieure sont regroupées dans un accès plus compact. Les marges de la page et les espacements entre les blocs diminuent aussi. La zone de contenu s'adapte à la hauteur visible du navigateur mobile.

UI Editor n'est pas disponible sur les écrans étroits. Pour modifier les menus ou les pages, revenez dans un navigateur sur ordinateur.

<!-- Une vidéo montrant la même page bureau passer d'un écran large à un écran étroit est nécessaire -->

### Adaptation du contenu de la page

Les mises en page et composants courants s'adaptent aussi aux écrans étroits. Les blocs à plusieurs colonnes favorisent ainsi une lecture verticale, les tableaux permettent de faire défiler horizontalement les colonnes qui dépassent de l'écran, et la pagination comme les actions deviennent plus compactes. Les sélections, les champs de date et d'heure, les filtres et les sous-pages utilisent également des interactions mieux adaptées aux petits écrans.

Le comportement supplémentaire des autres blocs sur écran étroit dépend de leur propre prise en charge. Les tableaux restent des tableaux et ne sont pas automatiquement transformés en cartes.

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
