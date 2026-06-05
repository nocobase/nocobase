---
pkg: "@nocobase/plugin-action-import"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Import

## Einführung

Importieren Sie Daten mithilfe einer Excel-Vorlage. Sie können konfigurieren, welche Felder importiert werden sollen, und die Vorlage wird automatisch generiert.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Hinweise zum Import

### Zahlenfelder

Es werden Zahlen und Prozentsätze unterstützt. Texte wie `N/A` oder `-` werden herausgefiltert.

| Zahl 1 | Prozentsatz | Zahl 2 | Zahl 3 |
| ----- | ------ | ----- | ----- |
| 123   | 25%    | N/A   | -     |

Nach der Konvertierung in JSON:

```ts
{
  "Zahl 1": 123,
  "Prozentsatz": 0.25,
  "Zahl 2": null,
  "Zahl 3": null,
}
```

### Boolesche Felder

Unterstützte Eingabetexte (Groß- und Kleinschreibung wird ignoriert):

- `Yes`, `Y`, `True`, `1`, `是`
- `No`, `N`, `False`, `0`, `否`

| Feld 1 | Feld 2 | Feld 3 | Feld 4 | Feld 5 |
| ----- | ----- | ----- | ----- | ----- |
| No    | Yes   | Y     | true  | 0     |

Nach der Konvertierung in JSON:

```ts
{
  "Feld 1": false,
  "Feld 2": true,
  "Feld 3": true,
  "Feld 4": true,
  "Feld 5": false,
}
```

### Datumsfelder

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Nach der Konvertierung in JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Auswahlfelder

Sowohl Optionswerte als auch Optionsbezeichnungen können als Importtext verwendet werden. Mehrere Optionen werden durch Kommas (`,` `，`) oder Aufzählungszeichen (`,`) getrennt.

Zum Beispiel umfassen die Optionen für das Feld `Priorität`:

| Optionswert | Optionsbezeichnung |
| ------ | -------- |
| low    | Niedrig  |
| medium | Mittel   |
| high   | Hoch     |

Sowohl Optionswerte als auch Optionsbezeichnungen können als Importtext verwendet werden.

| Priorität |
| ------ |
| Hoch   |
| low    |

Nach der Konvertierung in JSON:

```ts
[{ Priorität: 'high' }, { Priorität: 'low' }];
```

### Felder für chinesische Verwaltungsregionen

| Region 1         | Region 2         |
| ------------- | ------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Nach der Konvertierung in JSON:

```ts
{
  "Region 1": ["11","1101"],
  "Region 2": ["12","1201"]
}
```

### Felder für Anhänge

| Anhang                                   |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Nach der Konvertierung in JSON:

```ts
{
  "Anhang": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Beziehungsfelder

Mehrere Datensätze werden durch Kommas (`,` `，`) oder Aufzählungszeichen (`,`) getrennt.

| Abteilung/Name | Kategorie/Titel    |
| --------- | ------------ |
| Entwicklerteam    | Kategorie1、Kategorie2 |

Nach der Konvertierung in JSON:

```ts
{
  "Abteilung": [1], // 1 ist die Datensatz-ID für die Abteilung mit dem Namen „Entwicklerteam“
  "Kategorie": [1,2], // 1,2 sind die Datensatz-IDs für Kategorien mit den Titeln „Kategorie1“ und „Kategorie2“
}
```

### JSON-Felder

| JSON 1          |
| --------------- |
| {"key":"value"} |

Nach der Konvertierung in JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Geometrietypen für Karten

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Nach der Konvertierung in JSON:

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Benutzerdefiniertes Importformat

Registrieren Sie einen benutzerdefinierten `ValueParser` über die Methode `db.registerFieldValueParsers()`, zum Beispiel:

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

// Beim Import eines Feldes vom Typ "point" werden die Daten durch den PointValueParser analysiert.
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Import-Beispiel

| Point |
| ----- |
| 1,2   |

Nach der Konvertierung in JSON:

```ts
{
  "Point": [1,2]
}
```

## Aktions-Einstellungen

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Konfigurieren Sie importierbare Felder

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Verknüpfungsregeln](/interface-builder/actions/action-settings/linkage-rule): Schaltfläche dynamisch anzeigen/ausblenden;
- [Schaltfläche bearbeiten](/interface-builder/actions/action-settings/edit-button): Titel, Typ und Symbol der Schaltfläche bearbeiten;