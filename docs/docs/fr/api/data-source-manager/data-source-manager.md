:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# DataSourceManager

`DataSourceManager` est la classe de gestion pour plusieurs instances de `dataSource`.

## API

### add()
Ajoute une instance de `dataSource`.

#### Signature

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Ajoute un middleware global à l'instance de `dataSource`.

### middleware()

Récupère le middleware de l'instance `dataSourceManager` actuelle, qui peut être utilisé pour répondre aux requêtes HTTP.

### afterAddDataSource()

Une fonction de hook qui est appelée après l'ajout d'une nouvelle `dataSource`.

#### Signature

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Enregistre un type de source de données et sa classe.

#### Signature

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Récupère la classe de la source de données.

#### Signature

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Crée une instance de source de données en se basant sur le type de source de données enregistré et les options de l'instance.

#### Signature

- `buildDataSourceByType(type: string, options: any): DataSource`