:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# DataSourceManager: Gestión de Fuentes de Datos

NocoBase le ofrece `DataSourceManager` para la gestión de múltiples **fuentes de datos**. Cada `DataSource` cuenta con sus propias instancias de `Database`, `ResourceManager` y `ACL`, lo que facilita a los desarrolladores la gestión y extensión flexible de múltiples **fuentes de datos**.

## Conceptos Básicos

Cada instancia de `DataSource` incluye lo siguiente:

- **`dataSource.collectionManager`**: Se utiliza para gestionar **colecciones** y campos.
- **`dataSource.resourceManager`**: Maneja las operaciones relacionadas con los recursos (como crear, leer, actualizar y eliminar, entre otras).
- **`dataSource.acl`**: Control de acceso (ACL) para las operaciones sobre recursos.

Para facilitar el acceso, se proporcionan alias para los miembros de la **fuente de datos** principal:

- `app.db` es equivalente a `dataSourceManager.get('main').collectionManager.db`
- `app.acl` es equivalente a `dataSourceManager.get('main').acl`
- `app.resourceManager` es equivalente a `dataSourceManager.get('main').resourceManager`

## Métodos Comunes

### dataSourceManager.get(dataSourceKey)

Este método devuelve la instancia de `DataSource` especificada.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Registra un middleware para todas las **fuentes de datos**. Esto afectará las operaciones en todas las **fuentes de datos**.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Se ejecuta antes de la carga de una **fuente de datos**. Se usa comúnmente para el registro de clases estáticas, como clases de modelo o tipos de campo:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Tipo de campo personalizado
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Se ejecuta después de la carga de una **fuente de datos**. Se usa comúnmente para registrar operaciones, configurar el control de acceso, etc.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Configurar permisos de acceso
});
```

## Extensión de Fuentes de Datos

Para una extensión completa de las **fuentes de datos**, consulte el capítulo de [Extensión de Fuentes de Datos](#).