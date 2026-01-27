:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utöka synkroniserade datakällor

## Översikt

NocoBase låter dig utöka typerna av datakällor för synkronisering av användardata efter behov.

## Serversidan

### Gränssnitt för datakälla

Det inbyggda `plugin`-programmet för synkronisering av användardata hanterar registrering och administration av datakälltyper. För att utöka en datakälltyp behöver ni ärva den abstrakta klassen `SyncSource` som `plugin`-programmet tillhandahåller och implementera de relevanta standardgränssnitten.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource`-klassen innehåller egenskapen `options` för att hämta anpassade konfigurationer för datakällan.

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

### Beskrivning av `UserData`-fält

| Fält         | Beskrivning                                    |
| ------------ | ---------------------------------------------- |
| `dataType`   | Datatyp, alternativen är `user` och `department` |
| `uniqueKey`  | Unikt identifieringsfält                        |
| `records`    | Dataposter                                   |
| `sourceName` | Datakällans namn                               |

Om `dataType` är `user` innehåller fältet `records` följande fält:

| Fält          | Beskrivning             |
| ------------- | ----------------------- |
| `id`          | Användar-ID                 |
| `nickname`    | Användarnamn           |
| `avatar`      | Användaravatar             |
| `email`       | E-post                   |
| `phone`       | Telefonnummer            |
| `departments` | Array med avdelnings-ID:n |

Om `dataType` är `department` innehåller fältet `records` följande fält:

| Fält       | Beskrivning          |
| ---------- | -------------------- |
| `id`       | Avdelnings-ID        |
| `name`     | Avdelningsnamn      |
| `parentId` | Överordnat avdelnings-ID |

### Exempel på implementering av datakällans gränssnitt

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

### Registrera en datakälltyp

Den utökade datakällan måste registreras i datamodulen.

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

## Klientsidan

Klientens användargränssnitt registrerar datakälltyper med hjälp av metoden `registerType` som tillhandahålls av `plugin`-programmets klientgränssnitt för synkronisering av användardata:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Administrationsformulär
      },
    });
  }
}
```

### Administrationsformulär

![](https://static-docs.nocobase.com/202412041429835.png)

Den övre delen visar allmänna konfigurationer för datakällan, medan den nedre delen möjliggör registrering av anpassade konfigurationsformulär.