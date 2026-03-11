:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

El gestor de fuentes de datos (instancia de `DataSourceManager`) se utiliza para gestionar y acceder a múltiples fuentes de datos (por ejemplo, la base de datos principal `main`, la base de datos de registros `logging`, etc.). Se utiliza cuando existen múltiples fuentes de datos o cuando se requiere acceso a metadatos entre diferentes fuentes de datos.

## Aplicaciones

| Escenario | Descripción |
|------|------|
| **Múltiples fuentes de datos** | Enumerar todas las fuentes de datos o obtener una fuente de datos específica por su clave (key). |
| **Acceso entre fuentes de datos** | Acceder a los metadatos utilizando el formato "clave de fuente de datos + nombre de la colección" cuando se desconoce la fuente de datos del contexto actual. |
| **Obtener campos por ruta completa** | Utilizar el formato `dataSourceKey.collectionName.fieldPath` para recuperar definiciones de campos a través de diferentes fuentes de datos. |

> Nota: Si solo está operando en la fuente de datos actual, priorice el uso de `ctx.dataSource`. Utilice `ctx.dataSourceManager` solo cuando necesite enumerar o cambiar entre fuentes de datos.

## Definición de tipos

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Gestión de fuentes de datos
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Leer fuentes de datos
  getDataSources(): DataSource[];                     // Obtener todas las fuentes de datos
  getDataSource(key: string): DataSource | undefined;  // Obtener fuente de datos por clave

  // Acceder a metadatos directamente por fuente de datos + colección
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relación con ctx.dataSource

| Necesidad | Uso recomendado |
|------|----------|
| **Única fuente de datos vinculada al contexto actual** | `ctx.dataSource` (ej. la fuente de datos de la página o bloque actual) |
| **Punto de entrada para todas las fuentes de datos** | `ctx.dataSourceManager` |
| **Listar o cambiar fuentes de datos** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Obtener una colección dentro de la fuente de datos actual** | `ctx.dataSource.getCollection(name)` |
| **Obtener una colección entre fuentes de datos** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Obtener un campo dentro de la fuente de datos actual** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Obtener un campo entre fuentes de datos** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Ejemplos

### Obtener una fuente de datos específica

```ts
// Obtener la fuente de datos llamada 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Obtener todas las colecciones bajo esta fuente de datos
const collections = mainDS?.getCollections();
```

### Acceder a metadatos de una colección entre fuentes de datos

```ts
// Obtener la colección por dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Obtener la clave primaria de la colección
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Obtener la definición de un campo por su ruta completa

```ts
// Formato: dataSourceKey.collectionName.fieldPath
// Obtener la definición del campo por "clave de fuente de datos.nombre de la colección.ruta del campo"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Admite rutas de campos de asociación
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Recorrer todas las fuentes de datos

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Fuente de datos: ${ds.key}, Nombre a mostrar: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Colección: ${col.name}`);
  }
}
```

### Seleccionar dinámicamente una fuente de datos basada en variables

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Notas

- El formato de ruta para `getCollectionField` es `dataSourceKey.collectionName.fieldPath`, donde el primer segmento es la clave de la fuente de datos, seguido del nombre de la colección y la ruta del campo.
- `getDataSource(key)` devuelve `undefined` si la fuente de datos no existe; se recomienda realizar una comprobación de valores nulos antes de su uso.
- `addDataSource` lanzará una excepción si la clave ya existe; `upsertDataSource` sobrescribirá la existente o añadirá una nueva.

## Relacionado

- [ctx.dataSource](./data-source.md): Instancia de la fuente de datos actual.
- [ctx.collection](./collection.md): Colección asociada al contexto actual.
- [ctx.collectionField](./collection-field.md): Definición del campo de la colección para el campo actual.