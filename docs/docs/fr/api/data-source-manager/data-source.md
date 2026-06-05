:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# DataSource (abstraite)

`DataSource` est une classe abstraite utilisée pour représenter un type de **source de données**, qui peut être une base de données, une API, etc.

## Membres

### collectionManager

L'instance `CollectionManager` de la **source de données**, qui doit implémenter l'interface [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

L'instance `resourceManager` de la **source de données**.

### acl

L'instance `ACL` de la **source de données**.

## API

### constructor()

Constructeur, crée une instance de `DataSource`.

#### Signature

- `constructor(options: DataSourceOptions)`

### init()

Fonction d'initialisation, appelée immédiatement après le `constructor`.

#### Signature

- `init(options: DataSourceOptions)`

### name

#### Signature

- `get name()`

Renvoie le nom de l'instance de la **source de données**.

### middleware()

Récupère le *middleware* de la `DataSource`, utilisé pour le monter sur le serveur afin de recevoir les requêtes.

### testConnection()

Une méthode statique appelée lors de l'opération de test de connexion. Elle peut être utilisée pour la validation des paramètres, et la logique spécifique est implémentée par la sous-classe.

#### Signature

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Signature

- `async load(options: any = {})`

L'opération de chargement de la **source de données**. La logique est implémentée par la sous-classe.

### createCollectionManager()

#### Signature
- `abstract createCollectionManager(options?: any): ICollectionManager`

Crée une instance de `CollectionManager` pour la **source de données**. La logique est implémentée par la sous-classe.

### createResourceManager()

Crée une instance de `ResourceManager` pour la **source de données**. Les sous-classes peuvent surcharger l'implémentation. Par défaut, elle crée le `ResourceManager` de `@nocobase/resourcer`.

### createACL()

- Crée une instance `ACL` pour la `DataSource`. Les sous-classes peuvent surcharger l'implémentation. Par défaut, elle crée l'`ACL` de `@nocobase/acl`.