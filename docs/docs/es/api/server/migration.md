---
title: "Migration"
description: "Referencia de la API de Migration en NocoBase: clase base Migration, métodos up/down, momento de ejecución con on, control de versiones con appVersion y propiedades disponibles."
keywords: "Migration,migración de datos,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration es la clase base de migración de datos de NocoBase, utilizada para gestionar cambios en la estructura de la base de datos y migraciones de datos durante la actualización de plugins. Se importa desde `@nocobase/server`.

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // Lógica de actualización
  }
}
```

## Propiedades de clase

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

Controla el momento de ejecución de la migration durante el flujo de upgrade. El valor por defecto es `'afterLoad'`.

| Valor | Momento de ejecución | Caso de uso |
|----|----------|----------|
| `'beforeLoad'` | Antes de cargar los plugins | Operaciones DDL de bajo nivel (por ejemplo, agregar columnas o restricciones). No se puede usar la API de Repository en este momento |
| `'afterSync'` | Después de `db.sync()` y antes del upgrade del plugin | Migraciones de datos que necesitan la nueva estructura de tablas pero no dependen de la lógica del plugin |
| `'afterLoad'` | Después de que todos los plugins se hayan cargado | **Valor por defecto**, la mayoría de las migrations usan este. Se puede utilizar la API completa de Repository |

### appVersion

```ts
appVersion: string;
```

Cadena de rango semver que determina en qué versiones de la aplicación se ejecutará esta migration. El framework usa `semver.satisfies()` para evaluar: la migration solo se ejecutará cuando la versión actual de la aplicación satisfaga ese rango.

```ts
// Solo se ejecuta al actualizar desde una versión inferior a 1.0.0
appVersion = '<1.0.0';

// Solo se ejecuta al actualizar desde una versión inferior a 0.21.0-alpha.13
appVersion = '<0.21.0-alpha.13';

// Si se deja vacío, se ejecuta en cada upgrade
appVersion = '';
```

## Propiedades de instancia

### app

```ts
get app(): Application
```

Instancia de Application de NocoBase. A través de ella se puede acceder a los distintos módulos de la aplicación:

```ts
async up() {
  // Obtener la versión de la aplicación
  const version = this.app.version;

  // Obtener el logger
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

Instancia de Database de NocoBase, que se puede usar para obtener Repositories, ejecutar consultas, etc.:

```ts
async up() {
  const repo = this.db.getRepository('users');
  await repo.update({
    filter: { status: 'inactive' },
    values: { status: 'disabled' },
  });
}
```

### plugin

```ts
get plugin(): Plugin
```

Instancia del plugin actual. Solo está disponible en migrations a nivel de plugin (en migrations del core es `undefined`).

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

Instancia de Sequelize, que permite ejecutar SQL sin procesar directamente:

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

QueryInterface de Sequelize, utilizado para ejecutar operaciones DDL (agregar/eliminar columnas, agregar restricciones, modificar tipos de columnas, etc.):

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // Agregar columna
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // Agregar restricción única
  await this.queryInterface.addConstraint('users', {
    type: 'unique',
    fields: ['email'],
  });
}
```

### pm

```ts
get pm(): PluginManager
```

Administrador de plugins. A través de `this.pm.repository` se pueden consultar y modificar los metadatos de los plugins:

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // Modificar registros de plugins en lote
  }
}
```

## Métodos de instancia

### up()

```ts
async up(): Promise<void>
```

**Se ejecuta durante la actualización.** Las subclases deben sobrescribir este método para implementar la lógica de migración.

### down()

```ts
async down(): Promise<void>
```

**Se ejecuta durante la reversión.** La mayoría de las migrations lo dejan vacío. Si se necesita soportar reversión, aquí se escribe la operación inversa.

## Ejemplos completos

### Actualizar datos con la API de Repository (afterLoad)

El escenario más común: después de que todos los plugins se hayan cargado, usar la API de Repository para actualizar datos en lote:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<1.0.0';

  async up() {
    const repo = this.db.getRepository('roles');
    await repo.update({
      filter: {
        $or: [{ allowConfigure: true }, { name: 'root' }],
      },
      values: {
        snippets: ['ui.*', 'pm', 'pm.*'],
        allowConfigure: false,
      },
    });
  }

  async down() {}
}
```

### Modificar la estructura de tablas con QueryInterface (beforeLoad)

Ejecutar DDL de bajo nivel antes de cargar los plugins, por ejemplo, agregar una nueva columna y una restricción única a una tabla:

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // Verificar primero si el campo ya existe
    const exists = await field.existsInDb();
    if (exists) return;

    await this.queryInterface.addColumn(tableName, field.columnName(), {
      type: DataTypes.STRING,
    });

    await this.queryInterface.addConstraint(tableName, {
      type: 'unique',
      fields: [field.columnName()],
    });
  }
}
```

### Usar SQL sin procesar (afterSync)

Después de completar la sincronización de la estructura de tablas, realizar la migración de datos con SQL sin procesar:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<1.0.0-alpha.3';

  async up() {
    const items = await this.pm.repository.find();
    for (const item of items) {
      if (item.name.startsWith('@nocobase/plugin-')) {
        item.set('name', item.name.substring('@nocobase/plugin-'.length));
        await item.save();
      }
    }
  }
}
```

## Crear archivo de Migration

Mediante el comando CLI:

```bash
nb scaffold migration my-migration --pkg @my-project/plugin-hello
```

El comando generará un archivo con marca de tiempo en el directorio `src/server/migrations/` del plugin, con la siguiente plantilla:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<versión actual>';

  async up() {
    // coding
  }
}
```

Parámetros del comando:

| Parámetro | Descripción |
|------|------|
| `<name>` | Nombre de la migration, utilizado para generar el nombre del archivo |
| `--pkg <pkg>` | Nombre del paquete, determina la ruta de almacenamiento del archivo |
| `--on <on>` | Momento de ejecución, por defecto `'afterLoad'` |

## Enlaces relacionados

- [Scripts de actualización Migration (desarrollo de plugins)](../../plugin-development/server/migration.md) — Tutorial sobre el uso de migrations en el desarrollo de plugins
- [Collections - Tablas de datos](../../plugin-development/server/collections.md) — defineCollection y sincronización de estructura de tablas
- [Database - Operaciones de base de datos](../../plugin-development/server/database.md) — API de Repository y operaciones de base de datos
- [Plugin](../../plugin-development/server/plugin.md) — Relación entre install() y migration en el ciclo de vida del plugin
