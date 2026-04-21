# توسيع موارد الهدف للمزامنة

## نظرة عامة

يدعم NocoBase أصلاً مزامنة بيانات المستخدمين إلى جدولَي **المستخدمين** و**الأقسام**. كما يتيح توسيع موارد الهدف لمزامنة البيانات لكتابة البيانات إلى جداول أخرى أو إجراء معالجة مخصصة حسب الحاجة.

:::warning{title=تجريبي}
الوثائق الكاملة قيد الإعداد.
:::

## واجهة معالج مورد الهدف

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

## تسجيل موارد الهدف

`registerResource(resource: UserDataResource, options?: ToposortOptions)`

```ts
import { Plugin } from '@nocobase/server';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';

class CustomUserResourcePluginServer extends Plugin {
  async load() {
    const userDataSyncPlugin = this.app.pm.get(PluginUserDataSyncServer);
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(
        new CustomDataSyncResource(this.db, this.app.logger),
      );
    }
  }
}
```
