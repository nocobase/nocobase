---
title: "Migration: Scripts de actualización"
description: "Migración de base de datos para plugins NocoBase: clase Migration, up/down, actualización de versiones, cambios de esquema."
keywords: "Migration,migración de base de datos,up,down,script de actualización,cambio de esquema,NocoBase"
---

# Migration: Scripts de actualización

Durante el desarrollo y las actualizaciones de los plugins de NocoBase, la estructura de la base de datos o la configuración de un plugin pueden sufrir cambios incompatibles. Para asegurar una actualización fluida, NocoBase ofrece un mecanismo de **Migration** — mediante la escritura de archivos de migración para gestionar estos cambios.

## Concepto de Migración

Una migración es un script que se ejecuta automáticamente durante las actualizaciones de los plugins y se utiliza para resolver los siguientes problemas:

- Ajustes en la estructura de las tablas de datos (como añadir campos, modificar tipos de campos, etc.)
- Migración de datos (por ejemplo, actualizaciones masivas de valores de campos)
- Actualizaciones de la configuración o la lógica interna del plugin

El momento de ejecución de las migraciones se divide en tres categorías:

| Tipo | Momento de activación | Escenario de ejecución |
|------|-----------------------|------------------------|
| `beforeLoad` | Antes de que se carguen todas las configuraciones de los plugins | |
| `afterSync`  | Después de que las configuraciones de las tablas se sincronicen con la base de datos (la estructura de las tablas ya ha cambiado) | |
| `afterLoad`  | Después de que se carguen todas las configuraciones de los plugins | |

## Creación de archivos de migración

Los archivos de migración deben ubicarse en `src/server/migrations/*.ts` dentro del directorio del plugin. El CLI de NocoBase proporciona el comando `nb scaffold migration` para generar rápidamente archivos de migración.

```bash
nb scaffold migration <name> --pkg <pkg> [--on <timing>]
```

Parámetros

| Parámetro | Descripción |
|------|----------|
| `<name>` | Nombre de la migración, obligatorio |
| `--pkg <pkg>` | Especifica el nombre del paquete del plugin, obligatorio |
| `--on <timing>` | Especifica el momento de ejecución, opciones: `beforeLoad`, `afterSync`, `afterLoad` |

Ejemplo

```bash
$ nb scaffold migration update-ui --pkg @nocobase/plugin-client
```

La ruta del archivo de migración generado es la siguiente:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Contenido inicial del archivo:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Escriba aquí la lógica de actualización
  }
}
```

:::tip Consejo

`appVersion` se utiliza para identificar la versión a la que se dirige la actualización. Los entornos con versiones anteriores a la especificada ejecutarán esta migración.

:::

## Escritura de migraciones

En los archivos de migración, puede acceder a las siguientes propiedades y API comunes a través de `this` para operar cómodamente con la base de datos, los plugins y las instancias de la aplicación:

Propiedades comunes

- **`this.app`**
  Instancia actual de la aplicación NocoBase. Se puede utilizar para acceder a servicios globales, plugins o configuraciones.
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**
  Instancia del servicio de base de datos, proporciona interfaces para operar con modelos (Tables).
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**
  Instancia del plugin actual, se puede utilizar para acceder a los métodos personalizados del plugin.
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**
  Instancia de Sequelize, puede ejecutar directamente SQL nativo u operaciones de transacción.
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**
  QueryInterface de Sequelize, comúnmente utilizada para modificar estructuras de tablas, como añadir campos, eliminar tablas, etc.
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Ejemplo de escritura de migración

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Usar queryInterface para añadir un campo
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Usar db para acceder a los modelos de datos
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Ejecutar el método personalizado del plugin
    await this.plugin.customMethod();
  }
}
```

Además de las propiedades comunes mencionadas anteriormente, la clase Migration también ofrece una amplia gama de API. Para obtener documentación detallada, consulte la [API de Migration](../../api/server/migration.md).

## Activación de migraciones

La ejecución de las migraciones se activa mediante el comando de actualización:

```bash
$ nb app upgrade
```

Durante la actualización, el sistema determinará el orden de ejecución basándose en el tipo de migración y `appVersion`.

## Prueba de migraciones

En el desarrollo de plugins, se recomienda utilizar un **Mock Server** para probar si la migración se ejecuta correctamente, evitando así dañar los datos reales.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Nombre del plugin
      version: '0.18.0-alpha.5', // Versión antes de la actualización
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Escriba la lógica de verificación, por ejemplo, comprobar si el campo existe, si la migración de datos fue exitosa
  });
});
```

:::tip Consejo

Usar un Mock Server le permite simular rápidamente escenarios de actualización y verificar el orden de ejecución de las migraciones y los cambios en los datos.

:::

## Recomendaciones para la práctica de desarrollo

1. **Divida las migraciones**
   Intente generar un archivo de migración por cada actualización para mantener la atomicidad y facilitar la resolución de problemas.
2. **Especifique el momento de ejecución**
   Elija `beforeLoad`, `afterSync` o `afterLoad` según los objetos de la operación para evitar depender de módulos no cargados.
3. **Gestione el control de versiones**
   Utilice `appVersion` para especificar claramente la versión a la que se aplica la migración y evitar ejecuciones repetidas.
4. **Cobertura de pruebas**
   Verifique la migración en un Mock Server antes de ejecutar la actualización en un entorno real.

## Enlaces relacionados

- [Collections: Tablas de datos](./collections.md) — Definición de la estructura de tablas que a menudo se ajusta en las migraciones
- [Database: Operaciones de base de datos](./database.md) — API para operar datos mediante `this.db` en las migraciones
- [Plugin](./plugin.md) — Organización y carga de archivos de migración en un plugin
- [Command: Línea de comandos](./command.md) — Activación de migraciones mediante `nb app upgrade` y `nb scaffold migration`
- [Test](./test.md) — Prueba de la ejecución de migraciones con Mock Server
- [API de Migration](../../api/server/migration.md) — Referencia completa de la API de la clase Migration
