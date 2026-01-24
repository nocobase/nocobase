:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mở rộng nguồn dữ liệu đồng bộ

## Tổng quan

NocoBase hỗ trợ mở rộng các loại **nguồn dữ liệu** đồng bộ hóa dữ liệu người dùng theo nhu cầu.

## Phía máy chủ

### Giao diện nguồn dữ liệu

**Plugin** đồng bộ hóa dữ liệu người dùng tích hợp sẵn cung cấp chức năng đăng ký và quản lý các loại **nguồn dữ liệu**. Để mở rộng một loại **nguồn dữ liệu**, bạn cần kế thừa lớp trừu tượng `SyncSource` do **plugin** cung cấp và triển khai các giao diện tiêu chuẩn tương ứng.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource` cung cấp thuộc tính `options` để lấy cấu hình tùy chỉnh của **nguồn dữ liệu**.

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

### Mô tả các trường của `UserData`

| Trường         | Mô tả                                      |
| ------------ | ----------------------------------------- |
| `dataType`   | Loại dữ liệu, các giá trị tùy chọn là `user` và `department` |
| `uniqueKey`  | Trường định danh duy nhất                              |
| `records`    | Các bản ghi dữ liệu                                  |
| `sourceName` | Tên **nguồn dữ liệu**                                |

Nếu `dataType` là `user`, trường `records` sẽ bao gồm các trường sau:

| Trường          | Mô tả           |
| ------------- | -------------- |
| `id`          | ID người dùng        |
| `nickname`    | Biệt danh người dùng       |
| `avatar`      | Ảnh đại diện người dùng             |
| `email`       | Email           |
| `phone`       | Số điện thoại         |
| `departments` | Mảng ID phòng ban |

Nếu `dataType` là `department`, trường `records` sẽ bao gồm các trường sau:
| Trường | Mô tả |
| -------- | ---------------------- |
| `id` | ID phòng ban |
| `name` | Tên phòng ban |
| `parentId` | ID phòng ban cha |

### Ví dụ triển khai giao diện nguồn dữ liệu

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

**Nguồn dữ liệu** mở rộng cần được đăng ký với module quản lý dữ liệu.

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

## Phía máy khách

Giao diện người dùng phía máy khách đăng ký các loại **nguồn dữ liệu** bằng cách sử dụng phương thức `registerType` do **plugin** đồng bộ hóa dữ liệu người dùng cung cấp:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Biểu mẫu quản lý backend
      },
    });
  }
}
```

### Biểu mẫu quản lý backend

![](https://static-docs.nocobase.com/202412041429835.png)

Phần trên cung cấp cấu hình **nguồn dữ liệu** chung, trong khi phần dưới là phần biểu mẫu cấu hình tùy chỉnh có thể đăng ký.