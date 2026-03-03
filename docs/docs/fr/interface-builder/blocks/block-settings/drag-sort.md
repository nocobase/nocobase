:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/blocks/block-settings/drag-sort).
:::

# Tri par glisser-déposer

## Introduction

Le tri par glisser-déposer repose sur un champ de tri pour réorganiser manuellement les enregistrements au sein d'un bloc.


:::info{title=Astuce}
* L'utilisation d'un même champ de tri pour le glisser-déposer à travers plusieurs blocs peut perturber l'ordre existant.
* Lors de l'utilisation du tri par glisser-déposer dans un tableau, le champ de tri ne peut pas avoir de règles de regroupement configurées.
* Les tableaux en arborescence ne prennent en charge que le tri des nœuds de même niveau.

:::


## Configuration

Ajoutez un champ de type "Tri". Les champs de tri ne sont plus générés automatiquement lors de la création d'une collection ; ils doivent être créés manuellement.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Lors de l'activation du tri par glisser-déposer pour un tableau, vous devez sélectionner un champ de tri.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Tri par glisser-déposer pour les lignes de tableau


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Explication des règles de tri

Supposons que l'ordre actuel soit :

```
[1,2,3,4,5,6,7,8,9]
```

Lorsqu'un élément (par exemple, 5) est déplacé vers l'avant à la position de 3, seules les valeurs de tri de 3, 4 et 5 changeront : 5 prend la position de 3, et 3 et 4 reculent chacun d'une position.

```
[1,2,5,3,4,6,7,8,9]
```

Si vous déplacez ensuite 6 vers l'arrière à la position de 8, 6 prend la position de 8, et 7 et 8 avancent chacun d'une position.

```
[1,2,5,3,4,7,8,6,9]
```