:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# RelationRepository

`RelationRepository` to obiekt `Repository` dla typów powiązań. Umożliwia on operowanie na powiązanych danych bez konieczności ładowania całego powiązania. Na podstawie `RelationRepository` każdy typ powiązania ma swoją pochodną implementację:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Konstruktor

**Sygnatura**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parametry**

| Nazwa parametru    | Typ                | Wartość domyślna | Opis                                                              |
| :----------------- | :----------------- | :--------------- | :---------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -                | `Kolekcja` odpowiadająca relacji odwołującej się w powiązaniu.   |
| `association`      | `string`           | -                | Nazwa powiązania.                                                 |
| `sourceKeyValue`   | `string \| number` | -                | Odpowiadająca wartość klucza w relacji odwołującej się.           |

## Właściwości klasy bazowej

### `db: Database`

Obiekt bazy danych.

### `sourceCollection`

`Kolekcja` odpowiadająca relacji odwołującej się w powiązaniu.

### `targetCollection`

`Kolekcja` odpowiadająca relacji, do której się odwołujemy w powiązaniu.

### `association`

Obiekt powiązania w Sequelize odpowiadający bieżącemu powiązaniu.

### `associationField`

Pole w `kolekcji` odpowiadające bieżącemu powiązaniu.

### `sourceKeyValue`

Odpowiadająca wartość klucza w relacji odwołującej się.