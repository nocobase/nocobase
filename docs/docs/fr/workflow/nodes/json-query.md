---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Calcul JSON

## Introduction

S'appuyant sur différents moteurs de calcul JSON, ce nœud vous permet de calculer ou de transformer des données JSON complexes générées par les nœuds en amont, afin qu'elles puissent être utilisées par les nœuds suivants. Par exemple, les résultats des opérations SQL et des requêtes HTTP peuvent être transformés via ce nœud en valeurs et formats de variables nécessaires pour les nœuds ultérieurs.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le processus pour ajouter un nœud « Calcul JSON » :

![Créer un nœud](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Astuce}
Généralement, le nœud Calcul JSON est créé sous d'autres nœuds de données pour faciliter leur analyse.
:::

## Configuration du nœud

### Moteur d'analyse

Le nœud Calcul JSON prend en charge différentes syntaxes grâce à divers moteurs d'analyse. Vous pouvez choisir en fonction de vos préférences et des spécificités de chaque moteur. Actuellement, trois moteurs d'analyse sont pris en charge :

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Sélection du moteur](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Source de données

La source de données peut être le résultat d'un nœud en amont ou un objet de données dans le contexte du flux de travail. Il s'agit généralement d'un objet de données sans structure intégrée, comme le résultat d'un nœud SQL ou d'un nœud de requête HTTP.

![Source de données](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Astuce}
Généralement, les objets de données des nœuds liés aux collections sont structurés via les informations de configuration de la collection et n'ont généralement pas besoin d'être analysés par le nœud Calcul JSON.
:::

### Expression d'analyse

Expressions d'analyse personnalisées basées sur les exigences d'analyse et le moteur d'analyse choisi.

![Expression d'analyse](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Astuce}
Différents moteurs offrent différentes syntaxes d'analyse. Pour plus de détails, veuillez consulter la documentation via les liens fournis.
:::

Depuis la version `v1.0.0-alpha.15`, les expressions prennent en charge les variables. Les variables sont pré-analysées avant l'exécution par le moteur spécifique, remplaçant les variables par des valeurs de chaîne spécifiques selon les règles des modèles de chaîne, et les concaténant avec d'autres chaînes statiques de l'expression pour former l'expression finale. Cette fonctionnalité est très utile lorsque vous avez besoin de construire des expressions de manière dynamique, par exemple, lorsque certains contenus JSON nécessitent une clé dynamique pour l'analyse.

### Mappage de propriétés

Lorsque le résultat du calcul est un objet (ou un tableau d'objets), vous pouvez, via le mappage de propriétés, mapper les propriétés nécessaires en variables enfants pour qu'elles soient utilisées par les nœuds suivants.

![Mappage de propriétés](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Astuce}
Pour un résultat d'objet (ou de tableau d'objets), si le mappage de propriétés n'est pas effectué, l'objet entier (ou le tableau d'objets) sera enregistré comme une seule variable dans le résultat du nœud, et les valeurs des propriétés de l'objet ne pourront pas être utilisées directement comme variables.
:::

## Exemple

Supposons que les données à analyser proviennent d'un nœud SQL précédent utilisé pour interroger des données, et que son résultat soit un ensemble de données de commande :

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Si nous devons analyser et calculer le prix total de deux commandes dans les données, et l'assembler avec l'ID de commande correspondant dans un objet pour mettre à jour le prix total de la commande, nous pouvons le configurer comme suit :

![Exemple - Configuration de l'analyse SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Sélectionnez le moteur d'analyse JSONata ;
2. Sélectionnez le résultat du nœud SQL comme source de données ;
3. Utilisez l'expression JSONata `$[0].{"id": id, "total": products.(price * quantity)}` pour l'analyse ;
4. Sélectionnez le mappage de propriétés pour mapper `id` et `total` en variables enfants ;

Le résultat final de l'analyse est le suivant :

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Ensuite, parcourez le tableau de commandes résultant pour mettre à jour le prix total des commandes.

![Mettre à jour le prix total de la commande correspondante](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)