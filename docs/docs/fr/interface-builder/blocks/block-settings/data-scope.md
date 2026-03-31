:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Définir la portée des données

## Introduction

Définir la portée des données consiste à établir des conditions de filtre par défaut pour un bloc de données. Les utilisateurs peuvent ajuster la portée des données de manière flexible selon leurs besoins métier. Cependant, quelles que soient les opérations de filtrage effectuées, le système appliquera automatiquement cette condition de filtre par défaut, garantissant que les données restent toujours dans les limites de la portée spécifiée.

## Guide d'utilisation

![20251027110053](https://static-docs.nocobase.com/20251027110053.png)

Le champ de filtre permet de sélectionner des champs de la collection actuelle et des collections associées.

![20251027110140](https://static-docs.nocobase.com/20251027110140.png)

### Opérateurs

Différents types de champs prennent en charge différents opérateurs. Par exemple, les champs de texte acceptent des opérateurs comme "égal à", "différent de" ou "contient" ; les champs numériques prennent en charge des opérateurs comme "supérieur à" ou "inférieur à" ; tandis que les champs de date permettent des opérateurs comme "est dans la plage" ou "est avant une date spécifique".

![20251027111124](https://static-docs.nocobase.com/20251027111124.png)

### Valeur statique

Exemple : Filtrer les données par le « Statut » de la commande.

![20251027111229](https://static-docs.nocobase.com/20251027111229.png)

### Valeur de variable

Exemple : Filtrer les données de commande de l'utilisateur actuel.

![20251027113349](https://static-docs.nocobase.com/20251027113349.png)

Pour en savoir plus sur les variables, consultez [Variables](/interface-builder/variables)