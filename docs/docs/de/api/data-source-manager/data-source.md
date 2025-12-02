:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Datenquelle (abstrakt)

Die abstrakte Klasse `DataSource` repräsentiert eine Art von Datenquelle, wie zum Beispiel eine Datenbank oder eine API.

## Mitglieder

### collectionManager

Die CollectionManager-Instanz der Datenquelle, die das [`ICollectionManager`](/api/data-source-manager/i-collection-manager)-Interface implementieren muss.

### resourceManager

Die resourceManager-Instanz der Datenquelle.

### acl

Die ACL-Instanz der Datenquelle.

## API

### constructor()

Der Konstruktor erstellt eine `DataSource`-Instanz.

#### Signatur

- `constructor(options: DataSourceOptions)`

### init()

Die Initialisierungsfunktion wird direkt nach dem `constructor` aufgerufen.

#### Signatur

- `init(options: DataSourceOptions)`

### name

#### Signatur

- `get name()`

Gibt den Instanznamen der Datenquelle zurück.

### middleware()

Liefert die Middleware der Datenquelle, die zum Empfangen von Anfragen auf dem Server eingebunden wird.

### testConnection()

Eine statische Methode, die während des Verbindungstests aufgerufen wird. Sie kann zur Parametervalidierung verwendet werden, wobei die spezifische Logik von der Unterklasse implementiert wird.

#### Signatur

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Signatur

- `async load(options: any = {})`

Der Ladevorgang der Datenquelle. Die Logik wird von der Unterklasse implementiert.

### createCollectionManager()

#### Signatur
- `abstract createCollectionManager(options?: any): ICollectionManager`

Erstellt eine CollectionManager-Instanz für die Datenquelle. Die Logik wird von der Unterklasse implementiert.

### createResourceManager()

Erstellt eine ResourceManager-Instanz für die Datenquelle. Unterklassen können die Implementierung überschreiben. Standardmäßig wird der `ResourceManager` aus `@nocobase/resourcer` erstellt.

### createACL()

- Erstellt eine ACL-Instanz für die Datenquelle. Unterklassen können die Implementierung überschreiben. Standardmäßig wird die `ACL` aus `@nocobase/acl` erstellt.