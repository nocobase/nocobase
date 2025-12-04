:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# RelationRepository

`RelationRepository` is een `Repository`-object voor relatietypen. Met `RelationRepository` kunt u gerelateerde gegevens bewerken zonder de relatie te laden. Op basis van `RelationRepository` is er voor elk relatietype een overeenkomstige afgeleide implementatie:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Constructor

**Handtekening**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parameters**

| Parameternaam      | Type               | Standaardwaarde | Beschrijving                                                      |
| :----------------- | :----------------- | :-------------- | :---------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -               | De `collectie` die overeenkomt met de verwijzende relatie binnen de associatie. |
| `association`      | `string`           | -               | Naam van de associatie                                            |
| `sourceKeyValue`   | `string \| number` | -               | De bijbehorende sleutelwaarde in de verwijzende relatie.          |

## Eigenschappen van de basisklasse

### `db: Database`

Database-object

### `sourceCollection`

De `collectie` die overeenkomt met de verwijzende relatie binnen de associatie.

### `targetCollection`

De `collectie` die overeenkomt met de verwezen relatie binnen de associatie.

### `association`

Het associatie-object in `sequelize` dat overeenkomt met de huidige associatie.

### `associationField`

Het veld in de `collectie` dat overeenkomt met de huidige associatie.

### `sourceKeyValue`

De bijbehorende sleutelwaarde in de verwijzende relatie.