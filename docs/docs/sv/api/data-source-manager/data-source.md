:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Datakälla (abstrakt)

`DataSource` är en abstrakt klass som används för att representera en typ av datakälla, till exempel en databas eller ett API.

## Medlemmar

### collectionManager

Detta är `CollectionManager`-instansen för datakällan, som måste implementera gränssnittet [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

`resourceManager`-instansen för datakällan.

### acl

`ACL`-instansen för datakällan.

## API

### constructor()

Konstruktorn skapar en `DataSource`-instans.

#### Signatur

- `constructor(options: DataSourceOptions)`

### init()

Initialiseringsfunktionen anropas omedelbart efter `constructor`.

#### Signatur

- `init(options: DataSourceOptions)`


### name

#### Signatur

- `get name()`

Returnerar datakällans instansnamn.

### middleware()

Hämtar `DataSource`:ens middleware, som används för att montera på servern för att ta emot förfrågningar.

### testConnection()

En statisk metod som anropas under anslutningstestet. Den kan användas för parametervalidering, och den specifika logiken implementeras av underklassen.

#### Signatur

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Signatur

- `async load(options: any = {})`

Datakällans laddningsoperation. Logiken implementeras av underklassen.

### createCollectionManager()

#### Signatur
- `abstract createCollectionManager(options?: any): ICollectionManager`

Skapar en `CollectionManager`-instans för datakällan. Logiken implementeras av underklassen.

### createResourceManager()

Skapar en `ResourceManager`-instans för datakällan. Underklasser kan åsidosätta implementeringen. Som standard skapas `ResourceManager` från `@nocobase/resourcer`.

### createACL()

- Skapar en `ACL`-instans för `DataSource`. Underklasser kan åsidosätta implementeringen. Som standard skapas `ACL` från `@nocobase/acl`.