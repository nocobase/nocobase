---
pkg: "@nocobase/plugin-action-import"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Importation

## Introduction

Importez des données à l'aide d'un modèle Excel. Vous pouvez configurer les champs à importer, et le modèle sera généré automatiquement.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Instructions d'importation

### Champs de type numérique

Prend en charge les nombres et les pourcentages. Les textes comme `N/A` ou `-` seront filtrés.

| Nombre 1 | Pourcentage | Nombre 2 | Nombre 3 |
| -------- | ----------- | -------- | -------- |
| 123      | 25%         | N/A      | -        |

Après conversion en JSON :

```ts
{
  "Nombre 1": 123,
  "Pourcentage": 0.25,
  "Nombre 2": null,
  "Nombre 3": null,
}
```

### Champs de type booléen

Les valeurs d'entrée prises en charge (l'anglais ne distingue pas la casse) :

- `Yes`, `Y`, `True`, `1`, `是`
- `No`, `N`, `False`, `0`, `否`

| Champ 1 | Champ 2 | Champ 3 | Champ 4 | Champ 5 |
| ------- | ------- | ------- | ------- | ------- |
| Non     | Oui     | Y       | true    | 0       |

Après conversion en JSON :

```ts
{
  "Champ 1": false,
  "Champ 2": true,
  "Champ 3": true,
  "Champ 4": true,
  "Champ 5": false,
}
```

### Champs de type date

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Après conversion en JSON :

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Champs de type sélection

Les valeurs d'option et les libellés d'option peuvent tous deux être utilisés comme texte d'importation. Plusieurs options sont séparées par des virgules (`,` `，`) ou des virgules d'énumération (`、`).

Par exemple, les options pour le champ `Priorité` incluent :

| Valeur d'option | Libellé d'option |
| --------------- | ---------------- |
| low             | Basse            |
| medium          | Moyenne          |
| high            | Haute            |

Les valeurs d'option et les libellés d'option peuvent tous deux être utilisés comme texte d'importation.

| Priorité |
| -------- |
| Haute    |
| low      |

Après conversion en JSON :

```ts
[{ Priorité: 'high' }, { Priorité: 'low' }];
```

### Champs de division administrative chinoise

| Région 1        | Région 2        |
| --------------- | --------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Après conversion en JSON :

```ts
{
  "Région 1": ["11","1101"],
  "Région 2": ["12","1201"]
}
```

### Champs de pièce jointe

| Pièce jointe                             |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Après conversion en JSON :

```ts
{
  "Pièce jointe": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Champs de type relationnel

Plusieurs entrées de données sont séparées par des virgules (`,` `，`) ou des virgules d'énumération (`、`).

| Département/Nom       | Catégorie/Titre               |
| --------------------- | ----------------------------- |
| Équipe de développement | Catégorie 1、Catégorie 2 |

Après conversion en JSON :

```ts
{
  "Département": [1], // 1 est l'ID de l'enregistrement pour le département nommé « Équipe de développement »
  "Catégorie": [1,2], // 1,2 sont les ID d'enregistrement pour les catégories intitulées « Catégorie 1 » et « Catégorie 2 »
}
```

### Champs de type JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Après conversion en JSON :

```ts
{
  "JSON": {"key":"value"}
}
```

### Types de géométrie cartographique

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Après conversion en JSON :

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Format d'importation personnalisé

Enregistrez un `ValueParser` personnalisé via la méthode `db.registerFieldValueParsers()`, par exemple :

```ts
import { BaseValueParser } from '@nocobase/database';

class PointValueParser extends BaseValueParser {
  async setValue(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === 'string') {
      this.value = value.split(',');
    } else {
      this.errors.push('Value invalid');
    }
  }
}

const db = new Database();

// Lors de l'importation d'un champ de type=point, les données seront analysées par PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Exemple d'importation

| Point |
| ----- |
| 1,2   |

Après conversion en JSON :

```ts
{
  "Point": [1,2]
}
```

## Paramètres d'action

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Configurez les champs importables

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Règles de liaison](/interface-builder/actions/action-settings/linkage-rule) : Affichez/masquez le bouton dynamiquement ;
- [Modifier le bouton](/interface-builder/actions/action-settings/edit-button) : Modifiez le titre, le type et l'icône du bouton ;