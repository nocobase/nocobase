:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# RelationRepository

`RelationRepository` je objekt typu `Repository` pro práci s relacemi (asociacemi). Umožňuje manipulovat s daty relací, aniž by bylo nutné relaci načítat. Z `RelationRepository` jsou odvozeny specifické implementace pro každý typ relace:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Konstruktor

**Podpis**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parametry**

| Název parametru    | Typ                | Výchozí hodnota | Popis                                                               |
| :----------------- | :----------------- | :-------------- | :------------------------------------------------------------------ |
| `sourceCollection` | `Collection`       | -               | Kolekce, která odpovídá referenční relaci v rámci asociace.         |
| `association`      | `string`           | -               | Název asociace.                                                     |
| `sourceKeyValue`   | `string \| number` | -               | Odpovídající hodnota klíče v referenční relaci.                     |

## Vlastnosti základní třídy

### `db: Database`

Objekt databáze.

### `sourceCollection`

Kolekce, která odpovídá referenční relaci v rámci asociace.

### `targetCollection`

Kolekce, která odpovídá referencované relaci v rámci asociace.

### `association`

Objekt asociace v Sequelize, který odpovídá aktuální asociaci.

### `associationField`

Pole v kolekci, které odpovídá aktuální asociaci.

### `sourceKeyValue`

Odpovídající hodnota klíče v referenční relaci.