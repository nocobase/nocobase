---
pkg: "@nocobase/plugin-action-import"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Importeren

## Introductie

U kunt gegevens importeren met behulp van een Excel-sjabloon. U kunt configureren welke velden u wilt importeren, en het sjabloon wordt automatisch gegenereerd.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Importinstructies

### Velden van het type Getal

Ondersteunt getallen en percentages. Tekst zoals `N/A` of `-` wordt gefilterd.

| Getal 1 | Percentage | Getal 2 | Getal 3 |
| ------- | ---------- | ------- | ------- |
| 123     | 25%        | N/A     | -       |

Na conversie naar JSON:

```ts
{
  "Getal 1": 123,
  "Percentage": 0.25,
  "Getal 2": null,
  "Getal 3": null
}
```

### Velden van het type Booleaans

Ondersteunde invoertekst (Engels is niet hoofdlettergevoelig):

- `Yes`, `Y`, `True`, `1`, `是`
- `No`, `N`, `False`, `0`, `否`

| Veld 1 | Veld 2 | Veld 3 | Veld 4 | Veld 5 |
| ------ | ------ | ------ | ------ | ------ |
| Nee    | Ja     | Y      | true   | 0      |

Na conversie naar JSON:

```ts
{
  "Veld 1": false,
  "Veld 2": true,
  "Veld 3": true,
  "Veld 4": true,
  "Veld 5": false
}
```

### Velden van het type Datum

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Na conversie naar JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z"
}
```

### Keuzevelden

Zowel optiewaarden als optielabels kunnen als importtekst worden gebruikt. Meerdere opties worden gescheiden door komma's (`,` `，`) of opsommingskomma's (`、`).

De opties voor het veld `Prioriteit` zijn bijvoorbeeld:

| Optiewaarde | Optielabel |
| ----------- | ---------- |
| low         | Laag       |
| medium      | Gemiddeld  |
| high        | Hoog       |

Zowel optiewaarden als optielabels kunnen als importtekst worden gebruikt.

| Prioriteit |
| ---------- |
| Hoog       |
| low        |

Na conversie naar JSON:

```ts
[{ Prioriteit: 'high' }, { Prioriteit: 'low' }];
```

### Velden voor Chinese administratieve indeling

| Regio 1       | Regio 2       |
| ------------- | ------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Na conversie naar JSON:

```ts
{
  "Regio 1": ["11","1101"],
  "Regio 2": ["12","1201"]
}
```

### Bijlagevelden

| Bijlage                                  |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Na conversie naar JSON:

```ts
{
  "Bijlage": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Relatievelden

Meerdere gegevensitems worden gescheiden door komma's (`,` `，`) of opsommingskomma's (`、`).

| Afdeling/Naam  | Categorie/Titel    |
| -------------- | ------------------ |
| Ontwikkelteam  | Categorie1, Categorie2 |

Na conversie naar JSON:

```ts
{
  "Afdeling": [1], // 1 is de record-ID voor de afdeling met de naam "Ontwikkelteam"
  "Categorie": [1,2], // 1,2 zijn de record-ID's voor categorieën met de titel "Categorie1" en "Categorie2"
}
```

### Velden van het type JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Na conversie naar JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Geometrische kaarttypen

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Na conversie naar JSON:

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Aangepast importformaat

Registreer een aangepaste `ValueParser` via de `db.registerFieldValueParsers()` methode, bijvoorbeeld:

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

// Bij het importeren van een veld van type=point, worden de gegevens geparset door PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Importvoorbeeld

| Point |
| ----- |
| 1,2   |

Na conversie naar JSON:

```ts
{
  "Point": [1,2]
}
```

## Actie-instellingen

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Configureer importeerbare velden

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Koppelingsregels](/interface-builder/actions/action-settings/linkage-rule): Toon/verberg de knop dynamisch;
- [Knop bewerken](/interface-builder/actions/action-settings/edit-button): Bewerk de titel, het type en het pictogram van de knop;