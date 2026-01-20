---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Collections héritées

## Introduction

:::warning
Uniquement pris en charge lorsque la base de données principale est PostgreSQL.
:::

Vous pouvez créer une collection parente et en dériver des collections enfants. La collection enfant héritera de la structure de la collection parente et pourra également définir ses propres colonnes. Ce modèle de conception aide à organiser et à gérer des données ayant des structures similaires mais potentiellement différentes.

Voici quelques caractéristiques courantes des collections héritées :

- **Collection parente** : Elle contient les colonnes et les données communes, définissant la structure de base de toute la hiérarchie d'héritage.
- **Collection enfant** : Elle hérite de la structure de la collection parente, mais peut également définir ses propres colonnes. Cela permet à chaque collection enfant d'avoir les propriétés communes de la collection parente tout en contenant des attributs spécifiques à la sous-classe.
- **Requêtes** : Lorsque vous effectuez des requêtes, vous pouvez choisir d'interroger toute la hiérarchie d'héritage, ou seulement la collection parente ou une collection enfant spécifique. Cela permet de récupérer et de traiter les données à différents niveaux selon vos besoins.
- **Relation d'héritage** : Une relation d'héritage est établie entre la collection parente et la collection enfant, ce qui signifie que la structure de la collection parente peut être utilisée pour définir des attributs cohérents, tout en permettant à la collection enfant d'étendre ou de remplacer ces attributs.

Ce modèle de conception aide à réduire la redondance des données, à simplifier le modèle de base de données et à faciliter la maintenance des données. Cependant, il doit être utilisé avec prudence, car les collections héritées peuvent augmenter la complexité des requêtes, en particulier lors du traitement de toute la hiérarchie d'héritage. Les systèmes de base de données qui prennent en charge les collections héritées fournissent généralement une syntaxe et des outils spécifiques pour gérer et interroger ces structures de collection.

## Manuel d'utilisation

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)