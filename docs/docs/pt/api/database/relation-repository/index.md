:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# RelationRepository

`RelationRepository` é um objeto `Repository` para tipos de associação. Ele permite operar em dados associados sem precisar carregar a associação. Com base no `RelationRepository`, cada tipo de associação possui uma implementação derivada correspondente:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Construtor

**Assinatura**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parâmetros**

| Nome do Parâmetro | Tipo               | Valor Padrão | Descrição                                                      |
| :---------------- | :----------------- | :----------- | :------------------------------------------------------------- |
| `sourceCollection` | `coleção`          | -            | A `coleção` correspondente à relação de referência na associação. |
| `association`      | `string`           | -            | Nome da associação.                                            |
| `sourceKeyValue`   | `string \| number` | -            | O valor da chave correspondente na relação de referência.      |

## Propriedades da Classe Base

### `db: Database`

Objeto de banco de dados.

### `sourceCollection`

A `coleção` correspondente à relação de referência na associação.

### `targetCollection`

A `coleção` correspondente à relação referenciada na associação.

### `association`

O objeto de associação no Sequelize correspondente à associação atual.

### `associationField`

O campo na `coleção` correspondente à associação atual.

### `sourceKeyValue`

O valor da chave correspondente na relação de referência.