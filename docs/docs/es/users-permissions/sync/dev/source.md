:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Extensión de fuentes de datos sincronizadas

## Resumen

NocoBase le permite extender los tipos de **fuente de datos** para la sincronización de datos de usuario según sea necesario.

## Lado del servidor

### Interfaz de la **fuente de datos**

El **plugin** de sincronización de datos de usuario integrado ofrece el registro y la gestión de los tipos de **fuente de datos**. Para extender un tipo de **fuente de datos**, debe heredar la clase abstracta `SyncSource` que proporciona el **plugin** e implementar las interfaces estándar correspondientes.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

La clase `SyncSource` incluye una propiedad `options` que le permite recuperar configuraciones personalizadas para la **fuente de datos**.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    //...
    const { appid, secret } = this.options;
    //...
    return [];
  }
}
```

### Descripción de los campos de `UserData`

| Campo          | Descripción                                    |
| -------------- | ---------------------------------------------- |
| `dataType`     | Tipo de datos, las opciones son `user` y `department` |
| `uniqueKey`    | Campo de identificador único                   |
| `records`      | Registros de datos                             |
| `sourceName`   | Nombre de la **fuente de datos**               |

Si `dataType` es `user`, el campo `records` contiene los siguientes campos:

| Campo         | Descripción             |
| ------------- | ----------------------- |
| `id`          | ID de usuario           |
| `nickname`    | Apodo de usuario        |
| `avatar`      | Avatar de usuario       |
| `email`       | Correo electrónico      |
| `phone`       | Número de teléfono      |
| `departments` | Array de IDs de departamento |

Si `dataType` es `department`, el campo `records` contiene los siguientes campos:

| Campo      | Descripción          |
| ---------- | -------------------- |
| `id`       | ID de departamento   |
| `name`     | Nombre del departamento |
| `parentId` | ID del departamento padre |

### Ejemplo de implementación de la interfaz de la **fuente de datos**

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    // ...
    const ThirdClientApi = new ThirdClientApi(
      this.options.appid,
      this.options.secret,
    );
    const departments = await this.clientapi.getDepartments();
    const users = await this.clientapi.getUsers();
    // ...
    return [
      {
        dataType: 'department',
        uniqueKey: 'id',
        records: departments,
        sourceName: this.instance.name,
      },
      {
        dataType: 'user',
        uniqueKey: 'id',
        records: users,
        sourceName: this.instance.name,
      },
    ];
  }
}
```

### Registro de un tipo de **fuente de datos**

La **fuente de datos** extendida debe registrarse en el módulo de gestión de datos.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.reigsterType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## Lado del cliente

La interfaz de usuario del cliente registra los tipos de **fuente de datos** utilizando el método `registerType` que proporciona la interfaz de cliente del **plugin** de sincronización de datos de usuario:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Formulario de administración de backend
      },
    });
  }
}
```

### Formulario de administración de backend

![](https://static-docs.nocobase.com/202412041429835.png)

La sección superior proporciona la configuración general de la **fuente de datos**, mientras que la sección inferior permite el registro de formularios de configuración personalizados.