---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Exporter les pièces jointes

## Introduction

L'exportation de pièces jointes vous permet d'exporter les champs liés aux pièces jointes sous forme d'archive compressée.

#### Configuration de l'exportation des pièces jointes

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Configurez les champs de pièces jointes à exporter ; la sélection multiple est prise en charge.
- Vous pouvez choisir de générer ou non un dossier pour chaque enregistrement.

Règles de nommage des fichiers :

- Si vous choisissez de générer un dossier pour chaque enregistrement, la règle de nommage des fichiers est la suivante : `{valeur du champ de titre de l'enregistrement}/{nom du champ de pièce jointe}[-{numéro de séquence du fichier}].{extension du fichier}`.
- Si vous choisissez de ne pas générer de dossier, la règle de nommage des fichiers est la suivante : `{valeur du champ de titre de l'enregistrement}-{nom du champ de pièce jointe}[-{numéro de séquence du fichier}].{extension du fichier}`.

Le numéro de séquence du fichier est généré automatiquement lorsqu'un champ de pièce jointe contient plusieurs pièces jointes.

- [Règle de liaison](/interface-builder/actions/action-settings/linkage-rule) : Affiche/masque dynamiquement le bouton ;
- [Modifier le bouton](/interface-builder/actions/action-settings/edit-button) : Modifiez le titre, le type et l'icône du bouton ;