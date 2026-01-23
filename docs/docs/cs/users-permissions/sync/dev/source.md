:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rozšíření synchronizovaných zdrojů dat

## Přehled

NocoBase umožňuje podle potřeby rozšiřovat typy zdrojů dat pro synchronizaci uživatelských dat.

## Na straně serveru

### Rozhraní zdroje dat

Vestavěný **plugin** pro synchronizaci uživatelských dat zajišťuje registraci a správu typů **zdrojů dat**. Chcete-li rozšířit typ **zdroje dat**, je potřeba zdědit abstraktní třídu `SyncSource` poskytovanou tímto **pluginem** a implementovat příslušná standardní rozhraní.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

Třída `SyncSource` obsahuje vlastnost `options`, která slouží k získání vlastních konfigurací pro **zdroj dat**.

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

### Popis polí `UserData`

| Pole         | Popis                                          |
| ------------ | ---------------------------------------------- |
| `dataType`   | Typ dat, možnosti jsou `user` a `department`   |
| `uniqueKey`  | Pole s unikátním identifikátorem               |
| `records`    | Datové záznamy                                 |
| `sourceName` | Název **zdroje dat**                           |

Pokud je `dataType` nastaveno na `user`, pole `records` obsahuje následující pole:

| Pole          | Popis                  |
| ------------- | ---------------------- |
| `id`          | ID uživatele           |
| `nickname`    | Přezdívka uživatele    |
| `avatar`      | Avatar uživatele       |
| `email`       | E-mail                 |
| `phone`       | Telefonní číslo        |
| `departments` | Pole ID oddělení       |

Pokud je `dataType` nastaveno na `department`, pole `records` obsahuje následující pole:

| Pole       | Popis                  |
| ---------- | ---------------------- |
| `id`       | ID oddělení            |
| `name`     | Název oddělení         |
| `parentId` | ID nadřazeného oddělení |

### Příklad implementace rozhraní zdroje dat

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

### Registrace typu zdroje dat

Rozšířený **zdroj dat** je nutné zaregistrovat v modulu pro správu dat.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.registerType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## Na straně klienta

Uživatelské rozhraní na straně klienta registruje typy **zdrojů dat** pomocí metody `registerType`, kterou poskytuje klientské rozhraní **pluginu** pro synchronizaci uživatelských dat:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Formulář pro správu v backendu
      },
    });
  }
}
```

### Formulář pro správu v backendu

![](https://static-docs.nocobase.com/202412041429835.png)

Horní část poskytuje obecnou konfiguraci **zdroje dat**, zatímco spodní část umožňuje registraci vlastních konfiguračních formulářů.