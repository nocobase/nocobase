:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/data-source).
:::

# ctx.dataSource

La instancia de la fuente de datos (`DataSource`) vinculada al contexto de ejecución actual de RunJS, utilizada para acceder a colecciones, metadatos de campos y gestionar la configuración de colecciones **dentro de la fuente de datos actual**. Generalmente corresponde a la fuente de datos seleccionada para la página o bloque actual (por ejemplo, la base de datos principal `main`).

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **Operaciones de una sola fuente de datos** | Obtener metadatos de colecciones y campos cuando se conoce la fuente de datos actual. |
| **Gestión de colecciones** | Obtener, agregar, actualizar o eliminar colecciones bajo la fuente de datos actual. |
| **Obtener campos por ruta** | Utilizar el formato `nombreColeccion.rutaCampo` para obtener definiciones de campos (soporta rutas de asociación). |

> Nota: `ctx.dataSource` representa una única fuente de datos para el contexto actual. Para enumerar o acceder a otras fuentes de datos, utilice [ctx.dataSourceManager](./data-source-manager.md).

## Definición de tipos

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Propiedades de solo lectura
  get flowEngine(): FlowEngine;   // Instancia actual de FlowEngine
  get displayName(): string;      // Nombre a mostrar (soporta i18n)
  get key(): string;              // Clave de la fuente de datos, ej. 'main'
  get name(): string;             // Igual que la clave

  // Lectura de colecciones
  getCollections(): Collection[];                      // Obtener todas las colecciones
  getCollection(name: string): Collection | undefined; // Obtener colección por nombre
  getAssociation(associationName: string): CollectionField | undefined; // Obtener campo de asociación (ej. users.roles)

  // Gestión de colecciones
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Metadatos de campos
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Propiedades comunes

| Propiedad | Tipo | Descripción |
|------|------|------|
| `key` | `string` | Clave de la fuente de datos, ej. `'main'` |
| `name` | `string` | Igual que la clave |
| `displayName` | `string` | Nombre a mostrar (soporta i18n) |
| `flowEngine` | `FlowEngine` | Instancia actual de FlowEngine |

## Métodos comunes

| Método | Descripción |
|------|------|
| `getCollections()` | Obtiene todas las colecciones bajo la fuente de datos actual (ordenadas y con las ocultas filtradas). |
| `getCollection(name)` | Obtiene una colección por nombre; `name` puede ser `nombreColeccion.nombreCampo` para obtener la colección de destino de una asociación. |
| `getAssociation(associationName)` | Obtiene la definición de un campo de asociación mediante `nombreColeccion.nombreCampo`. |
| `getCollectionField(fieldPath)` | Obtiene la definición de un campo mediante `nombreColeccion.rutaCampo`, soportando rutas de asociación como `users.profile.avatar`. |

## Relación con ctx.dataSourceManager

| Requisito | Uso recomendado |
|------|----------|
| **Fuente de datos única vinculada al contexto actual** | `ctx.dataSource` |
| **Punto de entrada para todas las fuentes de datos** | `ctx.dataSourceManager` |
| **Obtener colección dentro de la fuente de datos actual** | `ctx.dataSource.getCollection(name)` |
| **Obtener colección entre diferentes fuentes de datos** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Obtener campo dentro de la fuente de datos actual** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Obtener campo entre diferentes fuentes de datos** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Ejemplo

### Obtener colecciones y campos

```ts
// Obtener todas las colecciones
const collections = ctx.dataSource.getCollections();

// Obtener colección por nombre
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Obtener definición de campo por "nombreColeccion.rutaCampo" (soporta asociaciones)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Obtener campos de asociación

```ts
// Obtener definición de campo de asociación por nombreColeccion.nombreCampo
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Procesar basado en la estructura de la colección de destino
}
```

### Recorrer colecciones para procesamiento dinámico

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Realizar validaciones o UI dinámica basada en metadatos de campos

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Realizar lógica de UI o validación basada en interface, enum, validation, etc.
}
```

## Notas

- El formato de ruta para `getCollectionField(fieldPath)` es `nombreColeccion.rutaCampo`, donde el primer segmento es el nombre de la colección y los segmentos posteriores son la ruta del campo (soporta asociaciones, ej. `user.name`).
- `getCollection(name)` soporta el formato `nombreColeccion.nombreCampo`, devolviendo la colección de destino del campo de asociación.
- En el contexto de RunJS, `ctx.dataSource` suele estar determinado por la fuente de datos del bloque o página actual. Si no hay una fuente de datos vinculada al contexto, puede ser `undefined`; se recomienda realizar una comprobación de nulidad antes de su uso.

## Relacionado

- [ctx.dataSourceManager](./data-source-manager.md): Gestor de fuentes de datos, administra todas las fuentes de datos.
- [ctx.collection](./collection.md): La colección asociada al contexto actual.
- [ctx.collectionField](./collection-field.md): La definición del campo de la colección para el campo actual.