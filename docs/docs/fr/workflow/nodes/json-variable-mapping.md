---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Mappage de variables JSON

> v1.6.0

## Introduction

Permet de mapper des structures JSON complexes issues des résultats de nœuds amont en variables, afin de les utiliser dans les nœuds suivants. Par exemple, après avoir mappé les résultats des nœuds d'action SQL et de requête HTTP, vous pouvez utiliser leurs valeurs de propriété dans les nœuds ultérieurs.

:::info{title=Conseil}
Contrairement au nœud de calcul JSON, le nœud de mappage de variables JSON ne prend pas en charge les expressions personnalisées et ne repose pas sur un moteur tiers. Il est uniquement utilisé pour mapper les valeurs de propriété dans une structure JSON, mais il est plus simple à utiliser.
:::

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Mappage de variables JSON » :

![Créer un nœud](https://static-docs.nocobase.com/20250113173635.png)

## Configuration du nœud

### Source de données

La source de données peut être le résultat d'un nœud amont ou un objet de données dans le contexte du processus. Il s'agit généralement d'un objet de données non structuré, tel que le résultat d'un nœud SQL ou d'un nœud de requête HTTP.

![Source de données](https://static-docs.nocobase.com/20250113173720.png)

### Saisir des exemples de données

Collez des exemples de données et cliquez sur le bouton d'analyse pour générer automatiquement une liste de variables :

![Saisir des exemples de données](https://static-docs.nocobase.com/20250113182327.png)

Si la liste générée automatiquement contient des variables dont vous n'avez pas besoin, vous pouvez cliquer sur le bouton de suppression pour les retirer.

:::info{title=Conseil}
Les exemples de données ne sont pas le résultat final de l'exécution ; ils sont uniquement utilisés pour faciliter la génération de la liste de variables.
:::

### Le chemin inclut l'index du tableau

Si cette option n'est pas cochée, le contenu du tableau sera mappé selon la méthode de gestion des variables par défaut des flux de travail NocoBase. Par exemple, si vous saisissez l'exemple suivant :

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

Dans les variables générées, `b.c` représentera le tableau `[2, 3]`.

Si cette option est cochée, le chemin de la variable inclura l'index du tableau, par exemple `b.0.c` et `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Lorsque vous incluez des index de tableau, vous devez vous assurer que les index de tableau dans les données d'entrée sont cohérents ; sinon, cela entraînera une erreur d'analyse.

## Utilisation dans les nœuds suivants

Dans la configuration des nœuds suivants, vous pouvez utiliser les variables générées par le nœud de mappage de variables JSON :

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Bien que la structure JSON puisse être complexe, après le mappage, il vous suffit de sélectionner la variable correspondant au chemin souhaité.