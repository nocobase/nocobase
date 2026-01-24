---
pkg: "@nocobase/plugin-action-import"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Importera

## Introduktion

Importera data med hjälp av en Excel-mall. Ni kan konfigurera vilka fält som ska importeras, och mallen genereras automatiskt.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Importinstruktioner

### Numeriska fält

Stöder nummer och procenttal. Text som `N/A` eller `-` kommer att filtreras bort.

| Nummer1 | Procent | Nummer2 | Nummer3 |
| ------- | ------- | ------- | ------- |
| 123     | 25%     | N/A     | -       |

Efter konvertering till JSON:

```ts
{
  "Nummer1": 123,
  "Procent": 0.25,
  "Nummer2": null,
  "Nummer3": null
}
```

### Booleska fält

Följande inmatningstext stöds (engelska är inte skiftlägeskänsligt):

- `Yes`, `Y`, `True`, `1`, `Ja`
- `No`, `N`, `False`, `0`, `Nej`

| Fält1 | Fält2 | Fält3 | Fält4 | Fält5 |
| ----- | ----- | ----- | ----- | ----- |
| Nej   | Ja    | Y     | true  | 0     |

Efter konvertering till JSON:

```ts
{
  "Fält1": false,
  "Fält2": true,
  "Fält3": true,
  "Fält4": true,
  "Fält5": false
}
```

### Datumfält

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Efter konvertering till JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z"
}
```

### Urvalsfält

Både alternativvärden och alternativetiketter kan användas som importtext. Flera alternativ separeras med kommatecken (`,` `，`) eller uppräkningskommatecken (`、`).

Till exempel, alternativen för fältet `Prioritet` inkluderar:

| Alternativvärde | Alternativetikett |
| --------------- | ----------------- |
| low             | Låg               |
| medium          | Mellan            |
| high            | Hög               |

Både alternativvärden och alternativetiketter kan användas som importtext.

| Prioritet |
| --------- |
| Hög       |
| low       |

Efter konvertering till JSON:

```ts
[{ Prioritet: 'high' }, { Prioritet: 'low' }];
```

### Fält för kinesiska administrativa områden

| Region1             | Region2             |
| ------------------- | ------------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Efter konvertering till JSON:

```ts
{
  "Region1": ["11", "1101"],
  "Region2": ["12", "1201"]
}
```

### Bilagefält

| Bilaga                                   |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Efter konvertering till JSON:

```ts
{
  "Bilaga": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Relationsfält

Flera dataposter separeras med kommatecken (`,` `，`) eller uppräkningskommatecken (`、`).

| Avdelning/Namn  | Kategori/Titel       |
| --------------- | -------------------- |
| Utvecklingsteam | Kategori1, Kategori2 |

Efter konvertering till JSON:

```ts
{
  "Avdelning": [1], // 1 är ID för posten med avdelningsnamnet "Utvecklingsteam"
  "Kategori": [1, 2] // 1,2 är ID:n för posterna med kategorititlarna "Kategori1" och "Kategori2"
}
```

### JSON-fält

| JSON1           |
| --------------- |
| {"key":"value"} |

Efter konvertering till JSON:

```ts
{
  "JSON": { "key": "value" }
}
```

### Kartgeometrityper

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Efter konvertering till JSON:

```ts
{
  "Point": [1, 2],
  "Line": [[1, 2], [3, 4]],
  "Polygon": [[1, 2], [3, 4], [1, 2]],
  "Circle": [1, 2, 3]
}
```

## Anpassat importformat

Registrera en anpassad `ValueParser` via metoden `db.registerFieldValueParsers()`, till exempel:

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

// När ett fält av typen=point importeras, kommer datan att parsas av PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Importexempel

| Point |
| ----- |
| 1,2   |

Efter konvertering till JSON:

```ts
{
  "Point": [1, 2]
}
```

## Åtgärdsinställningar

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Konfigurera importerbara fält

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Länkregler](/interface-builder/actions/action-settings/linkage-rule): Visa/dölj knappen dynamiskt;
- [Redigera knapp](/interface-builder/actions/action-settings/edit-button): Redigera knappens titel, typ och ikon;