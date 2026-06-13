---
title: "Gestion des versions"
description: "Guide du plugin de gestion des versions : enregistrer automatiquement des versions pendant la création avec l'IA, créer et restaurer des versions manuellement, régler la rétention, définir un raccourci et inclure des collections utilisateur."
keywords: "Gestion des versions,Version control,gestion des opérations,AI Builder,nocobase-revision,nb revision create,créer une version,restaurer une version,NocoBase"
---

# Gestion des versions

Dans NocoBase, **Gestion des versions** permet d'enregistrer une version restaurable de l'application actuelle. Tu peux créer des versions manuellement, restaurer une version enregistrée quand nécessaire, et laisser AI Builder enregistrer automatiquement des versions après des étapes significatives.

La gestion des versions s'appuie sur [Gestion des sauvegardes](../backup-manager/index.mdx) pour enregistrer et restaurer les états de l'application. Avant d'utiliser la gestion des versions, active d'abord la gestion des sauvegardes.

:::warning Remarque

Les éditions Community et Standard n'incluent pas le plugin de gestion des versions. Si tu dois enregistrer un état restaurable de l'application, utilise [Gestion des sauvegardes](../backup-manager/index.mdx) : crée une sauvegarde manuelle avant les changements importants, puis restaure la sauvegarde correspondante si tu dois revenir en arrière.

:::

## Versions automatiques avec l'IA

Une fois le plugin de gestion des versions activé, AI Builder dispose d'un point de retour supplémentaire. Quand un AI Agent commence à traiter une demande, il vérifie les NocoBase Skills disponibles pour l'application actuelle. S'il trouve la skill `nocobase-revision`, il peut enregistrer les étapes importantes de construction sous forme de versions restaurables.

![L'IA détecte la skill nocobase-revision au début de la construction](https://static-docs.nocobase.com/20260611115845.png)

Quand l'IA termine un résultat qui peut être vérifié séparément, comme une page, un groupe de collections ou un workflow, elle exécute `nb revision create` via NocoBase CLI. Tu n'as pas besoin de cliquer manuellement sur 「Create version」 à chaque fois, et les petits ajustements ne créent pas trop d'enregistrements de version.

![L'IA crée une version après la construction](https://static-docs.nocobase.com/20260611115804.png)

Ces versions apparaissent dans la liste des versions. Si les modifications suivantes ne correspondent pas à tes attentes, tu peux restaurer l'étape précédente clairement identifiée et continuer les ajustements à partir de là.

## Ouvrir le plugin

Une fois le plugin activé, le menu 「Version control」 apparaît dans la barre supérieure. Tu peux y créer une version directement ou accéder à la liste des versions.

Tu peux aussi ouvrir la page du plugin depuis 「System settings / Version control」. Le raccourci par défaut pour créer une version est `Ctrl + K`, et tu peux le modifier dans l'onglet des réglages.

![Menu Version control](https://static-docs.nocobase.com/20260611112317.png)

## Créer une version

Clique sur 「Create version」, saisis une description, puis enregistre. La description peut contenir jusqu'à 2000 caractères. Elle sert bien à noter le contexte du changement, par exemple « Ajustement des champs et permissions du flux d'approbation ».

![Créer une version](https://static-docs.nocobase.com/20260611112739.png)

Après avoir cliqué sur enregistrer, la liste affiche d'abord une ligne temporaire avec l'état « Saving ». Une fois terminée, la version enregistrée apparaît dans la liste.

Points clés :

- Le nom de version est généré automatiquement
- Créer une version depuis la barre supérieure, le raccourci ou la page de liste produit le même résultat
- La liste affiche le nom, la description, la taille du fichier, la date de création, l'auteur et les actions disponibles

## Gérer et restaurer des versions

La liste des versions propose principalement ces actions :

- 「Refresh」 recharge la liste actuelle
- 「Delete」 supprime une version, ou plusieurs versions sélectionnées
- 「Restore」 restaure l'application dans l'état enregistré par cette version

:::warning Attention

La restauration d'une version écrase la configuration actuelle de l'application ainsi que les données incluses dans cette version. Il est recommandé de créer d'abord une version de l'état actuel pour pouvoir revenir en arrière si besoin.

:::

Après un clic sur 「Restore」, l'application passe brièvement en mode maintenance pendant la restauration. N'envoie pas une autre demande de restauration pendant ce temps. Si l'opération échoue, l'interface affiche une notification d'erreur.

## Configurer les règles de version

Ouvre l'onglet 「Settings」 pour contrôler la rétention et le contenu de chaque version.

![](https://static-docs.nocobase.com/20260526220720.png)

Les réglages incluent :

- `Versions to keep` : nombre maximal de versions conservées. Les versions les plus anciennes sont supprimées automatiquement une fois la limite dépassée
- `Shortcut: create version` : raccourci pour créer une version. Appuie sur `Ctrl + une lettre` pour le définir, ou sur `Backspace` pour l'effacer
- `User collections` : choisir quelles données des collections créées par les utilisateurs doivent être incluses dans les versions enregistrées

:::tip

Par défaut, les versions enregistrées n'incluent pas les données des collections créées par les utilisateurs. Tu n'as besoin de sélectionner des collections ici que si tu veux restaurer aussi certaines données métier avec la version de l'application.

:::

Si tu inclus une collection utilisateur, NocoBase inclut aussi automatiquement les collections liées, ce qui rend généralement la restauration plus complète.

## Liens associés

- [Gestion des sauvegardes](../backup-manager/index.mdx) — capacité de base requise par la gestion des versions
- [Gestion des migrations](../migration-manager/index.md) — déplacer la configuration de l'application entre plusieurs environnements
- [Gestion des publications](../release-management/index.md) — planifier un processus de publication avec sauvegardes, migrations et variables
- [Démarrage rapide de la construction par IA](../../ai-builder/index.md) — utiliser le langage naturel pour la modélisation des données, la configuration de pages et l'orchestration de workflows
