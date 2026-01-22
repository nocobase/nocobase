---
pkg: "@nocobase/plugin-action-import"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Import

## Úvod

Importujte data pomocí Excel šablony. Můžete si nakonfigurovat, která pole se mají importovat, a šablona se automaticky vygeneruje.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Pokyny k importu

### Pole typu Číslo

Podporuje čísla a procenta. Texty jako `N/A` nebo `-` budou odfiltrovány.

| Číslo1 | Procenta | Číslo2 | Číslo3 |
| ------ | -------- | ------ | ------ |
| 123    | 25%      | N/A    | -      |

Po převodu na JSON:

```ts
{
  "Číslo1": 123,
  "Procenta": 0.25,
  "Číslo2": null,
  "Číslo3": null,
}
```

### Pole typu Boolean

Podporované vstupní texty (angličtina nerozlišuje velká a malá písmena):

- `Yes`, `Y`, `True`, `1`, `je`
- `No`, `N`, `False`, `0`, `ne`

| Pole1 | Pole2 | Pole3 | Pole4 | Pole5 |
| ----- | ----- | ----- | ----- | ----- |
| Ne    | Ano   | Y     | true  | 0     |

Po převodu na JSON:

```ts
{
  "Pole1": false,
  "Pole2": true,
  "Pole3": true,
  "Pole4": true,
  "Pole5": false,
}
```

### Pole typu Datum

| PouzeDatum          | Lokální(+08:00)     | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Po převodu na JSON:

```ts
{
  "PouzeDatum": "2023-01-18T00:00:00.000Z",
  "Lokální(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Pole typu Výběr

Jako text pro import lze použít jak hodnoty, tak popisky možností. Více možností se odděluje čárkami (`,` `,`) nebo výčtovými čárkami (`、`).

Například možnosti pro pole `Priorita` zahrnují:

| Hodnota možnosti | Popisek možnosti |
| ---------------- | ---------------- |
| low              | Nízká            |
| medium           | Střední          |
| high             | Vysoká           |

Jako text pro import lze použít jak hodnoty, tak popisky možností.

| Priorita |
| -------- |
| Vysoká   |
| low      |

Po převodu na JSON:

```ts
[{ Priorita: 'high' }, { Priorita: 'low' }];
```

### Pole pro čínské administrativní oblasti

| Oblast1             | Oblast2             |
| ------------------- | ------------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Po převodu na JSON:

```ts
{
  "Oblast1": ["11","1101"],
  "Oblast2": ["12","1201"]
}
```

### Pole typu Příloha

| Příloha                                  |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Po převodu na JSON:

```ts
{
  "Příloha": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Pole typu Vztah

Více datových záznamů se odděluje čárkami (`,` `,`) nebo výčtovými čárkami (`、`).

| Oddělení/Název | Kategorie/Název    |
| -------------- | ------------------ |
| Vývojový tým   | Kategorie1、Kategorie2 |

Po převodu na JSON:

```ts
{
  "Oddělení": [1], // 1 je ID záznamu pro oddělení s názvem „Vývojový tým“
  "Kategorie": [1,2], // 1,2 jsou ID záznamů pro kategorie s názvy „Kategorie1“ a „Kategorie2“
}
```

### Pole typu JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Po převodu na JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Typy mapových geometrií

| Bod | Linie       | Polygon           | Kruh |
| --- | ----------- | ----------------- | ---- |
| 1,2 | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3 |

Po převodu na JSON:

```ts
{
  "Bod": [1,2],
  "Linie": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Kruh": [1,2,3]
}
```

## Vlastní formát importu

Zaregistrujte vlastní `ValueParser` pomocí metody `db.registerFieldValueParsers()`, například:

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

// Při importu pole typu=point budou data analyzována pomocí PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Příklad importu

| Bod |
| --- |
| 1,2 |

Po převodu na JSON:

```ts
{
  "Bod": [1,2]
}
```

## Nastavení akce

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Konfigurace importovatelných polí

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Pravidla propojení](/interface-builder/actions/action-settings/linkage-rule): Dynamické zobrazení/skrytí tlačítka;
- [Upravit tlačítko](/interface-builder/actions/action-settings/edit-button): Úprava názvu, typu a ikony tlačítka;