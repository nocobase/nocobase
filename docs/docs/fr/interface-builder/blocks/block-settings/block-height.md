:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/blocks/block-settings/block-height).
:::

# Hauteur du bloc

## Introduction

La hauteur du bloc prend en charge trois modes : **Hauteur par défaut**, **Hauteur spécifiée** et **Pleine hauteur**. La plupart des blocs prennent en charge les paramètres de hauteur.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Modes de hauteur

### Hauteur par défaut

La stratégie de hauteur par défaut varie selon les types de blocs. Par exemple, les blocs de type Tableau et Formulaire adaptent automatiquement leur hauteur en fonction du contenu, et aucune barre de défilement n'apparaît à l'intérieur du bloc.

### Hauteur spécifiée

Vous pouvez spécifier manuellement la hauteur totale du cadre extérieur du bloc. Le bloc calculera et allouera automatiquement la hauteur disponible à l'intérieur.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Pleine hauteur

Le mode pleine hauteur est similaire à la hauteur spécifiée, mais la hauteur du bloc est calculée en fonction de la **zone d'affichage** (viewport) actuelle du navigateur pour atteindre la hauteur maximale de l'écran. Aucune barre de défilement n'apparaît sur la page du navigateur ; les barres de défilement n'apparaissent qu'à l'intérieur du bloc.

La gestion du défilement interne en mode pleine hauteur diffère légèrement selon les blocs :

- **Tableau** : défilement interne au sein du `tbody` ;
- **Formulaire / Détails** : défilement à l'intérieur de la grille (défilement du contenu à l'exclusion de la zone d'action) ;
- **Liste / Carte en grille** : défilement à l'intérieur de la grille (défilement du contenu à l'exclusion de la zone d'action et de la barre de pagination) ;
- **Carte / Calendrier** : hauteur adaptative globale, sans barre de défilement ;
- **Iframe / Markdown** : limite la hauteur totale du cadre du bloc, les barres de défilement apparaissant à l'intérieur du bloc.

#### Tableau en pleine hauteur

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formulaire en pleine hauteur

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)