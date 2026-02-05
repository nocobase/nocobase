---
pkg: "@nocobase/plugin-action-import"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Importazione

## Introduzione

Importi dati utilizzando un modello Excel. Può configurare quali campi importare e il modello verrà generato automaticamente.

![20251029165818](https://static-docs.nocobase.com/20251029165818.png)

## Istruzioni per l'importazione

### Campi di tipo numerico

Supporta numeri e percentuali. Testi come `N/A` o `-` verranno filtrati.

| Numero1 | Percentuale | Numero2 | Numero3 |
| ------- | ----------- | ------- | ------- |
| 123     | 25%         | N/A     | -       |

Dopo la conversione in JSON:

```ts
{
  "Numero1": 123,
  "Percentuale": 0.25,
  "Numero2": null,
  "Numero3": null,
}
```

### Campi di tipo booleano

Il testo di input supporta (l'inglese non è sensibile alle maiuscole/minuscole):

- `Yes`, `Y`, `True`, `1`, `是`
- `No`, `N`, `False`, `0`, `否`

| Campo1 | Campo2 | Campo3 | Campo4 | Campo5 |
| ------ | ------ | ------ | ------ | ------ |
| No     | Sì     | Y      | true   | 0      |

Dopo la conversione in JSON:

```ts
{
  "Campo1": false,
  "Campo2": true,
  "Campo3": true,
  "Campo4": true,
  "Campo5": false,
}
```

### Campi di tipo data

| DateOnly            | Local(+08:00)       | GMT                 |
| ------------------- | ------------------- | ------------------- |
| 2023-01-18 22:22:22 | 2023-01-18 22:22:22 | 2023-01-18 22:22:22 |

Dopo la conversione in JSON:

```ts
{
  "DateOnly": "2023-01-18T00:00:00.000Z",
  "Local(+08:00)": "2023-01-18T14:22:22.000Z",
  "GMT": "2023-01-18T22:22:22.000Z",
}
```

### Campi di tipo selezione

Sia i valori delle opzioni che le etichette delle opzioni possono essere utilizzati come testo di importazione. Più opzioni sono separate da virgole (`,` `，`) o da virgole di enumerazione (`、`).

Ad esempio, le opzioni per il campo `Priorità` includono:

| Valore opzione | Etichetta opzione |
| -------------- | ----------------- |
| low            | Bassa             |
| medium         | Media             |
| high           | Alta              |

Sia i valori delle opzioni che le etichette delle opzioni possono essere utilizzati come testo di importazione.

| Priorità |
| -------- |
| Alta     |
| low      |

Dopo la conversione in JSON:

```ts
[{ Priorità: 'high' }, { Priorità: 'low' }];
```

### Campi di divisione amministrativa cinese

| Regione1      | Regione2      |
| ------------- | ------------- |
| 北京市/市辖区 | 天津市/市辖区 |

Dopo la conversione in JSON:

```ts
{
  "Regione1": ["11","1101"],
  "Regione2": ["12","1201"]
}
```

### Campi allegato

| Allegato                                 |
| ---------------------------------------- |
| https://www.nocobase.com/images/logo.png |

Dopo la conversione in JSON:

```ts
{
  "Allegato": [
    {
      "filename": "logo.png",
      "title": "logo.png",
      "extname": ".png",
      "url": "https://www.nocobase.com/images/logo.png"
    }
  ]
}
```

### Campi di tipo relazione

Più voci di dati sono separate da virgole (`,` `，`) o da virgole di enumerazione (`、`).

| Dipartimento/Nome | Categoria/Titolo |
| ----------------- | ---------------- |
| Team di Sviluppo  | Categoria1、Categoria2 |

Dopo la conversione in JSON:

```ts
{
  "Dipartimento": [1], // 1 è l'ID del record per il dipartimento chiamato "Team di Sviluppo"
  "Categoria": [1,2], // 1,2 sono gli ID dei record per le categorie intitolate "Categoria1" e "Categoria2"
}
```

### Campi di tipo JSON

| JSON1           |
| --------------- |
| {"key":"value"} |

Dopo la conversione in JSON:

```ts
{
  "JSON": {"key":"value"}
}
```

### Tipi di geometria mappa

| Point | Line        | Polygon           | Circle |
| ----- | ----------- | ----------------- | ------ |
| 1,2   | (1,2),(3,4) | (1,2),(3,4),(1,2) | 1,2,3  |

Dopo la conversione in JSON:

```ts
{
  "Point": [1,2],
  "Line": [[1,2], [3,4]],
  "Polygon": [[1,2], [3,4], [1,2]],
  "Circle": [1,2,3]
}
```

## Formato di importazione personalizzato

Registri un `ValueParser` personalizzato tramite il metodo `db.registerFieldValueParsers()`, ad esempio:

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

// Quando si importa un campo di tipo=point, i dati verranno analizzati da PointValueParser
db.registerFieldValueParsers({
  point: PointValueParser,
});
```

Esempio di importazione

| Point |
| ----- |
| 1,2   |

Dopo la conversione in JSON:

```ts
{
  "Point": [1,2]
}
```

## Impostazioni dell'azione

![20251029170959](https://static-docs.nocobase.com/20251029170959.png)

- Configuri i campi importabili

![20251029171036](https://static-docs.nocobase.com/20251029171036.png)

- [Regole di collegamento](/interface-builder/actions/action-settings/linkage-rule): Mostra/nasconde dinamicamente il pulsante;
- [Modifica pulsante](/interface-builder/actions/action-settings/edit-button): Modifica il titolo, il tipo e l'icona del pulsante;