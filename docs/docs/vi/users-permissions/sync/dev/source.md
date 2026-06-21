---
pkg: '@nocobase/plugin-user-data-sync'
title: "Mở rộng nguồn dữ liệu đồng bộ"
description: "Mở rộng plugin đồng bộ dữ liệu người dùng NocoBase: tùy chỉnh nguồn dữ liệu đồng bộ, interface SyncSource, đăng ký nguồn đồng bộ."
keywords: "Mở rộng nguồn dữ liệu đồng bộ,SyncSource,nguồn đồng bộ,plugin-user-data-sync,phát triển đồng bộ dữ liệu,NocoBase"
---

# Mở rộng nguồn dữ liệu đồng bộ

## Tổng quan

NocoBase hỗ trợ mở rộng các loại nguồn dữ liệu đồng bộ dữ liệu người dùng theo nhu cầu.

## Server

### Interface nguồn dữ liệu

Plugin đồng bộ dữ liệu người dùng tích hợp sẵn cung cấp việc đăng ký và quản lý các loại nguồn dữ liệu. Để mở rộng loại nguồn dữ liệu, cần kế thừa lớp trừu tượng `SyncSource` do plugin cung cấp và triển khai các interface chuẩn tương ứng.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource` cung cấp thuộc tính options, dùng để lấy cấu hình tùy chỉnh của nguồn dữ liệu.

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

### Mô tả các field UserData

| Field         | Mô tả                                      |
| ------------ | ----------------------------------------- |
| `dataType`   | Loại dữ liệu, các giá trị tùy chọn là `user` và `department` |
| `uniqueKey`  | Field định danh duy nhất                              |
| `records`    | Bản ghi dữ liệu                                  |
| `sourceName` | Tên nguồn dữ liệu                                |

Nếu dataType là `user`, records bao gồm các field sau:

| Field          | Mô tả           |
| ------------- | -------------- |
| `id`          | ID người dùng        |
| `nickname`    | Nickname người dùng       |
| `avatar`      | Ảnh đại diện người dùng       |
| `email`       | Email           |
| `phone`       | Số điện thoại         |
| `departments` | Mảng ID các phòng ban thuộc về |

Nếu dataType là `department`, records bao gồm các field sau:
| Field | Mô tả |
| -------- | ---------------------- |
| `id` | ID phòng ban |
| `name` | Tên phòng ban |
| `parentId` | ID phòng ban cha |

### Ví dụ triển khai interface nguồn dữ liệu

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

### Đăng ký loại nguồn dữ liệu

Nguồn dữ liệu mở rộng cần được đăng ký với module quản lý dữ liệu.

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

## Client

Giao diện người dùng phía client được đăng ký thông qua interface `registerType` mà plugin đồng bộ dữ liệu người dùng phía client cung cấp:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // form quản trị
      },
    });
  }
}
```

### Form quản trị

![](https://static-docs.nocobase.com/202412041429835.png)

Phần phía trên là cấu hình nguồn dữ liệu chung, phần phía dưới là phần form cấu hình tùy chỉnh có thể đăng ký.
