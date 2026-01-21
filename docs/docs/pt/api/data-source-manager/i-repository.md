:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# IRepository

A interface `Repository` define uma série de métodos para operações de modelo, adaptando as operações de CRUD (criar, ler, atualizar e excluir) da fonte de dados.

## API

### find()

Retorna uma lista de modelos que correspondem aos parâmetros de consulta.

#### Assinatura

- `find(options?: any): Promise<IModel[]>`

### findOne()

Retorna um modelo que corresponde aos parâmetros de consulta. Se houver vários modelos correspondentes, apenas o primeiro será retornado.

#### Assinatura

- `findOne(options?: any): Promise<IModel>`

### count()

Retorna a quantidade de modelos que correspondem aos parâmetros de consulta.

#### Assinatura

- `count(options?: any): Promise<Number>`

### findAndCount()

Retorna a lista e a quantidade de modelos que correspondem aos parâmetros de consulta.

#### Assinatura

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Cria um objeto de dados de modelo.

#### Assinatura

- `create(options: any): void`

### update()

Atualiza um objeto de dados de modelo com base nas condições de consulta.

#### Assinatura

- `update(options: any): void`

### destroy()

Exclui um objeto de dados de modelo com base nas condições de consulta.

#### Assinatura

- `destroy(options: any): void`