:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Sélection en cascade

## Introduction

Le sélecteur en cascade est conçu pour les champs de relation dont la collection cible est une table arborescente. Il permet aux utilisateurs de sélectionner des données en suivant la structure hiérarchique de la collection arborescente et prend en charge la recherche floue pour un filtrage rapide.

## Instructions d'utilisation

- Pour une relation un-à-un, le sélecteur en cascade est à sélection unique.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Pour une relation un-à-plusieurs, le sélecteur en cascade est à sélection multiple.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Options de configuration du champ

### Champ de titre

Le champ de titre détermine l'étiquette affichée pour chaque option.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Prend en charge la recherche rapide basée sur le champ de titre.

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Pour plus de détails, consultez :
[Champ de titre](/interface-builder/fields/field-settings/title-field)

### Portée des données

Contrôle la portée des données de la liste arborescente (si un enregistrement enfant correspond aux conditions, son enregistrement parent sera également inclus).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Pour plus de détails, consultez :
[Portée des données](/interface-builder/fields/field-settings/data-scope)

Plus de composants de champ :
[Composants de champ](/interface-builder/fields/association-field)