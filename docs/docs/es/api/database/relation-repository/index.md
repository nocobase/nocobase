:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# RelationRepository

`RelationRepository` es un objeto `Repository` para tipos de asociación. Permite operar con datos asociados sin necesidad de cargar la asociación. A partir de `RelationRepository`, cada tipo de asociación tiene una implementación derivada correspondiente, que son:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Constructor

**Firma**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parámetros**

| Nombre del parámetro | Tipo | Valor predeterminado | Descripción |
| :--- | :--- | :--- | :--- |
| `sourceCollection` | `Collection` | - | La `colección` correspondiente a la relación de referencia en la asociación. |
| `association` | `string` | - | Nombre de la asociación. |
| `sourceKeyValue` | `string \| number` | - | El valor de clave correspondiente en la relación de referencia. |

## Propiedades de la clase base

### `db: Database`

Objeto de base de datos.

### `sourceCollection`

La `colección` correspondiente a la relación de referencia en la asociación.

### `targetCollection`

La `colección` correspondiente a la relación referenciada en la asociación.

### `association`

El objeto de asociación en Sequelize correspondiente a la asociación actual.

### `associationField`

El campo en la `colección` correspondiente a la asociación actual.

### `sourceKeyValue`

El valor de clave correspondiente en la relación de referencia.