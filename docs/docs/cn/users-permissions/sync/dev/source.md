# 扩展同步数据源

## 概述

NocoBase 支持按需要扩展用户数据同步数据源类型。

## 服务端

### 数据源接口

内置的用户数据同步插件提供了数据源类型的注册和管理。扩展数据源类型，需要继承插件提供的 `SyncSource` 抽象类，并对相应的标准接口进行实现。

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource` 提供了options属性，用于获取数据源的自定义配置。

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

### UserData字段说明

| 字段         | 说明                                      |
| ------------ | ----------------------------------------- |
| `dataType`   | 数据类型, 可选值为 `user` 和 `department` |
| `uniqueKey`  | 唯一标识字段                              |
| `records`    | 数据记录                                  |
| `sourceName` | 数据源名称                                |

若dataType为 `user`，则records包含以下字段：

| 字段          | 说明           |
| ------------- | -------------- |
| `id`          | 用户 ID        |
| `nickname`    | 用户昵称       |
| `avatar`      | 用户头像       |
| `email`       | 邮箱           |
| `phone`       | 手机号         |
| `departments` | 所属部门ID数组 |

若dataType为 `department`，则records包含以下字段：
| 字段 | 说明 |
| -------- | ---------------------- |
| `id` | 部门 ID |
| `name` | 部门名称 |
| `parentId` | 父级部门 ID |

### 数据源接口实现示例

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

### 数据源类型注册

扩展的数据源需要向数据管理模块注册。

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

## 客户端

客户端用户界面通过用户数据同步插件客户端提供的接口 `registerType` 进行注册：

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // 后台管理表单
      },
    });
  }
}
```

### 后台管理表单

![](https://static-docs.nocobase.com/202412041429835.png)

上方为通用的数据源配置，下方为可注册的自定义配置表单部分。
