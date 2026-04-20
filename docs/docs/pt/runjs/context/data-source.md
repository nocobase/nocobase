:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/data-source).
:::

# ctx.dataSource

A instância `DataSource` vinculada ao contexto de execução atual do RunJS, usada para acessar coleções, metadados de campos e gerenciar configurações de coleções **dentro da fonte de dados atual**. Geralmente corresponde à fonte de dados selecionada para a página ou bloco atual (por exemplo, o banco de dados principal `main`).

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **Operações em fonte de dados única** | Obter metadados de coleção e campo quando a fonte de dados atual é conhecida. |
| **Gerenciamento de coleções** | Obter, adicionar, atualizar ou excluir coleções na fonte de dados atual. |
| **Obter campos por caminho** | Usar o formato `nomeDaColeção.caminhoDoCampo` para obter definições de campo (suporta caminhos de associação). |

> Observação: `ctx.dataSource` representa uma única fonte de dados para o contexto atual. Para enumerar ou acessar outras fontes de dados, use [ctx.dataSourceManager](./data-source-manager.md).

## Definição de tipo

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Propriedades somente leitura
  get flowEngine(): FlowEngine;   // Instância atual do FlowEngine
  get displayName(): string;      // Nome de exibição (suporta i18n)
  get key(): string;              // Chave da fonte de dados, ex: 'main'
  get name(): string;             // O mesmo que key

  // Leitura de coleções
  getCollections(): Collection[];                      // Obter todas as coleções
  getCollection(name: string): Collection | undefined; // Obter coleção por nome
  getAssociation(associationName: string): CollectionField | undefined; // Obter campo de associação (ex: users.roles)

  // Gerenciamento de coleções
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Metadados de campo
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Propriedades comuns

| Propriedade | Tipo | Descrição |
|------|------|------|
| `key` | `string` | Chave da fonte de dados, ex: `'main'` |
| `name` | `string` | O mesmo que key |
| `displayName` | `string` | Nome de exibição (suporta i18n) |
| `flowEngine` | `FlowEngine` | Instância atual do FlowEngine |

## Métodos comuns

| Método | Descrição |
|------|------|
| `getCollections()` | Obtém todas as coleções na fonte de dados atual (ordenadas, com as ocultas filtradas). |
| `getCollection(name)` | Obtém uma coleção por nome; `name` pode ser `nomeDaColeção.nomeDoCampo` para obter a coleção de destino de uma associação. |
| `getAssociation(associationName)` | Obtém uma definição de campo de associação por `nomeDaColeção.nomeDoCampo`. |
| `getCollectionField(fieldPath)` | Obtém uma definição de campo por `nomeDaColeção.caminhoDoCampo`, suportando caminhos de associação como `users.profile.avatar`. |

## Relação com ctx.dataSourceManager

| Necessidade | Uso recomendado |
|------|----------|
| **Fonte de dados única vinculada ao contexto atual** | `ctx.dataSource` |
| **Ponto de entrada para todas as fontes de dados** | `ctx.dataSourceManager` |
| **Obter coleção dentro da fonte de dados atual** | `ctx.dataSource.getCollection(name)` |
| **Obter coleção entre fontes de dados** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Obter campo dentro da fonte de dados atual** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Obter campo entre fontes de dados** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Exemplo

### Obter coleções e campos

```ts
// Obter todas as coleções
const collections = ctx.dataSource.getCollections();

// Obter coleção por nome
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Obter definição de campo por "nomeDaColeção.caminhoDoCampo" (suporta associações)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Obter campos de associação

```ts
// Obter definição de campo de associação por nomeDaColeção.nomeDoCampo
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Processar com base na estrutura da coleção de destino
}
```

### Iterar pelas coleções para processamento dinâmico

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Realizar validação ou UI dinâmica com base nos metadados do campo

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Realizar lógica de UI ou validação com base em interface, enum, validação, etc.
}
```

## Observações

- O formato do caminho para `getCollectionField(fieldPath)` é `nomeDaColeção.caminhoDoCampo`, onde o primeiro segmento é o nome da coleção e os segmentos subsequentes são o caminho do campo (suporta associações, ex: `user.name`).
- `getCollection(name)` suporta o formato `nomeDaColeção.nomeDoCampo`, retornando a coleção de destino do campo de associação.
- No contexto RunJS, `ctx.dataSource` geralmente é determinado pela fonte de dados do bloco ou página atual. Se nenhuma fonte de dados estiver vinculada ao contexto, ele pode ser `undefined`; recomenda-se realizar uma verificação de nulidade antes do uso.

## Relacionado

- [ctx.dataSourceManager](./data-source-manager.md): Gerenciador de fontes de dados, gerencia todas as fontes de dados.
- [ctx.collection](./collection.md): A coleção associada ao contexto atual.
- [ctx.collectionField](./collection-field.md): A definição de campo da coleção para o campo atual.