:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# DataSource (abstrata)

`DataSource` é uma classe abstrata usada para representar um tipo de fonte de dados, que pode ser um banco de dados, uma API, etc.

## Membros

### collectionManager

A instância de CollectionManager da fonte de dados, que deve implementar a interface [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

A instância de resourceManager da fonte de dados.

### acl

A instância de ACL da fonte de dados.

## API

### constructor()

Construtor, cria uma instância de `DataSource`.

#### Assinatura

- `constructor(options: DataSourceOptions)`

### init()

Função de inicialização, chamada imediatamente após o `constructor`.

#### Assinatura

- `init(options: DataSourceOptions)`


### name

#### Assinatura

- `get name()`

Retorna o nome da instância da fonte de dados.

### middleware()

Obtém o middleware para o DataSource, usado para montar no servidor e receber requisições.

### testConnection()

Um método estático chamado durante a operação de teste de conexão. Pode ser usado para validação de parâmetros, e a lógica específica é implementada pela subclasse.

#### Assinatura

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Assinatura

- `async load(options: any = {})`

A operação de carregamento da fonte de dados. A lógica é implementada pela subclasse.

### createCollectionManager()

#### Assinatura
- `abstract createCollectionManager(options?: any): ICollectionManager`

Cria uma instância de CollectionManager para a fonte de dados. A lógica é implementada pela subclasse.

### createResourceManager()

Cria uma instância de ResourceManager para a fonte de dados. As subclasses podem sobrescrever a implementação. Por padrão, ele cria o `ResourceManager` de `@nocobase/resourcer`.

### createACL()

- Cria uma instância de ACL para o DataSource. As subclasses podem sobrescrever a implementação. Por padrão, ele cria o `ACL` de `@nocobase/acl`.