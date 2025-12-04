:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# RelationRepository

`RelationRepository` är ett `Repository`-objekt för relationstyper. Det gör det möjligt att hantera relaterad data utan att behöva ladda relationen först. Baserat på `RelationRepository` har varje relationstyp en motsvarande härledd implementering:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Konstruktor

**Signatur**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parametrar**

| Parameternamn      | Typ                | Standardvärde | Beskrivning                                                      |
| :----------------- | :----------------- | :------------ | :--------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -             | Den `samling` som motsvarar den refererande relationen i associationen. |
| `association`      | `string`           | -             | Relationsnamn                                                    |
| `sourceKeyValue`   | `string \| number` | -             | Det motsvarande nyckelvärdet i den refererande relationen.       |

## Basklassens egenskaper

### `db: Database`

Databasobjekt

### `sourceCollection`

Den `samling` som motsvarar den refererande relationen i associationen.

### `targetCollection`

Den `samling` som motsvarar den refererade relationen i associationen.

### `association`

Det associationsobjekt i Sequelize som motsvarar den aktuella relationen.

### `associationField`

Fältet i samlingen som motsvarar den aktuella relationen.

### `sourceKeyValue`

Det motsvarande nyckelvärdet i den refererande relationen.