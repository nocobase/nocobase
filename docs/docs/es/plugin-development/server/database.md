:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Database

`Database` es un componente fundamental de las **fuentes de datos** (`DataSource`) de tipo base de datos. Cada fuente de datos de este tipo tiene una instancia `Database` correspondiente, a la que puede acceder a través de `dataSource.db`. La instancia de base de datos de la fuente de datos principal también ofrece el práctico alias `app.db`. Familiarizarse con los métodos comunes de `db` es esencial para desarrollar **plugins** del lado del servidor.

## Componentes de Database

Una `Database` típica se compone de las siguientes partes:

-   **Collection** (colección): Define la estructura de las tablas de datos.
-   **Model**: Corresponde a los modelos ORM (generalmente gestionados por Sequelize).
-   **Repository**: La capa de repositorio que encapsula la lógica de acceso a datos, ofreciendo métodos de operación de nivel superior.
-   **FieldType**: Tipos de campo.
-   **FilterOperator**: Operadores utilizados para el filtrado.
-   **Event**: Eventos de ciclo de vida y eventos de base de datos.

## Cuándo usar `Database` en los plugins

### Qué hacer en la etapa `beforeLoad`

En esta etapa, no se permiten operaciones de base de datos. Es adecuada para el registro de clases estáticas o la escucha de eventos.

-   `db.registerFieldTypes()` — Tipos de campo personalizados
-   `db.registerModels()` — Registrar clases de modelo personalizadas
-   `db.registerRepositories()` — Registrar clases de repositorio personalizadas
-   `db.registerOperators()` — Registrar operadores de filtro personalizados
-   `db.on()` — Escuchar eventos relacionados con la base de datos

### Qué hacer en la etapa `load`

En esta etapa, todas las definiciones de clases y eventos previos ya se han cargado, por lo que la carga de las tablas de datos no tendrá dependencias faltantes u omitidas.

-   `db.defineCollection()` — Definir nuevas tablas de datos
-   `db.extendCollection()` — Extender configuraciones de tablas de datos existentes

Si va a definir tablas integradas para un **plugin**, se recomienda encarecidamente ubicarlas en el directorio `./src/server/collections`. Consulte [Colecciones](./collections.md).

## Operaciones de datos

`Database` ofrece dos formas principales de acceder y operar con los datos:

### Operaciones a través de Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

La capa de Repository se utiliza habitualmente para encapsular la lógica de negocio, como la paginación, el filtrado, las comprobaciones de permisos, etc.

### Operaciones a través de Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

La capa de Model se corresponde directamente con las entidades ORM y es adecuada para ejecutar operaciones de base de datos de bajo nivel.

## ¿En qué etapas se permiten las operaciones de base de datos?

### Ciclo de vida del Plugin

| Etapa | ¿Operaciones de base de datos permitidas? |
| :-------------------- | :---------------------------------- |
| `staticImport` | No |
| `afterAdd` | No |
| `beforeLoad` | No |
| `load` | No |
| `install` | Sí |
| `beforeEnable` | Sí |
| `afterEnable` | Sí |
| `beforeDisable` | Sí |
| `afterDisable` | Sí |
| `remove` | Sí |
| `handleSyncMessage` | Sí |

### Eventos de la aplicación

| Etapa | ¿Operaciones de base de datos permitidas? |
| :-------------------- | :---------------------------------- |
| `beforeLoad` | No |
| `afterLoad` | No |
| `beforeStart` | Sí |
| `afterStart` | Sí |
| `beforeInstall` | No |
| `afterInstall` | Sí |
| `beforeStop` | Sí |
| `afterStop` | No |
| `beforeDestroy` | Sí |
| `afterDestroy` | No |
| `beforeLoadPlugin` | No |
| `afterLoadPlugin` | No |
| `beforeEnablePlugin` | Sí |
| `afterEnablePlugin` | Sí |
| `beforeDisablePlugin` | Sí |
| `afterDisablePlugin` | Sí |
| `afterUpgrade` | Sí |

### Eventos/Hooks de Database

| Etapa | ¿Operaciones de base de datos permitidas? |
| :------------------------------ | :---------------------------------- |
| `beforeSync` | No |
| `afterSync` | Sí |
| `beforeValidate` | Sí |
| `afterValidate` | Sí |
| `beforeCreate` | Sí |
| `afterCreate` | Sí |
| `beforeUpdate` | Sí |
| `afterUpdate` | Sí |
| `beforeSave` | Sí |
| `afterSave` | Sí |
| `beforeDestroy` | Sí |
| `afterDestroy` | Sí |
| `afterCreateWithAssociations` | Sí |
| `afterUpdateWithAssociations` | Sí |
| `afterSaveWithAssociations` | Sí |
| `beforeDefineCollection` | No |
| `afterDefineCollection` | No |
| `beforeRemoveCollection` | No |
| `afterRemoveCollection` | No |