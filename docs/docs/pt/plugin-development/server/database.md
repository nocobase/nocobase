:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Database

`Database` é um componente importante das **fontes de dados** (`DataSource`) do tipo banco de dados. Cada **fonte de dados** do tipo banco de dados tem uma instância `Database` correspondente, que você pode acessar via `dataSource.db`. A instância de banco de dados da **fonte de dados** principal também oferece o alias conveniente `app.db`. Familiarizar-se com os métodos comuns de `db` é fundamental para escrever **plugins** de servidor.

## Componentes do Database

Um `Database` típico é composto pelas seguintes partes:

- **Collection**: Define a estrutura da tabela de dados.
- **Model**: Corresponde aos modelos ORM (geralmente gerenciados pelo Sequelize).
- **Repository**: Camada de repositório que encapsula a lógica de acesso a dados, fornecendo métodos de operação de nível superior.
- **FieldType**: Tipos de campo.
- **FilterOperator**: Operadores usados para filtragem.
- **Event**: Eventos de ciclo de vida e eventos de banco de dados.

## Momento de Uso em Plugins

### O que fazer na fase `beforeLoad`

Nesta fase, operações de banco de dados não são permitidas. É um momento adequado para o registro de classes estáticas ou escuta de eventos.

- `db.registerFieldTypes()` — Tipos de campo personalizados
- `db.registerModels()` — Registra classes de modelo personalizadas
- `db.registerRepositories()` — Registra classes de repositório personalizadas
- `db.registerOperators()` — Registra operadores de filtro personalizados
- `db.on()` — Escuta eventos relacionados ao banco de dados

### O que fazer na fase `load`

Nesta fase, todas as definições de classe e eventos anteriores já foram carregados, então o carregamento das tabelas de dados não terá dependências ausentes ou omitidas.

- `db.defineCollection()` — Define novas **coleções** (tabelas de dados)
- `db.extendCollection()` — Estende configurações de **coleções** (tabelas de dados) existentes

Se você estiver definindo tabelas internas do **plugin**, é mais recomendado colocá-las no diretório `./src/server/collections`. Veja [Coleções](./collections.md).

## Operações de Dados

`Database` oferece duas maneiras principais de acessar e operar dados:

### Operações via Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

A camada de Repository é geralmente usada para encapsular a lógica de negócios, como paginação, filtragem, verificações de permissão, etc.

### Operações via Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

A camada de Model corresponde diretamente às entidades ORM, sendo adequada para executar operações de banco de dados de nível inferior.

## Quais fases permitem operações de banco de dados?

### Ciclo de Vida do Plugin

| Estágio | Operações de Banco de Dados Permitidas |
|---|---|
| `staticImport` | Não |
| `afterAdd` | Não |
| `beforeLoad` | Não |
| `load` | Não |
| `install` | Sim |
| `beforeEnable` | Sim |
| `afterEnable` | Sim |
| `beforeDisable` | Sim |
| `afterDisable` | Sim |
| `remove` | Sim |
| `handleSyncMessage` | Sim |

### Eventos do App

| Estágio | Operações de Banco de Dados Permitidas |
|---|---|
| `beforeLoad` | Não |
| `afterLoad` | Não |
| `beforeStart` | Sim |
| `afterStart` | Sim |
| `beforeInstall` | Não |
| `afterInstall` | Sim |
| `beforeStop` | Sim |
| `afterStop` | Não |
| `beforeDestroy` | Sim |
| `afterDestroy` | Não |
| `beforeLoadPlugin` | Não |
| `afterLoadPlugin` | Não |
| `beforeEnablePlugin` | Sim |
| `afterEnablePlugin` | Sim |
| `beforeDisablePlugin` | Sim |
| `afterDisablePlugin` | Sim |
| `afterUpgrade` | Sim |

### Eventos/Hooks do Database

| Estágio | Operações de Banco de Dados Permitidas |
|---|---|
| `beforeSync` | Não |
| `afterSync` | Sim |
| `beforeValidate` | Sim |
| `afterValidate` | Sim |
| `beforeCreate` | Sim |
| `afterCreate` | Sim |
| `beforeUpdate` | Sim |
| `afterUpdate` | Sim |
| `beforeSave` | Sim |
| `afterSave` | Sim |
| `beforeDestroy` | Sim |
| `afterDestroy` | Sim |
| `afterCreateWithAssociations` | Sim |
| `afterUpdateWithAssociations` | Sim |
| `afterSaveWithAssociations` | Sim |
| `beforeDefineCollection` | Não |
| `afterDefineCollection` | Não |
| `beforeRemoveCollection` | Não |
| `afterRemoveCollection` | Não |