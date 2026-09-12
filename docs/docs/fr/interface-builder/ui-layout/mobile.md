---
title: "Mise en page mobile"
description: "Découvrez la navigation, la construction et la prévisualisation des pages, les sous-pages, les routes et les autorisations de la mise en page mobile NocoBase."
keywords: "mise en page mobile,page mobile,navigation inférieure,prévisualisation mobile,route mobile,UI Editor,NocoBase"
---

# Mise en page mobile

Dans NocoBase, la **mise en page mobile** sert à construire une navigation et des pages indépendantes pour les appareils mobiles. Elle est accessible par défaut via `/mobile`, utilise une barre d'onglets inférieure comme navigation principale et convient mieux à la saisie et à la consultation de données, aux approbations et au traitement des tâches sur téléphone.

Les mises en page mobile et bureau utilisent les mêmes sources de données et les mêmes données métier. Les menus, les routes et le contenu des pages sont toutefois configurés séparément. Vous pouvez ainsi réorganiser les pages selon l'usage mobile sans rester lié à la structure des pages bureau.

<!-- Une capture d'écran d'une page complète avec la mise en page mobile sur un appareil réel est nécessaire -->

## Ouvrir et prévisualiser la mise en page mobile

Par défaut, cliquez sur « Mobile » dans le Centre de configuration ou accédez directement à `/mobile`.

Il est préférable de construire les pages dans le navigateur de votre ordinateur. Vous y trouverez une zone de prévisualisation mobile et une barre d'outils supérieure, avec les fonctions suivantes :

- « UI Editor » active ou désactive la construction de l'interface.
- « Aperçu tablette » vérifie l'affichage sur les appareils mobiles plus larges.
- « Aperçu mobile » rétablit la zone de prévisualisation à la taille d'un téléphone.
- « Code QR » ouvre l'adresse mobile actuelle sur un téléphone.

