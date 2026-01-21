---
pkg: "@nocobase/plugin-action-import"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Importowanie

## Wprowadzenie

Mogą Państwo importować dane, korzystając z szablonu Excel. Istnieje możliwość skonfigurowania pól do importu, a szablon zostanie wygenerowany automatycznie.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Instrukcje importowania

### Pola typu liczbowego

Obsługiwane są liczby i wartości procentowe. Tekst taki jak `N/A` lub `-` zostanie odfiltrowany.

| Liczba1 | Procent | Liczba2 | Liczba3 |
| ----- | ------ | ----- | ----- |
| 123   | 25%    | N/A   | -     |

Po konwersji na JSON:

```ts
{
  "Liczba1": 123,
  "Procent": 0.25,
  "Liczba2": null,
  "Liczba3": null,
}
```

### Pola typu logicznego (Boolean)

Obsługiwany tekst wejściowy (angielski nie rozróżnia wielkości liter):

- `Yes`, `Y`, `True`, `1`, `tak`
- `No`, `N`, `False`, `0`, `nie`

| Pole1 | Pole2 | Pole3 | Pole4 | Pole5 |
| ----- | ----- | ----- | ----- | ----- |
| nie    | tak    | Y     | true  | 0     |

Po konwersji na JSON:

```ts
{
  "Pole1": false,
  "Pole2": true,
  "Pole3": true,
  "Pole4": true,
  "Pole5": false,
}
```

### Pola typu daty

| TylkoData            | Lokalny(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Po konwersji na JSON:

```ts
{
  "TylkoData": "2023-01-18T00:00:00.000Z",
  "Lokalny(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Pola typu wyboru

Zarówno wartości opcji, jak i etykiety opcji mogą być używane jako tekst do importu. Wiele opcji rozdziela się przecinkami (`,`, `，`) lub przecinkami wyliczeniowymi (`、`).

Na przykład, dostępne opcje dla pola `Priorytet` to:

| Wartość opcji | Etykieta opcji |
| ------ | -------- |
| low    | Niska       |
| medium | Średnia   |
| high   | Wysoka      |

Zarówno wartości opcji, jak i etykiety opcji mogą być używane jako tekst do importu.

| Priorytet |
| ------ |
| Wysoki     |
| low    |

Po konwersji na JSON:

```ts
[{ "Priorytet": "high" }, { "Priorytet": "low" }];
```

### Pola podziału administracyjnego Chin

| Region1         | Region2         |
| ------------- | ------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Po konwersji na JSON:

```ts
{
  "Region1": ["11","1101"],
  "Region2": ["12","1201"]
}
```

### Pola załączników

| Załącznik                                |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Po konwersji na JSON:

```ts
{
  "Załącznik": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Pola typu relacji

Wiele wpisów danych rozdziela się przecinkami (`,`, `，`) lub przecinkami wyliczeniowymi (`、`).

| Dział/Nazwa | Kategoria/Tytuł    |
| --------- | ------------ |
| Zespół Rozwoju    | Kategoria1、Kategoria2 |

Po konwersji na JSON:

```ts
{
  "Dział": [1], // 1 to ID rekordu dla działu o nazwie „Zespół Rozwoju”
  "Kategoria": [1,2], // 1,2 to ID rekordów dla kategorii o tytułach „Kategoria1” i „Kategoria2”
}
```

### Pola typu JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Po konwersji na JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Pola typu geometrii mapy

| Punkt | Linia        | Wielokąt           | Okrąg |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Po konwersji na JSON:

```ts
{
  "Punkt": [1,2],
  "Linia": [[1,2], [3,4]],
  "Wielokąt": [[1,2], [3,4], [1,2]],
  "Okrąg": [1,2,3]
}
```

## Niestandardowy format importu

Mogą Państwo zarejestrować niestandardowy `ValueParser` za pomocą metody `db.registerFieldValueParsers()`, na przykład:

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

// Podczas importowania pola typu=point, dane zostaną przetworzone przez PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Przykład importu

| Punkt |
| ----- |
| 1,2   |

Po konwersji na JSON:

```ts
{
  "Punkt": [1,2]
}
```

## Ustawienia akcji

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Konfiguracja pól możliwych do importu

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Zasady powiązania](/interface-builder/actions/action-settings/linkage-rule): Dynamiczne pokazywanie/ukrywanie przycisku;
- [Edycja przycisku](/interface-builder/actions/action-settings/edit-button): Edycja tytułu, typu i ikony przycisku;