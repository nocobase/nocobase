:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# DataSource (abstracta)

`DataSource` es una clase abstracta que se utiliza para representar un tipo de fuente de datos, como una base de datos, una API, etc.

## Miembros

### collectionManager

La instancia de CollectionManager para la fuente de datos, que debe implementar la interfaz [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

La instancia de resourceManager para la fuente de datos.

### acl

La instancia de ACL para la fuente de datos.

## API

### constructor()

Constructor, crea una instancia de `DataSource`.

#### Firma

- `constructor(options: DataSourceOptions)`

### init()

Función de inicialización, se llama inmediatamente después del `constructor`.

#### Firma

- `init(options: DataSourceOptions)`

### name

#### Firma

- `get name()`

Devuelve el nombre de la instancia de la fuente de datos.

### middleware()

Obtiene el middleware para la DataSource, que se utiliza para montar en el servidor y recibir solicitudes.

### testConnection()

Método estático que se llama durante la operación de prueba de conexión. Se puede utilizar para la validación de parámetros, y la lógica específica es implementada por la subclase.

#### Firma

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Firma

- `async load(options: any = {})`

La operación de carga para la fuente de datos. La lógica es implementada por la subclase.

### createCollectionManager()

#### Firma
- `abstract createCollectionManager(options?: any): ICollectionManager`

Crea una instancia de CollectionManager para la fuente de datos. La lógica es implementada por la subclase.

### createResourceManager()

Crea una instancia de ResourceManager para la fuente de datos. Las subclases pueden sobrescribir la implementación. Por defecto, crea el `ResourceManager` de `@nocobase/resourcer`.

### createACL()

- Crea una instancia de ACL para la DataSource. Las subclases pueden sobrescribir la implementación. Por defecto, crea el `ACL` de `@nocobase/acl`.