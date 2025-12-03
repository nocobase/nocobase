:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# DataSourceManager: Gerenciamento de Fontes de Dados

NocoBase oferece o `DataSourceManager` para gerenciar múltiplas fontes de dados. Cada `DataSource` possui suas próprias instâncias de `Database`, `ResourceManager` e `ACL`, facilitando aos desenvolvedores o gerenciamento e a extensão flexíveis de múltiplas fontes de dados.

## Conceitos Básicos

Cada instância de `DataSource` contém o seguinte:

-   **`dataSource.collectionManager`**: Usado para gerenciar coleções e campos.
-   **`dataSource.resourceManager`**: Lida com operações relacionadas a recursos (como CRUD, etc.).
-   **`dataSource.acl`**: Controle de acesso (ACL) para operações de recursos.

Para facilitar o acesso, são fornecidos aliases para os membros da fonte de dados principal:

-   `app.db` é equivalente a `dataSourceManager.get('main').collectionManager.db`
-   `app.acl` é equivalente a `dataSourceManager.get('main').acl`
-   `app.resourceManager` é equivalente a `dataSourceManager.get('main').resourceManager`

## Métodos Comuns

### dataSourceManager.get(dataSourceKey)

Este método retorna a instância `DataSource` especificada.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Registra um middleware para todas as fontes de dados. Isso afetará as operações em todas as fontes de dados.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Executa antes do carregamento da fonte de dados. Geralmente usado para registro de classes estáticas, como classes de modelo e registro de tipos de campo:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Tipo de campo personalizado
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Executa após o carregamento da fonte de dados. Geralmente usado para registrar operações, configurar controle de acesso, etc.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Define as permissões de acesso
});
```

## Extensão de Fontes de Dados

Para a extensão completa de fontes de dados, consulte o capítulo de [extensão de fontes de dados](#).