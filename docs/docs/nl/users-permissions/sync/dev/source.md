:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gegevensbronnen voor synchronisatie uitbreiden

## Overzicht

NocoBase biedt de mogelijkheid om de typen gegevensbronnen voor het synchroniseren van gebruikersgegevens naar behoefte uit te breiden.

## Serverzijde

### Gegevensbron-interface

De ingebouwde plugin voor het synchroniseren van gebruikersgegevens biedt functionaliteit voor het registreren en beheren van gegevensbrontypen. Om een gegevensbrontype uit te breiden, erft u de abstracte klasse `SyncSource` van de plugin over en implementeert u de bijbehorende standaardinterfaces.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

De `SyncSource`-klasse bevat een `options`-eigenschap om aangepaste configuraties voor de gegevensbron op te halen.

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

### Beschrijving van `UserData`-velden

| Veld         | Beschrijving                                   |
| ------------ | ---------------------------------------------- |
| `dataType`   | Gegevenstype, opties zijn `user` en `department` |
| `uniqueKey`  | Uniek identificatieveld                        |
| `records`    | Gegevensrecords                                |
| `sourceName` | Naam van de gegevensbron                       |

Als `dataType` `user` is, bevat het veld `records` de volgende velden:

| Veld          | Beschrijving             |
| ------------- | ----------------------- |
| `id`          | Gebruikers-ID           |
| `nickname`    | Gebruikersnaam          |
| `avatar`      | Gebruikersavatar        |
| `email`       | E-mail                  |
| `phone`       | Telefoonnummer          |
| `departments` | Array van afdelings-ID's |

Als `dataType` `department` is, bevat het veld `records` de volgende velden:

| Veld       | Beschrijving          |
| ---------- | -------------------- |
| `id`       | Afdelings-ID         |
| `name`     | Afdelingsnaam        |
| `parentId` | Bovenliggende afdelings-ID |

### Voorbeeldimplementatie van de gegevensbron-interface

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

### Een gegevensbrontype registreren

De uitgebreide gegevensbron moet worden geregistreerd bij de gegevensbeheermodule.

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

## Clientzijde

De gebruikersinterface aan de clientzijde registreert gegevensbrontypen via de `registerType`-methode die wordt aangeboden door de client-interface van de plugin voor gebruikersgegevenssynchronisatie:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Backend management form
      },
    });
  }
}
```

### Backend-beheerformulier

![](https://static-docs.nocobase.com/202412041429835.png)

Het bovenste gedeelte toont de algemene configuratie van de gegevensbron, terwijl het onderste gedeelte de mogelijkheid biedt om aangepaste configuratieformulieren te registreren.