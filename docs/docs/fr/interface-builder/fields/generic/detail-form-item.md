:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Champs de détails

## Introduction

La configuration des champs pour les blocs de détails, de liste et de grille est pratiquement identique. Elle contrôle principalement l'affichage des champs en mode lecture seule.

![20251025172851](https://static-docs.nocobase.com/20251025172851.png)

## Options de configuration des champs

### Formatage des champs de date

![20251025173005](https://static-docs.nocobase.com/20251025173005.png)

Pour plus de détails, consultez [Formatage des dates](/interface-builder/fields/specific/date-picker)

### Formatage des champs numériques

![20251025173242](https://static-docs.nocobase.com/20251025173242.png)

Il prend en charge la conversion d'unités simple, les séparateurs de milliers, les préfixes et suffixes, la précision et la notation scientifique.

Pour plus de détails, consultez [Formatage des nombres](/interface-builder/fields/field-settings/number-format)

### Activer le clic pour ouvrir

Outre les champs d'association, les champs ordinaires peuvent également être configurés pour s'ouvrir au clic, servant ainsi de point d'entrée pour une fenêtre contextuelle. Vous pouvez également définir le mode d'ouverture de cette fenêtre (tiroir, boîte de dialogue ou sous-page).

![20251025173549](https://static-docs.nocobase.com/20251025173549.gif)

### Mode d'affichage du contenu en cas de dépassement

Lorsque le contenu du champ dépasse sa largeur, vous pouvez définir le mode de dépassement.

- Ellipse (par défaut)
- Retour à la ligne

![20251025173917](https://static-docs.nocobase.com/20251025173917.png)

### Composant de champ

Certains champs prennent en charge plusieurs formats d'affichage, ce qui peut être réalisé en changeant le composant de champ.

Par exemple : Le composant `URL` peut être remplacé par le composant `Preview`.

![20251025174042](https://static-docs.nocobase.com/20251025174042.png)

Par exemple, les champs d'association peuvent être affichés différemment en passant du composant de champ de titre à `Sous-détails` pour afficher plus de contenu lié à l'association.

![20251025174311](https://static-docs.nocobase.com/20251025174311.gif)

- [Modifier le titre du champ](/interface-builder/fields/field-settings/edit-title)
- [Modifier la description du champ](/interface-builder/fields/field-settings/edit-description)
- [Modifier l'info-bulle du champ](/interface-builder/fields/field-settings/edit-tooltip)