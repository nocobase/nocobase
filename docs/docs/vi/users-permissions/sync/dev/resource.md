:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mở rộng tài nguyên đích đồng bộ

## Tổng quan

NocoBase mặc định hỗ trợ đồng bộ dữ liệu người dùng vào các bảng **Người dùng** và **Phòng ban**. Nền tảng này cũng cho phép mở rộng các tài nguyên đích để đồng bộ dữ liệu, giúp bạn ghi dữ liệu vào các bảng khác hoặc thực hiện xử lý tùy chỉnh theo nhu cầu.

:::warning{title=Thử nghiệm}
Tài liệu đầy đủ đang được bổ sung.
:::

## Giao diện xử lý tài nguyên đích

```ts
export abstract class UserDataResource {
  name: string;
  accepts: SyncAccept[];
  db: Database;
  logger: SystemLogger;

  constructor(db: Database, logger: SystemLogger) {
    this.db = db;
    this.logger = logger;
  }

  abstract update(
    record: OriginRecord,
    resourcePks: PrimaryKey[],
    matchKey?: string,
  ): Promise<RecordResourceChanged[]>;
  abstract create(
    record: OriginRecord,
    matchKey: string,
  ): Promise<RecordResourceChanged[]>;

  get syncRecordRepo() {
    return this.db.getRepository('userDataSyncRecords');
  }

  get syncRecordResourceRepo() {
    return this.db.getRepository('userDataSyncRecordsResources');
  }
}
```

## Đăng ký tài nguyên đích

`registerResource(resource: UserDataResource, options?: ToposortOptions)`

```ts
import { Plugin } from '@nocobase/server';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';

class CustomUserResourcePluginServer extends Plugin {
  async load() {
    const userDataSyncPlugin = this.app.pm.get(PluginUserDataSyncServer);
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(new CustomDataSyncResource(this.db, this.app.logger)
    }
  }
}
```