![20260715221712](https://static-docs.nocobase.com/20260715221712.png)

Après avoir terminé la construction sur ordinateur, utilisez le code QR pour vérifier le résultat sur un appareil réel. Contrôlez en priorité la navigation, le défilement, la saisie dans les formulaires, les pages superposées et les zones de sécurité de l'écran.

## Construire la navigation mobile

La mise en page mobile utilise une barre d'onglets inférieure comme navigation principale. Pour le moment, cette navigation propose principalement des pages et des liens.

### Ajouter une page

1. Ouvrez « UI Editor ».
2. Cliquez sur le bouton d'ajout à droite de la barre d'onglets inférieure.
3. Sélectionnez « Page ».
4. Saisissez le titre de la page et choisissez une icône.
5. Après validation, ouvrez la nouvelle page et continuez à ajouter son contenu.

![20260715221823_rec_](https://static-docs.nocobase.com/20260715221823_rec_.gif)

### Ajouter un lien

Pour ouvrir une adresse interne ou externe, sélectionnez « Lien », puis configurez le titre, l'icône et l'URL.

Le lien peut s'ouvrir dans la fenêtre actuelle ou dans une nouvelle fenêtre. Le comportement dépend de la configuration du lien.

![20260715221950](https://static-docs.nocobase.com/20260715221950.png)

### Ajuster la navigation

Dans le mode de construction de l'interface, vous pouvez réorganiser les onglets inférieurs par glisser-déposer. Pour chaque onglet, vous pouvez également modifier le titre et l'icône, configurer des règles d'interaction, copier l'UID ou supprimer l'élément.

Pour consulter, afficher, masquer ou supprimer les routes mobiles depuis un seul endroit, ouvrez « Centre de configuration / Routes / Routes mobiles ».

![20260715222113_rec_](https://static-docs.nocobase.com/20260715222113_rec_.gif)

## Construire une page mobile

Commencez par créer et ouvrir une page mobile, puis ajoutez-y des blocs. Le contenu de la page se construit globalement selon le même principe que sur le bureau : utilisez des [blocs](../blocks/index.md), des [champs](../fields/index.md) et des [actions](../actions/index.md) pour organiser le contenu métier. La navigation mobile et les interactions de certains composants sont toutefois adaptées aux petits écrans.

### Ajouter du contenu à la page

1. Ouvrez la page mobile à construire.
2. Vérifiez que « UI Editor » est activé.
3. Cliquez sur « Ajouter un bloc » dans la page.
4. Sélectionnez un tableau, un formulaire, des détails, un filtre ou un autre bloc.
5. Continuez à configurer les champs, les actions et les paramètres du bloc.

![20260715222230_rec_](https://static-docs.nocobase.com/20260715222230_rec_.gif)

### Utiliser les onglets de page

Une page mobile peut aussi utiliser des onglets. Les contenus placés sous la même entrée de navigation, mais relativement indépendants, peuvent être répartis dans différents onglets.

1. Ouvrez les paramètres de la page et activez « Activer les onglets ». Vous pouvez aussi modifier la page dans « Centre de configuration / Routes / Routes mobiles » et cocher « Activer les onglets de page ».
2. Ouvrez « UI Editor ».
3. Cliquez sur « Ajouter un onglet » à droite de la barre d'onglets de la page.
4. Ajoutez l'onglet, puis configurez son nom et son contenu.

Si la page mobile contient peu d'éléments, une seule page suffit. Il n'est alors pas nécessaire d'activer des onglets.

![20260715222354_rec_](https://static-docs.nocobase.com/20260715222354_rec_.gif)

### Interactions mobiles des composants courants

Les composants courants adaptent leur disposition et leurs interactions à la mise en page mobile. Les contenus à plusieurs colonnes passent ainsi automatiquement à une seule colonne, plus adaptée à la lecture verticale, les champs de sélection, de date et d'heure utilisent des sélecteurs mobiles, et les filtres, les enregistrements associés ainsi que les sous-pages adoptent une interface mieux adaptée au toucher.

Les tableaux restent des tableaux et permettent de faire défiler horizontalement les colonnes qui dépassent de l'écran. Le comportement mobile supplémentaire des autres blocs dépend de leur propre prise en charge.

## Pages et sous-pages

Le contenu ouvert depuis les actions d'affichage, de modification ou de sélection d'enregistrements associés apparaît sous la forme d'une sous-page mobile. La sous-page fournit un bouton de retour vers la page précédente.

Lorsque vous ouvrez une sous-page plus profonde, la barre d'onglets inférieure est masquée afin de libérer davantage d'espace pour le contenu actuel. Elle réapparaît lorsque vous fermez la sous-page ou revenez au niveau précédent.

Lorsque vous passez d'un onglet inférieur à un autre, l'état des pages déjà ouvertes est conservé. Vous pouvez ainsi basculer entre plusieurs tâches mobiles sans perdre le contexte.

![20260715222828_rec_](https://static-docs.nocobase.com/20260715222828_rec_.gif)

## Gérer les routes et les autorisations

Les routes mobiles peuvent être gérées depuis le [Gestionnaire de routes](../../routes/index.md). Ouvrez « Centre de configuration / Routes / Routes mobiles » pour ajouter, modifier, supprimer, afficher ou masquer des pages et des liens, et pour configurer les onglets d'une page.

Les autorisations d'accès aux routes mobiles sont configurées séparément de celles des routes bureau. Dans les autorisations du rôle, ouvrez « Routes mobiles » et sélectionnez les pages accessibles au rôle actuel. Pour plus de détails, consultez la [Configuration des autorisations](../../users-permissions/acl/permissions.md).

![20260715223016_rec_](https://static-docs.nocobase.com/20260715223016_rec_.gif)

![20260715223106_rec_](https://static-docs.nocobase.com/20260715223106_rec_.gif)

## Liens avec la mise en page bureau

Les mises en page bureau et mobile peuvent proposer des pages différentes à partir de la même table de données. Par exemple, le bureau peut utiliser un tableau comportant davantage de champs pour traiter les données, tandis que le mobile utilise une liste ou un formulaire plus simple pour la saisie sur le terrain.

Les pages des deux mises en page ne sont pas synchronisées automatiquement. Modifier une page, un menu ou une route du bureau ne met pas à jour la configuration mobile. De même, les modifications apportées à la mise en page mobile n'affectent pas le bureau.

:::tip Recommandation

Si vous avez seulement besoin de consulter occasionnellement une page bureau depuis un téléphone, commencez par utiliser l'adaptation aux écrans étroits de la [mise en page bureau](./desktop.md). Configurez une mise en page mobile distincte uniquement lorsque vous avez besoin d'une navigation et de parcours indépendants pour les appareils mobiles.

:::

## Liens connexes

- [Présentation de la mise en page de l'interface](./index.md) — découvrir les cas d'usage des mises en page bureau et mobile
- [Mise en page bureau](./desktop.md) — utiliser la mise en page bureau par défaut et son affichage responsive
- [Blocs](../blocks/index.md) — ajouter du contenu métier aux pages mobiles
- [Champs](../fields/index.md) — configurer les formulaires mobiles et les champs d'affichage des données
- [Actions](../actions/index.md) — configurer les boutons d'action dans les pages mobiles
- [Gestionnaire de routes](../../routes/index.md) — gérer les pages, les liens et les onglets mobiles
- [Configuration des autorisations](../../users-permissions/acl/permissions.md) — contrôler les routes mobiles accessibles à chaque rôle
