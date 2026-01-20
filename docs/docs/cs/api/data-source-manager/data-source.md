:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# DataSource (abstraktní)

`DataSource` je abstraktní třída, která slouží k reprezentaci typu zdroje dat, jako je například databáze nebo API.

## Členové

### collectionManager

Instance CollectionManageru pro zdroj dat, která musí implementovat rozhraní [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Instance resourceManageru pro zdroj dat.

### acl

Instance ACL pro zdroj dat.

## API

### constructor()

Konstruktor, který vytváří instanci `DataSource`.

#### Podpis

- `constructor(options: DataSourceOptions)`

### init()

Inicializační funkce, která je volána ihned po konstruktoru.

#### Podpis

- `init(options: DataSourceOptions)`


### name

#### Podpis

- `get name()`

Vrací název instance zdroje dat.

### middleware()

Získává middleware pro DataSource, který se používá k připojení k serveru pro příjem požadavků.

### testConnection()

Statická metoda volaná během operace testování připojení. Může být použita pro validaci parametrů a konkrétní logika je implementována podtřídou.

#### Podpis

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Podpis

- `async load(options: any = {})`

Operace načítání pro zdroj dat. Logika je implementována podtřídou.

### createCollectionManager()

#### Podpis
- `abstract createCollectionManager(options?: any): ICollectionManager`

Vytváří instanci CollectionManageru pro zdroj dat. Logika je implementována podtřídou.

### createResourceManager()

Vytváří instanci ResourceManageru pro zdroj dat. Podtřídy mohou tuto implementaci přepsat; standardně se vytvoří `ResourceManager` z `@nocobase/resourcer`.

### createACL()

- Vytváří instanci ACL pro DataSource. Podtřídy mohou tuto implementaci přepsat; standardně se vytvoří `ACL` z `@nocobase/acl`.