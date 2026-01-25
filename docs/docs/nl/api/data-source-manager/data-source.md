:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# DataSource (abstract)

`DataSource` is een abstracte klasse die wordt gebruikt om een type gegevensbron te representeren, zoals een database of een API.

## Leden

### collectionManager

De `CollectionManager`-instantie voor de gegevensbron, die de [`ICollectionManager`](/api/data-source-manager/i-collection-manager)-interface moet implementeren.

### resourceManager

De `resourceManager`-instantie van de gegevensbron.

### acl

De `ACL`-instantie van de gegevensbron.

## API

### constructor()

`Constructor`, creëert een `DataSource`-instantie.

#### Signatuur

- `constructor(options: DataSourceOptions)`

### init()

`Initialisatiefunctie`, wordt direct na de `constructor` aangeroepen.

#### Signatuur

- `init(options: DataSourceOptions)`

### name

#### Signatuur

- `get name()`

Retourneert de instantienaam van de gegevensbron.

### middleware()

Haalt de middleware voor de `DataSource` op, die wordt gebruikt om op de Server te monteren en verzoeken te ontvangen.

### testConnection()

Een statische methode die wordt aangeroepen tijdens de testverbindingsbewerking. Deze kan worden gebruikt voor parametervalidatie, en de specifieke logica wordt geïmplementeerd door de subklasse.

#### Signatuur

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Signatuur

- `async load(options: any = {})`

De laadbewerking voor de gegevensbron. De logica wordt geïmplementeerd door de subklasse.

### createCollectionManager()

#### Signatuur
- `abstract createCollectionManager(options?: any): ICollectionManager`

Creëert een `CollectionManager`-instantie voor de gegevensbron. De logica wordt geïmplementeerd door de subklasse.

### createResourceManager()

Creëert een `ResourceManager`-instantie voor de gegevensbron. Subklassen kunnen de implementatie overschrijven. Standaard creëert het de `ResourceManager` uit `@nocobase/resourcer`.

### createACL()

- Creëert een `ACL`-instantie voor de `DataSource`. Subklassen kunnen de implementatie overschrijven. Standaard creëert het de `ACL` uit `@nocobase/acl`.