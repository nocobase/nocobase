:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Extension des sources de données synchronisées

## Vue d'ensemble

NocoBase vous permet d'étendre les types de sources de données pour la synchronisation des données utilisateur, selon vos besoins.

## Côté serveur

### Interface de la source de données

Le plugin de synchronisation des données utilisateur intégré gère l'enregistrement et la gestion des types de sources de données. Pour étendre un type de source de données, vous devez hériter de la classe abstraite `SyncSource` fournie par le plugin et implémenter les interfaces standard correspondantes.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

La classe `SyncSource` inclut une propriété `options` pour récupérer les configurations personnalisées de la source de données.

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

### Description des champs `UserData`

| Champ        | Description                                    |
| ------------ | ---------------------------------------------- |
| `dataType`   | Type de données, les options sont `user` et `department` |
| `uniqueKey`  | Champ d'identifiant unique                        |
| `records`    | Enregistrements de données                                   |
| `sourceName` | Nom de la source de données                                |

Si `dataType` est `user`, le champ `records` contient les champs suivants :

| Champ         | Description             |
| ------------- | ----------------------- |
| `id`          | ID utilisateur                 |
| `nickname`    | Surnom de l'utilisateur           |
| `avatar`      | Avatar de l'utilisateur             |
| `email`       | E-mail                   |
| `phone`       | Numéro de téléphone            |
| `departments` | Tableau des ID de département |

Si `dataType` est `department`, le champ `records` contient les champs suivants :

| Champ      | Description          |
| ---------- | -------------------- |
| `id`       | ID du département        |
| `name`     | Nom du département      |
| `parentId` | ID du département parent |

### Exemple d'implémentation de l'interface de source de données

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

### Enregistrement d'un type de source de données

La source de données étendue doit être enregistrée auprès du module de gestion des données.

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

## Côté client

L'interface utilisateur côté client enregistre les types de sources de données en utilisant la méthode `registerType` fournie par l'interface client du plugin de synchronisation des données utilisateur :

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Formulaire d'administration
      },
    });
  }
}
```

### Formulaire d'administration

![](https://static-docs.nocobase.com/202412041429835.png)

La section supérieure présente la configuration générale de la source de données, tandis que la section inférieure permet l'enregistrement de formulaires de configuration personnalisés.