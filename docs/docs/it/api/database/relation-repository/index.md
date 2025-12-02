:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# RelationRepository

`RelationRepository` è un oggetto `Repository` per i tipi di associazione. `RelationRepository` consente di operare sui dati associati senza dover caricare l'associazione stessa. Da `RelationRepository` derivano implementazioni specifiche per ogni tipo di associazione:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Costruttore

**Firma**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parametri**

| Nome parametro     | Tipo               | Valore predefinito | Descrizione                                                      |
| :----------------- | :----------------- | :---               | :--------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -                  | La `Collection` corrispondente alla relazione di riferimento nell'associazione |
| `association`      | `string`           | -                  | Nome dell'associazione                                           |
| `sourceKeyValue`   | `string \| number` | -                  | Il valore chiave corrispondente nella relazione di riferimento   |

## Proprietà della classe base

### `db: Database`

Oggetto database

### `sourceCollection`

La `Collection` corrispondente alla relazione di riferimento nell'associazione

### `targetCollection`

La `Collection` corrispondente alla relazione referenziata nell'associazione

### `association`

L'oggetto associazione in Sequelize corrispondente all'associazione corrente

### `associationField`

Il campo nella collezione corrispondente all'associazione corrente

### `sourceKeyValue`

Il valore chiave corrispondente nella relazione di riferimento