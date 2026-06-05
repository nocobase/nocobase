:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# DataSourceManager

`DataSourceManager` é a classe de gerenciamento para múltiplas instâncias de `fonte de dados`.

## API

### add()
Adiciona uma instância de `fonte de dados`.

#### Assinatura

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Adiciona um middleware global à instância de `fonte de dados`.

### middleware()

Obtém o middleware da instância atual de `DataSourceManager`, que pode ser usado para responder a requisições HTTP.

### afterAddDataSource()

Uma função de *hook* que é chamada após a adição de uma nova `fonte de dados`.

#### Assinatura

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Registra um tipo de `fonte de dados` e sua classe.

#### Assinatura

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Obtém a classe da `fonte de dados`.

#### Assinatura

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Cria uma instância de `fonte de dados` com base no tipo de `fonte de dados` registrado e nas opções da instância.

#### Assinatura

- `buildDataSourceByType(type: string, options: any): DataSource`