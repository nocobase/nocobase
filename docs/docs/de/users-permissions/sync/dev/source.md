:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweitern von synchronisierten Datenquellen

## Übersicht

NocoBase ermöglicht es Ihnen, die Typen von Datenquellen für die Benutzersynchronisierung bei Bedarf zu erweitern.

## Serverseitig

### Datenquellen-Schnittstelle

Das integrierte Plugin für die Benutzersynchronisierung bietet die Registrierung und Verwaltung von Datenquellentypen. Um einen Datenquellentyp zu erweitern, müssen Sie die vom Plugin bereitgestellte abstrakte Klasse `SyncSource` erben und die entsprechenden Standardschnittstellen implementieren.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

Die Klasse `SyncSource` enthält eine `options`-Eigenschaft, um benutzerdefinierte Konfigurationen für die Datenquelle abzurufen.

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

### Beschreibung der `UserData`-Felder

| Feld         | Beschreibung                                    |
| ------------ | ----------------------------------------------- |
| `dataType`   | Datentyp, mögliche Werte sind `user` und `department` |
| `uniqueKey`  | Eindeutiges Bezeichnerfeld                      |
| `records`    | Datensätze                                      |
| `sourceName` | Name der Datenquelle                            |

Wenn `dataType` den Wert `user` hat, enthält das Feld `records` die folgenden Felder:

| Feld          | Beschreibung             |
| ------------- | ------------------------ |
| `id`          | Benutzer-ID              |
| `nickname`    | Benutzer-Spitzname       |
| `avatar`      | Benutzer-Avatar          |
| `email`       | E-Mail                   |
| `phone`       | Telefonnummer            |
| `departments` | Array von Abteilungs-IDs |

Wenn `dataType` den Wert `department` hat, enthält das Feld `records` die folgenden Felder:

| Feld       | Beschreibung             |
| ---------- | ------------------------ |
| `id`       | Abteilungs-ID            |
| `name`     | Abteilungsname           |
| `parentId` | Übergeordnete Abteilungs-ID |

### Beispiel für die Implementierung der Datenquellen-Schnittstelle

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

### Registrierung eines Datenquellentyps

Die erweiterte Datenquelle muss beim Datenverwaltungsmodul registriert werden.

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

## Clientseitig

Die clientseitige Benutzeroberfläche registriert Datenquellentypen über die `registerType`-Methode, die von der Client-Schnittstelle des Benutzersynchronisierungs-Plugins bereitgestellt wird:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Backend-Verwaltungsformular
      },
    });
  }
}
```

### Backend-Verwaltungsformular

![](https://static-docs.nocobase.com/202412041429835.png)

Der obere Bereich zeigt die allgemeine Datenquellenkonfiguration, während der untere Bereich die Registrierung von benutzerdefinierten Konfigurationsformularen ermöglicht.