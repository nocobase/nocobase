# Extend Synchronized Data Sources

## Overview

NocoBase supports extending user data synchronization source types as needed.

## Server-side

### Data Source Interface

The built-in user data synchronization plugin provides registration and management of data source types. To extend a data source type, you need to inherit the `SyncSource` abstract class provided by the plugin and implement the corresponding standard interfaces.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource` provides an `options` property to get the custom configuration of the data source.

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

### UserData Field Description

| Field | Description |
| ------------ | ----------------------------------------- |
| `dataType` | Data type, optional values are `user` and `department` |
| `uniqueKey` | Unique identifier field |
| `records` | Data records |
| `sourceName` | Data source name |

If dataType is `user`, then records contains the following fields:

| Field | Description |
| ------------- | -------------- |
| `id` | User ID |
| `nickname` | User nickname |
| `avatar` | User avatar |
| `email` | Email |
| `phone` | Phone number |
| `departments` | Array of department IDs to which the user belongs |

If dataType is `department`, then records contains the following fields:
| Field | Description |
| -------- | ---------------------- |
| `id` | Department ID |
| `name` | Department name |
| `parentId` | Parent department ID |

### Data Source Interface Implementation Example

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

### Data Source Type Registration

The extended data source needs to be registered.

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

## Client-side

The client-side user interface is registered through the `registerType` interface provided by the user data synchronization plugin's client:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Admin settings form
      },
    });
  }
}
```

### Admin Settings Form


![](https://static-docs.nocobase.com/202412041429835.png)


The upper part is the common data source configuration, and the lower part is the section for the registrable custom configuration form.