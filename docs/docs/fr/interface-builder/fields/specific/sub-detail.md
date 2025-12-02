:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Sous-détails

## Introduction

Les sous-détails sont le composant correspondant aux sous-formulaires en mode lecture seule. Comparés aux composants Étiquette et Titre, les sous-détails peuvent non seulement afficher davantage de données de la collection actuelle, mais vous pouvez également les configurer pour afficher des informations provenant de collections liées. Les données relationnelles à plusieurs niveaux sont clairement présentées sous forme de détails imbriqués.

## Utilisation

### Sous-détails pour les champs d'association "un-à-plusieurs"

![20251027221700](https://static-docs.nocobase.com/20251027221700.png)

Cette fonctionnalité prend en charge l'affichage imbriqué de champs d'association à plusieurs niveaux. Exemple : Commandes/Articles de commande/Produits.

![20251027221924](https://static-docs.nocobase.com/20251027221924.png)

### Sous-détails pour les champs d'association "un-à-un"

![20251027222059](https://static-docs.nocobase.com/20251027222059.png)

## Options de configuration des champs

### Composant de champ

![20251027222243](https://static-docs.nocobase.com/20251027222243.png)

![20251027222347](https://static-docs.nocobase.com/20251027222347.png)

[Composant de champ](/interface-builder/fields/association-field) : Permet de passer à d'autres composants de champ d'association en mode lecture seule, tels que le composant de champ Titre, le sous-tableau (pris en charge uniquement pour les champs d'association "un-à-plusieurs"), etc.