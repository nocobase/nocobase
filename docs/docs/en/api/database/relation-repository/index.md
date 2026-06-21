# RelationRepository

`RelationRepository` is a `Repository` object for association types. `RelationRepository` allows operating on associated data without loading the association. Based on `RelationRepository`, each association type has a corresponding derived implementation:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Constructor

**Signature**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parameters**

| Parameter Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `sourceCollection` | `Collection` | - | The `Collection` corresponding to the referencing relation in the association |
| `association` | `string` | - | Association name |
| `sourceKeyValue` | `string \| number` | - | The corresponding key value in the referencing relation |

## Base Class Properties

### `db: Database`

Database object

### `sourceCollection`

The `Collection` corresponding to the referencing relation in the association

### `targetCollection`

The `Collection` corresponding to the referenced relation in the association

### `association`

The association object in sequelize corresponding to the current association

### `associationField`

The field in the collection corresponding to the current association

### `sourceKeyValue`

The corresponding key value in the referencing relation