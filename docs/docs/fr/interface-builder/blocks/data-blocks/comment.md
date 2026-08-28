---
pkg: "@nocobase/plugin-block-comment"
title: "Bloc de commentaires"
description: "Bloc de commentaires : permet d'afficher et de créer des commentaires dans les détails d'enregistrements, les fenêtres contextuelles et les scénarios similaires, avec mappage des champs, pagination, portée des données, tri par défaut et saut automatique à la dernière page."
keywords: "Bloc de commentaires,CommentBlock,table de commentaires,mappage des champs,portée des données,tri par défaut,constructeur d'interface,NocoBase"
---

# Bloc de commentaires

## Introduction

Le bloc de commentaires ajoute des capacités de commentaire aux enregistrements métier. Vous pouvez l'ajouter aux pages de détail ou aux fenêtres contextuelles de tâches, d'articles, de tickets, de clients et d'autres enregistrements, afin que les utilisateurs puissent consulter, répondre et créer des commentaires autour de l'enregistrement courant.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_02_PM.png)

:::tip Astuce

Le bloc de commentaires ne crée pas de collection par lui-même. Avant de l'utiliser, préparez une collection pour stocker les commentaires et configurez les champs comme le contenu du commentaire, l'auteur, le propriétaire du commentaire et l'heure du commentaire.

:::

## Ajouter un bloc

Le bloc de commentaires est généralement ajouté à la page de détail ou à la fenêtre contextuelle d'un enregistrement métier.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM.png)

1. Ouvrez la page de détail ou la fenêtre contextuelle de l'enregistrement cible
2. Cliquez sur "Ajouter un bloc"
3. Sélectionnez "Commentaire"
4. Sélectionnez la collection utilisée pour stocker les commentaires
5. Terminez le mappage des champs comme indiqué

Si le bloc de commentaires est créé à partir d'une association, NocoBase essaie d'identifier automatiquement le champ propriétaire du commentaire et la valeur de l'enregistrement courant selon l'association courante. Dans ce cas, "Champ propriétaire du commentaire" et "Valeur du champ propriétaire du commentaire" sont remplis automatiquement et ne nécessitent généralement pas de configuration manuelle.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Si le bloc est créé directement depuis la collection de commentaires, vous devez configurer manuellement le champ propriétaire du commentaire et sa valeur.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_03_PM%20(1).png)

## Mappage des champs

Le bloc de commentaires utilise le "Mappage des champs" pour savoir comment chaque commentaire doit être affiché et enregistré.

| Configuration | Description |
| --- | --- |
| Champ de contenu du commentaire | Sélectionnez le champ utilisé pour stocker le corps du commentaire. |
| Champ de l'auteur du commentaire | Sélectionnez un champ plusieurs-à-un associé à la collection des utilisateurs. |
| Champ propriétaire du commentaire | Sélectionnez le champ utilisé pour stocker l'identifiant de l'enregistrement métier courant. |
| Valeur du champ propriétaire du commentaire | Indiquez la valeur de l'enregistrement métier courant, par exemple `{{ ctx.popup.record.id }}`. |
| Champ de date du commentaire | Sélectionnez le champ d'heure du commentaire, utilisé pour l'affichage et le tri par défaut. |

### Champ propriétaire du commentaire

"Champ propriétaire du commentaire" sert à filtrer les commentaires de l'enregistrement courant et est également écrit lors de la création d'un nouveau commentaire.

Lors de la sélection manuelle, la liste déroulante affiche uniquement les champs scalaires ordinaires et n'affiche pas les champs d'association. Configurations courantes :

| Collection métier | Champ propriétaire dans la collection de commentaires | Valeur du champ propriétaire du commentaire |
| --- | --- | --- |
| Tâches | `taskId` | `{{ ctx.popup.record.id }}` |
| Articles | `postId` | `{{ ctx.popup.record.id }}` |
| Tickets | `ticketId` | `{{ ctx.popup.record.id }}` |

Si l'enregistrement courant utilise un identifiant unique autre que `id`, remplacez "Valeur du champ propriétaire du commentaire" par le champ correspondant, par exemple `{{ ctx.popup.record.uuid }}`.

### Mappage automatique depuis les associations

Si le bloc est créé à partir d'une association de l'enregistrement métier, le bloc de commentaires utilise en priorité le champ de clé étrangère de cette association comme champ propriétaire du commentaire, et utilise la valeur de l'enregistrement courant comme valeur du champ propriétaire du commentaire.

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_04_PM.png)

Par exemple, s'il existe une association un-à-plusieurs entre la collection des tâches et la collection des commentaires de tâches, et que le champ de clé étrangère dans la collection des commentaires de tâches est `taskId`, alors lorsque vous ajoutez un bloc de commentaires depuis l'association dans la page de détail de la tâche, le bloc utilise automatiquement :

- Champ propriétaire du commentaire : `taskId`
- Valeur du champ propriétaire du commentaire : l'identifiant de l'enregistrement de tâche courant

Cette approche convient à la plupart des scénarios et réduit les erreurs de configuration manuelle.

## Configuration du bloc

![](https://static-docs.nocobase.com/Comments-07-01-2026_12_07_PM.png)

### Taille de page

Définissez le nombre de commentaires affichés par page. Les valeurs disponibles sont `5`, `10`, `20`, `50`, `100` et `200`.

### Portée des données

Définissez la portée de filtrage des données pour la liste des commentaires. Vous pouvez ajouter d'autres conditions ici, par exemple afficher uniquement les commentaires qui correspondent à certains statuts ou conditions d'autorisation.

Pour plus de détails, consultez [Définir la portée des données](../block-settings/data-scope.md).

### Règle de tri par défaut

Définissez la règle de tri par défaut de la liste des commentaires. En général, vous pouvez trier par le champ de date du commentaire en ordre croissant ou décroissant.

Si aucune règle de tri par défaut n'est configurée séparément, le bloc de commentaires utilise en priorité le "Champ de date du commentaire" comme champ de tri par défaut.

Pour plus de détails, consultez [Définir la règle de tri](../block-settings/sorting-rule.md).

### Sauter automatiquement à la dernière page

Désactivé par défaut. Lorsqu'il est désactivé, le bloc de commentaires reste sur la première page après l'ouverture.

Lorsqu'il est activé, le bloc de commentaires saute à la dernière page au premier chargement. C'est adapté lorsque vous souhaitez que les utilisateurs voient d'abord les commentaires les plus récents.
