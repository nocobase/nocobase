:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Estendere le Fonti Dati Sincronizzate

## Panoramica

NocoBase Le permette di estendere i tipi di **fonte dati** per la sincronizzazione dei dati utente in base alle Sue esigenze.

## Lato Server

### Interfaccia della Fonte Dati

Il **plugin** di sincronizzazione dei dati utente integrato offre la registrazione e la gestione dei tipi di **fonte dati**. Per estendere un tipo di **fonte dati**, deve ereditare la classe astratta `SyncSource` fornita dal **plugin** e implementare le interfacce standard pertinenti.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

La classe `SyncSource` include una proprietà `options` per recuperare le configurazioni personalizzate della **fonte dati**.

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

### Descrizione dei Campi `UserData`

| Campo        | Descrizione                                    |
| ------------ | ---------------------------------------------- |
| `dataType`   | Tipo di dati, le opzioni sono `user` e `department` |
| `uniqueKey`  | Campo identificatore univoco                   |
| `records`    | Record di dati                                 |
| `sourceName` | Nome della fonte dati                           |

Se `dataType` è `user`, il campo `records` contiene i seguenti campi:

| Campo         | Descrizione             |
| ------------- | ----------------------- |
| `id`          | ID utente               |
| `nickname`    | Nickname utente         |
| `avatar`      | Avatar utente           |
| `email`       | Email                   |
| `phone`       | Numero di telefono      |
| `departments` | Array di ID dei dipartimenti |

Se `dataType` è `department`, il campo `records` contiene i seguenti campi:

| Campo      | Descrizione          |
| ---------- | -------------------- |
| `id`       | ID dipartimento      |
| `name`     | Nome dipartimento    |
| `parentId` | ID dipartimento padre |

### Esempio di Implementazione dell'Interfaccia della Fonte Dati

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

### Registrazione di un Tipo di Fonte Dati

La **fonte dati** estesa deve essere registrata nel modulo di gestione dei dati.

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

## Lato Client

L'interfaccia utente lato client registra i tipi di **fonte dati** utilizzando il metodo `registerType` fornito dall'interfaccia client del **plugin** di sincronizzazione dei dati utente:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Modulo di gestione backend
      },
    });
  }
}
```

### Modulo di Gestione Backend

![](https://static-docs.nocobase.com/202412041429835.png)

La sezione superiore mostra la configurazione generale della **fonte dati**, mentre la sezione inferiore permette la registrazione di moduli di configurazione personalizzati.