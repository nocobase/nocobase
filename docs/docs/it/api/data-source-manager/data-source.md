:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# DataSource (classe astratta)

`DataSource` è una classe astratta utilizzata per rappresentare un tipo di **fonte dati**, che può essere un database, un'API, ecc.

## Membri

### collectionManager

L'istanza di CollectionManager per la **fonte dati**, che deve implementare l'interfaccia [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

L'istanza di resourceManager per la **fonte dati**.

### acl

L'istanza di ACL per la **fonte dati**.

## API

### constructor()

Costruttore, crea un'istanza di `DataSource`.

#### Firma

- `constructor(options: DataSourceOptions)`

### init()

Funzione di inizializzazione, viene chiamata immediatamente dopo il `constructor`.

#### Firma

- `init(options: DataSourceOptions)`


### name

#### Firma

- `get name()`

Restituisce il nome dell'istanza della **fonte dati**.

### middleware()

Ottiene il middleware per la **fonte dati**, utilizzato per montarlo sul Server e ricevere le richieste.

### testConnection()

Un metodo statico chiamato durante l'operazione di test della connessione. Può essere utilizzato per la validazione dei parametri, e la logica specifica è implementata dalla sottoclasse.

#### Firma

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Firma

- `async load(options: any = {})`

L'operazione di caricamento per la **fonte dati**. La logica è implementata dalla sottoclasse.

### createCollectionManager()

#### Firma
- `abstract createCollectionManager(options?: any): ICollectionManager`

Crea un'istanza di CollectionManager per la **fonte dati**. La logica è implementata dalla sottoclasse.

### createResourceManager()

Crea un'istanza di ResourceManager per la **fonte dati**. Le sottoclassi possono sovrascrivere l'implementazione. Per impostazione predefinita, crea il `ResourceManager` da `@nocobase/resourcer`.

### createACL()

- Crea un'istanza di ACL per la **fonte dati**. Le sottoclassi possono sovrascrivere l'implementazione. Per impostazione predefinita, crea l'`ACL` da `@nocobase/acl`.