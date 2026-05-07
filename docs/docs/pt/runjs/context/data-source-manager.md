:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

O gerenciador de fontes de dados (instância de `DataSourceManager`) é usado para gerenciar e acessar múltiplas fontes de dados (ex: banco de dados principal `main`, banco de logs `logging`, etc.). Ele é utilizado quando existem múltiplas fontes de dados ou quando o acesso a metadados entre fontes de dados é necessário.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **Múltiplas fontes de dados** | Enumerar todas as fontes de dados ou obter uma fonte de dados específica por chave. |
| **Acesso entre fontes de dados** | Acessar metadados usando o formato "chave da fonte de dados + nome da coleção" quando a fonte de dados do contexto atual for desconhecida. |
| **Obter campos pelo caminho completo** | Usar o formato `dataSourceKey.collectionName.fieldPath` para recuperar definições de campos em diferentes fontes de dados. |

> Observação: Se você estiver operando apenas na fonte de dados atual, priorize o uso de `ctx.dataSource`. Use `ctx.dataSourceManager` apenas quando precisar enumerar ou alternar entre fontes de dados.

## Definição de Tipo

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Gerenciamento de fontes de dados
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Ler fontes de dados
  getDataSources(): DataSource[];                     // Obter todas as fontes de dados
  getDataSource(key: string): DataSource | undefined;  // Obter fonte de dados por chave

  // Acessar metadados diretamente por fonte de dados + coleção
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relação com ctx.dataSource

| Necessidade | Uso Recomendado |
|------|----------|
| **Fonte de dados única vinculada ao contexto atual** | `ctx.dataSource` (ex: a fonte de dados da página/bloco atual) |
| **Ponto de entrada para todas as fontes de dados** | `ctx.dataSourceManager` |
| **Listar ou alternar fontes de dados** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Obter coleção dentro da fonte de dados atual** | `ctx.dataSource.getCollection(name)` |
| **Obter coleção entre fontes de dados** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Obter campo dentro da fonte de dados atual** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Obter campo entre fontes de dados** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Exemplos

### Obter uma Fonte de Dados Específica

```ts
// Obter a fonte de dados chamada 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Obter todas as coleções desta fonte de dados
const collections = mainDS?.getCollections();
```

### Acessar Metadados de Coleção entre Fontes de Dados

```ts
// Obter coleção por dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Obter a chave primária da coleção
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Obter Definição de Campo pelo Caminho Completo

```ts
// Formato: dataSourceKey.collectionName.fieldPath
// Obter a definição do campo por "chave da fonte de dados.nome da coleção.caminho do campo"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Suporta caminhos de campos de associação
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Iterar por Todas as Fontes de Dados

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Fonte de dados: ${ds.key}, Nome de exibição: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Coleção: ${col.name}`);
  }
}
```

### Selecionar Fonte de Dados Dinamicamente com Base em Variáveis

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Observações

- O formato do caminho para `getCollectionField` é `dataSourceKey.collectionName.fieldPath`, onde o primeiro segmento é a chave da fonte de dados, seguido pelo nome da coleção e o caminho do campo.
- `getDataSource(key)` retorna `undefined` se a fonte de dados não existir; recomenda-se realizar uma verificação de valor nulo antes do uso.
- `addDataSource` lançará uma exceção se a chave já existir; `upsertDataSource` irá sobrescrever a existente ou adicionar uma nova.

## Relacionado

- [ctx.dataSource](./data-source.md): Instância da fonte de dados atual
- [ctx.collection](./collection.md): Coleção associada ao contexto atual
- [ctx.collectionField](./collection-field.md): Definição de campo de coleção para o campo atual