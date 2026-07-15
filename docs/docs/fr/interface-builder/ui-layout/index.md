---
title: "Mise en page de l'interface"
description: "Présentation des mises en page de l'interface NocoBase, avec les caractéristiques, les cas d'usage et les liens entre les mises en page bureau et mobile."
keywords: "mise en page de l'interface,mise en page bureau,mise en page mobile,mise en page responsive,pages mobiles,NocoBase"
---

# Mise en page de l'interface

NocoBase propose une mise en page bureau et une mise en page mobile. Dans les deux cas, vous pouvez utiliser la construction de l'interface pour créer des pages et y configurer des blocs, des champs et des actions.

La mise en page bureau est le choix par défaut. Elle convient aux tâches quotidiennes d'administration et de traitement des données sur ordinateur. Si vous avez besoin d'une navigation et de pages propres aux appareils mobiles, vous pouvez aussi configurer la mise en page mobile.

<!-- Une capture d'écran comparant la mise en page bureau et la mise en page mobile est nécessaire -->

## Mise en page bureau

La [mise en page bureau](./desktop.md) est accessible par défaut via `/admin`. Elle se compose d'une navigation supérieure, d'une navigation latérale et d'une zone de contenu. Elle convient aux usages courants, comme la gestion de tableaux, la saisie de formulaires et la consultation de données.

La mise en page bureau s'adapte aussi aux écrans étroits. Lorsque la page s'affiche sur un écran plus petit, la navigation, les espacements et les composants courants prennent une forme mieux adaptée à l'espace disponible, tout en conservant les menus et les pages du bureau.

<!-- Une capture d'écran d'une page complète avec la mise en page bureau est nécessaire -->

## Mise en page mobile

La [mise en page mobile](./mobile.md) est accessible par défaut via `/mobile`. Elle utilise une barre d'onglets inférieure pour organiser la navigation principale et propose des pages, des liens et des onglets de page indépendants.

La mise en page mobile convient aux opérations fréquentes sur téléphone, comme la saisie sur le terrain, les approbations, le traitement des tâches et la consultation de données. Vous pouvez construire et prévisualiser les pages dans le navigateur de votre ordinateur, puis vérifier le résultat sur un appareil réel à l'aide d'un code QR.

<!-- Une capture d'écran d'une page complète avec la mise en page mobile est nécessaire -->

## Comment choisir

Utilisez la mise en page bureau par défaut.

| Je veux... | Mise en page recommandée |
| --- | --- |
| Travailler principalement sur ordinateur et accéder occasionnellement depuis un téléphone | [Mise en page bureau](./desktop.md) |
| Concevoir une navigation, des pages et des parcours propres aux téléphones | [Mise en page mobile](./mobile.md) |
| Proposer une expérience complète sur ordinateur et sur mobile | Configurer séparément les mises en page bureau et mobile |

## Liens entre les configurations

Les mises en page bureau et mobile utilisent les mêmes sources de données, collections et données métier. Vous pouvez donc construire dans chaque mise en page des pages adaptées à différents appareils à partir de la même collection.

Les menus, les routes et les pages sont gérés séparément. Modifier une page bureau ne met pas automatiquement à jour la page mobile, et les changements de la navigation mobile n'affectent pas la navigation bureau. Les [autorisations d'accès aux routes](../../users-permissions/acl/permissions.md) doivent également être configurées séparément pour les deux mises en page.

## Liens connexes

- [Mise en page bureau](./desktop.md) — construire des pages bureau et comprendre leur comportement responsive sur les écrans étroits
- [Mise en page mobile](./mobile.md) — construire une navigation et des pages mobiles indépendantes
- [Gestionnaire de routes](../../routes/index.md) — gérer les pages, les liens et les menus des mises en page bureau et mobile
- [Configuration des autorisations](../../users-permissions/acl/permissions.md) — définir les menus et les pages accessibles à chaque rôle
