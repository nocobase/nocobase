---
pkg: "@nocobase/plugin-action-bulk-edit"
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/actions/types/bulk-edit).
:::

# Édition en masse

## Introduction

L'édition en masse est adaptée aux scénarios nécessitant des mises à jour flexibles de données par lots. Après avoir cliqué sur le bouton d'édition en masse, vous pouvez configurer le formulaire d'édition en masse dans une fenêtre contextuelle et définir différentes stratégies de mise à jour pour chaque champ.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## Configuration de l'action

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## Guide d'utilisation

### Configuration du formulaire d'édition en masse

1. Ajoutez un bouton d'édition en masse.

2. Définissez la portée de l'édition en masse : Sélectionné / Tout, par défaut sur Sélectionné.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. Ajoutez un formulaire d'édition en masse.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. Configurez les champs à modifier et ajoutez un bouton de soumission.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### Soumission du formulaire

1. Sélectionnez les lignes de données à modifier.

2. Sélectionnez le mode d'édition pour les champs et saisissez les valeurs à soumettre.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title="Modes d'édition disponibles"}
* **Ne pas mettre à jour** : Le champ reste inchangé.
* **Modifier en** : Met à jour le champ avec la valeur soumise.
* **Effacer** : Efface les données du champ.

:::

3. Soumettez le formulaire.