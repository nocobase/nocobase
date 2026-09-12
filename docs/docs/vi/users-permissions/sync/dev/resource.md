---
pkg: '@nocobase/plugin-user-data-sync'
title: "Mở rộng tài nguyên đích đồng bộ"
description: "Mở rộng plugin đồng bộ dữ liệu người dùng NocoBase: tùy chỉnh tài nguyên đích đồng bộ, interface SyncResource, ánh xạ bảng người dùng và phòng ban."
keywords: "Mở rộng tài nguyên đồng bộ,SyncResource,đích đồng bộ,ánh xạ bảng người dùng,plugin-user-data-sync,NocoBase"
---

# Mở rộng tài nguyên đích đồng bộ

## Tổng quan

NocoBase mặc định hỗ trợ đồng bộ dữ liệu người dùng vào bảng **người dùng** và **phòng ban**, đồng thời cũng hỗ trợ mở rộng tài nguyên đích đồng bộ dữ liệu theo nhu cầu, để ghi dữ liệu vào các bảng khác hoặc xử lý tùy chỉnh khác.

:::warning{title=Thử nghiệm}
Tài liệu đầy đủ sẽ được bổ sung sau
:::

## Interface xử lý tài nguyên đích

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
