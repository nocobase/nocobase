---
title: "Gestion des versions"
description: "Guide du plugin de gestion des versions : créer des versions, les restaurer, régler la rétention, définir un raccourci et inclure des collections utilisateur."
keywords: "Gestion des versions,Version control,gestion des opérations,créer une version,restaurer une version,NocoBase"
---

# Gestion des versions

Dans NocoBase, **Gestion des versions** permet d'enregistrer une version restaurable de l'application actuelle. Tu peux créer des versions manuellement, restaurer une version enregistrée quand nécessaire, et utiliser les réglages du plugin pour définir combien de versions conserver, quel raccourci utiliser et quelles collections utilisateur doivent être incluses dans une version.

Cette fonction dépend de [Gestion des sauvegardes](../backup-manager/index.mdx). Si le plugin de gestion des versions est déjà activé mais que le système affiche encore des erreurs liées à cette fonction, vérifie d'abord que la gestion des sauvegardes est aussi activée.

## Ouvrir le plugin

Tu peux ouvrir le plugin depuis 「System settings」 → 「Version control」. Un bouton de gestion des versions apparaît aussi dans la barre supérieure. Il permet de créer une version directement ou d'aller à la liste des versions. Le raccourci par défaut pour créer une version est `Ctrl + K`, et tu peux le modifier dans l'onglet des réglages.

![](https://static-docs.nocobase.com/20260526220402.png)

## Créer une version

Clique sur 「Create version」, saisis une description, puis enregistre. La description peut contenir jusqu'à 2000 caractères. Elle sert bien à noter le contexte du changement, par exemple « Ajustement des champs et permissions du flux d'approbation ».

![](https://static-docs.nocobase.com/20260526220510.png)

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
